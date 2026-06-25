import assert from "node:assert/strict";
import {
  buildImportSummary,
  canImportRow,
  normalizeImportedProspect,
  normalizeImportedProspectFile
} from "../prospect-import.mjs";

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log("  ok -", name); };

const businessTypes = [
  { value: "estacion de servicio", label: "Estacion de servicio" },
  { value: "despensa", label: "Despensa" }
];

const validRecord = {
  externalId: "maps-001",
  businessName: "estacion central",
  contactName: "juan perez",
  phone: "+595 983 600 200",
  businessTypeName: "ESTACION DE SERVICIO",
  address: "Ruta PY02, km 10",
  city: "ciudad del este",
  zone: "area 4",
  latitude: -25.5097,
  longitude: -54.6111,
  googleMapsUrl: "https://maps.google.com/?q=-25.5097,-54.6111",
  potential: "medium",
  status: "new",
  notes: "Local encontrado mediante Google Maps"
};

console.log("prospect import:");

test("normaliza un prospecto valido con rubro existente", () => {
  const row = normalizeImportedProspect(validRecord, 0, { businessTypes });
  assert.equal(row.name, "Estacion Central");
  assert.equal(row.businessType, "estacion de servicio");
  assert.equal(row.businessTypeIsNew, false);
  assert.equal(row.potential, "medio");
  assert.equal(row.status, "nuevo");
  assert.equal(row.normalizedPhone, "983600200");
  assert.equal(row.errors.length, 0);
  assert.equal(canImportRow(row), true);
});

test("acepta alias razonables de campos", () => {
  const row = normalizeImportedProspect({
    nombreNegocio: "Despensa la familia",
    latitud: "-25.50",
    longitud: "-54.60",
    rubro: "despensa",
    telefono: "0983600200",
    direccion: "Av Test",
    ciudad: "minga guazu",
    barrio: "centro"
  }, 0, { businessTypes });
  assert.equal(row.name, "Despensa La Familia");
  assert.equal(row.latitude, -25.5);
  assert.equal(row.longitude, -54.6);
  assert.equal(row.businessType, "despensa");
  assert.equal(row.city, "Minga Guazu");
  assert.equal(row.zone, "Centro");
});

test("marca coordenada invalida", () => {
  const row = normalizeImportedProspect({ businessName: "Local", latitude: -91, longitude: -54.6 }, 0, { businessTypes });
  assert.equal(row.errors.some((error) => error.code === "invalid-latitude"), true);
  assert.equal(canImportRow(row), false);
});

test("marca coma decimal como coordenada invalida", () => {
  const row = normalizeImportedProspect({ businessName: "Local", latitude: "-25,5", longitude: -54.6 }, 0, { businessTypes });
  assert.equal(row.errors.some((error) => error.code === "invalid-latitude"), true);
});

test("marca nombre vacio", () => {
  const row = normalizeImportedProspect({ businessName: "!!!", latitude: -25.5, longitude: -54.6 }, 0, { businessTypes });
  assert.equal(row.errors.some((error) => error.code === "missing-name"), true);
});

test("detecta rubro nuevo sin crearlo automaticamente", () => {
  const row = normalizeImportedProspect({ businessName: "Cantina Uno", businessTypeName: "Cantina universitaria", latitude: -25.5, longitude: -54.6 }, 0, { businessTypes });
  assert.equal(row.businessTypeIsNew, true);
  assert.equal(row.businessType, "cantina universitaria");
});

test("normaliza archivo oficial", () => {
  const result = normalizeImportedProspectFile({ schemaVersion: "1.0", prospects: [validRecord] }, { businessTypes });
  assert.equal(result.ok, true);
  assert.equal(result.rows.length, 1);
});

test("normaliza archivo con 30 prospectos validos", () => {
  const prospects = Array.from({ length: 30 }, (_, index) => ({
    ...validRecord,
    externalId: `maps-${String(index + 1).padStart(3, "0")}`,
    businessName: `Local ${index + 1}`,
    phone: null,
    latitude: -25.5 + (index * 0.001),
    longitude: -54.6
  }));
  const result = normalizeImportedProspectFile({ prospects }, { businessTypes });
  assert.equal(result.ok, true);
  assert.equal(result.rows.length, 30);
  assert.equal(result.rows.every(canImportRow), true);
});

test("rechaza archivo sin prospectos", () => {
  const result = normalizeImportedProspectFile({ prospects: [] }, { businessTypes });
  assert.equal(result.ok, false);
});

test("detecta repetidos dentro del archivo por telefono", () => {
  const result = normalizeImportedProspectFile({
    prospects: [
      validRecord,
      { ...validRecord, externalId: "maps-002", businessName: "Otro Local", latitude: -25.50975, longitude: -54.61115 }
    ]
  }, { businessTypes });
  assert.equal(result.ok, true);
  assert.equal(result.rows[0].fileDuplicateMatches.length, 1);
  assert.equal(result.rows[1].fileDuplicateMatches.length, 1);
});

test("no marca sucursales lejanas como repetidas solo por telefono corporativo", () => {
  const result = normalizeImportedProspectFile({
    prospects: [
      { ...validRecord, externalId: "maps-001", businessName: "Petrobras Area 1", address: "Area 1", latitude: -25.5097, longitude: -54.6111 },
      { ...validRecord, externalId: "maps-002", businessName: "Petrobras Km 10", address: "Km 10", latitude: -25.5267, longitude: -54.6241 }
    ]
  }, { businessTypes });
  assert.equal(result.ok, true);
  assert.equal(result.rows[0].fileDuplicateMatches.length, 0);
  assert.equal(result.rows[1].fileDuplicateMatches.length, 0);
  assert.equal(result.rows[0].fileBranchMatches.length, 1);
  assert.equal(result.rows[1].fileBranchMatches.length, 1);
});

test("detecta duplicado existente por telefono aunque este lejos", () => {
  const result = normalizeImportedProspectFile({ prospects: [validRecord] }, {
    businessTypes,
    existingRecords: [
      { id: "client-1", type: "Cliente", name: "Cliente", phone: "0983 600 200", latitude: -26, longitude: -55 }
    ]
  });
  assert.equal(result.rows[0].duplicateMatches.length, 1);
  assert.equal(result.rows[0].duplicateMatches[0].type, "Cliente");
});

test("summary cuenta errores, duplicados, rubros nuevos y faltantes", () => {
  const result = normalizeImportedProspectFile({
    prospects: [
      validRecord,
      { businessName: "Cantina", businessTypeName: "Cantina universitaria", latitude: -25.6, longitude: -54.6 }
    ]
  }, { businessTypes });
  const summary = buildImportSummary(result.rows);
  assert.equal(summary.total, 2);
  assert.equal(summary.importable, 2);
  assert.equal(summary.newBusinessTypes, 1);
  assert.equal(summary.withoutPhone, 1);
  assert.equal(summary.withoutAddress, 1);
});

console.log(`prospect import tests passed: ${passed}`);
