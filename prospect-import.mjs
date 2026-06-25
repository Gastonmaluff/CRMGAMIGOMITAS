import {
  DUPLICATE_DISTANCE_METERS,
  SIMILAR_NAME_DISTANCE_METERS,
  buildDuplicateMatches,
  calculateDistanceMeters,
  hasValidCoordinatePair,
  isHighlySimilarBusinessName,
  normalizeDuplicatePhone,
  normalizeDuplicateText
} from "./duplicate-detection.mjs";

export const IMPORT_MAX_RECORDS = 500;
export const IMPORT_SOURCE_LABEL = "Importacion JSON";
export const IMPORT_SCHEMA_TEMPLATE = {
  schemaVersion: "1.0",
  source: "chatgpt-google-maps-screenshots",
  generatedAt: "2026-06-25T12:00:00Z",
  prospects: [
    {
      externalId: "maps-001",
      businessName: "Nombre del negocio",
      contactName: null,
      phone: null,
      businessTypeName: "Estacion de servicio",
      address: "Direccion",
      city: "Ciudad del Este",
      zone: "Barrio o zona",
      latitude: -25.5097,
      longitude: -54.6111,
      googleMapsUrl: null,
      potential: "medium",
      status: "new",
      notes: ""
    }
  ]
};

const FIELD_ALIASES = {
  externalId: ["externalId", "external_id", "idExterno", "id"],
  businessName: ["businessName", "name", "nombre", "nombreNegocio", "nombre_negocio", "negocio", "local"],
  contactName: ["contactName", "contacto", "nombreContacto", "responsable"],
  phone: ["phone", "telefono", "tel", "whatsapp", "wa"],
  businessTypeName: ["businessTypeName", "businessType", "rubro", "tipoNegocio", "tipo_negocio", "categoria"],
  address: ["address", "direccion", "dir"],
  city: ["city", "ciudad", "localidad"],
  zone: ["zone", "barrio", "zona", "neighborhood", "area"],
  latitude: ["latitude", "lat", "latitud"],
  longitude: ["longitude", "lng", "lon", "longitud"],
  googleMapsUrl: ["googleMapsUrl", "mapsLink", "googleMapsLink", "linkGoogleMaps", "url", "maps"],
  potential: ["potential", "potencial"],
  status: ["status", "estado"],
  notes: ["notes", "observations", "observaciones", "nota", "notas"]
};

const POTENTIAL_ALIASES = new Map([
  ["bajo", "bajo"],
  ["low", "bajo"],
  ["medio", "medio"],
  ["medium", "medio"],
  ["media", "medio"],
  ["alto", "alto"],
  ["high", "alto"],
  ["alta", "alto"]
]);

const STATUS_ALIASES = new Map([
  ["nuevo", "nuevo"],
  ["nueva", "nuevo"],
  ["new", "nuevo"],
  ["contactado", "contactado"],
  ["contacted", "contactado"],
  ["visita pendiente", "visita_pendiente"],
  ["visita_pendiente", "visita_pendiente"],
  ["visitado", "visitado"],
  ["interesado", "interesado"],
  ["no interesado", "no_interesado"],
  ["no_interesado", "no_interesado"]
]);

export const normalizeImportKey = (value) => normalizeDuplicateText(value);

export const normalizeImportBusinessTypeKey = (value) => normalizeImportKey(value);

export const titleCaseImport = (value) => {
  const text = String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!text) return "";
  return text.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const pickAlias = (record, canonicalKey) => {
  const aliases = FIELD_ALIASES[canonicalKey] || [canonicalKey];
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(record, alias)) return record[alias];
  }
  return undefined;
};

const cleanText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

const parseCoordinate = (value) => {
  if (typeof value === "number") return value;
  const raw = String(value ?? "").trim();
  if (!raw || raw.includes(",")) return NaN;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const isSafeUrl = (value) => {
  const raw = cleanText(value);
  if (!raw) return true;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const normalizePotential = (value) => {
  const key = normalizeImportKey(value);
  return POTENTIAL_ALIASES.get(key) || "";
};

const normalizeStatus = (value) => {
  const key = normalizeImportKey(value);
  return STATUS_ALIASES.get(key) || "nuevo";
};

const resolveBusinessType = (businessTypeName, businessTypes = []) => {
  const rawName = cleanText(businessTypeName);
  const key = normalizeImportBusinessTypeKey(rawName);
  if (!key) return { key: "", label: "", isNew: false };
  const found = (businessTypes || []).find((option) => (
    normalizeImportBusinessTypeKey(option.value) === key
    || normalizeImportBusinessTypeKey(option.label) === key
    || normalizeImportBusinessTypeKey(option.name) === key
  ));
  if (found) {
    return {
      key: normalizeImportBusinessTypeKey(found.value || found.label || found.name),
      label: found.label || found.name || titleCaseImport(rawName),
      isNew: false
    };
  }
  return { key, label: titleCaseImport(rawName), isNew: true };
};

export const getImportProspectArray = (jsonValue) => {
  if (Array.isArray(jsonValue)) return jsonValue;
  if (Array.isArray(jsonValue?.prospects)) return jsonValue.prospects;
  if (Array.isArray(jsonValue?.items)) return jsonValue.items;
  if (Array.isArray(jsonValue?.data)) return jsonValue.data;
  return null;
};

export const normalizeImportedProspect = (rawRecord, index = 0, options = {}) => {
  const raw = rawRecord && typeof rawRecord === "object" && !Array.isArray(rawRecord) ? rawRecord : {};
  const warnings = [];
  const errors = [];
  const businessName = titleCaseImport(pickAlias(raw, "businessName"));
  const latitude = parseCoordinate(pickAlias(raw, "latitude"));
  const longitude = parseCoordinate(pickAlias(raw, "longitude"));
  const phoneRaw = cleanText(pickAlias(raw, "phone"));
  const mapsUrl = cleanText(pickAlias(raw, "googleMapsUrl"));
  const rubro = resolveBusinessType(pickAlias(raw, "businessTypeName"), options.businessTypes || []);
  const potentialRaw = pickAlias(raw, "potential");
  const potential = normalizePotential(potentialRaw);
  const statusRaw = pickAlias(raw, "status");
  const status = normalizeStatus(statusRaw);

  if (!businessName || !/[a-z0-9]/i.test(normalizeImportKey(businessName))) {
    errors.push({ code: "missing-name", message: "Falta nombre del negocio." });
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    errors.push({ code: "invalid-latitude", message: "Latitud invalida." });
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    errors.push({ code: "invalid-longitude", message: "Longitud invalida." });
  }
  if (potentialRaw !== undefined && cleanText(potentialRaw) && !potential) {
    warnings.push({ code: "unknown-potential", message: "Potencial desconocido." });
  }
  if (statusRaw !== undefined && cleanText(statusRaw) && !STATUS_ALIASES.has(normalizeImportKey(statusRaw))) {
    warnings.push({ code: "unknown-status", message: "Estado desconocido; se usara Nuevo." });
  }
  if (!isSafeUrl(mapsUrl)) {
    warnings.push({ code: "unsafe-url", message: "Link ignorado por formato no permitido." });
  }

  return {
    rowId: `import-row-${index + 1}`,
    index,
    externalId: cleanText(pickAlias(raw, "externalId")),
    name: businessName,
    contactName: titleCaseImport(pickAlias(raw, "contactName")),
    phone: phoneRaw,
    normalizedPhone: normalizeDuplicatePhone(phoneRaw),
    businessTypeName: rubro.label,
    businessType: rubro.key,
    businessTypeIsNew: rubro.isNew,
    address: cleanText(pickAlias(raw, "address")),
    city: titleCaseImport(pickAlias(raw, "city")),
    zone: titleCaseImport(pickAlias(raw, "zone")),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    mapsLink: isSafeUrl(mapsUrl) ? mapsUrl : "",
    potential,
    status,
    observations: cleanText(pickAlias(raw, "notes")),
    selected: true,
    excluded: false,
    duplicateMatches: [],
    fileDuplicateMatches: [],
    errors,
    warnings
  };
};

export const detectImportedFileDuplicates = (rows) => {
  const nextRows = rows.map((row) => ({ ...row, fileDuplicateMatches: [...(row.fileDuplicateMatches || [])] }));
  for (let i = 0; i < nextRows.length; i += 1) {
    for (let j = i + 1; j < nextRows.length; j += 1) {
      const a = nextRows[i];
      const b = nextRows[j];
      const reasons = [];
      const distance = hasValidCoordinatePair(a.latitude, a.longitude) && hasValidCoordinatePair(b.latitude, b.longitude)
        ? calculateDistanceMeters(a.latitude, a.longitude, b.latitude, b.longitude)
        : Infinity;
      if (a.normalizedPhone && b.normalizedPhone && a.normalizedPhone === b.normalizedPhone) reasons.push("mismo telefono en archivo");
      if (Number.isFinite(distance) && distance <= DUPLICATE_DISTANCE_METERS + 0.001) reasons.push("ubicacion repetida en archivo");
      if (
        Number.isFinite(distance)
        && distance <= SIMILAR_NAME_DISTANCE_METERS + 0.001
        && isHighlySimilarBusinessName(a.name, b.name)
      ) reasons.push("nombre similar en archivo");
      if (!reasons.length) continue;
      const matchA = { rowId: b.rowId, name: b.name, distance, reasons };
      const matchB = { rowId: a.rowId, name: a.name, distance, reasons };
      a.fileDuplicateMatches.push(matchA);
      b.fileDuplicateMatches.push(matchB);
    }
  }
  return nextRows;
};

export const enrichImportedRowsWithDuplicates = (rows, existingRecords = []) => rows.map((row) => {
  const duplicateMatches = buildDuplicateMatches({
    payload: row,
    records: existingRecords
  });
  return { ...row, duplicateMatches };
});

export const normalizeImportedProspectFile = (jsonValue, options = {}) => {
  const records = getImportProspectArray(jsonValue);
  if (!records) {
    return {
      ok: false,
      error: "El JSON debe contener un arreglo prospects.",
      rows: []
    };
  }
  if (!records.length) {
    return {
      ok: false,
      error: "El archivo no contiene prospectos.",
      rows: []
    };
  }
  if (records.length > (options.maxRecords || IMPORT_MAX_RECORDS)) {
    return {
      ok: false,
      error: `El archivo supera el maximo de ${options.maxRecords || IMPORT_MAX_RECORDS} prospectos.`,
      rows: []
    };
  }
  let rows = records.map((record, index) => normalizeImportedProspect(record, index, options));
  rows = detectImportedFileDuplicates(rows);
  if (options.existingRecords) rows = enrichImportedRowsWithDuplicates(rows, options.existingRecords);
  return {
    ok: true,
    rows,
    metadata: {
      schemaVersion: cleanText(jsonValue?.schemaVersion),
      source: cleanText(jsonValue?.source),
      generatedAt: cleanText(jsonValue?.generatedAt)
    }
  };
};

export const getImportedRowStateCodes = (row) => {
  const states = [];
  if (row.excluded || !row.selected) return ["excluded"];
  if ((row.errors || []).some((error) => error.code === "missing-name")) states.push("missing");
  if ((row.errors || []).some((error) => error.code.startsWith("invalid-"))) states.push("invalid-coordinates");
  if ((row.duplicateMatches || []).length) states.push("duplicate");
  if ((row.fileDuplicateMatches || []).length) states.push("file-duplicate");
  if (row.businessTypeIsNew) states.push("new-business-type");
  if (!states.length) states.push("ready");
  return states;
};

export const canImportRow = (row) => (
  Boolean(row?.selected)
  && !row.excluded
  && !(row.errors || []).length
);

export const buildImportSummary = (rows) => {
  const selectedRows = rows.filter((row) => row.selected && !row.excluded);
  const importableRows = selectedRows.filter(canImportRow);
  const newBusinessTypes = new Set(
    selectedRows
      .filter((row) => row.businessTypeIsNew && row.businessType)
      .map((row) => row.businessType)
  );
  return {
    total: rows.length,
    selected: selectedRows.length,
    importable: importableRows.length,
    excluded: rows.length - selectedRows.length,
    errors: selectedRows.filter((row) => (row.errors || []).length).length,
    duplicates: selectedRows.filter((row) => (row.duplicateMatches || []).length).length,
    fileDuplicates: selectedRows.filter((row) => (row.fileDuplicateMatches || []).length).length,
    newBusinessTypes: newBusinessTypes.size,
    withoutPhone: selectedRows.filter((row) => !row.phone).length,
    withoutAddress: selectedRows.filter((row) => !row.address).length
  };
};
