const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { buildHealthReport } = require("./health");

admin.initializeApp();

const db = admin.firestore();

// Version desplegada. Prioridad: variable de entorno -> commit del build ->
// version de package.json -> "unknown". Nunca una fecha inventada.
let buildInfo = {};
try {
  // Generado por gen-build-info.js en el predeploy (esta en .gitignore).
  buildInfo = require("./build-info.json");
} catch (error) {
  buildInfo = {};
}
const pkg = require("./package.json");
const APP_VERSION = process.env.APP_VERSION || buildInfo.commit || pkg.version || "unknown";
const AUTH_EMAIL_DOMAIN = "auth.gamigomitas.local";
const ROLES = new Set(["admin", "sales"]);

const normalizeUsername = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9._-]/g, "")
  .replace(/^[._-]+|[._-]+$/g, "")
  .slice(0, 40);

const buildAuthEmail = (username) => `${username}@${AUTH_EMAIL_DOMAIN}`;

const serializeTimestamp = (value) => {
  if (!value) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value === "number" || typeof value === "string") return value;
  return null;
};

const publicUserProfile = (uid, data) => ({
  uid,
  displayName: data.displayName || "",
  username: data.username || "",
  authEmail: data.authEmail || "",
  role: data.role || "",
  active: data.active === true,
  createdAt: serializeTimestamp(data.createdAt),
  createdBy: data.createdBy || "",
  updatedAt: serializeTimestamp(data.updatedAt),
  lastLoginAt: serializeTimestamp(data.lastLoginAt)
});

const getCallerUid = (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Debes iniciar sesion.");
  return uid;
};

const getUserProfileSnap = (uid) => db.collection("users").doc(uid).get();

const assertAdmin = async (uid) => {
  const snap = await getUserProfileSnap(uid);
  const data = snap.data() || {};
  if (!snap.exists || data.active !== true || data.role !== "admin") {
    throw new HttpsError("permission-denied", "No tenes permisos para gestionar usuarios.");
  }
  return publicUserProfile(uid, data);
};

exports.bootstrapCurrentUser = onCall({ region: "us-central1" }, async (request) => {
  const uid = getCallerUid(request);
  const userRef = db.collection("users").doc(uid);
  const existing = await userRef.get();
  if (existing.exists) {
    const profile = publicUserProfile(uid, existing.data() || {});
    if (!profile.active) throw new HttpsError("permission-denied", "Tu usuario esta inactivo.");
    return profile;
  }

  const adminSnap = await db.collection("users")
    .where("role", "==", "admin")
    .where("active", "==", true)
    .limit(1)
    .get();
  if (!adminSnap.empty) {
    throw new HttpsError("permission-denied", "Tu usuario todavia no fue habilitado en el CRM.");
  }

  const authUser = await admin.auth().getUser(uid);
  const username = normalizeUsername(
    authUser.email ? authUser.email.split("@")[0] : authUser.displayName || "admin"
  ) || `admin-${uid.slice(0, 6)}`;
  const payload = {
    displayName: authUser.displayName || authUser.email || "Administrador",
    username,
    authEmail: authUser.email || "",
    role: "admin",
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: uid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await userRef.set(payload);
  const created = await userRef.get();
  return publicUserProfile(uid, created.data() || {});
});

exports.registerUserLogin = onCall({ region: "us-central1" }, async (request) => {
  const uid = getCallerUid(request);
  const snap = await getUserProfileSnap(uid);
  const data = snap.data() || {};
  if (!snap.exists || data.active !== true) {
    throw new HttpsError("permission-denied", "Tu usuario no esta habilitado.");
  }
  await db.collection("users").doc(uid).update({
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const updated = await getUserProfileSnap(uid);
  return publicUserProfile(uid, updated.data() || {});
});

exports.createAppUser = onCall({ region: "us-central1" }, async (request) => {
  const callerUid = getCallerUid(request);
  await assertAdmin(callerUid);

  const data = request.data || {};
  const displayName = String(data.displayName || "").trim().slice(0, 80);
  const username = normalizeUsername(data.username);
  const password = String(data.password || "");
  const role = String(data.role || "sales").trim();
  const active = data.active !== false;

  if (!displayName) throw new HttpsError("invalid-argument", "Completa el nombre.");
  if (!username || username.length < 3) throw new HttpsError("invalid-argument", "El usuario debe tener al menos 3 caracteres.");
  if (!ROLES.has(role)) throw new HttpsError("invalid-argument", "Rol invalido.");
  if (password.length < 8) throw new HttpsError("invalid-argument", "La contrasena debe tener al menos 8 caracteres.");

  const authEmail = buildAuthEmail(username);
  const existingUsername = await db.collection("users").where("username", "==", username).limit(1).get();
  if (!existingUsername.empty) throw new HttpsError("already-exists", "Ese usuario ya existe.");

  let createdUser;
  try {
    createdUser = await admin.auth().createUser({
      email: authEmail,
      password,
      displayName,
      disabled: !active
    });
  } catch (error) {
    if (error?.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Ese usuario ya existe en Firebase Auth.");
    }
    logger.error("No se pudo crear usuario Auth", { message: error?.message || String(error) });
    throw new HttpsError("internal", "No se pudo crear el usuario.");
  }

  const payload = {
    displayName,
    username,
    authEmail,
    role,
    active,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: callerUid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection("users").doc(createdUser.uid).set(payload);
  } catch (error) {
    await admin.auth().deleteUser(createdUser.uid).catch(() => {});
    logger.error("No se pudo crear perfil de usuario", { uid: createdUser.uid, message: error?.message || String(error) });
    throw new HttpsError("internal", "No se pudo guardar el perfil del usuario.");
  }

  const createdProfile = await db.collection("users").doc(createdUser.uid).get();
  return publicUserProfile(createdUser.uid, createdProfile.data() || {});
});

exports.updateAppUser = onCall({ region: "us-central1" }, async (request) => {
  const callerUid = getCallerUid(request);
  await assertAdmin(callerUid);

  const uid = String(request.data?.uid || "").trim();
  if (!uid) throw new HttpsError("invalid-argument", "Usuario invalido.");
  const snap = await getUserProfileSnap(uid);
  if (!snap.exists) throw new HttpsError("not-found", "Usuario no encontrado.");

  const patch = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  if (typeof request.data.displayName === "string") {
    const displayName = request.data.displayName.trim().slice(0, 80);
    if (!displayName) throw new HttpsError("invalid-argument", "Completa el nombre.");
    patch.displayName = displayName;
  }
  if (typeof request.data.role === "string") {
    const role = request.data.role.trim();
    if (!ROLES.has(role)) throw new HttpsError("invalid-argument", "Rol invalido.");
    if (uid === callerUid && role !== "admin") throw new HttpsError("failed-precondition", "No podes quitarte tu propio rol administrador.");
    patch.role = role;
  }
  if (typeof request.data.active === "boolean") {
    if (uid === callerUid && request.data.active === false) throw new HttpsError("failed-precondition", "No podes desactivar tu propio usuario.");
    patch.active = request.data.active;
  }

  await db.collection("users").doc(uid).update(patch);
  const authPatch = {};
  if (typeof patch.active === "boolean") authPatch.disabled = patch.active === false;
  if (patch.displayName) authPatch.displayName = patch.displayName;
  if (Object.keys(authPatch).length) await admin.auth().updateUser(uid, authPatch);
  const updated = await getUserProfileSnap(uid);
  return publicUserProfile(uid, updated.data() || {});
});

const sendHtml = (res, status, title, message) => {
  res.status(status)
    .set("Cache-Control", "no-store, max-age=0")
    .set("Content-Type", "text/html; charset=utf-8")
    .send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fff;color:#111827;font-family:Arial,sans-serif;padding:24px}
    main{max-width:420px;text-align:center}
    h1{font-size:1.2rem;margin:0 0 8px}
    p{margin:0;color:#6b7280;line-height:1.45}
  </style>
</head>
<body><main><h1>${title}</h1><p>${message}</p></main></body>
</html>`);
};

const sanitizeSlug = (value) => String(value || "")
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, "")
  .replace(/-+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 80);

const getSlugFromRequest = (req) => {
  const path = String(req.path || req.url || "");
  const parts = path.split("?")[0].split("/").filter(Boolean);
  const qIndex = parts.indexOf("q");
  return sanitizeSlug(decodeURIComponent(parts[qIndex + 1] || ""));
};

const getValidDestination = (value) => {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch (error) {
    return "";
  }
};

exports.redirectQr = onRequest(
  {
    region: "us-central1",
    cors: false,
    invoker: "public"
  },
  async (req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.set("Allow", "GET, HEAD").status(405).send("Metodo no permitido.");
      return;
    }

    const slug = getSlugFromRequest(req);
    if (!slug) {
      sendHtml(res, 404, "Codigo QR no encontrado.", "Verifica el enlace e intenta nuevamente.");
      return;
    }

    try {
      const redirectSnap = await db.collection("qrRedirects").doc(slug).get();
      if (!redirectSnap.exists) {
        sendHtml(res, 404, "Codigo QR no encontrado.", "Verifica el enlace e intenta nuevamente.");
        return;
      }

      const redirect = redirectSnap.data() || {};
      if (redirect.archived === true) {
        sendHtml(res, 410, "Codigo QR no disponible.", "Este codigo QR ya no se encuentra disponible.");
        return;
      }

      if (redirect.status !== "active") {
        if (redirect.qrId) {
          const qrSnap = await db.collection("qrCodes").doc(String(redirect.qrId)).get();
          if (qrSnap.exists && qrSnap.data()?.archived === true) {
            sendHtml(res, 410, "Codigo QR no disponible.", "Este codigo QR ya no se encuentra disponible.");
            return;
          }
        }
        sendHtml(res, 410, "Codigo QR inactivo.", "Este codigo QR se encuentra temporalmente inactivo.");
        return;
      }

      const destinationUrl = getValidDestination(redirect.destinationUrl);
      if (!destinationUrl) {
        sendHtml(res, 400, "Destino no disponible.", "Este codigo QR no tiene un destino valido.");
        return;
      }

      if (redirect.qrId) {
        await db.collection("qrCodes").doc(String(redirect.qrId)).update({
          scanCount: admin.firestore.FieldValue.increment(1),
          lastScannedAt: admin.firestore.FieldValue.serverTimestamp()
        }).catch((error) => {
          logger.warn("No se pudo registrar el escaneo QR", {
            slug,
            qrId: redirect.qrId,
            message: error?.message || String(error)
          });
        });
      }

      res.set("Cache-Control", "no-store, max-age=0");
      res.redirect(302, destinationUrl);
    } catch (error) {
      logger.error("Error en redirectQr", { slug, message: error?.message || String(error) });
      sendHtml(res, 500, "No se pudo abrir este codigo QR.", "Intenta nuevamente en unos minutos.");
    }
  }
);

/**
 * Endpoint publico de salud tecnica: GET /api/health (via rewrite en
 * firebase.json). Devuelve JSON generico y sanitizado con el estado real de
 * base de datos, autenticacion y backend/Functions, mas version y checkedAt.
 * No expone datos sensibles. Storage se omite: este proyecto no lo utiliza.
 */
exports.healthCheck = onRequest(
  {
    region: "us-central1",
    cors: false,
    invoker: "public"
  },
  async (req, res) => {
    res.set("Cache-Control", "no-store, max-age=0");
    res.set("Content-Type", "application/json; charset=utf-8");

    if (!["GET", "HEAD"].includes(req.method)) {
      res.set("Allow", "GET, HEAD").status(405).json({ status: "error", errorCode: "METHOD_NOT_ALLOWED" });
      return;
    }

    try {
      const report = await buildHealthReport({
        db,
        auth: admin.auth(),
        version: APP_VERSION,
        logger
      });
      res.status(200).json(report);
    } catch (error) {
      logger.error("Error en healthCheck", { message: error?.message || String(error) });
      res.status(500).json({
        status: "error",
        errorCode: "HEALTH_UNAVAILABLE",
        checkedAt: new Date().toISOString()
      });
    }
  }
);
