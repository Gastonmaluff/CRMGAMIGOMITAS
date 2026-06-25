import assert from "node:assert/strict";
import {
  DUPLICATE_DISTANCE_METERS,
  buildDuplicateMatches,
  calculateDistanceMeters,
  formatDuplicateDistance,
  normalizeDuplicatePhone
} from "../duplicate-detection.mjs";

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log("  ok -", name); };

const origin = { lat: -25.5, lng: -54.6 };
const toRadians = (value) => (value * Math.PI) / 180;
const toDegrees = (value) => (value * 180) / Math.PI;
const destinationNorth = (meters) => {
  const radius = 6371000;
  const distance = meters / radius;
  const lat1 = toRadians(origin.lat);
  const lng1 = toRadians(origin.lng);
  const lat2 = Math.asin((Math.sin(lat1) * Math.cos(distance)) + (Math.cos(lat1) * Math.sin(distance)));
  return { lat: toDegrees(lat2), lng: toDegrees(lng1) };
};

const payload = {
  name: "Autoservice San Jose",
  phone: "0983 600 200",
  address: "Av Test 123",
  latitude: origin.lat,
  longitude: origin.lng
};

const recordAt = (meters, overrides = {}) => ({
  id: `record-${meters}`,
  type: "Prospecto",
  name: "Comercio Diferente",
  phone: "",
  address: "",
  latitude: destinationNorth(meters).lat,
  longitude: destinationNorth(meters).lng,
  ...overrides
});

const matchesFor = (records, extraPayload = {}) => buildDuplicateMatches({
  payload: { ...payload, ...extraPayload },
  records
});

console.log("duplicate detection:");

test("usa radio geografico centralizado de 50 metros", () => {
  assert.equal(DUPLICATE_DISTANCE_METERS, 50);
});

test("calcula distancia de 0 metros", () => {
  assert.equal(Math.round(calculateDistanceMeters(origin.lat, origin.lng, origin.lat, origin.lng)), 0);
});

test("calcula distancia de 20 metros", () => {
  assert.equal(Math.round(calculateDistanceMeters(origin.lat, origin.lng, recordAt(20).latitude, recordAt(20).longitude)), 20);
  assert.equal(matchesFor([recordAt(20)]).length, 1);
});

test("calcula distancia de 49 metros", () => {
  assert.equal(Math.round(calculateDistanceMeters(origin.lat, origin.lng, recordAt(49).latitude, recordAt(49).longitude)), 49);
  assert.equal(matchesFor([recordAt(49)]).length, 1);
});

test("calcula distancia de 50 metros como duplicado geografico", () => {
  assert.equal(Math.round(calculateDistanceMeters(origin.lat, origin.lng, recordAt(50).latitude, recordAt(50).longitude)), 50);
  assert.equal(matchesFor([recordAt(50)]).length, 1);
});

test("no considera 51 metros como duplicado solo por ubicacion", () => {
  assert.equal(Math.round(calculateDistanceMeters(origin.lat, origin.lng, recordAt(51).latitude, recordAt(51).longitude)), 51);
  assert.equal(matchesFor([recordAt(51)]).length, 0);
});

test("no considera 100 metros como duplicado solo por ubicacion", () => {
  assert.equal(Math.round(calculateDistanceMeters(origin.lat, origin.lng, recordAt(100).latitude, recordAt(100).longitude)), 100);
  assert.equal(matchesFor([recordAt(100)]).length, 0);
});

test("no muestra registros a 2000 metros solo por cercania", () => {
  assert.equal(Math.round(calculateDistanceMeters(origin.lat, origin.lng, recordAt(2000).latitude, recordAt(2000).longitude)), 2000);
  assert.equal(matchesFor([recordAt(2000)]).length, 0);
});

test("ignora coordenadas invalidas para distancia", () => {
  assert.equal(calculateDistanceMeters(origin.lat, origin.lng, 0, 0), Infinity);
  assert.equal(calculateDistanceMeters(origin.lat, origin.lng, 120, -54.6), Infinity);
});

test("mismo telefono advierte aunque este lejos", () => {
  const matches = matchesFor([recordAt(2149, { phone: "+595 983 600 200", type: "Cliente" })]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].type, "Cliente");
  assert.ok(matches[0].reasons.includes("mismo telefono"));
});

test("normaliza telefonos de Paraguay", () => {
  assert.equal(normalizeDuplicatePhone("+595 (983) 600-200"), "983600200");
  assert.equal(normalizeDuplicatePhone("0983 600 200"), "983600200");
});

test("nombre similar advierte solo en ubicacion cercana de hasta 100 metros", () => {
  const matches = matchesFor([recordAt(100, { name: "Autoservice San Jose" })]);
  assert.equal(matches.length, 1);
  assert.ok(matches[0].reasons.includes("nombre similar en una ubicacion cercana"));
});

test("nombre similar no advierte si esta a kilometros", () => {
  assert.equal(matchesFor([recordAt(2000, { name: "Autoservice San Jose" })]).length, 0);
});

test("registro sin ubicacion puede coincidir por telefono", () => {
  const matches = matchesFor([{ id: "no-location", type: "Prospecto", name: "Sin ubicacion", phone: "0983600200" }]);
  assert.equal(matches.length, 1);
  assert.ok(matches[0].reasons.includes("mismo telefono"));
});

test("registro sin ubicacion no coincide solo por distancia", () => {
  assert.equal(matchesFor([{ id: "no-location", type: "Prospecto", name: "Comercio Diferente" }]).length, 0);
});

test("formatea distancia en metros y kilometros", () => {
  assert.equal(formatDuplicateDistance(18.2), "18 m");
  assert.equal(formatDuplicateDistance(1200), "1,2 km");
});

console.log(`duplicate detection tests passed: ${passed}`);
