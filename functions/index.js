const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

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
