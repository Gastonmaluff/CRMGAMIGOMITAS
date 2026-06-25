export const DUPLICATE_DISTANCE_METERS = 50;
export const SIMILAR_NAME_DISTANCE_METERS = 100;

const EARTH_RADIUS_METERS = 6371000;
const DISTANCE_EPSILON_METERS = 0.001;

const COMMON_BUSINESS_WORDS = new Set([
  "supermercado",
  "super",
  "despensa",
  "copetrol",
  "estacion",
  "farmacia",
  "local",
  "tienda",
  "comercial",
  "market",
  "mini",
  "ruta",
  "km"
]);

export const hasValidCoordinatePair = (lat, lng) => {
  const safeLat = Number(lat);
  const safeLng = Number(lng);
  return Number.isFinite(safeLat)
    && Number.isFinite(safeLng)
    && safeLat >= -90
    && safeLat <= 90
    && safeLng >= -180
    && safeLng <= 180
    && !(safeLat === 0 && safeLng === 0);
};

export const calculateDistanceMeters = (lat1, lng1, lat2, lng2) => {
  if (!hasValidCoordinatePair(lat1, lng1) || !hasValidCoordinatePair(lat2, lng2)) return Infinity;
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLng = toRad(Number(lng2) - Number(lng1));
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
};

export const normalizeDuplicatePhone = (value) => {
  let digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("595") && digits.length >= 12) digits = digits.slice(3);
  if (digits.startsWith("0") && digits.length >= 10) digits = digits.slice(1);
  return digits;
};

export const normalizeDuplicateText = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

const tokenizeName = (value) => normalizeDuplicateText(value)
  .split(" ")
  .filter((token) => token.length > 1 && !COMMON_BUSINESS_WORDS.has(token));

const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }
  return prev[b.length];
};

export const isHighlySimilarBusinessName = (a, b) => {
  const left = normalizeDuplicateText(a);
  const right = normalizeDuplicateText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const maxLen = Math.max(left.length, right.length);
  const editScore = maxLen ? 1 - (levenshtein(left, right) / maxLen) : 0;
  if (editScore >= 0.9) return true;
  const leftTokens = new Set(tokenizeName(left));
  const rightTokens = new Set(tokenizeName(right));
  if (!leftTokens.size || !rightTokens.size) return false;
  const intersection = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union > 0 && intersection / union >= 0.8;
};

export const formatDuplicateDistance = (meters) => {
  const value = Number(meters);
  if (!Number.isFinite(value)) return "";
  if (value < 1000) return `${Math.round(value)} m`;
  return `${(Math.round(value / 100) / 10).toLocaleString("es-PY", { maximumFractionDigits: 1 })} km`;
};

export const buildDuplicateMatches = ({ payload, records }) => {
  const payloadPhone = normalizeDuplicatePhone(payload?.phone);
  const payloadName = normalizeDuplicateText(payload?.name);
  const payloadAddress = normalizeDuplicateText(payload?.address);
  const payloadLat = Number(payload?.latitude);
  const payloadLng = Number(payload?.longitude);
  const hasPayloadCoords = hasValidCoordinatePair(payloadLat, payloadLng);

  return (records || [])
    .map((record) => {
      const recordLat = Number(record.latitude);
      const recordLng = Number(record.longitude);
      const hasRecordCoords = hasValidCoordinatePair(recordLat, recordLng);
      const distance = hasPayloadCoords && hasRecordCoords
        ? calculateDistanceMeters(payloadLat, payloadLng, recordLat, recordLng)
        : Infinity;
      const phoneMatch = Boolean(payloadPhone && normalizeDuplicatePhone(record.phone) === payloadPhone);
      const locationMatch = distance <= DUPLICATE_DISTANCE_METERS + DISTANCE_EPSILON_METERS;
      const nameMatch = Boolean(
        hasPayloadCoords
        && hasRecordCoords
        && distance <= SIMILAR_NAME_DISTANCE_METERS + DISTANCE_EPSILON_METERS
        && payloadName
        && isHighlySimilarBusinessName(payloadName, record.name)
      );
      const addressMatch = Boolean(
        payloadAddress
        && normalizeDuplicateText(record.address)
        && normalizeDuplicateText(record.address) === payloadAddress
      );
      if (!phoneMatch && !locationMatch && !nameMatch && !addressMatch) return null;
      return {
        ...record,
        distance,
        reasons: [
          phoneMatch ? "mismo telefono" : "",
          locationMatch ? "ubicacion cercana" : "",
          nameMatch ? "nombre similar en una ubicacion cercana" : "",
          addressMatch ? "direccion exacta" : ""
        ].filter(Boolean)
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const phoneDelta = Number(b.reasons.includes("mismo telefono")) - Number(a.reasons.includes("mismo telefono"));
      if (phoneDelta) return phoneDelta;
      return a.distance - b.distance;
    });
};
