"use strict";

/**
 * Logica de comprobacion de salud tecnica para /api/health.
 *
 * Este modulo es puro: no importa firebase-admin ni ningun servicio.
 * Recibe `db` y `auth` inyectados para poder ejecutarlo y testearlo en
 * aislamiento con mocks. Toda respuesta que sale al cliente es generica y
 * sanitizada: no expone claves, tokens, correos, uids, nombres de usuarios
 * ni datos comerciales. Los errores completos se registran solo via `logger`.
 */

const CHECK_TIMEOUT_MS = 3000;
const HEALTH_COLLECTION = "_health";
const HEALTH_DOC = "status";

/**
 * Ejecuta una promesa con timeout y mide el tiempo transcurrido.
 * Nunca lanza: devuelve { ok, ms, value?, error? }.
 */
function timed(factory, timeoutMs, timeoutCode) {
  const start = Date.now();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error("timeout");
      err.code = timeoutCode;
      reject(err);
    }, timeoutMs);
  });
  return Promise.race([Promise.resolve().then(factory), timeout])
    .then((value) => ({ ok: true, ms: Date.now() - start, value }))
    .catch((error) => ({ ok: false, ms: Date.now() - start, error }))
    .then((result) => {
      clearTimeout(timer);
      return result;
    });
}

/**
 * Comprueba Firestore con una lectura real y liviana de un documento tecnico
 * dedicado (`_health/status`). No lee datos privados ni cuenta documentos
 * comerciales. Si el documento no existe, lo inicializa una unica vez.
 */
async function checkDatabase(db, options = {}) {
  const { timeoutMs = CHECK_TIMEOUT_MS, logger } = options;
  const result = await timed(async () => {
    const ref = db.collection(HEALTH_COLLECTION).doc(HEALTH_DOC);
    const snap = await ref.get();
    if (snap && snap.exists === false) {
      // Inicializacion unica: solo se escribe cuando el documento no existe.
      await ref
        .set({ initializedAt: new Date().toISOString(), purpose: "health-check" }, { merge: true })
        .catch(() => {});
    }
    return true;
  }, timeoutMs, "DATABASE_TIMEOUT");

  if (result.ok) return { status: "ok", responseMs: result.ms };
  if (logger) logger.error("health: database check failed", { message: safeMessage(result.error) });
  return {
    status: "error",
    responseMs: result.ms,
    errorCode: result.error && result.error.code === "DATABASE_TIMEOUT" ? "DATABASE_TIMEOUT" : "DATABASE_UNAVAILABLE"
  };
}

/**
 * Comprueba Firebase Authentication con una operacion minima y segura del
 * Admin SDK (listUsers con maxResults=1). No devuelve correos, uids, nombres
 * ni cantidad de usuarios: solo confirma acceso al servicio y mide el tiempo.
 */
async function checkAuthentication(auth, options = {}) {
  const { timeoutMs = CHECK_TIMEOUT_MS, logger } = options;
  const result = await timed(() => auth.listUsers(1), timeoutMs, "AUTH_TIMEOUT");

  if (result.ok) return { status: "ok", responseMs: result.ms };
  if (logger) logger.error("health: authentication check failed", { message: safeMessage(result.error) });
  return {
    status: "error",
    responseMs: result.ms,
    errorCode: result.error && result.error.code === "AUTH_TIMEOUT" ? "AUTH_TIMEOUT" : "AUTH_UNAVAILABLE"
  };
}

/** Extrae un mensaje seguro para logs internos (nunca sale al cliente). */
function safeMessage(error) {
  if (!error) return "unknown";
  if (typeof error === "string") return error;
  return error.message || error.code || String(error);
}

/**
 * Construye el reporte de salud completo. Ejecuta las comprobaciones criticas
 * en paralelo y calcula el estado general con informacion real.
 *
 * Componentes criticos: database, authentication, functions.
 * Storage se omite intencionalmente porque este proyecto no lo utiliza.
 */
async function buildHealthReport(options = {}) {
  const {
    db,
    auth,
    version,
    now = () => new Date(),
    logger,
    timeoutMs = CHECK_TIMEOUT_MS
  } = options;

  const startedAt = Date.now();
  const [database, authentication] = await Promise.all([
    checkDatabase(db, { timeoutMs, logger }),
    checkAuthentication(auth, { timeoutMs, logger })
  ]);

  // La propia ejecucion de este handler confirma que las Functions/API estan
  // vivas. Medimos el tiempo real invertido hasta este punto.
  const functionsComponent = { status: "ok", responseMs: Date.now() - startedAt };

  const criticalStatuses = [database.status, authentication.status, functionsComponent.status];
  let status = "ok";
  if (criticalStatuses.includes("error") || criticalStatuses.includes("down")) {
    status = "error";
  } else if (criticalStatuses.includes("warn") || criticalStatuses.includes("degraded")) {
    status = "warn";
  }

  return {
    status,
    database,
    authentication,
    functions: functionsComponent,
    version: version || "unknown",
    checkedAt: now().toISOString()
  };
}

module.exports = {
  buildHealthReport,
  checkDatabase,
  checkAuthentication,
  CHECK_TIMEOUT_MS,
  HEALTH_COLLECTION,
  HEALTH_DOC
};
