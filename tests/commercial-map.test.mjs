// Pruebas de la logica pura del modulo "Mapa comercial".
// El proyecto es vanilla (sin build/exports), por eso estas funciones
// reflejan exactamente la logica implementada en app.js. Ejecutar con:
//   node tests/commercial-map.test.mjs
import assert from "node:assert/strict";

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log("  ok -", name); };

/* ---- Helpers espejo de app.js ---- */
const mapToNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(num) ? num : null;
};

const normalizeCoordinates = (record) => {
  if (!record) return null;
  const candidates = [
    [record.latitude, record.longitude],
    [record.lat, record.lng],
    [record.latitud, record.longitud],
    [record.location?.latitude, record.location?.longitude],
    [record.location?.lat, record.location?.lng],
    [record.ubicacion?.latitud, record.ubicacion?.longitud],
    [record.ubicacion?.lat, record.ubicacion?.lng]
  ];
  for (const [latRaw, lngRaw] of candidates) {
    if (latRaw === undefined || latRaw === null || lngRaw === undefined || lngRaw === null) continue;
    const lat = mapToNumber(latRaw);
    const lng = mapToNumber(lngRaw);
    if (lat === null || lng === null) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    if (lat === 0 && lng === 0) continue;
    return { lat, lng };
  }
  return null;
};

const toGeoCoords = (c) => [c.lng, c.lat];

// normalizeDateValue (version reducida fiel a app.js)
const normalizeDateValue = (value) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value?.toDate === "function") return value.toDate().toISOString().slice(0, 10);
  if (typeof value === "number") return new Date(value).toISOString().slice(0, 10);
  if (typeof value === "object" && typeof value.seconds === "number") return new Date(value.seconds * 1000).toISOString().slice(0, 10);
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const latam = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (latam) return `${latam[3]}-${latam[2].padStart(2, "0")}-${latam[1].padStart(2, "0")}`;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

const toIsoDayNumber = (iso) => {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
};

// Asignacion de color (espejo de getCommercialMapStatus)
const COLORS = { prospect: "#9ca3af", client: "#16a34a", overdue: "#dc2626" };
const getColor = ({ entityType, expectedRepurchaseDate, todayIso }) => {
  if (entityType === "prospect") return COLORS.prospect;
  if (expectedRepurchaseDate) {
    const exp = toIsoDayNumber(expectedRepurchaseDate);
    const today = toIsoDayNumber(todayIso);
    if (exp !== null && today !== null && today > exp) return COLORS.overdue;
  }
  return COLORS.client;
};

/* ---- Tests ---- */
console.log("normalizeCoordinates:");
test("acepta latitude/longitude numericos", () => {
  assert.deepEqual(normalizeCoordinates({ latitude: -25.5, longitude: -54.6 }), { lat: -25.5, lng: -54.6 });
});
test("acepta lat/lng", () => {
  assert.deepEqual(normalizeCoordinates({ lat: -25.3, lng: -57.6 }), { lat: -25.3, lng: -57.6 });
});
test("acepta latitud/longitud (es)", () => {
  assert.deepEqual(normalizeCoordinates({ latitud: "-25,5", longitud: "-54,6" }), { lat: -25.5, lng: -54.6 });
});
test("acepta location.latitude (GeoPoint-like)", () => {
  assert.deepEqual(normalizeCoordinates({ location: { latitude: -25.1, longitude: -55.2 } }), { lat: -25.1, lng: -55.2 });
});
test("acepta strings numericos", () => {
  assert.deepEqual(normalizeCoordinates({ latitude: "-25.51", longitude: "-54.61" }), { lat: -25.51, lng: -54.61 });
});
test("rechaza fuera de rango", () => {
  assert.equal(normalizeCoordinates({ latitude: 200, longitude: -54 }), null);
  assert.equal(normalizeCoordinates({ latitude: -25, longitude: 999 }), null);
});
test("rechaza 0,0 y faltantes", () => {
  assert.equal(normalizeCoordinates({ latitude: 0, longitude: 0 }), null);
  assert.equal(normalizeCoordinates({ latitude: -25 }), null);
  assert.equal(normalizeCoordinates({}), null);
});
test("convierte a orden GeoJSON [lng, lat]", () => {
  const c = normalizeCoordinates({ latitude: -25.5, longitude: -54.6 });
  assert.deepEqual(toGeoCoords(c), [-54.6, -25.5]);
});

console.log("getColor (estado):");
test("prospecto -> gris", () => {
  assert.equal(getColor({ entityType: "prospect" }), COLORS.prospect);
});
test("cliente sin recompra -> verde", () => {
  assert.equal(getColor({ entityType: "client", expectedRepurchaseDate: "" }), COLORS.client);
});
test("cliente recompra futura -> verde", () => {
  assert.equal(getColor({ entityType: "client", expectedRepurchaseDate: "2999-01-01", todayIso: "2026-06-23" }), COLORS.client);
});
test("cliente recompra vencida -> rojo", () => {
  assert.equal(getColor({ entityType: "client", expectedRepurchaseDate: "2026-06-01", todayIso: "2026-06-23" }), COLORS.overdue);
});
test("cliente recompra hoy -> verde (no vencida)", () => {
  assert.equal(getColor({ entityType: "client", expectedRepurchaseDate: "2026-06-23", todayIso: "2026-06-23" }), COLORS.client);
});

console.log("normalizeDateValue:");
test("ISO", () => assert.equal(normalizeDateValue("2026-6-3"), "2026-06-03"));
test("latam dd/mm/yyyy", () => assert.equal(normalizeDateValue("03/06/2026"), "2026-06-03"));
test("Date", () => assert.equal(normalizeDateValue(new Date("2026-06-23T12:00:00Z")), "2026-06-23"));
test("Timestamp-like seconds", () => assert.equal(normalizeDateValue({ seconds: Math.floor(Date.UTC(2026, 5, 23) / 1000) }), "2026-06-23"));
test("vacio", () => assert.equal(normalizeDateValue(""), ""));

console.log("recompra vencida (comparacion de dias):");
test("vencida cuando hoy > esperada", () => {
  assert.ok(toIsoDayNumber("2026-06-23") > toIsoDayNumber("2026-06-20"));
});
test("registro sin ubicacion no entra al GeoJSON", () => {
  const records = [{ latitude: -25.5, longitude: -54.6 }, { latitude: null }];
  const withCoords = records.map(normalizeCoordinates).filter(Boolean);
  assert.equal(withCoords.length, 1);
});

console.log(`\nTODAS LAS PRUEBAS PASARON (${passed})`);
