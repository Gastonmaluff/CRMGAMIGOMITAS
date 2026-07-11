import assert from "node:assert/strict";
import {
  buildHealthReport,
  checkDatabase,
  checkAuthentication
} from "../functions/health.js";

let passed = 0;
const test = async (name, fn) => { await fn(); passed += 1; console.log("  ok -", name); };

// --- Mocks -------------------------------------------------------------------

const okSnap = { exists: true };
const missingSnap = { exists: false };

const makeDb = ({ getResult = okSnap, getError = null, setSpy } = {}) => ({
  collection() {
    return {
      doc() {
        return {
          get() {
            if (getError) return Promise.reject(getError);
            return Promise.resolve(getResult);
          },
          set(data, opts) {
            if (setSpy) setSpy(data, opts);
            return Promise.resolve();
          }
        };
      }
    };
  }
});

const makeAuth = ({ error = null, hangMs = 0 } = {}) => ({
  listUsers() {
    if (hangMs) return new Promise((resolve) => setTimeout(() => resolve({ users: [] }), hangMs));
    if (error) return Promise.reject(error);
    return Promise.resolve({ users: [{ uid: "SECRET_UID", email: "secret@x" }] });
  }
});

const silentLogger = { error() {}, warn() {}, info() {} };

// --- Tests -------------------------------------------------------------------

await test("todos los componentes correctos => status ok", async () => {
  const report = await buildHealthReport({
    db: makeDb(),
    auth: makeAuth(),
    version: "abc1234",
    logger: silentLogger
  });
  assert.equal(report.status, "ok");
  assert.equal(report.database.status, "ok");
  assert.equal(report.authentication.status, "ok");
  assert.equal(report.functions.status, "ok");
  assert.equal(report.version, "abc1234");
  assert.equal(typeof report.database.responseMs, "number");
  assert.equal(typeof report.authentication.responseMs, "number");
  assert.equal(typeof report.functions.responseMs, "number");
  assert.ok(!Number.isNaN(Date.parse(report.checkedAt)));
});

await test("componente storage siempre omitido (no lo usa el proyecto)", async () => {
  const report = await buildHealthReport({ db: makeDb(), auth: makeAuth(), version: "v", logger: silentLogger });
  assert.equal("storage" in report, false);
});

await test("error de Firestore => database error y status general error", async () => {
  const report = await buildHealthReport({
    db: makeDb({ getError: Object.assign(new Error("boom"), { code: "unavailable" }) }),
    auth: makeAuth(),
    version: "v",
    logger: silentLogger
  });
  assert.equal(report.database.status, "error");
  assert.equal(report.database.errorCode, "DATABASE_UNAVAILABLE");
  assert.equal(report.status, "error");
});

await test("error de Authentication => auth error y status general error", async () => {
  const report = await buildHealthReport({
    db: makeDb(),
    auth: makeAuth({ error: new Error("no auth") }),
    version: "v",
    logger: silentLogger
  });
  assert.equal(report.authentication.status, "error");
  assert.equal(report.authentication.errorCode, "AUTH_UNAVAILABLE");
  assert.equal(report.status, "error");
});

await test("timeout de un componente => errorCode de timeout", async () => {
  const result = await checkAuthentication(makeAuth({ hangMs: 50 }), { timeoutMs: 5, logger: silentLogger });
  assert.equal(result.status, "error");
  assert.equal(result.errorCode, "AUTH_TIMEOUT");
});

await test("respuesta parcial: DB ok + Auth error => status error", async () => {
  const report = await buildHealthReport({
    db: makeDb(),
    auth: makeAuth({ error: new Error("x") }),
    version: "v",
    logger: silentLogger
  });
  assert.equal(report.database.status, "ok");
  assert.equal(report.authentication.status, "error");
  assert.equal(report.status, "error");
});

await test("documento _health inexistente => se inicializa una unica vez (write) y DB ok", async () => {
  let setCalls = 0;
  const report = await buildHealthReport({
    db: makeDb({ getResult: missingSnap, setSpy: () => { setCalls += 1; } }),
    auth: makeAuth(),
    version: "v",
    logger: silentLogger
  });
  assert.equal(report.database.status, "ok");
  assert.equal(setCalls, 1);
});

await test("documento _health existente => sin escrituras (read-only)", async () => {
  let setCalls = 0;
  await checkDatabase(makeDb({ getResult: okSnap, setSpy: () => { setCalls += 1; } }), { logger: silentLogger });
  assert.equal(setCalls, 0);
});

await test("sanitizacion: la salida no filtra errores ni datos sensibles", async () => {
  const report = await buildHealthReport({
    db: makeDb({ getError: new Error("Firestore internal stack trace at db.js:123") }),
    auth: makeAuth(),
    version: "v",
    logger: silentLogger
  });
  const json = JSON.stringify(report);
  assert.equal(json.includes("stack trace"), false);
  assert.equal(json.includes("db.js"), false);
  assert.equal(json.includes("SECRET_UID"), false);
  assert.equal(json.includes("secret@x"), false);
  // Solo se exponen campos permitidos por componente.
  assert.deepEqual(Object.keys(report.database).sort(), ["errorCode", "responseMs", "status"]);
});

await test("errores completos si se registran en el logger interno", async () => {
  const logged = [];
  await buildHealthReport({
    db: makeDb({ getError: new Error("detalle interno sensible") }),
    auth: makeAuth(),
    version: "v",
    logger: { error: (msg, meta) => logged.push({ msg, meta }), warn() {}, info() {} }
  });
  assert.ok(logged.some((entry) => String(entry.meta?.message || "").includes("detalle interno sensible")));
});

console.log(`\n${passed} pruebas de health OK`);
