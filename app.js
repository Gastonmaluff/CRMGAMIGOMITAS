import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  writeBatch,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0i_qAO6PU3PcS-b-Tp523zoTzmSXzgZ0",
  authDomain: "crmgamigomitas-889b5.firebaseapp.com",
  projectId: "crmgamigomitas-889b5",
  storageBucket: "crmgamigomitas-889b5.firebasestorage.app",
  messagingSenderId: "113194529937",
  appId: "1:113194529937:web:b6beeb6818b6f81f1f3b30",
  measurementId: "G-45724JZTLH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const userArea = document.getElementById("userArea");
const userEmail = document.getElementById("userEmail");
const authError = document.getElementById("authError");

const loginForm = document.getElementById("loginForm");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".tab-panel");
const TAB_IDS = Array.from(tabs).map((tab) => tab.dataset.tab).filter(Boolean);

const rawMaterialForm = document.getElementById("rawMaterialForm");
const purchaseForm = document.getElementById("purchaseForm");
const recipeForm = document.getElementById("recipeForm");
const batchForm = document.getElementById("batchForm");
const batchProductSelect = document.getElementById("batchProductSelect");
const batchRecipeNotice = document.getElementById("batchRecipeNotice");
const batchProductInfo = document.getElementById("batchProductInfo");
const metricKgYesterday = document.getElementById("metricKgYesterday");
const metricDisplaysStock = document.getElementById("metricDisplaysStock");
const metricDisplaysBreakdown = document.getElementById("metricDisplaysBreakdown");
const metricLotsPossible = document.getElementById("metricLotsPossible");
const metricLotsProgress = document.getElementById("metricLotsProgress");
const metricLotsSub = document.getElementById("metricLotsSub");
const metricBottleneck = document.getElementById("metricBottleneck");
const metricBottleneckCard = document.getElementById("metricBottleneckCard");
const metricBottleneckSub = document.getElementById("metricBottleneckSub");
const dashboardOverviewViewport = document.getElementById("dashboardOverviewViewport");
const dashboardOverviewTrack = document.getElementById("dashboardOverviewTrack");
const dashboardPanelsViewport = document.getElementById("dashboardPanelsViewport");
const dashboardPanelsTrack = document.getElementById("dashboardPanelsTrack");
const salesMetricToday = document.getElementById("salesMetricToday");
const salesMetricMonth = document.getElementById("salesMetricMonth");
const salesMetricYesterday = document.getElementById("salesMetricYesterday");
const salesMetricLastMonth = document.getElementById("salesMetricLastMonth");
const salesMetricAvailable = document.getElementById("salesMetricAvailable");
const salesMetricAvailableBreakdown = document.getElementById("salesMetricAvailableBreakdown");
const salesMetricGoal = document.getElementById("salesMetricGoal");
const salesGoalCard = document.querySelector(".sales-card-goal");
const salesGoalSummary = document.getElementById("salesGoalSummary");
const salesGoalProgressBar = document.getElementById("salesGoalProgressBar");
const salesGoalTarget = document.getElementById("salesGoalTarget");
const salesGoalRemaining = document.getElementById("salesGoalRemaining");
const salesGoalPaceCurrent = document.getElementById("salesGoalPaceCurrent");
const salesGoalPaceNeeded = document.getElementById("salesGoalPaceNeeded");
const salesGoalMessage = document.getElementById("salesGoalMessage");
const historyMetricSalesCount = document.getElementById("historyMetricSalesCount");
const historyMetricCustomersCount = document.getElementById("historyMetricCustomersCount");
const historyMetricAmount = document.getElementById("historyMetricAmount");
const historyMetricTicket = document.getElementById("historyMetricTicket");
const productForm = document.getElementById("productForm");
const clientForm = document.getElementById("clientForm");
const saleForm = document.getElementById("saleForm");
const saleSubmitButton = saleForm?.querySelector('button[type="submit"]');
const saleCreditCheckbox = document.getElementById("saleCredit");
const saleCreditToggle = document.getElementById("saleCreditToggle");
const saleItems = document.getElementById("saleItems");
const saleGrandTotal = document.getElementById("saleGrandTotal");
const addSaleItemBtn = document.getElementById("addSaleItemBtn");
const salesGoalForm = document.getElementById("salesGoalForm");
const salesGoalNotice = document.getElementById("salesGoalNotice");
const addIngredientBtn = document.getElementById("addIngredientBtn");
const quickClientToggle = document.getElementById("quickClientToggle");
const quickClientPanel = document.getElementById("quickClientPanel");
const quickClientName = document.getElementById("quickClientName");
const quickClientRucMain = document.getElementById("quickClientRucMain");
const quickClientRucDv = document.getElementById("quickClientRucDv");
const quickClientPhone = document.getElementById("quickClientPhone");
const quickClientAddress = document.getElementById("quickClientAddress");
const quickClientSave = document.getElementById("quickClientSave");
const quickClientCancel = document.getElementById("quickClientCancel");
const quickClientNotice = document.getElementById("quickClientNotice");

const rawMaterialList = document.getElementById("rawMaterialList");
const purchaseList = document.getElementById("purchaseList");
const recipeIngredientsList = document.getElementById("recipeIngredientsList");
const recipeCostPreview = document.getElementById("recipeCostPreview");
const recipeList = document.getElementById("recipeList");
const batchList = document.getElementById("batchList");
const stockSummaryGeneral = document.getElementById("stockSummaryGeneral");
const stockMaterialsList = document.getElementById("stockMaterialsList");
const stockRecipeSelect = document.getElementById("stockRecipeSelect");
const rawMaterialAdjustmentHistory = document.getElementById("rawMaterialAdjustmentHistory");
const productList = document.getElementById("productList");
const clientList = document.getElementById("clientList");
const saleList = document.getElementById("saleList");
const repurchaseList = document.getElementById("repurchaseList");
const salesCoverageSection = document.getElementById("coverageSection");
const salesCoveragePins = document.getElementById("salesCoveragePins");
const salesCoverageSummary = document.getElementById("salesCoverageSummary");
const salesCoverageCities = document.getElementById("salesCoverageCities");
const historyFilters = document.getElementById("historyFilters");
const historyCustomerSearch = document.getElementById("historyCustomerSearch");
const historyCustomerResults = document.getElementById("historyCustomerResults");
const historyClientFilter = document.getElementById("historyClientFilter");
const historyDateFrom = document.getElementById("historyDateFrom");
const historyDateTo = document.getElementById("historyDateTo");
const historyStatusFilter = document.getElementById("historyStatusFilter");
const historyPaymentFilter = document.getElementById("historyPaymentFilter");
const historyProductFilter = document.getElementById("historyProductFilter");
const historyProductModeField = document.getElementById("historyProductModeField");
const historyProductMode = document.getElementById("historyProductMode");
const historyResetFiltersBtn = document.getElementById("historyResetFiltersBtn");
const historyPeriodClients = document.getElementById("historyPeriodClients");
const historyCustomerProfile = document.getElementById("historyCustomerProfile");
const historySalesResults = document.getElementById("historySalesResults");
const historySalesChartCanvas = document.getElementById("historySalesChart");
const historySalesChartEmpty = document.getElementById("historySalesChartEmpty");
const finishedStockList = document.getElementById("finishedStockList");
const finishedStockAdjustmentHistory = document.getElementById("finishedStockAdjustmentHistory");

const dueDateField = document.getElementById("dueDateField");
const saleObservationToggle = document.getElementById("saleObservationToggle");
const saleObservationField = document.getElementById("saleObservationField");
const saleRepurchaseToggle = document.getElementById("saleRepurchaseToggle");
const saleRepurchaseField = document.getElementById("saleRepurchaseField");
const saleRepurchaseFrequencyField = document.getElementById("saleRepurchaseFrequencyField");
const unitGroups = Array.from(document.querySelectorAll(".unit-group[data-target]"));

const state = {
  rawMaterials: [],
  purchases: [],
  recipes: [],
  batches: [],
  products: [],
  clients: [],
  sales: [],
  salesGoals: [],
  finishedStockAdjustments: [],
  rawMaterialAdjustments: []
};

let unsubscribers = [];
const recipeDraft = {
  ingredients: []
};
const commercialHistoryState = {
  searchTerm: "",
  selectedClientId: ""
};
const repurchaseNotesOpenState = new Set();
const repurchaseHistoryOpenState = new Set();
const clientHistoryOpenState = new Set();
const stockAdjustmentState = {
  openKey: "",
  newStock: "",
  reason: ""
};
const rawMaterialAdjustmentState = {
  openKey: "",
  newStock: "",
  reason: ""
};
let saleProductIndex = new Map();
const SALES_DASHBOARD_DEBUG = false;
const COMPANY_INFO = {
  name: "Mimar Alimentos",
  phone: "0983417650",
  address: "KM12 Acaray - Ciudad del Este",
  email: "contacto@mimar.com.py"
};
const COMPANY_LOGO_SRC = "IMG_8867.PNG";
let companyLogoDataUrlPromise = null;
const REPURCHASE_CONTACT_RESULT_OPTIONS = [
  { value: "", label: "Seleccionar" },
  { value: "vendio", label: "Vendio" },
  { value: "no_respondio", label: "No respondio" },
  { value: "dijo_despues", label: "Dijo despues" },
  { value: "sin_stock", label: "Sin stock" },
  { value: "tiene_todavia", label: "Tiene todavia" }
];
const REPURCHASE_CONTACT_RESULT_VALUES = new Set(
  REPURCHASE_CONTACT_RESULT_OPTIONS
    .map((option) => option.value)
    .filter(Boolean)
);
const PARAGUAY_COVERAGE_CITIES = [
  { key: "asuncion", label: "Asuncion", lat: -25.2637, lng: -57.5759, aliases: ["asuncion"] },
  { key: "san-lorenzo", label: "San Lorenzo", lat: -25.3397, lng: -57.5088, aliases: ["san lorenzo"] },
  { key: "luque", label: "Luque", lat: -25.2666, lng: -57.4916, aliases: ["luque"] },
  { key: "lambare", label: "Lambare", lat: -25.3465, lng: -57.6065, aliases: ["lambare"] },
  { key: "capiata", label: "Capiata", lat: -25.3552, lng: -57.4454, aliases: ["capiata"] },
  { key: "caacupe", label: "Caacupe", lat: -25.3857, lng: -57.1422, aliases: ["caacupe"] },
  { key: "concepcion", label: "Concepcion", lat: -23.4064, lng: -57.4344, aliases: ["concepcion"] },
  { key: "san-estanislao", label: "San Estanislao", lat: -24.6638, lng: -56.4438, aliases: ["san estanislao", "santani"] },
  { key: "curuguaty", label: "Curuguaty", lat: -24.4729, lng: -55.692, aliases: ["curuguaty"] },
  { key: "pedro-juan-caballero", label: "Pedro Juan Caballero", lat: -22.547, lng: -55.7336, aliases: ["pedro juan caballero"] },
  { key: "salto-del-guaira", label: "Salto del Guaira", lat: -24.0619, lng: -54.3097, aliases: ["salto del guaira"] },
  { key: "caaguazu", label: "Caaguazu", lat: -25.4554, lng: -56.0169, aliases: ["caaguazu"] },
  { key: "coronel-oviedo", label: "Coronel Oviedo", lat: -25.4444, lng: -56.4401, aliases: ["coronel oviedo", "oviedo"] },
  { key: "villarrica", label: "Villarrica", lat: -25.7495, lng: -56.4352, aliases: ["villarrica"] },
  { key: "ciudad-del-este", label: "Ciudad del Este", lat: -25.5097, lng: -54.6111, aliases: ["ciudad del este", "cde"] },
  { key: "hernandarias", label: "Hernandarias", lat: -25.4079, lng: -54.6421, aliases: ["hernandarias"] },
  { key: "presidente-franco", label: "Presidente Franco", lat: -25.5638, lng: -54.6108, aliases: ["presidente franco"] },
  { key: "minga-guazu", label: "Minga Guazu", lat: -25.4996, lng: -54.7594, aliases: ["minga guazu"] },
  { key: "santa-rita", label: "Santa Rita", lat: -25.7974, lng: -55.0888, aliases: ["santa rita"] },
  { key: "encarnacion", label: "Encarnacion", lat: -27.3306, lng: -55.8667, aliases: ["encarnacion"] },
  { key: "pilar", label: "Pilar", lat: -26.8682, lng: -58.2935, aliases: ["pilar"] }
];
const COVERAGE_MAP_VIEWBOX = {
  width: 1261.43,
  height: 1387.544,
  minLat: -27.75,
  maxLat: -19.15,
  minLng: -62.85,
  maxLng: -54.0,
  paddingLeft: 76,
  paddingRight: 82,
  paddingTop: 58,
  paddingBottom: 52
};

const showAuth = () => {
  authSection.style.display = "grid";
  dashboardSection.style.display = "none";
  userArea.style.display = "none";
};

const showDashboard = (user) => {
  authSection.style.display = "none";
  dashboardSection.style.display = "block";
  userArea.style.display = "flex";
  userEmail.textContent = user.email || "";
  requestAnimationFrame(() => {
    refreshCollapseHeights();
  });
};

const formatNumber = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatGs = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("es-PY", { maximumFractionDigits: 0 });
};

const parseGsInputValue = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return 0;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatGsInputValue = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return formatGs(amount);
};

const normalizePhoneForStorage = (phone) => {
  const cleaned = String(phone ?? "").replace(/\D+/g, "");
  if (!cleaned) return "";
  if (/^5959\d{8}$/.test(cleaned)) return cleaned;
  if (/^9\d{8}$/.test(cleaned)) return `595${cleaned}`;
  return null;
};

const getLocalPhoneInputValue = (phone) => {
  const cleaned = String(phone ?? "").replace(/\D+/g, "");
  if (!cleaned) return "";
  if (/^5959\d{8}$/.test(cleaned)) return cleaned.slice(3);
  if (/^0?9\d{8}$/.test(cleaned)) return cleaned.slice(-9);
  return cleaned;
};

const formatPhoneForWhatsApp = (phone) => {
  const normalized = normalizePhoneForStorage(phone);
  return normalized || null;
};

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const normalizeRepurchaseContactResult = (value) => {
  const normalized = normalizeText(value || "");
  return REPURCHASE_CONTACT_RESULT_VALUES.has(normalized) ? normalized : "";
};

const getClientFollowupData = (client) => {
  const followup = client?.followUp && typeof client.followUp === "object"
    ? client.followUp
    : {};
  return {
    lastContactDate: normalizeDateValue(followup.lastContactDate || client?.lastContactDate || ""),
    result: normalizeRepurchaseContactResult(followup.result || client?.contactResult || ""),
    nextActionDate: normalizeDateValue(followup.nextActionDate || client?.nextActionDate || ""),
    observation: String(followup.observation || client?.followupObservation || "").trim()
  };
};

const buildRepurchaseContactResultOptions = (selectedValue = "") => REPURCHASE_CONTACT_RESULT_OPTIONS
  .map((option) => `<option value="${option.value}"${option.value === selectedValue ? " selected" : ""}>${option.label}</option>`)
  .join("");

const getRepurchaseContactResultLabel = (value) => {
  const normalized = normalizeRepurchaseContactResult(value);
  const match = REPURCHASE_CONTACT_RESULT_OPTIONS.find((option) => option.value === normalized);
  return match?.label || "Sin resultado";
};

const parseHistoryCreatedAt = (value) => {
  if (value && typeof value === "object") {
    if (Number.isFinite(value.seconds)) return Number(value.seconds) * 1000;
    if (typeof value.toDate === "function") return value.toDate().getTime();
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const getClientFollowupHistory = (client) => {
  const history = Array.isArray(client?.followUpHistory) ? client.followUpHistory : [];
  return history
    .map((entry) => ({
      date: normalizeDateValue(entry?.date || entry?.followupDate || entry?.lastContactDate || ""),
      result: normalizeRepurchaseContactResult(entry?.result || entry?.contactResult || ""),
      observation: String(entry?.observation || entry?.note || entry?.notes || "").trim(),
      nextActionDate: normalizeDateValue(entry?.nextActionDate || entry?.nextDate || ""),
      userName: String(entry?.userName || entry?.user || "").trim(),
      userEmail: String(entry?.userEmail || entry?.email || "").trim(),
      createdAtMs: parseHistoryCreatedAt(entry?.createdAtMs || entry?.createdAt || 0)
    }))
    .filter((entry) => entry.date || entry.result || entry.observation || entry.nextActionDate)
    .sort((a, b) => {
      const aDay = toIsoDayNumber(a.date) ?? -1;
      const bDay = toIsoDayNumber(b.date) ?? -1;
      if (aDay !== bDay) return bDay - aDay;
      return Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0);
    });
};

const buildClientFollowupHistoryMarkup = (client, emptyText = "Sin historial de seguimiento.") => {
  const entries = getClientFollowupHistory(client);
  if (!entries.length) {
    return `<div class="list-item muted">${emptyText}</div>`;
  }
  return entries.map((entry) => `
    <div class="followup-history-item">
      <div class="followup-history-main">
        <strong>${formatDateForPdf(entry.date)}</strong>
        <span>${getRepurchaseContactResultLabel(entry.result)}</span>
      </div>
      ${entry.observation ? `<div class="followup-history-note">${escapeHtml(entry.observation)}</div>` : ""}
      <div class="followup-history-meta">
        ${entry.nextActionDate ? `<span>Proxima accion: ${formatDateForPdf(entry.nextActionDate)}</span>` : ""}
        ${entry.userName || entry.userEmail ? `<span>Usuario: ${escapeHtml(entry.userName || entry.userEmail)}</span>` : ""}
      </div>
    </div>
  `).join("");
};

const buildWhatsAppLink = (phone, customerName = "") => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  if (!formattedPhone) return null;
  const safeName = String(customerName || "").trim();
  const message = safeName
    ? `Hola ${safeName}, ¿cómo estás? Te escribo para consultarte si necesitás reposición.`
    : "Hola, ¿cómo estás? Te escribo para consultarte si necesitás reposición.";
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

const metricAnimationState = new WeakMap();
const metricAnimationFrames = new WeakMap();
const dashboardMetricSnapshot = {
  production: {
    kgYesterday: null,
    displaysStock: null,
    lotsPossible: null
  },
  sales: {
    today: null,
    yesterday: null,
    month: null,
    lastMonth: null,
    available: null,
    goalPercent: null,
    goalProgress: 0,
    goalProgressColor: "#94a3b8"
  },
  commercialHistory: {
    totalSales: 0,
    totalCustomers: 0,
    totalAmount: 0,
    averageTicket: 0
  }
};
let salesGoalProgressFrameId = null;
const salesGoalProgressState = {
  target: null,
  color: null
};
let historySalesChart = null;

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

const getCountAnimationDuration = (target) => {
  const abs = Math.abs(Number(target) || 0);
  if (!Number.isFinite(abs)) return 800;
  const normalized = Math.min(1, Math.log10(abs + 1) / 4);
  return Math.round(700 + (normalized * 500));
};

const animateMetricNumber = (element, target, {
  formatFrame,
  formatFinal,
  force = false
} = {}) => {
  if (!element || !Number.isFinite(target)) return;
  const previous = metricAnimationState.get(element);
  if (!force && previous?.target === target) {
    element.textContent = (formatFinal || formatFrame || ((value) => String(value)))(target);
    return;
  }
  const activeFrame = metricAnimationFrames.get(element);
  if (activeFrame) {
    cancelAnimationFrame(activeFrame);
  }
  if (prefersReducedMotion()) {
    const finalFormatter = formatFinal || formatFrame || ((value) => String(value));
    element.textContent = finalFormatter(target);
    metricAnimationState.set(element, { target });
    return;
  }
  const frameFormatter = formatFrame || ((value) => String(value));
  const finalFormatter = formatFinal || frameFormatter;
  const duration = getCountAnimationDuration(target);
  const startValue = 0;
  const delta = target - startValue;
  let startTime = null;

  const tick = (timestamp) => {
    if (startTime === null) startTime = timestamp;
    const progress = Math.min(1, (timestamp - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = startValue + (delta * eased);
    element.textContent = frameFormatter(currentValue);
    if (progress < 1) {
      metricAnimationFrames.set(element, requestAnimationFrame(tick));
      return;
    }
    element.textContent = finalFormatter(target);
    metricAnimationState.set(element, { target });
    metricAnimationFrames.delete(element);
  };

  metricAnimationFrames.set(element, requestAnimationFrame(tick));
};

const ensureKgMetricMainNode = () => {
  if (!metricKgYesterday) return null;
  let mainNode = metricKgYesterday.querySelector(".overview-number-main");
  let unitNode = metricKgYesterday.querySelector(".overview-number-unit");
  if (!mainNode || !unitNode) {
    metricKgYesterday.innerHTML = '<span class="overview-number-main">0,00</span><span class="overview-number-unit">kg</span>';
    mainNode = metricKgYesterday.querySelector(".overview-number-main");
    unitNode = metricKgYesterday.querySelector(".overview-number-unit");
  }
  return mainNode;
};

const animateProductionDashboardMetrics = ({ force = false } = {}) => {
  const snapshot = dashboardMetricSnapshot.production;
  const kgMainNode = ensureKgMetricMainNode();
  if (kgMainNode && Number.isFinite(snapshot.kgYesterday)) {
    animateMetricNumber(kgMainNode, snapshot.kgYesterday, {
      force,
      formatFrame: (value) => formatNumber(value),
      formatFinal: (value) => formatNumber(value)
    });
  }
  if (metricDisplaysStock) {
    if (Number.isFinite(snapshot.displaysStock)) {
      animateMetricNumber(metricDisplaysStock, snapshot.displaysStock, {
        force,
        formatFrame: (value) => formatInteger(value),
        formatFinal: (value) => formatInteger(value)
      });
    } else {
      metricDisplaysStock.textContent = "N/D";
    }
  }
  if (metricLotsPossible) {
    if (Number.isFinite(snapshot.lotsPossible)) {
      animateMetricNumber(metricLotsPossible, snapshot.lotsPossible, {
        force,
        formatFrame: (value) => formatInteger(value),
        formatFinal: (value) => formatInteger(value)
      });
    }
  }
};

const animateSalesDashboardMetrics = ({ force = false } = {}) => {
  const snapshot = dashboardMetricSnapshot.sales;
  if (salesMetricToday && Number.isFinite(snapshot.today)) {
    animateMetricNumber(salesMetricToday, snapshot.today, {
      force,
      formatFrame: (value) => formatInteger(value),
      formatFinal: (value) => formatInteger(value)
    });
  }
  if (salesMetricYesterday && Number.isFinite(snapshot.yesterday)) {
    animateMetricNumber(salesMetricYesterday, snapshot.yesterday, {
      force,
      formatFrame: (value) => formatInteger(value),
      formatFinal: (value) => formatInteger(value)
    });
  }
  if (salesMetricMonth && Number.isFinite(snapshot.month)) {
    animateMetricNumber(salesMetricMonth, snapshot.month, {
      force,
      formatFrame: (value) => formatInteger(value),
      formatFinal: (value) => formatInteger(value)
    });
  }
  if (salesMetricLastMonth && Number.isFinite(snapshot.lastMonth)) {
    animateMetricNumber(salesMetricLastMonth, snapshot.lastMonth, {
      force,
      formatFrame: (value) => formatInteger(value),
      formatFinal: (value) => formatInteger(value)
    });
  }
  if (salesMetricAvailable) {
    if (Number.isFinite(snapshot.available)) {
      animateMetricNumber(salesMetricAvailable, snapshot.available, {
        force,
        formatFrame: (value) => formatInteger(value),
        formatFinal: (value) => formatInteger(value)
      });
    } else {
      salesMetricAvailable.textContent = "N/D";
    }
  }
  if (salesMetricGoal) {
    if (Number.isFinite(snapshot.goalPercent)) {
      animateMetricNumber(salesMetricGoal, snapshot.goalPercent, {
        force,
        formatFrame: (value) => `${formatInteger(value)}%`,
        formatFinal: (value) => `${formatInteger(value)}%`
      });
    } else {
      salesMetricGoal.textContent = "Sin objetivo";
    }
  }
};

const animateCommercialHistoryMetrics = ({ force = false } = {}) => {
  const snapshot = dashboardMetricSnapshot.commercialHistory;
  if (historyMetricSalesCount) {
    animateMetricNumber(historyMetricSalesCount, snapshot.totalSales, {
      force,
      formatFrame: (value) => formatInteger(value),
      formatFinal: (value) => formatInteger(value)
    });
  }
  if (historyMetricCustomersCount) {
    animateMetricNumber(historyMetricCustomersCount, snapshot.totalCustomers, {
      force,
      formatFrame: (value) => formatInteger(value),
      formatFinal: (value) => formatInteger(value)
    });
  }
  if (historyMetricAmount) {
    animateMetricNumber(historyMetricAmount, snapshot.totalAmount, {
      force,
      formatFrame: (value) => `Gs ${formatGs(value)}`,
      formatFinal: (value) => `Gs ${formatGs(value)}`
    });
  }
  if (historyMetricTicket) {
    animateMetricNumber(historyMetricTicket, snapshot.averageTicket, {
      force,
      formatFrame: (value) => `Gs ${formatGs(value)}`,
      formatFinal: (value) => `Gs ${formatGs(value)}`
    });
  }
};

const animateDashboardMetricsByTab = (tab, { force = false } = {}) => {
  if (tab === "sales") {
    animateSalesDashboardMetrics({ force });
    return;
  }
  if (tab === "commercial-history") {
    animateCommercialHistoryMetrics({ force });
    return;
  }
  animateProductionDashboardMetrics({ force });
};

const getProgressAnimationDuration = (targetPercent) => {
  const normalized = Math.max(0, Math.min(100, Number(targetPercent) || 0));
  return Math.round(Math.max(700, Math.min(1000, 700 + (normalized * 3))));
};

const animateSalesGoalProgressBar = (targetPercent, color, { force = false } = {}) => {
  if (!salesGoalProgressBar) return;
  const clamped = Math.max(0, Math.min(100, Number(targetPercent) || 0));
  const safeColor = color || "#94a3b8";
  if (!force
    && salesGoalProgressState.target === clamped
    && salesGoalProgressState.color === safeColor) {
    salesGoalProgressBar.style.width = `${clamped}%`;
    salesGoalProgressBar.style.background = safeColor;
    return;
  }

  if (salesGoalProgressFrameId) {
    cancelAnimationFrame(salesGoalProgressFrameId);
    salesGoalProgressFrameId = null;
  }

  if (prefersReducedMotion()) {
    salesGoalProgressBar.style.width = `${clamped}%`;
    salesGoalProgressBar.style.background = safeColor;
    salesGoalProgressState.target = clamped;
    salesGoalProgressState.color = safeColor;
    return;
  }

  const duration = getProgressAnimationDuration(clamped);
  const startValue = 0;
  const delta = clamped - startValue;
  let startTime = null;
  salesGoalProgressBar.style.width = "0%";
  salesGoalProgressBar.style.background = safeColor;

  const tick = (timestamp) => {
    if (startTime === null) startTime = timestamp;
    const progress = Math.min(1, (timestamp - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = startValue + (delta * eased);
    salesGoalProgressBar.style.width = `${Math.max(0, Math.min(100, currentValue))}%`;
    if (progress < 1) {
      salesGoalProgressFrameId = requestAnimationFrame(tick);
      return;
    }
    salesGoalProgressBar.style.width = `${clamped}%`;
    salesGoalProgressBar.style.background = safeColor;
    salesGoalProgressState.target = clamped;
    salesGoalProgressState.color = safeColor;
    salesGoalProgressFrameId = null;
  };

  salesGoalProgressFrameId = requestAnimationFrame(tick);
};

const refreshIcons = () => {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
};

const formatInteger = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return Math.round(num).toLocaleString("es-PY", { maximumFractionDigits: 0 });
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-PY");
};

const formatTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" });
};

const getAuthMessage = (error) => {
  const code = String(error?.code || "");
  if (code === "auth/invalid-email") return "Correo invalido.";
  if (code === "auth/user-not-found") return "No existe una cuenta con ese correo.";
  if (code === "auth/wrong-password") return "Contrasena incorrecta.";
  if (code === "auth/invalid-credential") return "Correo o contrasena incorrectos.";
  if (code === "auth/too-many-requests") return "Demasiados intentos. Espera un momento y vuelve a intentar.";
  if (code === "auth/network-request-failed") return "Sin conexion a internet. Revisa tu red.";
  if (code === "auth/email-already-in-use") return "Ese correo ya esta registrado.";
  if (code === "auth/weak-password") return "La contrasena es demasiado debil (usa al menos 6 caracteres).";
  return error?.message || "No se pudo completar la autenticacion.";
};

const setAuthFeedback = (message, type = "error") => {
  if (!authError) return;
  authError.classList.remove("info", "success");
  if (type === "info" || type === "success") {
    authError.classList.add(type);
  }
  authError.textContent = message || "";
};

const setAuthBusy = (busy) => {
  if (loginSubmitBtn) {
    if (!loginSubmitBtn.dataset.defaultText) {
      loginSubmitBtn.dataset.defaultText = loginSubmitBtn.textContent || "Ingresar";
    }
    loginSubmitBtn.disabled = busy;
    loginSubmitBtn.textContent = busy ? "Ingresando..." : loginSubmitBtn.dataset.defaultText;
  }
  if (registerBtn) registerBtn.disabled = busy;
};

const getLoginCredentials = () => {
  const emailInput = loginForm?.elements?.namedItem("email") || loginForm?.querySelector('input[name="email"]');
  const passwordInput = loginForm?.elements?.namedItem("password") || loginForm?.querySelector('input[name="password"]');
  const email = String(emailInput?.value || "").trim();
  const password = String(passwordInput?.value || "").trim();
  return { email, password };
};

const buildSaleOptionKey = ({ productId, name, productName }) => {
  if (productId) return productId;
  const label = name || productName || "";
  return `name:${normalizeText(label)}`;
};

const getSaleLineItems = (sale) => {
  if (Array.isArray(sale.items) && sale.items.length) return sale.items;
  if (sale.productId || sale.productName) {
    return [{
      productId: sale.productId || "",
      productName: sale.productName || "",
      quantity: sale.quantity || 0,
      unitPrice: sale.unitPrice || 0,
      unit: sale.unit || "display"
    }];
  }
  return [];
};

const isCreditSaleRecord = (sale) => sale.isCredit === true
  || sale.paid === "no"
  || normalizeText(sale.payment) === "credito";

const getSaleTotalAmount = (sale) => {
  const storedTotal = Number(sale?.total);
  if (Number.isFinite(storedTotal)) return storedTotal;
  return getSaleLineItems(sale).reduce((sum, line) => {
    const lineTotal = Number(line.total);
    if (Number.isFinite(lineTotal)) return sum + lineTotal;
    return sum + (Number(line.quantity || 0) * Number(line.unitPrice || 0));
  }, 0);
};

const getSaleClientDetails = (sale) => {
  const linkedClient = state.clients.find((client) => client.id === sale.clientId);
  return {
    name: sale.clientName || linkedClient?.name || "Sin cliente",
    ruc: linkedClient?.ruc || "",
    phone: linkedClient?.phone || "",
    address: linkedClient?.address || ""
  };
};

const slugifyFilePart = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 50);

const formatDateForPdf = (value) => {
  const iso = normalizeDateValue(value);
  if (!iso) return "Sin fecha";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "Sin fecha";
  return `${day}/${month}/${year}`;
};

const buildSalePdfFilename = (sale) => {
  const saleDateIso = normalizeDateValue(getSaleDateValue(sale)) || toDateInputValue(new Date()) || "venta";
  const clientLabel = slugifyFilePart(getSaleClientDetails(sale).name) || "cliente";
  return `venta-${saleDateIso}-${clientLabel}.pdf`;
};

const getCompanyLogoDataUrl = async () => {
  if (companyLogoDataUrlPromise) return companyLogoDataUrlPromise;
  companyLogoDataUrlPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("");
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        console.error("[sales-pdf] No se pudo procesar el logo.", error);
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = COMPANY_LOGO_SRC;
  });
  return companyLogoDataUrlPromise;
};

const shareSaleAsPdf = async (sale) => {
  const JsPdf = window.jspdf?.jsPDF;
  if (!JsPdf) {
    window.alert("No se pudo generar el PDF. Recarga la pagina e intenta nuevamente.");
    return;
  }
  const lines = getSaleLineItems(sale);
  const totalAmount = getSaleTotalAmount(sale);
  const saleDateLabel = formatDateForPdf(getSaleDateValue(sale));
  const saleCode = (sale.id || "venta").slice(0, 8).toUpperCase();
  const client = getSaleClientDetails(sale);
  const isCredit = isCreditSaleRecord(sale);
  const paymentMethod = sale.payment || "No especificado";
  const typeLabel = isCredit ? "Credito" : "Contado";
  const observation = String(sale.observation || "").trim();
  const palette = {
    black: [0, 0, 0],
    dark: [28, 28, 28],
    text: [42, 42, 42],
    muted: [96, 96, 96],
    border: [204, 204, 204],
    block: [236, 236, 236],
    soft: [246, 246, 246],
    white: [255, 255, 255]
  };

  const doc = new JsPdf({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  doc.setDrawColor(...palette.border);
  doc.roundedRect(10, 10, pageWidth - 20, 277, 2, 2);

  const logoDataUrl = await getCompanyLogoDataUrl();
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 15, y, 28, 18);
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...palette.black);
  doc.setFontSize(20);
  doc.text("RECIBO / PEDIDO", pageWidth - 15, y + 6, { align: "right" });
  doc.setFontSize(11);
  doc.setTextColor(...palette.muted);
  doc.text(`Etiqueta de despacho #${saleCode}`, pageWidth - 15, y + 12, { align: "right" });
  y += 26;

  doc.setDrawColor(...palette.border);
  doc.setFillColor(...palette.soft);
  doc.roundedRect(15, y, 85, 34, 2, 2, "FD");
  doc.roundedRect(105, y, 90, 34, 2, 2, "FD");

  doc.setFontSize(9.5);
  doc.setTextColor(...palette.muted);
  doc.text("Empresa", 18, y + 6);
  doc.text("Cliente", 108, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...palette.dark);
  doc.text(COMPANY_INFO.name, 18, y + 13);
  doc.text(client.name, 108, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.8);
  doc.setTextColor(...palette.text);
  doc.text(`Tel: ${COMPANY_INFO.phone || "-"}`, 18, y + 19);
  doc.text(`Dir: ${COMPANY_INFO.address || "-"}`, 18, y + 24);
  doc.text(`Email: ${COMPANY_INFO.email || "-"}`, 18, y + 29);

  doc.text(`RUC: ${client.ruc || "-"}`, 108, y + 19);
  doc.text(`Tel: ${client.phone || "-"}`, 108, y + 24);
  const addressLines = doc.splitTextToSize(`Dir: ${client.address || "-"}`, 84);
  doc.text(addressLines.slice(0, 2), 108, y + 29);
  y += 42;

  doc.setFillColor(...palette.soft);
  doc.roundedRect(15, y, 180, 24, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...palette.muted);
  doc.text("Resumen de venta", 18, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.8);
  doc.setTextColor(...palette.text);
  doc.text(`Fecha: ${saleDateLabel}`, 18, y + 13);
  doc.text(`Metodo de pago: ${paymentMethod}`, 18, y + 19);
  doc.text(`Tipo: ${typeLabel}${isCredit && sale.dueDate ? ` (Cobro: ${formatDateForPdf(sale.dueDate)})` : ""}`, 108, y + 13);
  y += 32;

  if (observation) {
    const observationLines = doc.splitTextToSize(observation, 172);
    const noteHeight = Math.min(44, 12 + (observationLines.length * 5));
    doc.setDrawColor(...palette.border);
    doc.setFillColor(...palette.soft);
    doc.roundedRect(15, y, 180, noteHeight, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...palette.muted);
    doc.text("Observacion", 18, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.2);
    doc.setTextColor(...palette.text);
    doc.text(observationLines.slice(0, 5), 18, y + 12);
    y += noteHeight + 8;
  }

  doc.setDrawColor(...palette.border);
  doc.roundedRect(15, y, 180, 145, 2, 2);
  doc.setFillColor(...palette.block);
  doc.rect(16, y + 2, 178, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...palette.dark);
  doc.text("Detalle de productos", 18, y + 8);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...palette.dark);
  if (!lines.length) {
    doc.text("Sin productos registrados.", 18, y);
    y += 7;
  } else {
    lines.forEach((line) => {
      const qtyLabel = formatInteger(line.quantity || 0);
      const nameLabel = line.productName || "Producto";
      const lineLabel = `${qtyLabel}x ${nameLabel}`;
      const detailLines = doc.splitTextToSize(lineLabel, 126);
      const lineTotal = Number.isFinite(Number(line.total))
        ? Number(line.total)
        : Number(line.quantity || 0) * Number(line.unitPrice || 0);
      doc.text(detailLines, 18, y);
      doc.text(`Gs ${formatGs(lineTotal)}`, 192, y, { align: "right" });
      y += (detailLines.length * 6) + 1.5;
    });
  }

  y = Math.max(y + 7, 238);
  doc.setFillColor(...palette.black);
  doc.roundedRect(15, y, 180, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.8);
  doc.setTextColor(...palette.white);
  doc.text("TOTAL", 18, y + 9);
  doc.text(`Gs ${formatGs(totalAmount)}`, 192, y + 9, { align: "right" });
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...palette.muted);
  doc.text("Pedido preparado. Gracias por su compra.", 105, y, { align: "center" });

  doc.save(buildSalePdfFilename(sale));
};

const computeDisplaysForSaleLine = (line) => {
  const qty = Number(line.quantity || 0);
  if (!qty) return 0;
  const unit = normalizeText(line.unit || "display");
  const converted = computeDisplaysFromUnit(qty, unit);
  if (converted !== null) return converted;
  return qty;
};

const getStockStatus = ({ available, minStock, requiredPerBatch }) => {
  const availableNum = Number(available || 0);
  const minNum = Number(minStock || 0);
  const requiredNum = Number(requiredPerBatch || 0);
  if (availableNum <= 0 || (requiredNum > 0 && availableNum + 1e-6 < requiredNum)) {
    return { label: "Critico", tagClass: "status-critical", alertClass: "alert-critical" };
  }
  if (minNum > 0 && availableNum < minNum) {
    return { label: "Bajo", tagClass: "status-low", alertClass: "alert-low" };
  }
  return { label: "OK", tagClass: "status-ok", alertClass: "" };
};

const resetForm = (form) => {
  form.reset();
  form.dataset.editId = "";
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn && submitBtn.dataset.defaultText) {
    submitBtn.textContent = submitBtn.dataset.defaultText;
  }
  const dateInputs = form.querySelectorAll('input[type="date"]');
  dateInputs.forEach((input) => {
    input.valueAsDate = new Date();
  });
};

const setSubmitLabel = (form, label) => {
  const submitBtn = form.querySelector('button[type="submit"]');
  if (!submitBtn) return;
  if (!submitBtn.dataset.defaultText) {
    submitBtn.dataset.defaultText = submitBtn.textContent;
  }
  submitBtn.textContent = label || submitBtn.dataset.defaultText;
};

const saveDoc = async (collectionName, form, payload) => {
  const editId = form.dataset.editId;
  if (editId) {
    const { createdAt, ...rest } = payload;
    await updateDoc(doc(db, collectionName, editId), { ...rest, updatedAt: serverTimestamp() });
  } else {
    await addDoc(collection(db, collectionName), payload);
  }
};

const renderList = (container, items, renderer) => {
  if (!items.length) {
    container.innerHTML = '<div class="list-item muted">Sin registros todavia.</div>';
    return;
  }
  container.innerHTML = items.map(renderer).join("");
};

const updateSelect = (select, items, placeholder) => {
  if (!select || select.tagName !== "SELECT") return;
  const selectedValue = select.value || "";
  const options = [`<option value="">${placeholder}</option>`];
  items.forEach((item) => {
    options.push(`<option value="${item.id}">${item.name}</option>`);
  });
  select.innerHTML = options.join("");
  if (selectedValue && items.some((item) => item.id === selectedValue)) {
    select.value = selectedValue;
  }
};

const computeStockTotals = () => {
  const totals = {};
  state.purchases.forEach((purchase) => {
    const id = purchase.materialId;
    totals[id] = totals[id] || { purchased: 0, used: 0 };
    const type = purchase.type || "ingreso";
    if (type === "ingreso") {
      totals[id].purchased += Number(purchase.quantity || 0);
    } else {
      totals[id].used += Number(purchase.quantity || 0);
    }
  });
  state.batches.forEach((batch) => {
    if (batch.stockDeducted) return;
    (batch.materialsUsed || []).forEach((material) => {
      const id = material.materialId;
      totals[id] = totals[id] || { purchased: 0, used: 0 };
      totals[id].used += Number(material.quantity || 0);
    });
  });

  const adjustmentDeltaByMaterial = new Map();
  state.rawMaterialAdjustments.forEach((adjustment) => {
    const materialId = String(adjustment?.materialId || "").trim();
    if (!materialId) return;
    const delta = Number(adjustment?.difference || 0);
    if (!Number.isFinite(delta) || delta === 0) return;
    adjustmentDeltaByMaterial.set(materialId, (adjustmentDeltaByMaterial.get(materialId) || 0) + delta);
  });

  const rows = state.rawMaterials.map((material) => {
    const summary = totals[material.id] || { purchased: 0, used: 0 };
    const baseAvailable = summary.purchased - summary.used;
    const adjustmentDelta = adjustmentDeltaByMaterial.get(material.id) || 0;
    const available = baseAvailable + adjustmentDelta;
    return {
      name: material.name,
      unit: material.unit,
      materialId: material.id,
      price: Number(material.price || 0),
      minStock: material.minStock ?? null,
      purchased: summary.purchased,
      used: summary.used,
      available,
      baseAvailable,
      adjustmentDelta
    };
  });

  const availabilityMap = rows.reduce((acc, row) => {
    acc[row.materialId] = row.available;
    return acc;
  }, {});

  return { rows, availabilityMap };
};

const toDateInputValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end)
  };
};

const getPreviousMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end)
  };
};

const getSalesPeriodRange = (goal) => {
  const goalStart = String(goal?.startDate || "").trim();
  const goalEnd = String(goal?.endDate || "").trim();
  if (goalStart && goalEnd && goalStart <= goalEnd) {
    return {
      startDate: goalStart,
      endDate: goalEnd
    };
  }
  return getCurrentMonthRange();
};

const toIsoDayNumber = (isoValue) => {
  const [year, month, day] = String(isoValue || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
};

const addDaysToDateValue = (dateValue, daysToAdd) => {
  const normalized = normalizeDateValue(dateValue);
  const days = Number(daysToAdd);
  if (!normalized || !Number.isFinite(days)) return "";
  const [year, month, day] = normalized.split("-").map(Number);
  if (!year || !month || !day) return "";
  const result = new Date(year, month - 1, day);
  result.setDate(result.getDate() + days);
  return toDateInputValue(result);
};

const normalizeDateValue = (value) => {
  if (!value) return "";
  if (value instanceof Date) return toDateInputValue(value);
  if (typeof value?.toDate === "function") return toDateInputValue(value.toDate());
  if (typeof value === "number") return toDateInputValue(new Date(value));
  if (typeof value === "object") {
    if (typeof value.seconds === "number") return toDateInputValue(new Date(value.seconds * 1000));
    if (typeof value._seconds === "number") return toDateInputValue(new Date(value._seconds * 1000));
  }
  const raw = String(value).trim();
  if (!raw) return "";
  const isoStrict = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoStrict) return `${isoStrict[1]}-${isoStrict[2]}-${isoStrict[3]}`;
  const isoLoose = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoLoose) {
    const year = isoLoose[1];
    const month = isoLoose[2].padStart(2, "0");
    const day = isoLoose[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const latam = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (latam) {
    const day = latam[1].padStart(2, "0");
    const month = latam[2].padStart(2, "0");
    const year = latam[3];
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return toDateInputValue(parsed);
  return "";
};

const getSaleDateValue = (sale) => {
  const fromSaleDate = normalizeDateValue(sale?.date);
  if (fromSaleDate) return fromSaleDate;
  const fromCreatedAt = normalizeDateValue(sale?.createdAt);
  if (fromCreatedAt) return fromCreatedAt;
  return normalizeDateValue(sale?.updatedAt);
};

const getSaleCreatedTimestamp = (sale) => Number(
  sale?.createdAt?.seconds
  || sale?.createdAt?._seconds
  || sale?.updatedAt?.seconds
  || sale?.updatedAt?._seconds
  || 0
);

const getProductKey = ({ productId = "", name = "" } = {}) => {
  const safeId = String(productId || "").trim();
  if (safeId) return safeId;
  return normalizeText(name || "");
};

const getAdjustmentProductKey = (adjustment) => getProductKey({
  productId: adjustment?.productId || "",
  name: adjustment?.productName || adjustment?.productKey || ""
});

const getAdjustmentTimestamp = (adjustment) => {
  const direct = Number(adjustment?.createdAtMs || 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const createdAt = adjustment?.createdAt;
  if (typeof createdAt?.toDate === "function") return createdAt.toDate().getTime();
  if (Number.isFinite(createdAt?.seconds)) return Number(createdAt.seconds) * 1000;
  if (Number.isFinite(createdAt?._seconds)) return Number(createdAt._seconds) * 1000;
  const parsedDate = normalizeDateValue(adjustment?.date);
  const parsedTime = parsedDate ? new Date(parsedDate).getTime() : 0;
  return Number.isFinite(parsedTime) ? parsedTime : 0;
};

const formatSignedInteger = (value) => {
  const num = Math.round(Number(value) || 0);
  if (num > 0) return `+${formatInteger(num)}`;
  return formatInteger(num);
};

const normalizeLookupText = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const COVERAGE_CITY_INDEX = PARAGUAY_COVERAGE_CITIES.map((city) => ({
  ...city,
  aliasesNormalized: (city.aliases || []).map((alias) => normalizeLookupText(alias)).filter(Boolean)
}));

const projectCoverageCityPoint = (city) => {
  const lat = Number(city?.lat);
  const lng = Number(city?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { x: COVERAGE_MAP_VIEWBOX.width / 2, y: COVERAGE_MAP_VIEWBOX.height / 2 };
  }

  const usableWidth = COVERAGE_MAP_VIEWBOX.width - COVERAGE_MAP_VIEWBOX.paddingLeft - COVERAGE_MAP_VIEWBOX.paddingRight;
  const usableHeight = COVERAGE_MAP_VIEWBOX.height - COVERAGE_MAP_VIEWBOX.paddingTop - COVERAGE_MAP_VIEWBOX.paddingBottom;
  const lngRatio = (lng - COVERAGE_MAP_VIEWBOX.minLng) / (COVERAGE_MAP_VIEWBOX.maxLng - COVERAGE_MAP_VIEWBOX.minLng);
  const latRatio = (COVERAGE_MAP_VIEWBOX.maxLat - lat) / (COVERAGE_MAP_VIEWBOX.maxLat - COVERAGE_MAP_VIEWBOX.minLat);
  const clampedLngRatio = Math.min(Math.max(lngRatio, 0), 1);
  const clampedLatRatio = Math.min(Math.max(latRatio, 0), 1);

  return {
    x: COVERAGE_MAP_VIEWBOX.paddingLeft + usableWidth * clampedLngRatio,
    y: COVERAGE_MAP_VIEWBOX.paddingTop + usableHeight * clampedLatRatio
  };
};

const getCoverageCityByAddress = (address) => {
  const normalizedAddress = normalizeLookupText(address);
  if (!normalizedAddress) return null;
  for (const city of COVERAGE_CITY_INDEX) {
    if (city.aliasesNormalized.some((alias) => normalizedAddress.includes(alias))) {
      return city;
    }
  }
  return null;
};

const getSaleClientRecord = (sale) => {
  if (sale?.clientId) {
    const byId = state.clients.find((client) => client.id === sale.clientId);
    if (byId) return byId;
  }
  const saleClientName = normalizeText(sale?.clientName || "");
  if (!saleClientName) return null;
  return state.clients.find((client) => normalizeText(client.name) === saleClientName) || null;
};

const getSaleClientUniqueKey = (sale, client) => {
  if (sale?.clientId) return `id:${sale.clientId}`;
  if (client?.id) return `id:${client.id}`;
  const byName = normalizeText(sale?.clientName || client?.name || "");
  return byName ? `name:${byName}` : "";
};

const buildSalesCoverageData = () => {
  const cityMap = new Map();
  const purchasedClientKeys = new Set();

  state.sales.forEach((sale) => {
    const client = getSaleClientRecord(sale);
    const clientKey = getSaleClientUniqueKey(sale, client);
    if (clientKey) purchasedClientKeys.add(clientKey);

    const city = getCoverageCityByAddress(client?.address || sale?.clientAddress || sale?.address || "");
    if (!city) return;
    const saleDate = getSaleDateValue(sale);
    const saleTimestamp = getSaleCreatedTimestamp(sale);
    const cityEntry = cityMap.get(city.key) || {
      ...city,
      salesCount: 0,
      clientKeys: new Set(),
      firstSaleDate: "",
      firstSaleTs: 0
    };

    cityEntry.salesCount += 1;
    if (clientKey) cityEntry.clientKeys.add(clientKey);

    if (saleDate) {
      if (
        !cityEntry.firstSaleDate
        || saleDate < cityEntry.firstSaleDate
        || (saleDate === cityEntry.firstSaleDate && saleTimestamp < cityEntry.firstSaleTs)
      ) {
        cityEntry.firstSaleDate = saleDate;
        cityEntry.firstSaleTs = saleTimestamp;
      }
    }

    cityMap.set(city.key, cityEntry);
  });

  const cities = Array.from(cityMap.values())
    .map((entry) => ({
      ...entry,
      clientsCount: entry.clientKeys.size
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const latestCity = cities
    .filter((city) => city.firstSaleDate)
    .sort((a, b) => {
      if (a.firstSaleDate !== b.firstSaleDate) return a.firstSaleDate < b.firstSaleDate ? 1 : -1;
      return b.firstSaleTs - a.firstSaleTs;
    })[0] || null;

  return {
    cities,
    cityCount: cities.length,
    customersWithPurchase: purchasedClientKeys.size,
    latestCity
  };
};

const renderSalesCoverage = ({ animatePins = false } = {}) => {
  if (!salesCoveragePins || !salesCoverageSummary || !salesCoverageCities) return;
  const coverage = buildSalesCoverageData();
  const canAnimate = Boolean(animatePins && salesCoverageSection?.classList.contains("open"));

  if (!coverage.cities.length) {
    salesCoveragePins.innerHTML = "";
    salesCoverageSummary.innerHTML = `
      <div class="coverage-stat"><span>Ciudades con venta</span><strong>0</strong></div>
      <div class="coverage-stat"><span>Clientes con compra</span><strong>${formatInteger(coverage.customersWithPurchase)}</strong></div>
      <div class="coverage-stat"><span>Ultima ciudad incorporada</span><strong>Sin datos</strong></div>
    `;
    salesCoverageCities.innerHTML = '<div class="list-item muted">Aun no hay ciudades con venta registrada.</div>';
    return;
  }

  salesCoveragePins.innerHTML = coverage.cities.map((city, index) => {
    const point = projectCoverageCityPoint(city);
    return `
    <g class="coverage-pin ${canAnimate ? "animate" : ""}" style="--pin-x:${point.x}px; --pin-y:${point.y}px; --pin-delay:${Math.min(index * 65, 700)}ms;">
      <title>${city.label}: ${city.salesCount} venta${city.salesCount === 1 ? "" : "s"}</title>
      <path class="coverage-pin-tail" d="M0 20 L-11 38 L11 38 Z"></path>
      <circle class="coverage-pin-dot" cx="0" cy="0" r="16"></circle>
      <circle class="coverage-pin-core" cx="0" cy="0" r="5.6"></circle>
    </g>
  `;
  }).join("");

  salesCoverageSummary.innerHTML = `
    <div class="coverage-stat">
      <span>Ciudades con venta</span>
      <strong>${formatInteger(coverage.cityCount)}</strong>
    </div>
    <div class="coverage-stat">
      <span>Clientes con compra</span>
      <strong>${formatInteger(coverage.customersWithPurchase)}</strong>
    </div>
    <div class="coverage-stat">
      <span>Ultima ciudad incorporada</span>
      <strong>${coverage.latestCity ? coverage.latestCity.label : "Sin datos"}</strong>
      ${coverage.latestCity?.firstSaleDate ? `<small>${formatDateForPdf(coverage.latestCity.firstSaleDate)}</small>` : ""}
    </div>
  `;

  salesCoverageCities.innerHTML = coverage.cities
    .sort((a, b) => b.salesCount - a.salesCount || a.label.localeCompare(b.label))
    .map((city) => `
      <div class="coverage-city-item">
        <span class="coverage-city-name">${city.label}</span>
        <strong>${formatInteger(city.salesCount)} venta${city.salesCount === 1 ? "" : "s"}</strong>
      </div>
    `)
    .join("");
};

const isSalePendingPayment = (sale) => {
  const paidValue = normalizeText(sale?.paid);
  if (paidValue === "si") return false;
  if (paidValue === "no") return true;
  return isCreditSaleRecord(sale);
};

const getCommercialHistoryFilterValues = () => {
  let dateFrom = normalizeDateValue(historyDateFrom?.value);
  let dateTo = normalizeDateValue(historyDateTo?.value);
  if (dateFrom && dateTo && dateFrom > dateTo) {
    [dateFrom, dateTo] = [dateTo, dateFrom];
  }
  const productKey = String(historyProductFilter?.value || "").trim();
  const productModeRaw = String(historyProductMode?.value || "includes").trim();
  const productMode = ["includes", "only", "excludes"].includes(productModeRaw) ? productModeRaw : "includes";
  return {
    dateFrom,
    dateTo,
    clientId: String(historyClientFilter?.value || commercialHistoryState.selectedClientId || "").trim(),
    status: String(historyStatusFilter?.value || "").trim(),
    payment: normalizeText(historyPaymentFilter?.value || ""),
    productKey,
    productMode: productKey ? productMode : "includes"
  };
};

const getCommercialHistoryDefaultDateRange = () => getCurrentMonthRange();

const hasActiveCommercialHistoryFilters = () => {
  const { startDate, endDate } = getCommercialHistoryDefaultDateRange();
  const searchValue = String(historyCustomerSearch?.value || commercialHistoryState.searchTerm || "").trim();
  const dateFrom = normalizeDateValue(historyDateFrom?.value);
  const dateTo = normalizeDateValue(historyDateTo?.value);
  const clientId = String(historyClientFilter?.value || "").trim();
  const productKey = String(historyProductFilter?.value || "").trim();
  const productMode = String(historyProductMode?.value || "includes").trim();
  const payment = String(historyPaymentFilter?.value || "").trim();
  const status = String(historyStatusFilter?.value || "").trim();
  return Boolean(
    searchValue
    || (dateFrom && dateFrom !== startDate)
    || (dateTo && dateTo !== endDate)
    || clientId
    || productKey
    || (productKey && productMode !== "includes")
    || payment
    || status
  );
};

const updateCommercialHistoryResetButtonState = () => {
  if (!historyResetFiltersBtn) return;
  const hasActiveFilters = hasActiveCommercialHistoryFilters();
  historyResetFiltersBtn.disabled = !hasActiveFilters;
  historyResetFiltersBtn.setAttribute("aria-disabled", String(!hasActiveFilters));
};

const resetCommercialHistoryFilters = () => {
  if (!historyFilters || !hasActiveCommercialHistoryFilters()) return;
  const { startDate, endDate } = getCommercialHistoryDefaultDateRange();
  if (historyCustomerSearch) historyCustomerSearch.value = "";
  commercialHistoryState.searchTerm = "";
  commercialHistoryState.selectedClientId = "";
  if (historyDateFrom) historyDateFrom.value = startDate;
  if (historyDateTo) historyDateTo.value = endDate;
  if (historyClientFilter) historyClientFilter.value = "";
  if (historyProductFilter) historyProductFilter.value = "";
  if (historyProductMode) historyProductMode.value = "includes";
  if (historyPaymentFilter) historyPaymentFilter.value = "";
  if (historyStatusFilter) historyStatusFilter.value = "";
  updateCommercialHistoryProductModeVisibility();
  renderCommercialHistory();
  updateCommercialHistoryResetButtonState();
  requestAnimationFrame(() => {
    refreshCollapseHeights();
  });
};

const getCommercialHistoryFilteredSales = (filters) => state.sales
  .filter((sale) => {
    const saleDate = getSaleDateValue(sale);
    if (!saleDate) return false;
    if (filters.dateFrom && saleDate < filters.dateFrom) return false;
    if (filters.dateTo && saleDate > filters.dateTo) return false;
    if (filters.clientId && sale.clientId !== filters.clientId) return false;
    if (filters.status === "pagado" && isSalePendingPayment(sale)) return false;
    if (filters.status === "pendiente" && !isSalePendingPayment(sale)) return false;
    if (filters.payment && normalizeText(sale.payment) !== filters.payment) return false;
    return true;
  })
  .sort((a, b) => {
    const bDay = toIsoDayNumber(getSaleDateValue(b)) ?? 0;
    const aDay = toIsoDayNumber(getSaleDateValue(a)) ?? 0;
    if (bDay !== aDay) return bDay - aDay;
    return getSaleCreatedTimestamp(b) - getSaleCreatedTimestamp(a);
  });

const getCommercialHistoryProductOptions = () => {
  const byKey = new Map();
  state.products.forEach((product) => {
    const key = buildSaleOptionKey({ productId: product.id, name: product.name });
    if (!key) return;
    byKey.set(key, product.name || "Producto");
  });
  state.sales.forEach((sale) => {
    getSaleLineItems(sale).forEach((line) => {
      const key = buildSaleOptionKey({
        productId: line.productId || sale.productId || "",
        productName: line.productName || sale.productName || ""
      });
      const label = line.productName || sale.productName || "";
      if (!key || !label) return;
      if (!byKey.has(key)) byKey.set(key, label);
    });
  });
  return Array.from(byKey.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
};

const refreshCommercialHistoryProductOptions = () => {
  if (!historyProductFilter) return;
  const selected = String(historyProductFilter.value || "").trim();
  const options = ['<option value="">Todos</option>'];
  getCommercialHistoryProductOptions().forEach((item) => {
    options.push(`<option value="${item.key}">${item.label}</option>`);
  });
  historyProductFilter.innerHTML = options.join("");
  if (selected && Array.from(historyProductFilter.options).some((opt) => opt.value === selected)) {
    historyProductFilter.value = selected;
  }
};

const updateCommercialHistoryProductModeVisibility = () => {
  if (!historyProductMode || !historyProductModeField) return;
  const hasProduct = Boolean(String(historyProductFilter?.value || "").trim());
  const secondaryRow = historyProductModeField.closest(".commercial-history-filters-row-secondary");
  if (secondaryRow) {
    secondaryRow.classList.toggle("mode-hidden", !hasProduct);
  }
  historyProductMode.disabled = !hasProduct;
  historyProductModeField.classList.toggle("is-disabled", !hasProduct);
  historyProductModeField.classList.toggle("hidden", !hasProduct);
  if (!hasProduct) historyProductMode.value = "includes";
};

const getSaleProductKeys = (sale) => {
  const keys = new Set();
  getSaleLineItems(sale).forEach((line) => {
    const key = buildSaleOptionKey({
      productId: line.productId || sale.productId || "",
      productName: line.productName || sale.productName || ""
    });
    if (key) keys.add(key);
  });
  return keys;
};

const applyCommercialHistoryProductMode = (sales, filters) => {
  if (!filters.productKey) {
    return { sales, allowedClientKeys: null };
  }
  const byClient = new Map();
  sales.forEach((sale) => {
    const details = getSaleClientDetails(sale);
    const clientKey = sale.clientId
      ? `id:${sale.clientId}`
      : `name:${normalizeText(details.name)}`;
    if (!clientKey || clientKey === "name:") return;
    const existing = byClient.get(clientKey) || {
      productKeys: new Set()
    };
    getSaleProductKeys(sale).forEach((productKey) => existing.productKeys.add(productKey));
    byClient.set(clientKey, existing);
  });

  const allowedClientKeys = new Set();
  byClient.forEach((entry, clientKey) => {
    const hasProduct = entry.productKeys.has(filters.productKey);
    if (filters.productMode === "includes" && hasProduct) {
      allowedClientKeys.add(clientKey);
      return;
    }
    if (filters.productMode === "only" && hasProduct && entry.productKeys.size === 1) {
      allowedClientKeys.add(clientKey);
      return;
    }
    if (filters.productMode === "excludes" && !hasProduct && entry.productKeys.size > 0) {
      allowedClientKeys.add(clientKey);
    }
  });

  const filteredByMode = sales.filter((sale) => {
    const details = getSaleClientDetails(sale);
    const clientKey = sale.clientId
      ? `id:${sale.clientId}`
      : `name:${normalizeText(details.name)}`;
    return allowedClientKeys.has(clientKey);
  });

  return { sales: filteredByMode, allowedClientKeys };
};

const summarizeSaleProducts = (sale) => {
  const lines = getSaleLineItems(sale);
  if (!lines.length) return "Sin productos";
  return lines
    .map((line) => `${formatInteger(line.quantity)}x ${line.productName || "Producto"}`)
    .join(" | ");
};

const buildCommercialHistoryDailySeries = (sales) => {
  const totalsByDate = new Map();
  sales.forEach((sale) => {
    const saleDate = getSaleDateValue(sale);
    if (!saleDate) return;
    const current = totalsByDate.get(saleDate) || 0;
    totalsByDate.set(saleDate, current + getSaleTotalAmount(sale));
  });
  return Array.from(totalsByDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));
};

const getCommercialHistoryRangeDayCount = (filters, series) => {
  if (!series.length) return 0;
  const fallbackStart = series[0][0];
  const fallbackEnd = series[series.length - 1][0];
  const startIso = normalizeDateValue(filters?.dateFrom) || fallbackStart;
  const endIso = normalizeDateValue(filters?.dateTo) || fallbackEnd;
  const startDay = toIsoDayNumber(startIso);
  const endDay = toIsoDayNumber(endIso);
  if (startDay === null || endDay === null) return series.length;
  const diff = Math.abs(endDay - startDay) + 1;
  return Math.max(1, diff);
};

const renderCommercialHistoryChart = (sales, filters = null) => {
  if (!historySalesChartCanvas || !historySalesChartEmpty) return;
  const ChartLib = window.Chart;
  if (!ChartLib || typeof ChartLib !== "function") {
    historySalesChartCanvas.classList.add("hidden");
    historySalesChartEmpty.classList.remove("hidden");
    historySalesChartEmpty.textContent = "No se pudo cargar el grafico.";
    if (historySalesChart) {
      historySalesChart.destroy();
      historySalesChart = null;
    }
    return;
  }

  const series = buildCommercialHistoryDailySeries(sales);
  if (!series.length) {
    historySalesChartCanvas.classList.add("hidden");
    historySalesChartEmpty.classList.remove("hidden");
    historySalesChartEmpty.textContent = "No hay datos para el periodo seleccionado.";
    if (historySalesChart) {
      historySalesChart.destroy();
      historySalesChart = null;
    }
    return;
  }

  historySalesChartCanvas.classList.remove("hidden");
  historySalesChartEmpty.classList.add("hidden");
  const labels = series.map(([iso]) => {
    const [year, month, day] = iso.split("-");
    if (!year || !month || !day) return iso;
    return `${day}/${month}`;
  });
  const fullLabels = series.map(([iso]) => formatDateForPdf(iso));
  const values = series.map(([, total]) => Math.round(Number(total) || 0));
  const totalAmount = values.reduce((sum, value) => sum + value, 0);
  const dayCount = getCommercialHistoryRangeDayCount(filters, series);
  const averageDaily = dayCount > 0 ? (totalAmount / dayCount) : 0;
  const averageValues = labels.map(() => averageDaily);
  const datasets = [
    {
      label: "Monto vendido",
      data: values,
      borderColor: "#1f2937",
      backgroundColor: "rgba(31, 41, 55, 0.12)",
      borderWidth: 2.2,
      pointRadius: 3,
      pointHoverRadius: 4,
      pointBackgroundColor: "#111827",
      tension: 0.3,
      fill: true
    },
    {
      label: "Promedio diario",
      data: averageValues,
      borderColor: "rgba(100, 116, 139, 0.9)",
      backgroundColor: "rgba(100, 116, 139, 0.08)",
      borderWidth: 1.8,
      borderDash: [6, 6],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0,
      fill: false
    }
  ];

  const tooltipTitle = (items) => {
    const point = items?.[0];
    if (!point) return "";
    return fullLabels[point.dataIndex] || point.label || "";
  };
  const tooltipLabel = (context) => {
    const value = context.parsed.y || 0;
    if (context.dataset?.label === "Promedio diario") {
      return `Promedio diario: Gs ${formatGs(value)}`;
    }
    return `Monto vendido: Gs ${formatGs(value)}`;
  };

  if (historySalesChart) {
    historySalesChart.data.labels = labels;
    historySalesChart.data.datasets = datasets;
    historySalesChart.options.plugins.tooltip.callbacks.title = tooltipTitle;
    historySalesChart.options.plugins.tooltip.callbacks.label = tooltipLabel;
    historySalesChart.update();
    return;
  }

  const ctx = historySalesChartCanvas.getContext("2d");
  if (!ctx) return;
  historySalesChart = new ChartLib(ctx, {
    type: "line",
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: tooltipTitle,
            label: tooltipLabel
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: "#64748b",
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(148, 163, 184, 0.28)"
          },
          ticks: {
            color: "#475569",
            callback: (value) => `Gs ${formatGs(value)}`
          }
        }
      }
    }
  });
};

const buildCommercialHistoryPeriodClients = (sales) => {
  const byClient = new Map();
  sales.forEach((sale) => {
    const details = getSaleClientDetails(sale);
    const clientKey = sale.clientId
      ? `id:${sale.clientId}`
      : `name:${normalizeText(details.name)}`;
    if (!clientKey || clientKey === "name:") return;
    const saleDate = getSaleDateValue(sale);
    const dayNumber = toIsoDayNumber(saleDate) ?? 0;
    const amount = getSaleTotalAmount(sale);
    const existing = byClient.get(clientKey);
    if (!existing) {
      byClient.set(clientKey, {
        clientId: sale.clientId || "",
        name: details.name,
        purchaseCount: 1,
        totalAmount: amount,
        lastPurchase: saleDate,
        lastDay: dayNumber
      });
      return;
    }
    existing.purchaseCount += 1;
    existing.totalAmount += amount;
    if (dayNumber >= existing.lastDay) {
      existing.lastDay = dayNumber;
      existing.lastPurchase = saleDate;
    }
  });
  return Array.from(byClient.values()).sort((a, b) => {
    if (b.lastDay !== a.lastDay) return b.lastDay - a.lastDay;
    return b.totalAmount - a.totalAmount;
  });
};

const refreshCommercialHistoryPaymentOptions = () => {
  if (!historyPaymentFilter) return;
  const selected = normalizeText(historyPaymentFilter.value || "");
  const paymentMap = new Map();
  state.sales.forEach((sale) => {
    const label = String(sale.payment || "").trim();
    const key = normalizeText(label);
    if (!key) return;
    if (!paymentMap.has(key)) paymentMap.set(key, label);
  });
  const options = ['<option value="">Todos</option>'];
  Array.from(paymentMap.entries())
    .sort((a, b) => a[1].localeCompare(b[1], "es"))
    .forEach(([key, label]) => {
      options.push(`<option value="${key}">${label}</option>`);
    });
  historyPaymentFilter.innerHTML = options.join("");
  if (selected && paymentMap.has(selected)) {
    historyPaymentFilter.value = selected;
  }
};

const renderCommercialHistorySearchResults = () => {
  if (!historyCustomerResults) return;
  const term = normalizeText(commercialHistoryState.searchTerm);
  if (!term) {
    historyCustomerResults.innerHTML = '<div class="list-item muted">Escribe un nombre para buscar clientes.</div>';
    return;
  }
  const matches = state.clients
    .filter((client) => normalizeText(client.name).includes(term))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  if (!matches.length) {
    historyCustomerResults.innerHTML = '<div class="list-item muted">Sin coincidencias.</div>';
    return;
  }
  historyCustomerResults.innerHTML = matches.map((client) => `
    <div class="list-item history-client-item">
      <div class="history-client-header">
        <strong>${client.name}</strong>
        <button class="btn ghost" type="button" data-select-history-client="${client.id}">Ver ficha</button>
      </div>
      <div class="history-client-meta">
        ${client.phone ? `<div>Tel: ${client.phone}</div>` : ""}
        ${client.ruc ? `<div>RUC: ${client.ruc}</div>` : ""}
      </div>
    </div>
  `).join("");
};

const renderCommercialHistory = () => {
  if (!historyPeriodClients || !historyCustomerProfile || !historySalesResults) return;
  renderCommercialHistorySearchResults();

  const filters = getCommercialHistoryFilterValues();
  commercialHistoryState.selectedClientId = filters.clientId;
  const baseFilteredSales = getCommercialHistoryFilteredSales(filters);
  const { sales: filteredSales } = applyCommercialHistoryProductMode(baseFilteredSales, filters);
  renderCommercialHistoryChart(filteredSales, filters);
  const periodClients = buildCommercialHistoryPeriodClients(filteredSales);

  const totalSalesCount = filteredSales.length;
  const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + getSaleTotalAmount(sale), 0);
  const ticketAverage = totalSalesCount ? totalSalesAmount / totalSalesCount : 0;
  dashboardMetricSnapshot.commercialHistory.totalSales = totalSalesCount;
  dashboardMetricSnapshot.commercialHistory.totalCustomers = periodClients.length;
  dashboardMetricSnapshot.commercialHistory.totalAmount = totalSalesAmount;
  dashboardMetricSnapshot.commercialHistory.averageTicket = ticketAverage;
  const activeTab = document.querySelector(".tab.active")?.dataset.tab || "production";
  if (activeTab === "commercial-history") {
    animateCommercialHistoryMetrics({ force: true });
  }

  if (!periodClients.length) {
    historyPeriodClients.innerHTML = '<div class="list-item muted">No hay clientes con compras para los filtros actuales.</div>';
  } else {
    historyPeriodClients.innerHTML = periodClients.map((entry) => `
      <div class="list-item history-client-item">
        <div class="history-client-header">
          <strong>${entry.name}</strong>
          ${entry.clientId ? `<button class="btn ghost" type="button" data-select-history-client="${entry.clientId}">Ver ficha</button>` : ""}
        </div>
        <div class="history-client-meta">
          <div>Ultima compra: ${formatDate(entry.lastPurchase)}</div>
          <div>Compras en periodo: ${formatInteger(entry.purchaseCount)}</div>
          <div>Total en periodo: Gs ${formatGs(entry.totalAmount)}</div>
        </div>
      </div>
    `).join("");
  }

  const selectedClient = state.clients.find((client) => client.id === filters.clientId);
  if (!selectedClient) {
    historyCustomerProfile.innerHTML = '<div class="list-item muted">Selecciona un cliente para ver su ficha comercial.</div>';
  } else {
    const clientSales = filteredSales
      .filter((sale) => sale.clientId === selectedClient.id)
      .sort((a, b) => {
        const bDay = toIsoDayNumber(getSaleDateValue(b)) ?? 0;
        const aDay = toIsoDayNumber(getSaleDateValue(a)) ?? 0;
        if (bDay !== aDay) return bDay - aDay;
        return getSaleCreatedTimestamp(b) - getSaleCreatedTimestamp(a);
      });
    const lastPurchase = clientSales.length ? getSaleDateValue(clientSales[0]) : "";
    const totalAmount = clientSales.reduce((sum, sale) => sum + getSaleTotalAmount(sale), 0);
    const recentSales = clientSales.slice(0, 6);
    historyCustomerProfile.innerHTML = `
      <div class="list-item">
        <strong>${selectedClient.name || "Sin nombre"}</strong>
        ${selectedClient.phone ? `<div>Telefono: ${selectedClient.phone}</div>` : ""}
        ${selectedClient.ruc ? `<div>RUC: ${selectedClient.ruc}</div>` : ""}
        ${selectedClient.address ? `<div>Direccion: ${selectedClient.address}</div>` : ""}
        <div>Fecha de ultima compra: ${lastPurchase ? formatDate(lastPurchase) : "Sin compras"}</div>
        <div>Cantidad de compras: ${formatInteger(clientSales.length)}</div>
        <div>Total comprado acumulado: Gs ${formatGs(totalAmount)}</div>
      </div>
      <div class="history-sale-lines">
        ${recentSales.length
    ? recentSales.map((sale) => `
          <div class="history-sale-line">
            <strong>${formatDate(getSaleDateValue(sale))} - Gs ${formatGs(getSaleTotalAmount(sale))}</strong>
            <div>Metodo: ${sale.payment || "No especificado"} | ${isSalePendingPayment(sale) ? "Pendiente" : "Pagado"}</div>
            <div class="history-sale-products">${summarizeSaleProducts(sale)}</div>
          </div>
        `).join("")
    : '<div class="list-item muted">Sin ventas registradas para este cliente.</div>'}
      </div>
    `;
  }

  if (!filteredSales.length) {
    historySalesResults.innerHTML = '<div class="list-item muted">Sin ventas para los filtros seleccionados.</div>';
  } else {
    historySalesResults.innerHTML = filteredSales.map((sale) => {
      const client = getSaleClientDetails(sale);
      return `
        <div class="list-item history-sale-item">
          <strong>${client.name}</strong>
          <div>Fecha: ${formatDate(getSaleDateValue(sale))}</div>
          <div>Total: Gs ${formatGs(getSaleTotalAmount(sale))}</div>
          <div>Metodo: ${sale.payment || "No especificado"} | ${isSalePendingPayment(sale) ? "Pendiente" : "Pagado"}</div>
          <div class="history-sale-products">${summarizeSaleProducts(sale)}</div>
        </div>
      `;
    }).join("");
  }
  updateCommercialHistoryResetButtonState();
};

const buildRepurchaseFollowups = () => {
  const byClient = new Map();
  state.sales.forEach((sale) => {
    if (sale.repurchaseActive !== true) return;
    const frequency = Number(sale.repurchaseFrequencyDays || 0);
    if (![15, 30, 45, 60].includes(frequency)) return;
    const saleDate = getSaleDateValue(sale);
    if (!saleDate) return;
    const nextContactDate = normalizeDateValue(sale.repurchaseNextContactDate) || addDaysToDateValue(saleDate, frequency);
    if (!nextContactDate) return;
    const rawClientName = String(sale.clientName || "").trim();
    const clientName = rawClientName || "Sin cliente";
    const dedupeKey = sale.clientId
      ? `id:${sale.clientId}`
      : `name:${normalizeText(rawClientName)}`;
    if (!dedupeKey || dedupeKey === "name:") return;
    const linkedClient = sale.clientId
      ? state.clients.find((client) => client.id === sale.clientId)
      : null;
    const clientFollowup = getClientFollowupData(linkedClient);
    const clientHistory = getClientFollowupHistory(linkedClient);
    const candidate = {
      clientId: sale.clientId || "",
      clientName,
      phone: linkedClient?.phone || sale.clientPhone || "",
      notes: String(linkedClient?.notes || "").trim(),
      saleDate,
      frequency,
      nextContactDate,
      lastContactDate: clientFollowup.lastContactDate,
      contactResult: clientFollowup.result,
      nextActionDate: clientFollowup.nextActionDate,
      followupObservation: clientFollowup.observation,
      followupHistory: clientHistory,
      sortDay: toIsoDayNumber(saleDate) ?? -1,
      sortCreatedAt: getSaleCreatedTimestamp(sale)
    };
    const existing = byClient.get(dedupeKey);
    if (!existing) {
      byClient.set(dedupeKey, candidate);
      return;
    }
    if (candidate.sortDay > existing.sortDay
      || (candidate.sortDay === existing.sortDay && candidate.sortCreatedAt > existing.sortCreatedAt)) {
      byClient.set(dedupeKey, candidate);
    }
  });

  const todayIso = toDateInputValue(new Date());
  const todayDay = toIsoDayNumber(todayIso) ?? 0;

  return Array.from(byClient.values())
    .map((entry) => {
      const operativeDate = normalizeDateValue(entry.nextActionDate) || entry.nextContactDate;
      const nextDay = toIsoDayNumber(operativeDate);
      if (nextDay === null) return null;
      const dayDelta = todayDay - nextDay;
      let status = "proximo";
      let statusClass = "upcoming";
      let statusOrder = 2;
      if (dayDelta > 0) {
        status = "vencido";
        statusClass = "overdue";
        statusOrder = 0;
      } else if (dayDelta === 0) {
        status = "vence hoy";
        statusClass = "today";
        statusOrder = 1;
      }
      return {
        ...entry,
        operativeDate,
        status,
        statusClass,
        statusOrder,
        overdueDays: Math.max(dayDelta, 0),
        daysUntil: Math.max(-dayDelta, 0)
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.statusOrder !== b.statusOrder) return a.statusOrder - b.statusOrder;
      if (a.statusOrder === 0) return b.overdueDays - a.overdueDays;
      if (a.statusOrder === 1) return a.clientName.localeCompare(b.clientName);
      if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
      return a.clientName.localeCompare(b.clientName);
    });
};

const renderRepurchaseList = () => {
  if (!repurchaseList) return;
  const validClientIds = new Set(state.clients.map((client) => client.id));
  Array.from(repurchaseNotesOpenState).forEach((clientId) => {
    if (!validClientIds.has(clientId)) repurchaseNotesOpenState.delete(clientId);
  });
  Array.from(repurchaseHistoryOpenState).forEach((clientId) => {
    if (!validClientIds.has(clientId)) repurchaseHistoryOpenState.delete(clientId);
  });
  const followups = buildRepurchaseFollowups();
  if (!followups.length) {
    repurchaseList.innerHTML = '<div class="list-item muted">Sin clientes con seguimiento activo.</div>';
    return;
  }
  repurchaseList.innerHTML = followups.map((entry) => {
    const whatsappLink = buildWhatsAppLink(entry.phone, entry.clientName);
    const hasClientRecord = Boolean(entry.clientId);
    const notesOpen = hasClientRecord && repurchaseNotesOpenState.has(entry.clientId);
    const historyOpen = hasClientRecord && repurchaseHistoryOpenState.has(entry.clientId);
    const notesValue = escapeHtml(entry.notes || "");
    const followupObservation = escapeHtml(entry.followupObservation || "");
    const resultOptions = buildRepurchaseContactResultOptions(entry.contactResult || "");
    return `
      <div class="list-item repurchase-item ${entry.statusClass === "overdue" ? "overdue" : ""}" data-repurchase-client-id="${entry.clientId}">
        <div class="repurchase-item-header">
          <strong>${entry.clientName}</strong>
          <span class="repurchase-status ${entry.statusClass}">${entry.status}</span>
        </div>
        <div class="repurchase-item-meta">
          <div>Telefono: ${entry.phone || "Sin telefono"}</div>
          <div>Ultima compra: ${formatDateForPdf(entry.saleDate)}</div>
          <div>Frecuencia: cada ${entry.frequency} dias</div>
          <div>Proximo contacto sugerido: ${formatDateForPdf(entry.nextContactDate)}</div>
        </div>
        <div class="repurchase-followup-grid ${hasClientRecord ? "" : "disabled"}">
          <label>
            Ultimo contacto
            <input type="date" value="${entry.lastContactDate || ""}" data-repurchase-last-contact ${hasClientRecord ? "" : "disabled"} />
          </label>
          <label>
            Resultado del contacto
            <select data-repurchase-contact-result ${hasClientRecord ? "" : "disabled"}>
              ${resultOptions}
            </select>
          </label>
          <label>
            Proxima accion
            <input type="date" value="${entry.nextActionDate || entry.nextContactDate || ""}" data-repurchase-next-action ${hasClientRecord ? "" : "disabled"} />
          </label>
          <label class="repurchase-followup-observation">
            Observacion del seguimiento
            <textarea data-repurchase-followup-observation ${hasClientRecord ? "" : "disabled"}>${followupObservation}</textarea>
          </label>
        </div>
        <div class="list-actions">
          ${whatsappLink
    ? `<button class="btn ghost" type="button" data-whatsapp-link="${whatsappLink}">WhatsApp</button>`
    : '<button class="btn ghost" type="button" disabled>WhatsApp</button>'}
          ${hasClientRecord
    ? `<button class="btn ghost" type="button" data-toggle-repurchase-notes="${entry.clientId}">Notas</button>`
    : '<button class="btn ghost" type="button" disabled>Notas</button>'}
          ${hasClientRecord
    ? `<button class="btn ghost" type="button" data-save-repurchase-followup="${entry.clientId}">Guardar seguimiento</button>`
    : ""}
          ${hasClientRecord
    ? `<button class="btn ghost" type="button" data-toggle-repurchase-history="${entry.clientId}">Historial</button>`
    : '<button class="btn ghost" type="button" disabled>Historial</button>'}
        </div>
        ${hasClientRecord
    ? `
          <div class="repurchase-notes-panel ${notesOpen ? "open" : "hidden"}">
            <label>
              Notas del cliente
              <textarea data-repurchase-notes-input>${notesValue}</textarea>
            </label>
            <div class="repurchase-inline-actions">
              <button class="btn ghost" type="button" data-save-repurchase-notes="${entry.clientId}">Guardar notas</button>
            </div>
          </div>
        `
    : '<div class="muted">Asocia este seguimiento a un cliente para guardar notas y acciones.</div>'}
        ${hasClientRecord
    ? `
          <div class="followup-history-panel ${historyOpen ? "open" : "hidden"}">
            ${buildClientFollowupHistoryMarkup(
    state.clients.find((client) => client.id === entry.clientId),
    "Sin historial de seguimiento para este cliente."
  )}
          </div>
        `
    : ""}
      </div>
    `;
  }).join("");
};

const debugSalesDateComparison = ({ todayValue, yesterdayValue, monthStart, monthEnd }) => {
  if (!SALES_DASHBOARD_DEBUG || !Array.isArray(state.sales)) return;
  console.groupCollapsed("[SalesDashboard] Debug fechas");
  console.log("hoy:", todayValue);
  console.log("ayer:", yesterdayValue);
  console.log("mes actual:", `${monthStart} -> ${monthEnd}`);
  state.sales.forEach((sale) => {
    const saleDate = getSaleDateValue(sale);
    const displays = Number(computeDisplaysFromSale(sale) || 0);
    console.log({
      saleId: sale.id,
      originalDate: sale.date ?? null,
      normalizedDate: saleDate || "(sin fecha)",
      displays,
      isToday: saleDate === todayValue,
      isYesterday: saleDate === yesterdayValue,
      inCurrentMonth: isDateInRange(saleDate, monthStart, monthEnd)
    });
  });
  console.groupEnd();
};

const computeKgForDate = (dateValue) => {
  let totalKg = 0;
  state.batches.forEach((batch) => {
    if (batch.date !== dateValue) return;
    const qty = Number(batch.quantityProduced || 0);
    if (!qty) return;
    if (batch.unitProduced === "kg") totalKg += qty;
    if (batch.unitProduced === "g") totalKg += qty / 1000;
  });
  return totalKg;
};

const getActiveRecipe = () => {
  const selectedRecipeId = batchForm.recipe.value || stockRecipeSelect?.value;
  if (selectedRecipeId) {
    return state.recipes.find((recipe) => recipe.id === selectedRecipeId) || null;
  }
  if (state.recipes.length === 1) return state.recipes[0];

  const buildBaseSignature = (recipe) => {
    const ingredients = (recipe.ingredients || []).map((ing) => {
      const qty = Number(ing.quantityBase || ing.quantity || 0);
      return {
        materialId: ing.materialId,
        quantity: Number.isFinite(qty) ? Number(qty.toFixed(6)) : 0
      };
    }).filter((ing) => ing.materialId);
    if (!ingredients.length) return "";
    ingredients.sort((a, b) => a.quantity - b.quantity);
    const core = ingredients.length > 1 ? ingredients.slice(1) : ingredients;
    core.sort((a, b) => a.materialId.localeCompare(b.materialId));
    return core.map((ing) => `${ing.materialId}:${ing.quantity}`).join("|");
  };

  const groups = new Map();
  state.recipes.forEach((recipe) => {
    const signature = buildBaseSignature(recipe);
    if (!signature) return;
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(recipe);
  });
  if (!groups.size) return state.recipes[0] || null;
  let bestGroup = null;
  groups.forEach((recipes) => {
    if (!bestGroup || recipes.length > bestGroup.length) {
      bestGroup = recipes;
    }
  });
  return bestGroup ? bestGroup[0] : state.recipes[0] || null;
};

const computeRecipeStockMetrics = (recipe, availabilityMap) => {
  const ingredientRows = [];
  let limitingRow = null;
  let maxBatches = null;
  let productionMaxKg = null;
  let displaysMax = null;
  if (recipe && recipe.ingredients?.length) {
    recipe.ingredients.forEach((ing) => {
      const material = state.rawMaterials.find((m) => m.id === ing.materialId);
      const baseUnit = material?.unit || ing.unitBase || ing.unit;
      const requiredBase = Number(ing.quantityBase || 0) ||
        normalizeQuantity(Number(ing.quantity || 0), ing.unit, baseUnit) ||
        Number(ing.quantity || 0);
      const available = availabilityMap[ing.materialId] ?? 0;
      const lotsPossible = requiredBase > 0 ? available / requiredBase : Infinity;
      const row = {
        materialId: ing.materialId,
        name: ing.materialName,
        unit: baseUnit,
        requiredBase,
        available,
        lotsPossible
      };
      ingredientRows.push(row);
      if (requiredBase > 0 && (!limitingRow || lotsPossible < limitingRow.lotsPossible)) {
        limitingRow = row;
      }
    });
    maxBatches = limitingRow ? Math.max(limitingRow.lotsPossible, 0) : 0;
    const yieldQuantity = Number(recipe.yieldQuantity || 0);
    const yieldUnit = recipe.yieldUnit || "";
    if (yieldQuantity > 0 && Number.isFinite(maxBatches)) {
      const totalYield = maxBatches * yieldQuantity;
      if (yieldUnit === "kg") productionMaxKg = totalYield;
      if (yieldUnit === "g") productionMaxKg = totalYield / 1000;
    }
    if (productionMaxKg !== null) {
      displaysMax = Math.floor(productionMaxKg / 0.36);
    }
  }
  return { ingredientRows, limitingRow, maxBatches, productionMaxKg, displaysMax };
};

const isDateInRange = (dateValue, startDate, endDate) => {
  if (!dateValue || !startDate || !endDate) return false;
  return dateValue >= startDate && dateValue <= endDate;
};

const computeDisplaysFromSales = (sales, startDate, endDate) => {
  let total = 0;
  if (!startDate || !endDate) return 0;
  sales.forEach((sale) => {
    const saleDate = getSaleDateValue(sale);
    if (!isDateInRange(saleDate, startDate, endDate)) return;
    total += Number(computeDisplaysFromSale(sale) || 0);
  });
  return total;
};

const computeDisplaysForDate = (sales, dateValue) => {
  let total = 0;
  if (!dateValue) return 0;
  sales.forEach((sale) => {
    const saleDate = getSaleDateValue(sale);
    if (saleDate !== dateValue) return;
    total += Number(computeDisplaysFromSale(sale) || 0);
  });
  return total;
};

const computeDisplaysFromUnit = (quantity, unit) => {
  if (!unit) return null;
  if (unit === "kg") return quantity / 0.36;
  if (unit === "g") return quantity / 360;
  if (unit.includes("display")) return quantity;
  return null;
};

const computeDisplaysFromBatch = (batch, recipe) => {
  const qty = Number(batch.quantityProduced || 0);
  if (!qty) return 0;
  const unit = normalizeText(batch.unitProduced || "");
  if (unit === "kg" || unit === "g") {
    return computeDisplaysFromUnit(qty, unit);
  }
  if (recipe) {
    const recipeUnit = normalizeText(recipe.yieldUnit || "");
    if (recipeUnit === "kg" || recipeUnit === "g") {
      if (unit === recipeUnit) {
        return computeDisplaysFromUnit(qty, recipeUnit);
      }
    }
  }
  return null;
};

const computeDisplaysFromSale = (sale) => {
  let total = 0;
  let canCompute = false;
  getSaleLineItems(sale).forEach((line) => {
    const displays = computeDisplaysForSaleLine(line);
    if (displays !== null) {
      total += displays;
      canCompute = true;
    }
  });
  return canCompute ? total : null;
};

const buildFinishedStockRows = () => {
  const map = {};
  const ensureEntry = (key, name, productId = "") => {
    if (!map[key]) {
      map[key] = {
        key,
        name,
        productId,
        produced: 0,
        sold: 0,
        canCompute: true
      };
    } else if (productId && !map[key].productId) {
      map[key].productId = productId;
    }
    return map[key];
  };

  state.products.forEach((product) => {
    const key = getProductKey({ productId: product.id, name: product.name });
    if (!key) return;
    ensureEntry(key, product.name || "Producto", product.id || "");
  });

  state.finishedStockAdjustments.forEach((adjustment) => {
    const key = getAdjustmentProductKey(adjustment);
    if (!key) return;
    ensureEntry(
      key,
      String(adjustment.productName || "Producto ajustado"),
      String(adjustment.productId || "")
    );
  });

  state.batches.forEach((batch) => {
    const productId = batch.productId || "";
    const name = batch.productName || batch.recipeName || "Producto";
    const key = getProductKey({ productId, name });
    const entry = ensureEntry(key, name, productId);
    const product = state.products.find((item) => item.id === productId);
    const recipe = product ? findRecipeForProduct(product) : null;
    const displays = computeDisplaysFromBatch(batch, recipe);
    if (displays === null) {
      entry.canCompute = false;
    } else {
      entry.produced += displays;
    }
  });

  state.sales.forEach((sale) => {
    getSaleLineItems(sale).forEach((line) => {
      const productId = line.productId || sale.productId || "";
      const name = line.productName || sale.productName || "Producto";
      const key = getProductKey({ productId, name });
      const entry = ensureEntry(key, name, productId);
      const displays = computeDisplaysForSaleLine(line);
      if (displays === null) {
        entry.canCompute = false;
      } else {
        entry.sold += displays;
      }
    });
  });

  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
};

const updateSaleItemSubtotal = (row) => {
  if (!row) return 0;
  const qty = Number(row.querySelector(".sale-item-qty")?.value || 0);
  const unitPrice = parseGsInputValue(row.querySelector(".sale-item-price")?.value || 0);
  const subtotal = (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0);
  row.dataset.subtotal = String(subtotal);
  const subtotalLabel = row.querySelector(".sale-item-subtotal");
  if (subtotalLabel) {
    subtotalLabel.textContent = `Gs ${formatGs(subtotal)}`;
  }
  return subtotal;
};

const refreshSaleGrandTotal = () => {
  if (!saleItems || !saleGrandTotal) return;
  const total = Array.from(saleItems.querySelectorAll(".sale-item"))
    .reduce((sum, row) => sum + updateSaleItemSubtotal(row), 0);
  saleGrandTotal.textContent = `Gs ${formatGs(total)}`;
};

const updateSaleItemStock = (row) => {
  if (!row) return;
  const select = row.querySelector(".sale-item-product");
  const qtyInput = row.querySelector(".sale-item-qty");
  const stockLabel = row.querySelector(".sale-item-stock");
  if (!select || !stockLabel) return;
  stockLabel.classList.remove("warning");
  const productRow = saleProductIndex.get(select.value);
  if (!productRow) {
    stockLabel.textContent = "";
    return;
  }
  const available = productRow.displays;
  const qty = Number(qtyInput?.value || 0);
  stockLabel.textContent = `Stock disponible: ${available !== null ? formatInteger(available) : "N/D"} displays`;
  if (available !== null && available !== undefined && qty > available) {
    stockLabel.classList.add("warning");
    stockLabel.textContent = `Stock disponible: ${formatInteger(available)} displays. Excede por ${formatInteger(qty - available)}.`;
  }
};

const isDesktopSalesKeyboardMode = () => window.matchMedia("(min-width: 769px)").matches;

const clearSalesKeyboardSelectState = (select) => {
  if (!select) return;
  delete select.dataset.keyboardPickerOpen;
  delete select.dataset.keyboardAdvanceTo;
};

const openSalesKeyboardSelect = (select, advanceTo = "") => {
  if (!isDesktopSalesKeyboardMode() || !select) return false;
  if (select.dataset.keyboardPickerOpen === "true") return true;
  select.dataset.keyboardPickerOpen = "true";
  select.dataset.keyboardAdvanceTo = advanceTo;
  try {
    if (typeof select.showPicker === "function") {
      select.showPicker();
      return true;
    }
  } catch (error) {
    console.debug("[sales] showPicker no disponible", error);
  }
  try {
    select.click();
    return true;
  } catch (error) {
    console.debug("[sales] click no disponible para select", error);
  }
  clearSalesKeyboardSelectState(select);
  return false;
};

const focusSaleClientField = () => {
  const select = saleForm?.querySelector('select[name="client"]');
  if (!select) return;
  requestAnimationFrame(() => {
    select.focus({ preventScroll: false });
  });
};

const focusSaleSubmitField = () => {
  if (!saleSubmitButton) return;
  requestAnimationFrame(() => {
    saleSubmitButton.focus({ preventScroll: false });
  });
};

const focusSaleRowProduct = (row) => {
  const select = row?.querySelector(".sale-item-product");
  if (!select) return;
  requestAnimationFrame(() => {
    select.focus({ preventScroll: false });
  });
};

const focusSaleRowQty = (row) => {
  const input = row?.querySelector(".sale-item-qty");
  if (!input) return;
  requestAnimationFrame(() => {
    input.focus({ preventScroll: false });
    input.select?.();
  });
};

const focusSaleRowPrice = (row) => {
  const input = row?.querySelector(".sale-item-price");
  if (!input) return;
  requestAnimationFrame(() => {
    input.focus({ preventScroll: false });
    input.select?.();
  });
};

const ensureTrailingBlankSaleRow = (currentRow = null) => {
  const rows = Array.from(saleItems?.querySelectorAll(".sale-item") || []);
  const hasEmptyRow = rows.some((row) => {
    const product = String(row.querySelector(".sale-item-product")?.value || "").trim();
    const qty = String(row.querySelector(".sale-item-qty")?.value || "").trim();
    const price = String(row.querySelector(".sale-item-price")?.value || "").trim();
    return !product && !qty && !price;
  });
  if (!hasEmptyRow) {
    return createSaleItemRow();
  }
  if (currentRow?.nextElementSibling?.classList?.contains("sale-item")) {
    return currentRow.nextElementSibling;
  }
  return rows.find((row) => {
    const product = String(row.querySelector(".sale-item-product")?.value || "").trim();
    const qty = String(row.querySelector(".sale-item-qty")?.value || "").trim();
    const price = String(row.querySelector(".sale-item-price")?.value || "").trim();
    return !product && !qty && !price;
  }) || rows[rows.length - 1] || null;
};

const moveSalesFocusToFirstProduct = () => {
  if (!isDesktopSalesKeyboardMode()) return;
  const firstProductSelect = saleItems?.querySelector(".sale-item-product");
  if (!firstProductSelect) return;
  requestAnimationFrame(() => {
    firstProductSelect.focus({ preventScroll: false });
  });
};

const handleSalePriceEnter = (row) => {
  if (!isDesktopSalesKeyboardMode() || !row) return;
  const productSelect = row.querySelector(".sale-item-product");
  const qtyInput = row.querySelector(".sale-item-qty");
  const priceInput = row.querySelector(".sale-item-price");
  const productKey = String(productSelect?.value || "").trim();
  const quantity = Number(qtyInput?.value || 0);
  if (!productKey || !Number.isFinite(quantity) || quantity <= 0) return;
  const productRow = saleProductIndex.get(productKey);
  if (priceInput && !String(priceInput.value || "").trim()) {
    const defaultPrice = Number(productRow?.price || 0);
    if (Number.isFinite(defaultPrice) && defaultPrice > 0) {
      priceInput.value = formatGs(defaultPrice);
      updateSaleItemSubtotal(row);
      refreshSaleGrandTotal();
    }
  }
  const nextRow = ensureTrailingBlankSaleRow(row);
  refreshSaleProductOptions();
  focusSaleRowProduct(nextRow);
  requestAnimationFrame(refreshCollapseHeights);
};

const isSalesFreeTextField = (target) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.tagName === "TEXTAREA") return true;
  if (target.tagName !== "INPUT") return false;
  const inputType = String(target.getAttribute("type") || target.type || "").toLowerCase();
  if (target.classList.contains("sale-item-price")) return false;
  return ["text", "search", "email", "url", "tel", ""].includes(inputType);
};

const createSaleItemRow = (item = {}) => {
  if (!saleItems) return null;
  const row = document.createElement("tr");
  row.className = "sale-item";
  row.innerHTML = `
    <td class="sale-cell-product" data-label="Producto">
      <select class="sale-item-product" aria-label="Producto"></select>
      <div class="sale-item-stock"></div>
    </td>
    <td data-label="Cantidad">
      <input class="sale-item-qty" type="number" min="0" step="1" placeholder="0" aria-label="Cantidad" value="${item.quantity ?? ""}">
    </td>
    <td data-label="Precio unitario">
      <input class="sale-item-price" type="text" inputmode="numeric" pattern="[0-9.]*" placeholder="0" aria-label="Precio unitario" value="${formatGsInputValue(item.unitPrice)}">
    </td>
    <td data-label="Subtotal">
      <div class="sale-item-subtotal">Gs 0</div>
    </td>
    <td class="sale-cell-action" data-label="Accion">
      <button class="btn ghost danger sale-item-remove" type="button">Eliminar</button>
    </td>
  `;
  saleItems.appendChild(row);

  const select = row.querySelector(".sale-item-product");
  const qtyInput = row.querySelector(".sale-item-qty");
  const priceInput = row.querySelector(".sale-item-price");
  if (select) {
    if (item.productKey) {
      select.dataset.prefillValue = item.productKey;
    }
    select.addEventListener("change", () => {
      const shouldAdvanceToQty = isDesktopSalesKeyboardMode() && select.dataset.keyboardAdvanceTo === "qty";
      if (select.value) {
        const duplicate = Array.from(saleItems.querySelectorAll(".sale-item-product"))
          .some((other) => other !== select && other.value === select.value);
        if (duplicate) {
          window.alert("Ese producto ya fue agregado. Ajusta la cantidad en la linea existente.");
          select.value = "";
        }
      }
      const productRow = saleProductIndex.get(select.value);
      if (priceInput && !String(priceInput.value || "").trim()) {
        const defaultPrice = Number(productRow?.price || 0);
        if (Number.isFinite(defaultPrice) && defaultPrice > 0) {
          priceInput.value = formatGs(defaultPrice);
        }
      }
      updateSaleItemStock(row);
      updateSaleItemSubtotal(row);
      refreshSaleGrandTotal();
      refreshSaleProductOptions();
      if (shouldAdvanceToQty && select.value) {
        focusSaleRowQty(row);
      }
      clearSalesKeyboardSelectState(select);
      requestAnimationFrame(refreshCollapseHeights);
    });
    select.addEventListener("blur", () => {
      clearSalesKeyboardSelectState(select);
    });
  }
  qtyInput?.addEventListener("input", () => {
    updateSaleItemStock(row);
    updateSaleItemSubtotal(row);
    refreshSaleGrandTotal();
    requestAnimationFrame(refreshCollapseHeights);
  });
  priceInput?.addEventListener("input", () => {
    const digits = String(priceInput.value ?? "").replace(/\D/g, "");
    priceInput.value = digits ? formatGs(Number(digits)) : "";
    updateSaleItemSubtotal(row);
    refreshSaleGrandTotal();
    requestAnimationFrame(refreshCollapseHeights);
  });
  priceInput?.addEventListener("blur", () => {
    const digits = String(priceInput.value ?? "").replace(/\D/g, "");
    priceInput.value = digits ? formatGs(Number(digits)) : "";
    updateSaleItemSubtotal(row);
    refreshSaleGrandTotal();
  });
  updateSaleItemStock(row);
  updateSaleItemSubtotal(row);
  refreshSaleGrandTotal();
  return row;
};

const resetSaleItems = (items = []) => {
  if (!saleItems) return;
  saleItems.innerHTML = "";
  if (items.length) {
    items.forEach((item) => createSaleItemRow(item));
  } else {
    createSaleItemRow();
  }
  refreshSaleProductOptions();
  refreshSaleGrandTotal();
};

const refreshSaleProductOptions = () => {
  if (!saleItems) return;
  const { rows } = computeFinishedStockTotals();
  saleProductIndex = new Map();
  const options = [{ value: "", label: "Seleccionar", displays: null }];
  rows.forEach((row) => {
    if (!row.name) return;
    const displays = row.stockDisplays;
    const optionValue = row.productId ? row.productId : buildSaleOptionKey({ name: row.name });
    const label = displays !== null
      ? `${row.name} (${formatInteger(displays)} disponibles)`
      : `${row.name} (N/D)`;
    const product = state.products.find((item) => item.id === row.productId)
      || state.products.find((item) => normalizeText(item.name) === normalizeText(row.name));
    options.push({ value: optionValue, label, displays });
    saleProductIndex.set(optionValue, {
      ...row,
      displays,
      optionValue,
      price: Number(product?.price || 0)
    });
  });
  const selects = Array.from(saleItems.querySelectorAll(".sale-item-product"));
  selects.forEach((select) => {
    const prefillValue = select.dataset.prefillValue || "";
    const current = select.value || prefillValue;
    const selectedByOthers = new Set(
      selects
        .filter((other) => other !== select)
        .map((other) => other.value)
        .filter(Boolean)
    );
    select.innerHTML = options.map((option) => {
      const duplicateDisabled = option.value && selectedByOthers.has(option.value) && option.value !== current;
      const stockDisabled = option.value
        && option.displays !== null
        && option.displays <= 0
        && option.value !== current;
      return `<option value="${option.value}"${duplicateDisabled || stockDisabled ? " disabled" : ""}>${option.label}</option>`;
    }).join("");
    if (current && saleProductIndex.has(current)) {
      select.value = current;
    }
    if (prefillValue) {
      delete select.dataset.prefillValue;
    }
    updateSaleItemStock(select.closest(".sale-item"));
  });
  refreshSaleGrandTotal();
};

const computeFinishedStockTotals = () => {
  const baseRows = buildFinishedStockRows();
  const adjustmentDeltaByKey = new Map();
  state.finishedStockAdjustments.forEach((adjustment) => {
    const key = getAdjustmentProductKey(adjustment);
    if (!key) return;
    const delta = Number(adjustment?.difference || 0);
    if (!Number.isFinite(delta) || delta === 0) return;
    adjustmentDeltaByKey.set(key, (adjustmentDeltaByKey.get(key) || 0) + delta);
  });
  const rows = baseRows.map((row) => {
    const baseDisplays = row.canCompute ? (row.produced - row.sold) : null;
    const adjustmentDelta = adjustmentDeltaByKey.get(row.key) || 0;
    const stockDisplays = baseDisplays !== null
      ? baseDisplays + adjustmentDelta
      : (adjustmentDelta !== 0 ? adjustmentDelta : null);
    return {
      ...row,
      adjustmentDelta,
      baseDisplays,
      stockDisplays,
      canCompute: stockDisplays !== null
    };
  });
  let total = 0;
  let hasData = false;
  const breakdown = [];
  rows.forEach((row) => {
    if (row.stockDisplays === null) return;
    hasData = true;
    const displays = row.stockDisplays;
    total += displays;
    breakdown.push({
      name: row.name,
      displays
    });
  });
  return { totalDisplays: hasData ? total : null, rows, breakdown };
};

const renderFinishedStockAdjustmentHistory = () => {
  if (!finishedStockAdjustmentHistory) return;
  const history = [...state.finishedStockAdjustments]
    .sort((a, b) => getAdjustmentTimestamp(b) - getAdjustmentTimestamp(a));
  if (!history.length) {
    finishedStockAdjustmentHistory.innerHTML = '<div class="list-item muted">Sin ajustes manuales registrados.</div>';
    return;
  }
  finishedStockAdjustmentHistory.innerHTML = history.slice(0, 30).map((entry) => {
    const dateLabel = formatDate(normalizeDateValue(entry.date) || normalizeDateValue(entry.createdAt) || "");
    const userLabel = String(entry.userName || entry.userEmail || "").trim() || "Sin usuario";
    const previous = Number(entry.previousStock || 0);
    const current = Number(entry.newStock || 0);
    const difference = Number(entry.difference || 0);
    return `
      <div class="list-item stock-adjustment-history-item">
        <strong>${entry.productName || "Producto"}</strong>
        <div>Fecha: ${dateLabel || "Sin fecha"} | Usuario: ${userLabel}</div>
        <div>Anterior: ${formatNumber(previous)} | Nuevo: ${formatNumber(current)} | Diferencia: ${formatSignedInteger(difference)}</div>
        <div>Motivo: ${escapeHtml(String(entry.reason || "Sin motivo"))}</div>
      </div>
    `;
  }).join("");
};

const refreshFinishedStock = () => {
  if (!finishedStockList) return;
  const { rows } = computeFinishedStockTotals();
  if (!rows.length) {
    finishedStockList.innerHTML = '<div class="list-item muted">Sin registros todavia.</div>';
    renderFinishedStockAdjustmentHistory();
    return;
  }
  finishedStockList.innerHTML = rows.map((row) => {
    const stockDisplays = row.stockDisplays;
    const stockKg = stockDisplays !== null ? stockDisplays * 0.36 : null;
    const isAdjustmentOpen = stockAdjustmentState.openKey === row.key;
    const effectiveCurrent = Number.isFinite(Number(stockDisplays)) ? Number(stockDisplays) : 0;
    const newStockValue = isAdjustmentOpen
      ? stockAdjustmentState.newStock
      : "";
    const parsedNewStock = Number(newStockValue);
    const diffPreview = newStockValue !== "" && Number.isFinite(parsedNewStock)
      ? parsedNewStock - effectiveCurrent
      : null;
    return `
      <div class="list-item">
        <strong>${row.name}</strong>
        <div>Displays disponibles: ${stockDisplays !== null ? formatNumber(stockDisplays) : "N/D"}</div>
        <div>Equivalente en kg: ${stockKg !== null ? `${formatNumber(stockKg)} kg` : "N/D"}</div>
        ${row.adjustmentDelta
    ? `<div class="muted">Ajuste manual acumulado: ${formatSignedInteger(row.adjustmentDelta)} displays</div>`
    : ""}
        <div class="list-actions">
          <button class="btn ghost" type="button" data-open-stock-adjustment="${row.key}">Ajustar stock</button>
        </div>
        <div class="stock-adjustment-panel ${isAdjustmentOpen ? "open" : "hidden"}" data-stock-adjustment-panel="${row.key}">
          <div class="stock-adjustment-info">
            <div>Producto: <strong>${row.name}</strong></div>
            <div>Stock actual: <strong>${formatNumber(effectiveCurrent)} displays</strong></div>
            <div class="muted">Este ajuste modifica solo stock terminado.</div>
          </div>
          <label>
            Nuevo stock real
            <input type="number" min="0" step="1" value="${isAdjustmentOpen ? escapeHtml(newStockValue) : ""}" data-stock-adjustment-new="${row.key}" />
          </label>
          <div class="stock-adjustment-diff">
            Diferencia: <strong>${diffPreview === null ? "-" : formatSignedInteger(diffPreview)}</strong>
          </div>
          <label>
            Motivo del ajuste
            <textarea rows="2" maxlength="180" data-stock-adjustment-reason="${row.key}" placeholder="Ej: Stock inicial previo al sistema">${isAdjustmentOpen ? escapeHtml(stockAdjustmentState.reason) : ""}</textarea>
          </label>
          <div class="list-actions">
            <button class="btn primary" type="button" data-save-stock-adjustment="${row.key}">Guardar ajuste</button>
            <button class="btn ghost" type="button" data-cancel-stock-adjustment>Cancelar</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
  renderFinishedStockAdjustmentHistory();
};

const getRawMaterialAdjustmentTimestamp = (adjustment) => {
  const direct = Number(adjustment?.createdAtMs || 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const createdAt = adjustment?.createdAt;
  if (typeof createdAt?.toDate === "function") return createdAt.toDate().getTime();
  if (Number.isFinite(createdAt?.seconds)) return Number(createdAt.seconds) * 1000;
  if (Number.isFinite(createdAt?._seconds)) return Number(createdAt._seconds) * 1000;
  const parsedDate = normalizeDateValue(adjustment?.date);
  const parsedTime = parsedDate ? new Date(parsedDate).getTime() : 0;
  return Number.isFinite(parsedTime) ? parsedTime : 0;
};

const renderRawMaterialAdjustmentHistory = () => {
  if (!rawMaterialAdjustmentHistory) return;
  const history = [...state.rawMaterialAdjustments]
    .sort((a, b) => getRawMaterialAdjustmentTimestamp(b) - getRawMaterialAdjustmentTimestamp(a));
  if (!history.length) {
    rawMaterialAdjustmentHistory.innerHTML = '<div class="list-item muted">Sin ajustes manuales registrados.</div>';
    return;
  }
  rawMaterialAdjustmentHistory.innerHTML = history.slice(0, 30).map((entry) => {
    const dateLabel = formatDate(normalizeDateValue(entry.date) || normalizeDateValue(entry.createdAt) || "");
    const userLabel = String(entry.userName || entry.userEmail || "").trim() || "Sin usuario";
    const previous = Number(entry.previousStock || 0);
    const current = Number(entry.newStock || 0);
    const difference = Number(entry.difference || 0);
    return `
      <div class="list-item stock-adjustment-history-item">
        <strong>${entry.materialName || "Materia prima"}</strong>
        <div>Fecha: ${dateLabel || "Sin fecha"} | Usuario: ${userLabel}</div>
        <div>Anterior: ${formatNumber(previous)} ${entry.unit || ""} | Nuevo: ${formatNumber(current)} ${entry.unit || ""} | Diferencia: ${formatSignedInteger(difference)} ${entry.unit || ""}</div>
        <div>Motivo: ${escapeHtml(String(entry.reason || "Sin motivo"))}</div>
      </div>
    `;
  }).join("");
};

const getLayoutHeight = (node) => {
  if (!node) return 0;
  const rectHeight = Number(node.getBoundingClientRect?.().height || 0);
  if (rectHeight > 0) return Math.ceil(rectHeight);
  return Math.ceil(Number(node.scrollHeight || 0));
};

const syncDashboardSlideHeights = (activeTab) => {
  const safeTab = TAB_IDS.includes(activeTab) ? activeTab : (TAB_IDS[0] || "production");
  const tabIndex = TAB_IDS.indexOf(safeTab);
  if (dashboardOverviewViewport && dashboardOverviewTrack) {
    const overviewIndex = tabIndex >= 0 ? tabIndex : 0;
    const overviewSlide = dashboardOverviewTrack.children[overviewIndex];
    if (overviewSlide) {
      dashboardOverviewViewport.style.height = `${getLayoutHeight(overviewSlide)}px`;
    }
  }
  if (dashboardPanelsViewport && dashboardPanelsTrack) {
    const panelSlide = Array.from(dashboardPanelsTrack.children)
      .find((node) => node.id === safeTab);
    if (panelSlide) {
      dashboardPanelsViewport.style.height = `${getLayoutHeight(panelSlide)}px`;
    }
  }
};

let dashboardResizeObserver = null;

const setupDashboardResizeObserver = () => {
  if (typeof ResizeObserver !== "function") return;
  if (dashboardResizeObserver) {
    dashboardResizeObserver.disconnect();
  }
  dashboardResizeObserver = new ResizeObserver(() => {
    const currentTab = document.querySelector(".tab.active")?.dataset.tab || "production";
    syncDashboardSlideHeights(currentTab);
  });
  if (dashboardOverviewTrack) {
    Array.from(dashboardOverviewTrack.children).forEach((node) => {
      dashboardResizeObserver.observe(node);
    });
  }
  if (dashboardPanelsTrack) {
    Array.from(dashboardPanelsTrack.children).forEach((node) => {
      dashboardResizeObserver.observe(node);
    });
  }
};

const updateDashboardVisibility = (activeTab) => {
  const safeTab = TAB_IDS.includes(activeTab) ? activeTab : (TAB_IDS[0] || "production");
  const tabIndex = TAB_IDS.indexOf(safeTab);
  const offset = `${-100 * (tabIndex >= 0 ? tabIndex : 0)}%`;
  if (dashboardSection) {
    dashboardSection.dataset.view = safeTab;
  }
  if (dashboardOverviewTrack) {
    dashboardOverviewTrack.style.transform = `translateX(${offset})`;
  }
  if (dashboardPanelsTrack) {
    dashboardPanelsTrack.style.transform = `translateX(${offset})`;
  }
  panels.forEach((panel) => {
    panel.setAttribute("aria-hidden", panel.id === safeTab ? "false" : "true");
  });
  requestAnimationFrame(() => {
    syncDashboardSlideHeights(safeTab);
    animateDashboardMetricsByTab(safeTab, { force: true });
    if (safeTab === "sales") {
      animateSalesGoalProgressBar(
        dashboardMetricSnapshot.sales.goalProgress,
        dashboardMetricSnapshot.sales.goalProgressColor,
        { force: true }
      );
    }
  });
};

const setActiveTab = (targetTab) => {
  const safeTab = TAB_IDS.includes(targetTab) ? targetTab : (TAB_IDS[0] || "production");
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === safeTab));
  panels.forEach((panel) => panel.classList.toggle("active", panel.id === safeTab));
  updateDashboardVisibility(safeTab);
};

const updateSalesGoalForm = (goal) => {
  if (!salesGoalForm) return;
  salesGoalForm.dataset.editId = goal?.id || "";
  salesGoalForm.startDate.value = goal?.startDate || "";
  salesGoalForm.endDate.value = goal?.endDate || "";
  salesGoalForm.targetDisplays.value = goal?.targetDisplays ?? "";
  if (salesGoalNotice) salesGoalNotice.textContent = "";
};

const getStockDotClass = (productName) => {
  const label = normalizeText(productName);
  if (label.includes("rojo")) return "dot-red";
  if (label.includes("verde")) return "dot-green";
  return "dot-neutral";
};

const getLotsRiskColor = (lotsCount) => {
  const qty = Number(lotsCount || 0);
  if (!Number.isFinite(qty) || qty <= 5) return "#ef4444";
  if (qty <= 10) return "#f97316";
  if (qty <= 15) return "#eab308";
  if (qty <= 22) return "#a3e635";
  if (qty <= 30) return "#65a30d";
  return "#16a34a";
};

const isBottleneckInCriticalLevel = (limitingRow) => {
  if (!limitingRow?.materialId) return false;
  const rawMaterial = state.rawMaterials.find((item) => item.id === limitingRow.materialId);
  const minStockRaw = rawMaterial?.minStock;
  const hasMinStock = minStockRaw !== null && minStockRaw !== undefined && minStockRaw !== "";
  if (!hasMinStock) return false;
  const minStock = Number(minStockRaw);
  const available = Number(limitingRow.available || 0);
  if (!Number.isFinite(minStock) || !Number.isFinite(available)) return false;
  return available <= minStock;
};

const refreshDashboard = ({ rows, availabilityMap }) => {
  if (!metricKgYesterday) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayValue = toDateInputValue(yesterday);
  const kgYesterday = computeKgForDate(yesterdayValue);
  dashboardMetricSnapshot.production.kgYesterday = Number.isFinite(kgYesterday) ? kgYesterday : 0;

  const activeRecipe = getActiveRecipe();
  const metrics = computeRecipeStockMetrics(activeRecipe, availabilityMap);
  const finishedTotals = computeFinishedStockTotals();
  const displaysStockValue = finishedTotals.totalDisplays !== null
    ? Number(finishedTotals.totalDisplays)
    : null;
  let lotsPossibleLabel = "N/D";
  let lotsPossibleValue = null;
  let lotsCount = 0;
  let lotsProgress = 0;
  let bottleneck = "N/D";
  let limitingRow = null;
  let isBottleneckCritical = false;
  if (!activeRecipe) {
    lotsPossibleLabel = state.recipes.length ? "Sin formula base" : "Sin formulas";
    bottleneck = state.recipes.length ? "Sin formula base" : "Sin formulas";
  } else if (!rows.length || rows.every((row) => row.available <= 0)) {
    lotsPossibleLabel = "Sin stock cargado";
    bottleneck = "Sin stock cargado";
  } else if (metrics.maxBatches !== null && Number.isFinite(metrics.maxBatches)) {
    lotsCount = Math.max(0, Math.floor(metrics.maxBatches));
    lotsPossibleValue = lotsCount;
    lotsPossibleLabel = formatInteger(lotsCount);
    lotsProgress = Math.max(0, Math.min(100, Math.round((lotsCount / 30) * 100)));
    limitingRow = metrics.limitingRow || null;
    bottleneck = limitingRow ? limitingRow.name : "N/D";
    isBottleneckCritical = isBottleneckInCriticalLevel(limitingRow);
  }
  dashboardMetricSnapshot.production.displaysStock = Number.isFinite(displaysStockValue) ? displaysStockValue : null;
  dashboardMetricSnapshot.production.lotsPossible = Number.isFinite(lotsPossibleValue) ? lotsPossibleValue : null;

  animateProductionDashboardMetrics();
  if (!Number.isFinite(lotsPossibleValue) && metricLotsPossible) {
    metricLotsPossible.textContent = lotsPossibleLabel;
  }

  if (metricDisplaysBreakdown) {
    if (!finishedTotals.breakdown.length) {
      metricDisplaysBreakdown.innerHTML = "";
    } else {
      metricDisplaysBreakdown.innerHTML = finishedTotals.breakdown
        .sort((a, b) => b.displays - a.displays)
        .map((item) => `
          <div class="overview-row">
            <span class="overview-row-name"><i class="overview-row-dot ${getStockDotClass(item.name)}" aria-hidden="true"></i>${item.name}</span>
            <strong>${formatInteger(item.displays)}</strong>
          </div>
        `)
        .join("");
    }
  }
  if (metricLotsProgress) {
    metricLotsProgress.style.width = `${lotsProgress}%`;
    metricLotsProgress.style.background = getLotsRiskColor(lotsCount);
  }
  if (metricLotsSub) {
    metricLotsSub.textContent = lotsProgress > 0 ? "basado en materia prima actual" : "materia prima actual";
  }
  metricBottleneck.textContent = bottleneck;
  const hasAlert = isBottleneckCritical;
  if (metricBottleneckCard) {
    metricBottleneckCard.classList.toggle("alert", hasAlert);
  }
  if (metricBottleneckSub) {
    metricBottleneckSub.textContent = hasAlert
      ? "nivel critico detectado en suministro"
      : (bottleneck !== "N/D" && !normalizeText(bottleneck).startsWith("sin ")
        ? "se agotara primero segun stock actual"
        : "cuello de botella");
  }
};

const refreshSalesDashboard = ({ rows, availabilityMap }) => {
  if (!salesMetricMonth || !salesMetricToday || !salesMetricLastMonth) return;
  const goal = state.salesGoals[0];
  const { startDate: monthStart, endDate: monthEnd } = getCurrentMonthRange();
  const displaysCurrentMonth = computeDisplaysFromSales(state.sales, monthStart, monthEnd);
  const { startDate: previousMonthStart, endDate: previousMonthEnd } = getPreviousMonthRange();
  const displaysPreviousMonth = computeDisplaysFromSales(state.sales, previousMonthStart, previousMonthEnd);
  const todayValue = toDateInputValue(new Date());
  const displaysToday = computeDisplaysForDate(state.sales, todayValue);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayValue = toDateInputValue(yesterday);
  const displaysYesterday = computeDisplaysForDate(state.sales, yesterdayValue);
  const { startDate: goalStartDate, endDate: goalEndDate } = getSalesPeriodRange(goal);
  const displaysInGoalPeriod = computeDisplaysFromSales(state.sales, goalStartDate, goalEndDate);
  debugSalesDateComparison({ todayValue, yesterdayValue, monthStart, monthEnd });

  const finishedTotals = computeFinishedStockTotals();
  const availableDisplaysValue = finishedTotals.totalDisplays !== null
    ? Number(finishedTotals.totalDisplays)
    : null;

  dashboardMetricSnapshot.sales.today = Number(displaysToday || 0);
  dashboardMetricSnapshot.sales.yesterday = Number(displaysYesterday || 0);
  dashboardMetricSnapshot.sales.month = Number(displaysCurrentMonth || 0);
  dashboardMetricSnapshot.sales.lastMonth = Number(displaysPreviousMonth || 0);
  dashboardMetricSnapshot.sales.available = Number.isFinite(availableDisplaysValue) ? availableDisplaysValue : null;

  if (salesMetricAvailableBreakdown) {
    if (!finishedTotals.breakdown.length) {
      salesMetricAvailableBreakdown.innerHTML = "";
    } else {
      salesMetricAvailableBreakdown.innerHTML = finishedTotals.breakdown
        .sort((a, b) => b.displays - a.displays)
        .map((item) => `
          <div class="overview-row">
            <span class="overview-row-name"><i class="overview-row-dot ${getStockDotClass(item.name)}" aria-hidden="true"></i>${item.name}</span>
            <strong>${formatInteger(item.displays)}</strong>
          </div>
        `)
        .join("");
    }
  }

  const targetDisplays = Number(goal?.targetDisplays || 0);
  const now = new Date();
  const todayIso = toDateInputValue(now);
  const toDayNumber = (isoValue) => {
    const [year, month, day] = String(isoValue || "").split("-").map(Number);
    if (!year || !month || !day) return null;
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  };
  const startDay = toDayNumber(goalStartDate);
  const endDay = toDayNumber(goalEndDate);
  const todayDay = toDayNumber(todayIso);

  const daysElapsed = startDay !== null && todayDay !== null
    ? Math.max(0, todayDay - startDay + 1)
    : Math.max(1, now.getDate());
  const daysRemaining = endDay !== null && todayDay !== null
    ? Math.max(0, endDay - todayDay + 1)
    : 0;
  const soldForGoal = displaysInGoalPeriod;
  const currentPace = daysElapsed > 0 ? (soldForGoal / daysElapsed) : 0;

  if (targetDisplays <= 0) {
    dashboardMetricSnapshot.sales.goalPercent = null;
    dashboardMetricSnapshot.sales.goalProgress = 0;
    dashboardMetricSnapshot.sales.goalProgressColor = "#94a3b8";
    animateSalesDashboardMetrics();
    animateSalesGoalProgressBar(
      dashboardMetricSnapshot.sales.goalProgress,
      dashboardMetricSnapshot.sales.goalProgressColor
    );
    if (salesGoalSummary) salesGoalSummary.textContent = "Sin objetivo configurado";
    if (salesGoalTarget) salesGoalTarget.textContent = "-";
    if (salesGoalRemaining) salesGoalRemaining.textContent = "-";
    if (salesGoalPaceCurrent) salesGoalPaceCurrent.textContent = "-";
    if (salesGoalPaceNeeded) salesGoalPaceNeeded.textContent = "";
    if (salesGoalMessage) salesGoalMessage.textContent = "Configura un objetivo mensual para ver avance.";
    if (salesGoalCard) salesGoalCard.dataset.tone = "none";
    if (salesGoalCard) salesGoalCard.dataset.pace = "none";
    return;
  }

  const percent = targetDisplays > 0 ? (soldForGoal / targetDisplays) * 100 : 0;
  const percentRounded = Math.round(percent);
  const remainingDisplays = Math.max(targetDisplays - soldForGoal, 0);
  const paceCurrentLabel = `${currentPace.toLocaleString("es-PY", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / dia (actual)`;
  const neededPace = daysRemaining > 0 ? (remainingDisplays / daysRemaining) : null;
  const paceNeededLabel = neededPace !== null
    ? `${neededPace.toLocaleString("es-PY", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / dia (necesario)`
    : "";

  let tone = "good";
  let progressColor = "#22c55e";
  if (percent <= 40) {
    tone = "low";
    progressColor = "#ef4444";
  } else if (percent <= 70) {
    tone = "mid";
    progressColor = "#eab308";
  } else if (percent <= 100) {
    tone = "good";
    progressColor = "#22c55e";
  } else {
    tone = "over";
    progressColor = "#15803d";
  }

  let paceStatus = "mid";
  let message = "Vas justo";
  if (neededPace === null) {
    paceStatus = "none";
    message = "El periodo del objetivo ya finalizo";
  } else if (currentPace < neededPace * 0.95) {
    paceStatus = "low";
    message = "Tenes que acelerar";
  } else if (currentPace > neededPace * 1.05) {
    paceStatus = "high";
    message = "Vas adelantado";
  }

  dashboardMetricSnapshot.sales.goalPercent = percentRounded;
  const clampedProgress = Math.max(0, Math.min(percent, 100));
  dashboardMetricSnapshot.sales.goalProgress = clampedProgress;
  dashboardMetricSnapshot.sales.goalProgressColor = progressColor;
  animateSalesDashboardMetrics();
  animateSalesGoalProgressBar(
    dashboardMetricSnapshot.sales.goalProgress,
    dashboardMetricSnapshot.sales.goalProgressColor
  );
  if (salesGoalSummary) {
    salesGoalSummary.textContent = `${formatInteger(soldForGoal)} vendidos de ${formatInteger(targetDisplays)} objetivo`;
  }
  if (salesGoalTarget) salesGoalTarget.textContent = `${formatInteger(targetDisplays)} displays`;
  if (salesGoalRemaining) salesGoalRemaining.textContent = `${formatInteger(remainingDisplays)} displays`;
  if (salesGoalPaceCurrent) salesGoalPaceCurrent.textContent = paceCurrentLabel;
  if (salesGoalPaceNeeded) salesGoalPaceNeeded.textContent = paceNeededLabel;
  if (salesGoalMessage) salesGoalMessage.textContent = message;
  if (salesGoalCard) salesGoalCard.dataset.tone = tone;
  if (salesGoalCard) salesGoalCard.dataset.pace = paceStatus;
};

const refreshStockSummary = () => {
  const { rows, availabilityMap } = computeStockTotals();
  const stockRowsByMaterialId = rows.reduce((acc, row) => {
    acc[row.materialId] = row;
    return acc;
  }, {});
  const totalValue = rows.reduce((sum, row) => sum + row.available * row.price, 0);
  const selectedRecipeId = stockRecipeSelect?.value;
  const selectedRecipe = state.recipes.find((recipe) => recipe.id === selectedRecipeId);
  const metrics = computeRecipeStockMetrics(selectedRecipe, availabilityMap);
  const ingredientRows = metrics.ingredientRows;
  const limitingRow = metrics.limitingRow;
  const maxBatches = metrics.maxBatches;
  const productionMaxKg = metrics.productionMaxKg;
  const displaysMax = metrics.displaysMax;

  if (!selectedRecipe) {
    stockSummaryGeneral.innerHTML = '<div class="muted">Selecciona una formula para ver el resumen.</div>';
    stockMaterialsList.innerHTML = '<div class="list-item muted">Selecciona una formula para ver el detalle de materias primas.</div>';
  } else {
    stockSummaryGeneral.innerHTML = `
      <div class="summary-metric">
        <strong>Costo total estimado disponible</strong>
        <div>Gs ${formatGs(totalValue)}</div>
      </div>
      <div class="summary-metric">
        <strong>Produccion maxima</strong>
        <div>${productionMaxKg !== null ? `${formatNumber(productionMaxKg)} kg` : "N/D"}</div>
      </div>
      <div class="summary-metric">
        <strong>Lotes posibles</strong>
        <div>${maxBatches !== null && Number.isFinite(maxBatches) ? formatNumber(maxBatches) : "N/D"}</div>
      </div>
      <div class="summary-metric">
        <strong>Displays posibles (360 g)</strong>
        <div>${displaysMax !== null ? formatNumber(displaysMax) : "N/D"}</div>
      </div>
      <div class="summary-metric">
        <strong>Cuello de botella</strong>
        <div>${limitingRow ? `${limitingRow.name} (${limitingRow.unit})` : "N/D"}</div>
      </div>
    `;

    const header = `
      <div class="materials-row header">
        <div>Materia prima</div>
        <div>Disponible</div>
        <div>Requerido/lote</div>
        <div>Lotes posibles</div>
        <div>Estado</div>
        <div>Accion</div>
      </div>
    `;
    const body = ingredientRows.map((row) => {
      const stockRow = stockRowsByMaterialId[row.materialId] || null;
      const available = Number(row.available || 0);
      const lotsPossible = row.lotsPossible;
      let statusLabel = "OK";
      let statusClass = "status-ok";
      if (available <= 0 || (!Number.isFinite(lotsPossible) ? false : lotsPossible < 5)) {
        statusLabel = "Critico";
        statusClass = "status-critical";
      } else if (!Number.isFinite(lotsPossible)) {
        statusLabel = "OK";
        statusClass = "status-ok";
      } else if (lotsPossible <= 10) {
        statusLabel = "Bajo";
        statusClass = "status-low";
      }
      const isBottleneck = limitingRow && row.materialId === limitingRow.materialId;
      const badge = isBottleneck ? '<span class="badge">Cuello</span>' : "";
      const isAdjustmentOpen = rawMaterialAdjustmentState.openKey === row.materialId;
      const effectiveCurrent = Number.isFinite(Number(stockRow?.available)) ? Number(stockRow.available) : 0;
      const newStockValue = isAdjustmentOpen ? rawMaterialAdjustmentState.newStock : "";
      const parsedNewStock = Number(newStockValue);
      const diffPreview = newStockValue !== "" && Number.isFinite(parsedNewStock)
        ? parsedNewStock - effectiveCurrent
        : null;
      const adjustmentInfo = stockRow?.adjustmentDelta
        ? `<div class="materials-adjustment-note muted">Ajuste manual acumulado: ${formatSignedInteger(stockRow.adjustmentDelta)} ${row.unit}</div>`
        : "";
      return `
        <div class="materials-entry">
        <div class="materials-row ${isBottleneck ? "bottleneck" : ""}">
          <div class="materials-cell" data-label="Materia prima"><strong>${row.name}</strong>${badge}</div>
          <div class="materials-cell" data-label="Disponible">${formatNumber(row.available)} ${row.unit}${adjustmentInfo}</div>
          <div class="materials-cell" data-label="Requerido/lote">${formatNumber(row.requiredBase)} ${row.unit}</div>
          <div class="materials-cell" data-label="Lotes posibles">${Number.isFinite(lotsPossible) ? formatNumber(lotsPossible) : "N/D"}</div>
          <div class="materials-cell" data-label="Estado"><span class="status-tag ${statusClass}">${statusLabel}</span></div>
          <div class="materials-cell" data-label="Accion"><button class="btn ghost" type="button" data-open-raw-material-adjustment="${row.materialId}">Ajustar</button></div>
        </div>
        <div class="stock-adjustment-panel materials-adjustment-panel ${isAdjustmentOpen ? "open" : "hidden"}" data-raw-material-adjustment-panel="${row.materialId}">
          <div class="stock-adjustment-info">
            <div>Materia prima: <strong>${row.name}</strong></div>
            <div>Stock actual: <strong>${formatNumber(effectiveCurrent)} ${row.unit}</strong></div>
            <div class="muted">Este ajuste corrige el stock disponible y no representa una compra real.</div>
          </div>
          <label>
            Nuevo stock real
            <input type="number" min="0" step="0.01" value="${isAdjustmentOpen ? escapeHtml(newStockValue) : ""}" data-raw-material-adjustment-new="${row.materialId}" />
          </label>
          <div class="stock-adjustment-diff">
            Diferencia: <strong>${diffPreview === null ? "-" : `${formatSignedInteger(diffPreview)} ${row.unit}`}</strong>
          </div>
          <label>
            Motivo del ajuste
            <textarea rows="2" maxlength="180" data-raw-material-adjustment-reason="${row.materialId}" placeholder="Ej: Correccion de inventario">${isAdjustmentOpen ? escapeHtml(rawMaterialAdjustmentState.reason) : ""}</textarea>
          </label>
          <div class="list-actions">
            <button class="btn primary" type="button" data-save-raw-material-adjustment="${row.materialId}">Guardar ajuste</button>
            <button class="btn ghost" type="button" data-cancel-raw-material-adjustment>Cancelar</button>
          </div>
        </div>
        </div>
      `;
    }).join("");
    stockMaterialsList.innerHTML = header + body;
  }

  renderRawMaterialAdjustmentHistory();
  refreshDashboard({ rows, availabilityMap });
  requestAnimationFrame(refreshCollapseHeights);
};

const calculateRecipeTotals = () => {
  const totalCost = recipeDraft.ingredients.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
  const yieldQuantity = Number(recipeForm.yieldQuantity.value) || 0;
  const yieldUnit = recipeForm.yieldUnit.value || "";
  const costPerUnit = yieldQuantity > 0 ? totalCost / yieldQuantity : 0;
  let costPerKg = null;
  if (yieldUnit === "kg") {
    costPerKg = costPerUnit;
  }
  if (yieldUnit === "g") {
    costPerKg = costPerUnit * 1000;
  }
  const boxCost = Number(recipeForm.boxCost.value) || 0;
  const wrapCost = Number(recipeForm.wrapCost.value) || 0;
  const wrapCount = Number(recipeForm.wrapCount.value) || 0;
  const packagingCost = boxCost + wrapCost * wrapCount;
  const displayWeightKg = 0.36;
  const productCostPerDisplay = costPerKg !== null ? costPerKg * displayWeightKg : null;
  const totalDisplayCost = costPerKg !== null ? productCostPerDisplay + packagingCost : null;
  return {
    totalCost,
    costPerUnit,
    yieldQuantity,
    yieldUnit,
    costPerKg,
    packagingCost,
    productCostPerDisplay,
    totalDisplayCost,
    boxCost,
    wrapCost,
    wrapCount
  };
};

const renderRecipeDraft = () => {
  if (!recipeDraft.ingredients.length) {
    recipeIngredientsList.innerHTML = '<div class="list-item muted">Agrega materias primas para la receta.</div>';
  } else {
    recipeIngredientsList.innerHTML = recipeDraft.ingredients
      .map((item, index) => `
        <div class="list-item">
          <strong>${item.materialName}</strong>
          Cantidad: ${formatNumber(item.quantity)} ${item.unit}
          ${item.unitBase && item.unitBase !== item.unit ? ` | Equivalente: ${formatNumber(item.quantityBase)} ${item.unitBase}` : ""}
          | Costo: Gs ${formatGs(item.totalCost)}
          <div><button class="btn ghost" type="button" data-remove-ingredient="${index}">Quitar</button></div>
        </div>
      `)
      .join("");
  }
  const totals = calculateRecipeTotals();
  const recipeName = recipeForm.name.value.trim() || "Formula";
  const yieldLabel = totals.yieldQuantity && totals.yieldUnit
    ? `${formatNumber(totals.yieldQuantity)} ${totals.yieldUnit}`
    : "Definir rendimiento";
  recipeCostPreview.innerHTML = `
    <div class="list-item">
      <strong>${recipeName} rinde ${yieldLabel}</strong>
      <div>Costo formula total: Gs ${formatGs(totals.totalCost)}</div>
      <div>Costo de formula por kg: ${totals.costPerKg !== null ? `Gs ${formatGs(totals.costPerKg)}` : "Definir rendimiento en kg o g"}</div>
      <div>Costo por display de 360 g: ${totals.totalDisplayCost !== null ? `Gs ${formatGs(totals.totalDisplayCost)}` : "Definir rendimiento en kg o g"}</div>
    </div>
  `;
};

const updateRecipeIngredientFields = () => {
  const materialId = recipeForm.material.value;
  const material = state.rawMaterials.find((item) => item.id === materialId);
  if (!material) {
    setUnitGroupValue("recipeIngredientUnit", "");
    recipeForm.unitCost.value = "";
    return;
  }
  setUnitGroupValue("recipeIngredientUnit", material.unit || "");
  recipeForm.unitCost.value = Math.round(Number(material.price || 0)).toString();
};

const updateBatchCostPreview = () => {
  const recipeId = batchForm.recipe.value;
  const recipe = state.recipes.find((item) => item.id === recipeId);
  const quantity = Number(batchForm.quantity.value);
  if (!recipe || Number.isNaN(quantity)) {
    batchForm.totalCost.value = "";
    batchForm.unitCost.value = "";
    return;
  }
  const costPerUnit = Number(recipe.costPerUnit || 0);
  const totalCost = costPerUnit * quantity;
  batchForm.unitCost.value = costPerUnit ? Math.round(costPerUnit).toString() : "";
  batchForm.totalCost.value = totalCost ? Math.round(totalCost).toString() : "";
};

const normalizeText = (value) => (value || "").trim().toLowerCase();
const digitsOnly = (value) => String(value || "").replace(/\D+/g, "");
const formatClientName = (value) => {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized
    .split(" ")
    .map((word) => word
      .split("-")
      .map((part) => part
        ? part.charAt(0).toLocaleUpperCase("es-PY") + part.slice(1).toLocaleLowerCase("es-PY")
        : ""
      )
      .join("-")
    )
    .join(" ");
};

const splitRuc = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return { main: "", dv: "" };
  const [mainRaw, dvRaw] = raw.split("-");
  if (dvRaw !== undefined) {
    return {
      main: digitsOnly(mainRaw),
      dv: digitsOnly(dvRaw).slice(0, 3)
    };
  }
  const digits = digitsOnly(raw);
  if (!digits) return { main: "", dv: "" };
  if (digits.length === 1) return { main: digits, dv: "" };
  return {
    main: digits.slice(0, -1),
    dv: digits.slice(-1)
  };
};

const buildRuc = (mainValue, dvValue) => {
  const main = digitsOnly(mainValue);
  const dv = digitsOnly(dvValue);
  if (!main && !dv) return "";
  if (!main || !dv) return null;
  return `${main}-${dv}`;
};

const findRecipeForProduct = (product) => {
  if (!product) return null;
  return state.recipes.find((recipe) => recipe.productId === product.id)
    || state.recipes.find((recipe) => normalizeText(recipe.name) === normalizeText(product.name));
};

const findProductForRecipe = (recipe) => {
  if (!recipe) return null;
  return state.products.find((product) => product.id === recipe.productId)
    || state.products.find((product) => normalizeText(product.name) === normalizeText(recipe.name));
};

const updateBatchProductFromRecipe = () => {
  const recipe = state.recipes.find((item) => item.id === batchForm.recipe.value);
  const product = findProductForRecipe(recipe);
  if (batchProductSelect) {
    batchProductSelect.value = product?.id || "";
  }
  if (batchProductInfo) {
    batchProductInfo.textContent = product?.name
      ? `Producto: ${product.name}`
      : recipe?.name
        ? `Producto: ${recipe.name}`
        : "";
  }
};

const updateBatchRecipeFromProduct = () => {
  if (!batchProductSelect || batchProductSelect.tagName !== "SELECT") return;
  const productId = batchProductSelect?.value;
  const product = state.products.find((item) => item.id === productId);
  const recipe = findRecipeForProduct(product);
  const unitGroup = document.querySelector('.unit-group[data-target="batchUnit"]');
  if (!recipe) {
    batchForm.recipe.value = "";
    batchForm.totalCost.value = "";
    batchForm.unitCost.value = "";
    setUnitGroupValue("batchUnit", "");
    if (unitGroup) unitGroup.classList.remove("locked");
    if (batchRecipeNotice) {
      batchRecipeNotice.textContent = "No hay formula asociada. Primero carga la formula del producto.";
    }
    if (batchProductInfo) {
      batchProductInfo.textContent = "";
    }
    return;
  }
  batchForm.recipe.value = recipe.id;
  if (batchRecipeNotice) batchRecipeNotice.textContent = "";
  if (batchProductInfo) {
    batchProductInfo.textContent = product?.name
      ? `Producto: ${product.name}`
      : recipe?.name
        ? `Producto: ${recipe.name}`
        : "";
  }
  setUnitGroupValue("batchUnit", recipe.yieldUnit || "");
  if (unitGroup) unitGroup.classList.add("locked");
  updateBatchCostPreview();
};

const buildRecipeSummary = (item) => {
  const yieldLabel = item.yieldQuantity && item.yieldUnit
    ? `${formatNumber(item.yieldQuantity)} ${item.yieldUnit}`
    : "Definir rendimiento";
  const totalCost = Number(item.totalCost || 0);
  const yieldQty = Number(item.yieldQuantity || 0);
  const yieldUnit = item.yieldUnit || "";
  let costPerKg = Number(item.costPerKg || 0);
  if (!costPerKg && yieldQty > 0) {
    if (yieldUnit === "kg") costPerKg = totalCost / yieldQty;
    if (yieldUnit === "g") costPerKg = (totalCost / yieldQty) * 1000;
  }
  const packaging = item.packaging || {};
  const packagingCost = Number(packaging.packagingCost || 0) ||
    (Number(packaging.boxCost || 0) + Number(packaging.wrapCost || 0) * Number(packaging.wrapCount || 0));
  const totalDisplayCost = costPerKg ? costPerKg * 0.36 + packagingCost : 0;
  return `
    <div>Rinde: ${yieldLabel}</div>
    <div>Costo total: Gs ${formatGs(totalCost)}</div>
    <div>Costo por kg: ${costPerKg ? `Gs ${formatGs(costPerKg)}` : "Definir rendimiento en kg o g"}</div>
    <div>Costo por display (360 g): ${costPerKg ? `Gs ${formatGs(totalDisplayCost)}` : "Definir rendimiento en kg o g"}</div>
  `;
};

const setUnitGroupValue = (targetId, value) => {
  if (!targetId) return;
  const input = document.getElementById(targetId);
  if (input) input.value = value || "";
  unitGroups
    .filter((group) => group.dataset.target === targetId)
    .forEach((group) => {
      group.querySelectorAll("button[data-unit]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.unit === value);
      });
    });
};

const normalizeQuantity = (quantity, fromUnit, toUnit) => {
  if (!fromUnit || !toUnit) return quantity;
  if (fromUnit === toUnit) return quantity;
  const map = {
    kg: { g: 1000 },
    g: { kg: 1 / 1000 },
    L: { ml: 1000 },
    ml: { L: 1 / 1000 }
  };
  const factor = map[fromUnit]?.[toUnit];
  if (!factor) return null;
  return quantity * factor;
};

const updatePurchaseTotal = () => {
  const quantity = Number(purchaseForm.quantity.value);
  const totalCost = Number(purchaseForm.totalCost.value);
  if (Number.isNaN(quantity) || Number.isNaN(totalCost)) {
    purchaseForm.unitPrice.value = "";
    return;
  }
  const material = state.rawMaterials.find((item) => item.id === purchaseForm.material.value);
  const rawUnit = purchaseForm.purchaseUnit.value;
  const baseUnit = material?.unit || rawUnit;
  const normalized = material ? normalizeQuantity(quantity, rawUnit, baseUnit) : quantity;
  const baseQuantity = normalized ?? quantity;
  const unitPriceBase = baseQuantity ? totalCost / baseQuantity : 0;
  purchaseForm.unitPrice.value = Number.isNaN(unitPriceBase) ? "" : Math.round(unitPriceBase).toString();
};

const syncState = (key, items) => {
  state[key] = items;
  if (key === "rawMaterials") {
    updateSelect(purchaseForm.material, items, "Seleccionar");
    updateSelect(recipeForm.material, items, "Seleccionar");
    updateRecipeIngredientFields();
  }
  if (key === "recipes") {
    updateSelect(batchForm.recipe, items, "Seleccionar");
    updateSelect(stockRecipeSelect, items, "Seleccionar formula");
    updateBatchCostPreview();
    if (batchForm.recipe.value) {
      updateBatchProductFromRecipe();
    }
  }
  if (key === "products") {
    updateSelect(batchProductSelect, items, "Seleccionar");
    refreshCommercialHistoryProductOptions();
    if (batchForm.recipe.value) {
      updateBatchProductFromRecipe();
    }
  }
  if (key === "clients") {
    updateSelect(saleForm.client, items, "Opcional");
    updateSelect(historyClientFilter, items, "Todos");
    if (commercialHistoryState.selectedClientId && !items.some((item) => item.id === commercialHistoryState.selectedClientId)) {
      commercialHistoryState.selectedClientId = "";
      if (historyClientFilter) historyClientFilter.value = "";
    }
  }
  if (key === "salesGoals") {
    updateSalesGoalForm(items[0]);
  }
  if (key === "sales") {
    refreshCommercialHistoryPaymentOptions();
    refreshCommercialHistoryProductOptions();
  }

  if (["rawMaterials", "purchases", "batches", "rawMaterialAdjustments"].includes(key)) {
    refreshStockSummary();
  }
  if (["sales", "products", "salesGoals", "rawMaterials", "purchases", "batches", "finishedStockAdjustments", "rawMaterialAdjustments"].includes(key)) {
    const stockData = computeStockTotals();
    refreshSalesDashboard(stockData);
    refreshDashboard(stockData);
  }
  if (["batches", "sales", "products", "recipes", "finishedStockAdjustments"].includes(key)) {
    refreshFinishedStock();
    refreshSaleProductOptions();
  }
};

const listenCollection = (collectionName, key, userId) => {
  const q = query(collection(db, collectionName), where("userId", "==", userId));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
    syncState(key, items);
    renderAll();
  });
  unsubscribers.push(unsubscribe);
};

const renderAll = () => {
  const { availabilityMap } = computeStockTotals();
  renderList(rawMaterialList, state.rawMaterials, (item) => {
    const available = availabilityMap[item.id] ?? 0;
    const status = getStockStatus({ available, minStock: item.minStock });
    return `
      <div class="list-item ${status.alertClass}">
        <strong>${item.name}</strong>
        Unidad: ${item.unit} | Costo referencia: Gs ${formatGs(item.referenceCost || item.price)}
        <div>Disponible: ${formatNumber(available)} ${item.unit}</div>
        ${item.minStock ? `<div>Stock minimo: ${formatNumber(item.minStock)} ${item.unit}</div>` : ""}
        <div class="status-tag ${status.tagClass}">${status.label}</div>
        ${item.supplier ? `<div>Proveedor: ${item.supplier}</div>` : ""}
        <div class="list-actions">
          <button class="btn ghost" type="button" data-edit-raw-material="${item.id}">Editar</button>
          <button class="btn ghost danger" type="button" data-delete-raw-material="${item.id}">Eliminar</button>
        </div>
      </div>
    `;
  });

  renderList(purchaseList, state.purchases, (item) => `
    <div class="list-item">
      <strong>${item.materialName}</strong>
      <div>Tipo: ${item.type || "ingreso"}</div>
      Fecha: ${formatDate(item.date)} | Cantidad: ${formatNumber(item.quantityPurchased ?? item.quantity)} ${item.unitPurchased ?? item.unit}
      ${item.unitPurchased && item.unitPurchased !== item.unit ? `<div>Equivalente: ${formatNumber(item.quantity)} ${item.unit}</div>` : ""}
      <div>Costo: Gs ${formatGs(item.total)} | Costo unitario base: Gs ${formatGs(item.unitPrice)}</div>
      <div class="list-actions">
        <button class="btn ghost" type="button" data-edit-purchase="${item.id}">Editar</button>
        <button class="btn ghost danger" type="button" data-delete-purchase="${item.id}">Eliminar</button>
      </div>
    </div>
  `);

  renderList(recipeList, state.recipes, (item) => `
    <div class="list-item">
      <strong>${item.name}</strong>
      ${buildRecipeSummary(item)}
      <div class="list-actions">
        <button class="btn ghost" type="button" data-edit-recipe="${item.id}">Editar</button>
        <button class="btn ghost danger" type="button" data-delete-recipe="${item.id}">Eliminar</button>
      </div>
    </div>
  `);

  renderList(batchList, state.batches, (item) => {
    const createdAt = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : null;
    const timeLabel = createdAt ? formatTime(createdAt) : "N/D";
    const userLabel = item.createdByName
      ? item.createdByName
      : item.createdByEmail
        ? item.createdByEmail
        : "Registro anterior";
    const materials = (item.materialsUsed || [])
      .map((m) => `
        <div class="batch-material">
          <span>${m.materialName}</span>
          <strong>${formatNumber(m.quantity)} ${m.unit}</strong>
        </div>
      `)
      .join("");
    return `
      <div class="list-item batch-card">
        <div class="batch-header">
          <div>
            <div class="batch-title">${item.productName || item.recipeName}</div>
            <div class="batch-meta">
              <span>Fecha: ${formatDate(item.date)}</span>
              <span>Hora: ${timeLabel}</span>
              <span>Usuario: ${userLabel}</span>
            </div>
          </div>
          <div class="batch-actions">
            <button class="btn ghost" type="button" data-edit-batch="${item.id}">Editar</button>
            <button class="btn ghost danger" type="button" data-delete-batch="${item.id}">Eliminar</button>
          </div>
        </div>
        <div class="batch-grid">
          <div>
            <div class="batch-label">Cantidad producida</div>
            <div class="batch-value">${formatNumber(item.quantityProduced)} ${item.unitProduced}</div>
          </div>
          <div>
            <div class="batch-label">Numero de lote</div>
            <div class="batch-value">${item.lotNumber || "N/D"}</div>
          </div>
          <div>
            <div class="batch-label">Costo total</div>
            <div class="batch-value">Gs ${formatGs(item.totalCost)}</div>
          </div>
          <div>
            <div class="batch-label">Costo por unidad</div>
            <div class="batch-value">Gs ${formatGs(item.costPerUnit)}</div>
          </div>
        </div>
        <details class="batch-collapse">
          <summary class="batch-collapse-header">
            <span>Materias primas utilizadas</span>
            <span class="batch-chevron">▾</span>
          </summary>
          <div class="batch-materials">
            ${materials || '<div class="muted">Sin detalle</div>'}
          </div>
        </details>
      </div>
    `;
  });

  if (productForm) {
    renderList(productList, state.products, (item) => `
      <div class="list-item">
        <strong>${item.name}</strong>
        Unidad: ${item.unit} | Precio: Gs ${formatGs(item.price)}
        <div class="list-actions">
          <button class="btn ghost" type="button" data-edit-product="${item.id}">Editar</button>
          <button class="btn ghost danger" type="button" data-delete-product="${item.id}">Eliminar</button>
        </div>
      </div>
    `);
  } else {
    const { rows } = computeFinishedStockTotals();
    renderList(productList, rows, (item) => {
      const displays = item.stockDisplays;
      return `
        <div class="list-item">
          <strong>${item.name}</strong>
          <div>Displays disponibles: ${displays !== null ? formatInteger(displays) : "N/D"}</div>
        </div>
      `;
    });
  }

  const validClientIds = new Set(state.clients.map((client) => client.id));
  Array.from(clientHistoryOpenState).forEach((clientId) => {
    if (!validClientIds.has(clientId)) clientHistoryOpenState.delete(clientId);
  });

  renderList(clientList, state.clients, (item) => {
    const historyOpen = clientHistoryOpenState.has(item.id);
    return `
    <div class="list-item client-item">
      <strong>${item.name}</strong>
      ${item.ruc ? `RUC: ${item.ruc}` : ""}
      ${item.phone ? ` | Tel: ${item.phone}` : ""}
      ${item.address ? ` | Dir: ${item.address}` : ""}
      ${item.notes ? `<div class="muted">Notas: ${item.notes}</div>` : ""}
      <div class="list-actions">
        <button class="btn ghost" type="button" data-toggle-client-history="${item.id}">Historial</button>
        <button class="btn ghost" type="button" data-edit-client="${item.id}">Editar</button>
        <button class="btn ghost danger" type="button" data-delete-client="${item.id}">Eliminar</button>
      </div>
      <div class="followup-history-panel ${historyOpen ? "open" : "hidden"}">
        ${buildClientFollowupHistoryMarkup(item, "Sin historial comercial de seguimiento.")}
      </div>
    </div>
  `;
  });

  renderList(saleList, state.sales, (item) => {
    const lines = getSaleLineItems(item);
    const saleTotal = getSaleTotalAmount(item);
    const isCreditSale = isCreditSaleRecord(item);
    const lineRows = lines.length
      ? lines.map((line) => `
        <div class="sale-line">
          <span>${line.productName || "Producto"}</span>
          <strong>${formatInteger(line.quantity)} disp</strong>
        </div>
      `).join("")
      : '<div class="muted">Sin productos</div>';
    return `
      <div class="list-item">
        <div class="sale-summary-primary">
          <div>Cliente: <strong>${item.clientName || "Sin cliente"}</strong></div>
          <div>Monto: <strong>Gs ${formatGs(saleTotal)}</strong></div>
          <div>Fecha: <strong>${formatDate(item.date)}</strong></div>
        </div>
        <div class="sale-lines">${lineRows}</div>
        <div>Pago: ${item.payment} | ${isCreditSale ? `A credito hasta ${formatDate(item.dueDate)}` : "Contado"}</div>
        ${item.observation ? `<div class="muted">Observacion: ${item.observation}</div>` : ""}
        <div class="list-actions">
          <button class="btn ghost" type="button" data-share-sale="${item.id}">Compartir</button>
          <button class="btn ghost" type="button" data-edit-sale="${item.id}">Editar</button>
          <button class="btn ghost danger" type="button" data-delete-sale="${item.id}">Eliminar</button>
        </div>
      </div>
    `;
  });

  renderRepurchaseList();
  renderSalesCoverage();
  renderCommercialHistory();

  requestAnimationFrame(refreshCollapseHeights);
  refreshIcons();
};

const setupTabs = () => {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab.dataset.tab || "production");
    });
  });
  const initialTab = document.querySelector(".tab.active")?.dataset.tab || "production";
  setActiveTab(initialTab);
};

const updateDueDateVisibility = (forceOpen = null) => {
  if (!saleForm || !dueDateField) return;
  const isCredit = forceOpen === null
    ? Boolean(saleCreditCheckbox?.checked)
    : Boolean(forceOpen);
  if (saleCreditCheckbox) {
    saleCreditCheckbox.checked = isCredit;
  }
  dueDateField.classList.remove("hidden");
  dueDateField.classList.toggle("open", isCredit);
  if (saleCreditToggle) {
    saleCreditToggle.textContent = isCredit ? "Ocultar credito" : "Agregar credito";
  }
  if (!isCredit) saleForm.dueDate.value = "";
  requestAnimationFrame(() => {
    refreshCollapseHeights();
  });
};

const updateSaleObservationVisibility = (forceOpen = null) => {
  if (!saleForm || !saleObservationField) return;
  const currentValue = String(saleForm.observation?.value || "").trim();
  const shouldOpen = forceOpen === null ? Boolean(currentValue) : Boolean(forceOpen);
  saleObservationField.classList.remove("hidden");
  saleObservationField.classList.toggle("open", shouldOpen);
  if (saleObservationToggle) {
    saleObservationToggle.textContent = shouldOpen ? "Ocultar observacion" : "Agregar observacion";
  }
  if (!shouldOpen && saleForm.observation) {
    saleForm.observation.value = "";
  }
  requestAnimationFrame(() => {
    refreshCollapseHeights();
  });
};

const updateSaleRepurchaseFrequencyVisibility = () => {
  if (!saleRepurchaseFrequencyField) return;
  const isOpen = Boolean(saleRepurchaseField?.classList.contains("open"));
  saleRepurchaseFrequencyField.classList.toggle("open", isOpen);
  if (!isOpen && saleForm?.repurchaseFrequency) {
    saleForm.repurchaseFrequency.value = "";
  }
};

const updateSaleRepurchaseVisibility = (forceOpen = null) => {
  if (!saleRepurchaseField) return;
  const shouldOpen = forceOpen === null ? !saleRepurchaseField.classList.contains("open") : Boolean(forceOpen);
  saleRepurchaseField.classList.remove("hidden");
  saleRepurchaseField.classList.toggle("open", shouldOpen);
  if (saleRepurchaseToggle) {
    saleRepurchaseToggle.textContent = shouldOpen
      ? "Ocultar seguimiento de recompra"
      : "Agregar seguimiento de recompra";
  }
  if (shouldOpen && saleForm?.repurchaseFrequency) {
    requestAnimationFrame(() => {
      saleForm.repurchaseFrequency.focus({ preventScroll: false });
    });
  }
  updateSaleRepurchaseFrequencyVisibility();
  requestAnimationFrame(() => {
    refreshCollapseHeights();
  });
};

const setDefaultDates = () => {
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    input.valueAsDate = new Date();
  });
};

const handleLoginSubmit = async (event) => {
  event?.preventDefault();
  if (!loginForm) return;
  const { email, password } = getLoginCredentials();
  if (!email || !password) {
    setAuthFeedback("Completa correo y contrasena.");
    return;
  }
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!looksLikeEmail) {
    setAuthFeedback("Ingresa un correo valido.");
    return;
  }
  try {
    console.log("[auth] submit login", email);
    setAuthBusy(true);
    setAuthFeedback("Ingresando...", "info");
    await signInWithEmailAndPassword(auth, email, password);
    setAuthFeedback("Ingreso correcto. Cargando...", "success");
  } catch (error) {
    console.error("[auth] login error", error);
    setAuthFeedback(getAuthMessage(error), "error");
  } finally {
    setAuthBusy(false);
  }
};

if (loginForm) {
  loginForm.addEventListener("submit", handleLoginSubmit);
}

loginSubmitBtn?.addEventListener("click", () => {
  console.log("[auth] click ingresar");
});

registerBtn?.addEventListener("click", async () => {
  if (!loginForm) return;
  const { email, password } = getLoginCredentials();
  if (!email || !password) {
    setAuthFeedback("Completa correo y contrasena para crear la cuenta.");
    return;
  }
  try {
    console.log("[auth] create account", email);
    setAuthBusy(true);
    setAuthFeedback("Creando cuenta...", "info");
    await createUserWithEmailAndPassword(auth, email, password);
    setAuthFeedback("Cuenta creada. Cargando...", "success");
  } catch (error) {
    console.error("[auth] register error", error);
    setAuthFeedback(getAuthMessage(error), "error");
  } finally {
    setAuthBusy(false);
  }
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
});

unitGroups.forEach((group) => {
  group.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-unit]");
    if (!btn) return;
    setUnitGroupValue(group.dataset.target, btn.dataset.unit);
    if (group.dataset.target === "recipeYieldUnit") {
      renderRecipeDraft();
    }
  });
});

rawMaterialForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  if (!rawMaterialForm.unit.value) {
    window.alert("Selecciona una unidad para la materia prima.");
    return;
  }
  const referenceCost = Number(rawMaterialForm.referenceCost.value);
  const referenceQuantity = Number(rawMaterialForm.referenceQuantity.value) || 1;
  const price = Number.isNaN(referenceCost) ? 0 : referenceCost;
  const minStock = rawMaterialForm.minStock.value ? Number(rawMaterialForm.minStock.value) : null;
  const legacyReferenceQuantity = rawMaterialForm.legacyReferenceQuantity.value;
  const legacyReferenceCostTotal = rawMaterialForm.legacyReferenceCostTotal.value;
  const payload = {
    name: rawMaterialForm.name.value.trim(),
    unit: rawMaterialForm.unit.value.trim(),
    price,
    referenceQuantity,
    referenceCost: Number.isNaN(referenceCost) ? 0 : referenceCost,
    minStock,
    supplier: rawMaterialForm.supplier.value.trim(),
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  if (legacyReferenceQuantity) payload.legacyReferenceQuantity = Number(legacyReferenceQuantity);
  if (legacyReferenceCostTotal) payload.legacyReferenceCostTotal = Number(legacyReferenceCostTotal);
  await saveDoc("raw_materials", rawMaterialForm, payload);
  resetForm(rawMaterialForm);
  setUnitGroupValue("rawMaterialUnit", rawMaterialForm.unit.value);
});

purchaseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  if (!purchaseForm.purchaseUnit.value) {
    window.alert("Selecciona la unidad de ingreso.");
    return;
  }
  const materialId = purchaseForm.material.value;
  const material = state.rawMaterials.find((item) => item.id === materialId);
  if (!material) return;
  const quantityRaw = Number(purchaseForm.quantity.value);
  const totalCost = Number(purchaseForm.totalCost.value);
  const unitRaw = purchaseForm.purchaseUnit.value;
  const normalized = normalizeQuantity(quantityRaw, unitRaw, material.unit);
  const quantityBase = normalized ?? quantityRaw;
  const unitPriceBase = quantityBase ? totalCost / quantityBase : 0;
  const payload = {
    materialId,
    materialName: material.name,
    unit: material.unit,
    quantityPurchased: quantityRaw,
    unitPurchased: unitRaw,
    date: purchaseForm.date.value,
    quantity: quantityBase,
    unitPrice: unitPriceBase,
    total: totalCost,
    type: "ingreso",
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await saveDoc("raw_purchases", purchaseForm, payload);
  resetForm(purchaseForm);
});


addIngredientBtn.addEventListener("click", () => {
  const materialId = recipeForm.material.value;
  const material = state.rawMaterials.find((item) => item.id === materialId);
  const quantity = Number(recipeForm.quantity.value);
  if (!material || !quantity) return;
  const unit = recipeForm.unit.value.trim() || material.unit;
  const unitCost = Number(material.price || 0);
  const normalized = normalizeQuantity(quantity, unit, material.unit);
  const quantityBase = normalized ?? quantity;
  const totalCost = quantityBase * unitCost;
  recipeDraft.ingredients.push({
    materialId,
    materialName: material.name,
    quantity,
    unit,
    quantityBase,
    unitBase: material.unit,
    unitCost,
    totalCost
  });
  recipeForm.quantity.value = "";
  renderRecipeDraft();
});

recipeIngredientsList.addEventListener("click", (event) => {
  const target = event.target;
  if (!target.dataset.removeIngredient) return;
  const index = Number(target.dataset.removeIngredient);
  if (Number.isNaN(index)) return;
  recipeDraft.ingredients.splice(index, 1);
  renderRecipeDraft();
});

recipeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  if (!recipeForm.yieldUnit.value) {
    window.alert("Selecciona la unidad de rendimiento.");
    return;
  }
  if (!recipeDraft.ingredients.length) return;
  const totals = calculateRecipeTotals();
  const productName = recipeForm.name.value.trim();
  const matchedProduct = state.products.find((item) => normalizeText(item.name) === normalizeText(productName));
  const payload = {
    name: productName,
    productId: matchedProduct?.id || "",
    yieldQuantity: Number(recipeForm.yieldQuantity.value),
    yieldUnit: recipeForm.yieldUnit.value.trim(),
    ingredients: recipeDraft.ingredients.map((ing) => ({
      ...ing,
      quantityBase: ing.quantityBase ?? ing.quantity,
      unitBase: ing.unitBase ?? ing.unit
    })),
    totalCost: totals.totalCost,
    costPerUnit: totals.costPerUnit,
    costPerKg: totals.costPerKg ?? 0,
    displayWeightGrams: 360,
    packaging: {
      boxCost: totals.boxCost,
      wrapCost: totals.wrapCost,
      wrapCount: totals.wrapCount,
      packagingCost: totals.packagingCost
    },
    productCostPerDisplay: totals.productCostPerDisplay ?? 0,
    totalDisplayCost: totals.totalDisplayCost ?? 0,
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await saveDoc("recipes", recipeForm, payload);
  recipeDraft.ingredients = [];
  resetForm(recipeForm);
  updateRecipeIngredientFields();
  renderRecipeDraft();
});

batchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const existingBatch = batchForm.dataset.editId
    ? state.batches.find((item) => item.id === batchForm.dataset.editId)
    : null;
  if (!batchForm.unit.value) {
    window.alert("Selecciona la unidad producida.");
    return;
  }
  const lotNumber = batchForm.lotNumber.value.trim();
  if (!lotNumber) {
    if (batchRecipeNotice) {
      batchRecipeNotice.textContent = "Ingresa el numero de lote.";
    }
    return;
  }
  const recipeId = batchForm.recipe.value;
  if (!recipeId) {
    if (batchRecipeNotice) {
      batchRecipeNotice.textContent = "No hay formula asociada. Primero carga la formula del producto.";
    }
    return;
  }
  const recipe = state.recipes.find((item) => item.id === recipeId);
  if (!recipe) return;
  const productIdInput = batchForm.product.value;
  const product = state.products.find((item) => item.id === productIdInput) || findProductForRecipe(recipe);
  const resolvedProductId = product?.id || "";
  const resolvedProductName = product?.name || recipe.name || "";
  const quantityProduced = Number(batchForm.quantity.value);
  if (!quantityProduced || !recipe.yieldQuantity) {
    if (batchRecipeNotice) {
      batchRecipeNotice.textContent = "Completa cantidad producida y formula valida.";
    }
    return;
  }
  const batchDate = batchForm.date.value;
  const lotKey = normalizeText(lotNumber);
  const duplicate = state.batches.some((batch) => {
    const sameDate = batch.date === batchDate;
    const sameProduct = resolvedProductId
      ? batch.productId === resolvedProductId
      : normalizeText(batch.productName || "") === normalizeText(resolvedProductName);
    const sameLot = normalizeText(batch.lotNumber || "") === lotKey;
    return sameDate && sameProduct && sameLot;
  });
  if (duplicate) {
    if (batchRecipeNotice) {
      batchRecipeNotice.textContent = "Ya existe un lote con ese numero para este producto en la fecha indicada.";
    }
    return;
  }
  const ratio = quantityProduced / Number(recipe.yieldQuantity || 1);
  const { availabilityMap } = computeStockTotals();
  const shortages = [];
  const materialsToConsume = (recipe.ingredients || []).map((ing) => {
    const material = state.rawMaterials.find((m) => m.id === ing.materialId);
    const baseUnit = material?.unit || ing.unitBase || ing.unit;
    const baseRequired = Number(ing.quantityBase || 0) ||
      normalizeQuantity(Number(ing.quantity || 0), ing.unit, baseUnit) ||
      Number(ing.quantity || 0);
    const required = baseRequired * ratio;
    const available = availabilityMap[ing.materialId] ?? 0;
    if (available + 1e-6 < required) {
      shortages.push(`${ing.materialName}: faltan ${formatNumber(required - available)} ${baseUnit}`);
    }
    return {
      material,
      materialId: ing.materialId,
      materialName: ing.materialName,
      unit: baseUnit,
      quantity: required,
      unitCost: Number(ing.unitCost || material?.price || 0)
    };
  });

  if (shortages.length) {
    if (batchRecipeNotice) {
      batchRecipeNotice.textContent = `Stock insuficiente. ${shortages.join(" | ")}`;
    }
    return;
  }

  const costPerUnit = Number(recipe.costPerUnit || 0);
  const totalCost = costPerUnit * quantityProduced;
  const materialsUsed = materialsToConsume.map((item) => ({
    materialId: item.materialId,
    materialName: item.materialName,
    unit: item.unit,
    quantity: item.quantity,
    unitCost: item.unitCost,
    totalCost: item.quantity * item.unitCost
  }));
  const batchRef = doc(collection(db, "batches"));
  const payload = {
    recipeId,
    recipeName: recipe.name,
    productId: resolvedProductId,
    productName: resolvedProductName,
    date: batchDate,
    lotNumber,
    quantityProduced,
    unitProduced: batchForm.unit.value.trim(),
    costPerUnit,
    totalCost,
    materialsUsed,
    stockDeducted: true,
    createdBy: existingBatch?.createdBy || user.uid,
    createdByEmail: existingBatch?.createdByEmail || user.email || "",
    createdByName: existingBatch?.createdByName || user.displayName || "",
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  const batch = writeBatch(db);
  batch.set(batchRef, payload);
  materialsToConsume.forEach((item) => {
    const movementRef = doc(collection(db, "raw_purchases"));
    const movementTotal = item.quantity * item.unitCost;
    batch.set(movementRef, {
      type: "consumo por produccion",
      batchId: batchRef.id,
      lotNumber,
      productId: resolvedProductId,
      productName: resolvedProductName,
      recipeId,
      materialId: item.materialId,
      materialName: item.materialName,
      unit: item.unit,
      quantityPurchased: item.quantity,
      unitPurchased: item.unit,
      date: batchForm.date.value,
      quantity: item.quantity,
      unitPrice: item.unitCost,
      total: movementTotal,
      recipeId: recipe.id,
      recipeName: recipe.name,
      batchId: batchRef.id,
      lotNumber: batchForm.lotNumber.value.trim(),
      userId: user.uid,
      createdAt: serverTimestamp()
    });
  });
  await batch.commit();
  resetForm(batchForm);
  updateBatchCostPreview();
  if (batchRecipeNotice) {
    batchRecipeNotice.textContent = "Produccion registrada y stock actualizado.";
  }
});

productForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const payload = {
    name: productForm.name.value.trim(),
    unit: productForm.unit.value.trim(),
    price: Number(productForm.price.value),
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await saveDoc("products", productForm, payload);
  resetForm(productForm);
});

clientForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const name = formatClientName(clientForm.name.value);
  if (!name) {
    window.alert("Completa el nombre del cliente.");
    return;
  }
  clientForm.name.value = name;
  const rucMain = clientForm.rucMain?.value || "";
  const rucDv = clientForm.rucDv?.value || "";
  const ruc = buildRuc(rucMain, rucDv);
  if (ruc === null) {
    window.alert("Completa ambos campos del RUC o dejalos vacios.");
    return;
  }
  const phone = normalizePhoneForStorage(clientForm.phone.value);
  if (phone === null) {
    window.alert("El telefono debe tener 9 digitos y comenzar con 9. Ejemplo: 983600200.");
    return;
  }
  const payload = {
    name,
    ruc,
    phone,
    address: clientForm.address.value.trim(),
    notes: String(clientForm.notes?.value || "").trim(),
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await saveDoc("clients", clientForm, payload);
  resetForm(clientForm);
});

saleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const rows = Array.from(saleItems?.querySelectorAll(".sale-item") || []);
  const draftItems = [];
  let hasError = false;
  rows.forEach((row) => {
    const productKey = row.querySelector(".sale-item-product")?.value || "";
    const quantityValue = row.querySelector(".sale-item-qty")?.value;
    const unitPriceValue = row.querySelector(".sale-item-price")?.value;
    const quantity = Number(quantityValue);
    const unitPrice = parseGsInputValue(unitPriceValue);
    if (!productKey && !quantityValue && !unitPriceValue) return;
    if (!productKey || !quantity || quantity <= 0) {
      hasError = true;
      return;
    }
    draftItems.push({
      productKey,
      quantity,
      unitPrice: Number.isNaN(unitPrice) ? 0 : unitPrice
    });
  });
  if (!draftItems.length) {
    window.alert("Agrega al menos un producto a la venta.");
    return;
  }
  if (hasError) {
    window.alert("Completa producto y cantidad en cada linea.");
    return;
  }

  const duplicateKeys = new Set();
  const seenKeys = new Set();
  draftItems.forEach((item) => {
    if (seenKeys.has(item.productKey)) duplicateKeys.add(item.productKey);
    seenKeys.add(item.productKey);
  });
  if (duplicateKeys.size) {
    window.alert("No repitas productos. Ajusta la cantidad en una sola linea.");
    return;
  }

  const editId = saleForm.dataset.editId;
  const adjustmentByKey = new Map();
  if (editId) {
    const existing = state.sales.find((sale) => sale.id === editId);
    if (existing) {
      getSaleLineItems(existing).forEach((line) => {
        const key = buildSaleOptionKey({
          productId: line.productId,
          productName: line.productName
        });
        const qty = Number(line.quantity || 0);
        adjustmentByKey.set(key, (adjustmentByKey.get(key) || 0) + qty);
      });
    }
  }

  for (const item of draftItems) {
    const productRow = saleProductIndex.get(item.productKey);
    const available = productRow?.displays;
    if (available !== null && available !== undefined) {
      const allowed = available + (adjustmentByKey.get(item.productKey) || 0);
      if (item.quantity > allowed) {
        window.alert("Stock insuficiente para completar la venta.");
        return;
      }
    }
  }

  const clientId = saleForm.client.value;
  const client = state.clients.find((item) => item.id === clientId);
  const itemsPayload = draftItems.map((item) => {
    const productRow = saleProductIndex.get(item.productKey);
    return {
      productId: productRow?.productId || "",
      productName: productRow?.name || "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      unit: "display"
    };
  });
  const total = itemsPayload.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const summary = itemsPayload[0] || {};
  const isCredit = Boolean(saleCreditCheckbox?.checked);
  const observation = String(saleForm.observation?.value || "").trim();
  const repurchaseActive = Boolean(saleRepurchaseField?.classList.contains("open"));
  const repurchaseFrequencyDays = repurchaseActive
    ? Number(saleForm.repurchaseFrequency?.value || 0)
    : null;
  if (isCredit && !saleForm.dueDate.value) {
    window.alert("Completa la fecha de cobro para ventas a credito.");
    return;
  }
  if (repurchaseActive && ![15, 30, 45, 60].includes(repurchaseFrequencyDays)) {
    window.alert("Selecciona una frecuencia valida para el seguimiento de recompra.");
    return;
  }
  const saleDate = normalizeDateValue(saleForm.date.value);
  const nextRepurchaseDate = repurchaseActive
    ? addDaysToDateValue(saleDate, repurchaseFrequencyDays)
    : "";
  const payload = {
    date: saleForm.date.value,
    productId: summary.productId || "",
    productName: summary.productName || "",
    clientId: client?.id || "",
    clientName: client?.name || "",
    clientPhone: client?.phone || "",
    items: itemsPayload,
    quantity: summary.quantity || 0,
    unitPrice: summary.unitPrice || 0,
    total,
    unit: "display",
    payment: saleForm.payment.value,
    isCredit,
    paid: isCredit ? "no" : "si",
    dueDate: isCredit ? saleForm.dueDate.value : "",
    repurchaseActive,
    repurchaseFrequencyDays: repurchaseActive ? repurchaseFrequencyDays : null,
    repurchaseNextContactDate: nextRepurchaseDate,
    observation,
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await saveDoc("sales", saleForm, payload);
  resetForm(saleForm);
  resetSaleItems();
  if (saleCreditCheckbox) saleCreditCheckbox.checked = false;
  updateDueDateVisibility();
  updateSaleObservationVisibility(false);
  updateSaleRepurchaseVisibility(false);
});

const toggleQuickClient = (show) => {
  if (!quickClientPanel) return;
  quickClientPanel.classList.toggle("hidden", !show);
  if (show && quickClientName) quickClientName.focus();
};

quickClientToggle?.addEventListener("click", () => {
  const isHidden = quickClientPanel?.classList.contains("hidden");
  toggleQuickClient(isHidden);
});

quickClientCancel?.addEventListener("click", () => {
  if (quickClientNotice) quickClientNotice.textContent = "";
  toggleQuickClient(false);
});

quickClientSave?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;
  const name = formatClientName(quickClientName?.value);
  const ruc = buildRuc(quickClientRucMain?.value, quickClientRucDv?.value);
  const phone = normalizePhoneForStorage(quickClientPhone?.value || "");
  const address = quickClientAddress?.value.trim() || "";
  if (!name) {
    if (quickClientNotice) quickClientNotice.textContent = "Completa el nombre del cliente.";
    return;
  }
  if (quickClientName) quickClientName.value = name;
  if (ruc === null) {
    if (quickClientNotice) quickClientNotice.textContent = "Completa ambos campos del RUC o dejalos vacios.";
    return;
  }
  if (phone === null) {
    if (quickClientNotice) quickClientNotice.textContent = "Telefono invalido. Usa 9 digitos desde 9 (ej: 983600200).";
    return;
  }
  const payload = {
    name,
    ruc,
    phone,
    address,
    notes: "",
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, "clients"), payload);
  if (saleForm?.client) {
    let option = saleForm.client.querySelector(`option[value="${docRef.id}"]`);
    if (!option) {
      option = document.createElement("option");
      option.value = docRef.id;
      option.textContent = name;
      saleForm.client.appendChild(option);
    }
    saleForm.client.value = docRef.id;
  }
  if (quickClientName) quickClientName.value = "";
  if (quickClientRucMain) quickClientRucMain.value = "";
  if (quickClientRucDv) quickClientRucDv.value = "";
  if (quickClientPhone) quickClientPhone.value = "";
  if (quickClientAddress) quickClientAddress.value = "";
  if (quickClientNotice) quickClientNotice.textContent = "";
  toggleQuickClient(false);
  if (isDesktopSalesKeyboardMode()) {
    moveSalesFocusToFirstProduct();
  }
});

salesGoalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const startDate = salesGoalForm.startDate.value;
  const endDate = salesGoalForm.endDate.value;
  const targetDisplays = Number(salesGoalForm.targetDisplays.value);
  if (!startDate || !endDate) {
    if (salesGoalNotice) salesGoalNotice.textContent = "Completa las fechas del periodo.";
    return;
  }
  if (endDate < startDate) {
    if (salesGoalNotice) salesGoalNotice.textContent = "La fecha fin no puede ser menor que la fecha inicio.";
    return;
  }
  if (!targetDisplays || targetDisplays <= 0) {
    if (salesGoalNotice) salesGoalNotice.textContent = "El objetivo de displays debe ser mayor que 0.";
    return;
  }
  const payload = {
    startDate,
    endDate,
    targetDisplays,
    userId: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await saveDoc("sales_goals", salesGoalForm, payload);
  if (salesGoalNotice) salesGoalNotice.textContent = "Objetivo guardado.";
});

const startEditRawMaterial = (item) => {
  rawMaterialForm.name.value = item.name || "";
  setUnitGroupValue("rawMaterialUnit", item.unit || "");
  rawMaterialForm.referenceQuantity.value = 1;
  rawMaterialForm.referenceCost.value = item.price ?? item.referenceCost ?? "";
  rawMaterialForm.minStock.value = item.minStock ?? "";
  rawMaterialForm.legacyReferenceQuantity.value = item.referenceQuantity ?? "";
  rawMaterialForm.legacyReferenceCostTotal.value = item.referenceCost ?? "";
  rawMaterialForm.supplier.value = item.supplier || "";
  rawMaterialForm.dataset.editId = item.id;
  setSubmitLabel(rawMaterialForm, "Actualizar materia prima");
};

const startEditPurchase = (item) => {
  purchaseForm.material.value = item.materialId || "";
  purchaseForm.date.value = item.date || "";
  purchaseForm.quantity.value = item.quantityPurchased ?? item.quantity ?? "";
  setUnitGroupValue("purchaseUnit", item.unitPurchased ?? item.unit ?? "");
  purchaseForm.totalCost.value = item.total ?? "";
  purchaseForm.unitPrice.value = item.unitPrice ?? "";
  purchaseForm.dataset.editId = item.id;
  setSubmitLabel(purchaseForm, "Actualizar ingreso");
};

const startEditRecipe = (item) => {
  recipeForm.name.value = item.name || "";
  recipeForm.yieldQuantity.value = item.yieldQuantity ?? "";
  setUnitGroupValue("recipeYieldUnit", item.yieldUnit || "");
  recipeForm.boxCost.value = item.packaging?.boxCost ?? "";
  recipeForm.wrapCost.value = item.packaging?.wrapCost ?? "";
  recipeForm.wrapCount.value = item.packaging?.wrapCount ?? 12;
  recipeForm.dataset.editId = item.id;
  recipeDraft.ingredients = (item.ingredients || []).map((ing) => {
    const material = state.rawMaterials.find((m) => m.id === ing.materialId);
    const unitCost = material ? Number(material.price || 0) : Number(ing.unitCost || 0);
    const quantity = Number(ing.quantity || 0);
    const unit = ing.unit || material?.unit || "";
    const unitBase = material?.unit || ing.unitBase || unit;
    const quantityBaseStored = Number(ing.quantityBase || 0);
    const normalized = normalizeQuantity(quantity, unit, unitBase);
    const quantityBase = quantityBaseStored || normalized || quantity;
    return {
      materialId: ing.materialId,
      materialName: ing.materialName,
      quantity,
      unit,
      quantityBase,
      unitBase,
      unitCost,
      totalCost: quantityBase * unitCost
    };
  });
  setSubmitLabel(recipeForm, "Actualizar receta");
  renderRecipeDraft();
  updateRecipeIngredientFields();
};

const startEditBatch = (item) => {
  batchForm.recipe.value = item.recipeId || "";
  batchForm.date.value = item.date || "";
  batchForm.lotNumber.value = item.lotNumber || "";
  batchForm.quantity.value = item.quantityProduced ?? "";
  setUnitGroupValue("batchUnit", item.unitProduced || "");
  if (batchProductSelect) {
    batchProductSelect.value = item.productId || "";
  }
  batchForm.dataset.editId = item.id;
  setSubmitLabel(batchForm, "Actualizar lote");
  updateBatchCostPreview();
};

const startEditProduct = (item) => {
  if (!productForm) return;
  productForm.name.value = item.name || "";
  productForm.unit.value = item.unit || "";
  productForm.price.value = item.price ?? "";
  productForm.dataset.editId = item.id;
  setSubmitLabel(productForm, "Actualizar producto");
};

const startEditClient = (item) => {
  clientForm.name.value = item.name || "";
  const rucParts = splitRuc(item.ruc);
  if (clientForm.rucMain) clientForm.rucMain.value = rucParts.main;
  if (clientForm.rucDv) clientForm.rucDv.value = rucParts.dv;
  clientForm.phone.value = getLocalPhoneInputValue(item.phone);
  clientForm.address.value = item.address || "";
  if (clientForm.notes) clientForm.notes.value = item.notes || "";
  clientForm.dataset.editId = item.id;
  setSubmitLabel(clientForm, "Actualizar cliente");
};

const startEditSale = (item) => {
  saleForm.date.value = item.date || "";
  saleForm.client.value = item.clientId || "";
  const mappedItems = getSaleLineItems(item).map((line) => ({
    productKey: buildSaleOptionKey({ productId: line.productId, productName: line.productName }),
    quantity: line.quantity ?? "",
    unitPrice: line.unitPrice ?? ""
  }));
  resetSaleItems(mappedItems);
  const paymentOptions = Array.from(saleForm.payment.options).map((opt) => opt.value);
  saleForm.payment.value = paymentOptions.includes(item.payment) ? item.payment : "Efectivo";
  const isCreditSale = item.isCredit === true
    || item.paid === "no"
    || normalizeText(item.payment) === "credito";
  if (saleCreditCheckbox) saleCreditCheckbox.checked = isCreditSale;
  saleForm.dueDate.value = item.dueDate || "";
  if (saleForm.observation) saleForm.observation.value = item.observation || "";
  const hasRepurchase = item.repurchaseActive === true;
  if (saleForm.repurchaseFrequency) {
    const validFrequencies = ["15", "30", "45", "60"];
    const frequencyValue = String(item.repurchaseFrequencyDays || "");
    saleForm.repurchaseFrequency.value = validFrequencies.includes(frequencyValue) ? frequencyValue : "";
  }
  saleForm.dataset.editId = item.id;
  setSubmitLabel(saleForm, "Actualizar venta");
  updateDueDateVisibility();
  updateSaleObservationVisibility(Boolean(item.observation));
  updateSaleRepurchaseVisibility(hasRepurchase);
};

const confirmDelete = (label) => window.confirm(`Eliminar ${label}?`);

rawMaterialList.addEventListener("click", async (event) => {
  const editId = event.target.dataset.editRawMaterial;
  const deleteId = event.target.dataset.deleteRawMaterial;
  if (editId) {
    const item = state.rawMaterials.find((m) => m.id === editId);
    if (item) startEditRawMaterial(item);
  }
  if (deleteId && confirmDelete("materia prima")) {
    await deleteDoc(doc(db, "raw_materials", deleteId));
  }
});

purchaseList.addEventListener("click", async (event) => {
  const editId = event.target.dataset.editPurchase;
  const deleteId = event.target.dataset.deletePurchase;
  if (editId) {
    const item = state.purchases.find((m) => m.id === editId);
    if (item) startEditPurchase(item);
  }
  if (deleteId && confirmDelete("ingreso")) {
    await deleteDoc(doc(db, "raw_purchases", deleteId));
  }
});

recipeList.addEventListener("click", async (event) => {
  const editId = event.target.dataset.editRecipe;
  const deleteId = event.target.dataset.deleteRecipe;
  if (editId) {
    const item = state.recipes.find((m) => m.id === editId);
    if (item) startEditRecipe(item);
  }
  if (deleteId && confirmDelete("receta")) {
    await deleteDoc(doc(db, "recipes", deleteId));
  }
});

batchList.addEventListener("click", async (event) => {
  const editId = event.target.dataset.editBatch;
  const deleteId = event.target.dataset.deleteBatch;
  if (editId) {
    const item = state.batches.find((m) => m.id === editId);
    if (item) startEditBatch(item);
  }
  if (deleteId && confirmDelete("lote")) {
    await deleteDoc(doc(db, "batches", deleteId));
  }
});

productList.addEventListener("click", async (event) => {
  if (!productForm) return;
  const editId = event.target.dataset.editProduct;
  const deleteId = event.target.dataset.deleteProduct;
  if (editId) {
    const item = state.products.find((m) => m.id === editId);
    if (item) startEditProduct(item);
  }
  if (deleteId && confirmDelete("producto")) {
    await deleteDoc(doc(db, "products", deleteId));
  }
});

finishedStockList?.addEventListener("input", (event) => {
  const newStockInput = event.target.closest("[data-stock-adjustment-new]");
  if (newStockInput) {
    const key = String(newStockInput.dataset.stockAdjustmentNew || "").trim();
    if (!key || stockAdjustmentState.openKey !== key) return;
    stockAdjustmentState.newStock = newStockInput.value;
    const panel = newStockInput.closest(".stock-adjustment-panel");
    const diffStrong = panel?.querySelector(".stock-adjustment-diff strong");
    if (diffStrong) {
      const currentRows = computeFinishedStockTotals().rows;
      const currentRow = currentRows.find((row) => row.key === key);
      const currentStock = Number.isFinite(Number(currentRow?.stockDisplays))
        ? Number(currentRow.stockDisplays)
        : 0;
      const nextStock = Number(newStockInput.value);
      diffStrong.textContent = Number.isFinite(nextStock)
        ? formatSignedInteger(nextStock - currentStock)
        : "-";
    }
    return;
  }
  const reasonInput = event.target.closest("[data-stock-adjustment-reason]");
  if (reasonInput) {
    const key = String(reasonInput.dataset.stockAdjustmentReason || "").trim();
    if (!key || stockAdjustmentState.openKey !== key) return;
    stockAdjustmentState.reason = reasonInput.value;
  }
});

finishedStockList?.addEventListener("click", async (event) => {
  const openBtn = event.target.closest("[data-open-stock-adjustment]");
  if (openBtn) {
    const key = String(openBtn.dataset.openStockAdjustment || "").trim();
    const rows = computeFinishedStockTotals().rows;
    const row = rows.find((item) => item.key === key);
    if (!key || !row) return;
    const currentStock = Number.isFinite(Number(row.stockDisplays))
      ? Number(row.stockDisplays)
      : 0;
    stockAdjustmentState.openKey = key;
    stockAdjustmentState.newStock = String(Math.max(0, Math.round(currentStock)));
    stockAdjustmentState.reason = "";
    refreshFinishedStock();
    requestAnimationFrame(() => {
      refreshCollapseHeights();
    });
    return;
  }

  const cancelBtn = event.target.closest("[data-cancel-stock-adjustment]");
  if (cancelBtn) {
    stockAdjustmentState.openKey = "";
    stockAdjustmentState.newStock = "";
    stockAdjustmentState.reason = "";
    refreshFinishedStock();
    requestAnimationFrame(() => {
      refreshCollapseHeights();
    });
    return;
  }

  const saveBtn = event.target.closest("[data-save-stock-adjustment]");
  if (!saveBtn) return;
  const key = String(saveBtn.dataset.saveStockAdjustment || "").trim();
  if (!key || stockAdjustmentState.openKey !== key) return;
  const rows = computeFinishedStockTotals().rows;
  const row = rows.find((item) => item.key === key);
  if (!row) return;

  const newStockRaw = Number(stockAdjustmentState.newStock);
  if (!Number.isFinite(newStockRaw) || newStockRaw < 0) {
    window.alert("Ingresa un nuevo stock valido (0 o mayor).");
    return;
  }
  const reason = String(stockAdjustmentState.reason || "").trim();
  if (!reason) {
    window.alert("El motivo del ajuste es obligatorio.");
    return;
  }
  const previousStock = Number.isFinite(Number(row.stockDisplays))
    ? Number(row.stockDisplays)
    : 0;
  const newStock = Math.round(newStockRaw);
  const difference = newStock - previousStock;
  if (difference === 0) {
    window.alert("El nuevo stock es igual al stock actual. No hay ajuste para guardar.");
    return;
  }
  const user = auth.currentUser;
  const now = new Date();
  const payload = {
    date: toDateInputValue(now),
    productId: row.productId || "",
    productName: row.name || "Producto",
    productKey: row.key,
    previousStock,
    newStock,
    difference,
    reason,
    userId: user?.uid || "",
    userEmail: user?.email || "",
    userName: user?.displayName || "",
    createdAt: serverTimestamp(),
    createdAtMs: now.getTime()
  };
  try {
    await addDoc(collection(db, "finished_stock_adjustments"), payload);
    stockAdjustmentState.openKey = "";
    stockAdjustmentState.newStock = "";
    stockAdjustmentState.reason = "";
    refreshFinishedStock();
    requestAnimationFrame(() => {
      refreshCollapseHeights();
    });
  } catch (error) {
    console.error("No se pudo guardar ajuste manual de stock:", error);
    window.alert("No se pudo guardar el ajuste manual. Intenta nuevamente.");
  }
});

clientList.addEventListener("click", async (event) => {
  const toggleHistoryId = event.target.closest("[data-toggle-client-history]")?.dataset.toggleClientHistory;
  if (toggleHistoryId) {
    const safeId = String(toggleHistoryId).trim();
    if (!safeId) return;
    if (clientHistoryOpenState.has(safeId)) {
      clientHistoryOpenState.delete(safeId);
    } else {
      clientHistoryOpenState.add(safeId);
    }
    renderAll();
    return;
  }
  const editId = event.target.dataset.editClient;
  const deleteId = event.target.dataset.deleteClient;
  if (editId) {
    const item = state.clients.find((m) => m.id === editId);
    if (item) startEditClient(item);
  }
  if (deleteId && confirmDelete("cliente")) {
    await deleteDoc(doc(db, "clients", deleteId));
  }
});

saleList.addEventListener("click", async (event) => {
  const shareId = event.target.closest("[data-share-sale]")?.dataset.shareSale;
  const editId = event.target.closest("[data-edit-sale]")?.dataset.editSale;
  const deleteId = event.target.closest("[data-delete-sale]")?.dataset.deleteSale;
  if (shareId) {
    const item = state.sales.find((m) => m.id === shareId);
    if (item) await shareSaleAsPdf(item);
  }
  if (editId) {
    const item = state.sales.find((m) => m.id === editId);
    if (item) startEditSale(item);
  }
  if (deleteId && confirmDelete("venta")) {
    await deleteDoc(doc(db, "sales", deleteId));
  }
});

const updateClientNotesFromRepurchase = async (clientId, notesValue) => {
  const safeClientId = String(clientId || "").trim();
  if (!safeClientId) return false;
  const client = state.clients.find((item) => item.id === safeClientId);
  if (!client) return false;
  await updateDoc(doc(db, "clients", safeClientId), {
    notes: String(notesValue || "").trim(),
    updatedAt: serverTimestamp()
  });
  return true;
};

const updateClientFollowupFromRepurchase = async (clientId, fields = {}) => {
  const safeClientId = String(clientId || "").trim();
  if (!safeClientId) return false;
  const client = state.clients.find((item) => item.id === safeClientId);
  if (!client) return false;
  const current = getClientFollowupData(client);
  const user = auth.currentUser;
  const resolvedLastContactDate = normalizeDateValue(fields.lastContactDate ?? current.lastContactDate)
    || toDateInputValue(new Date())
    || "";
  const resolvedResult = normalizeRepurchaseContactResult(fields.result ?? current.result);
  const resolvedObservation = String((fields.observation ?? current.observation ?? "")).trim();
  const resolvedNextActionDate = normalizeDateValue(fields.nextActionDate ?? current.nextActionDate) || "";
  const nextFollowup = {
    lastContactDate: resolvedLastContactDate,
    result: resolvedResult,
    nextActionDate: resolvedNextActionDate,
    observation: resolvedObservation
  };
  const historyEntry = {
    date: resolvedLastContactDate,
    result: resolvedResult,
    observation: resolvedObservation,
    nextActionDate: resolvedNextActionDate,
    userName: String(user?.displayName || "").trim(),
    userEmail: String(user?.email || "").trim(),
    createdAtMs: Date.now()
  };
  await updateDoc(doc(db, "clients", safeClientId), {
    followUp: nextFollowup,
    followUpHistory: arrayUnion(historyEntry),
    updatedAt: serverTimestamp()
  });
  return true;
};

repurchaseList?.addEventListener("click", async (event) => {
  const whatsappBtn = event.target.closest("[data-whatsapp-link]");
  if (whatsappBtn) {
    const link = String(whatsappBtn.dataset.whatsappLink || "").trim();
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
    return;
  }

  const toggleNotesBtn = event.target.closest("[data-toggle-repurchase-notes]");
  if (toggleNotesBtn) {
    const clientId = String(toggleNotesBtn.dataset.toggleRepurchaseNotes || "").trim();
    if (!clientId) return;
    if (repurchaseNotesOpenState.has(clientId)) {
      repurchaseNotesOpenState.delete(clientId);
    } else {
      repurchaseNotesOpenState.add(clientId);
    }
    renderRepurchaseList();
    requestAnimationFrame(() => {
      refreshCollapseHeights();
    });
    return;
  }

  const saveNotesBtn = event.target.closest("[data-save-repurchase-notes]");
  if (saveNotesBtn) {
    const clientId = String(saveNotesBtn.dataset.saveRepurchaseNotes || "").trim();
    if (!clientId) return;
    const card = saveNotesBtn.closest(".repurchase-item");
    const notesInput = card?.querySelector("[data-repurchase-notes-input]");
    const notesValue = String(notesInput?.value || "").trim();
    try {
      await updateClientNotesFromRepurchase(clientId, notesValue);
      repurchaseNotesOpenState.add(clientId);
      renderRepurchaseList();
      requestAnimationFrame(() => {
        refreshCollapseHeights();
      });
    } catch (error) {
      console.error("No se pudo guardar notas de recompra:", error);
    }
    return;
  }

  const toggleHistoryBtn = event.target.closest("[data-toggle-repurchase-history]");
  if (toggleHistoryBtn) {
    const clientId = String(toggleHistoryBtn.dataset.toggleRepurchaseHistory || "").trim();
    if (!clientId) return;
    if (repurchaseHistoryOpenState.has(clientId)) {
      repurchaseHistoryOpenState.delete(clientId);
    } else {
      repurchaseHistoryOpenState.add(clientId);
    }
    renderRepurchaseList();
    requestAnimationFrame(() => {
      refreshCollapseHeights();
    });
    return;
  }

  const saveFollowupBtn = event.target.closest("[data-save-repurchase-followup]");
  if (!saveFollowupBtn) return;
  const clientId = String(saveFollowupBtn.dataset.saveRepurchaseFollowup || "").trim();
  if (!clientId) return;
  const card = saveFollowupBtn.closest(".repurchase-item");
  const lastContactInput = card?.querySelector("[data-repurchase-last-contact]");
  const resultInput = card?.querySelector("[data-repurchase-contact-result]");
  const nextActionInput = card?.querySelector("[data-repurchase-next-action]");
  const observationInput = card?.querySelector("[data-repurchase-followup-observation]");
  try {
    await updateClientFollowupFromRepurchase(clientId, {
      lastContactDate: String(lastContactInput?.value || "").trim(),
      result: String(resultInput?.value || "").trim(),
      nextActionDate: String(nextActionInput?.value || "").trim(),
      observation: String(observationInput?.value || "").trim()
    });
    renderRepurchaseList();
    requestAnimationFrame(() => {
      refreshCollapseHeights();
    });
  } catch (error) {
    console.error("No se pudo guardar seguimiento de recompra:", error);
  }
});

const selectCommercialHistoryClient = (clientId) => {
  const safeId = String(clientId || "").trim();
  commercialHistoryState.selectedClientId = safeId;
  if (historyClientFilter) historyClientFilter.value = safeId;
  const selectedClient = state.clients.find((client) => client.id === safeId);
  if (selectedClient && historyCustomerSearch) {
    historyCustomerSearch.value = selectedClient.name || "";
    commercialHistoryState.searchTerm = selectedClient.name || "";
  }
  renderCommercialHistory();
  requestAnimationFrame(() => {
    refreshCollapseHeights();
  });
};

const initializeCommercialHistory = () => {
  if (!historyFilters) return;
  const { startDate, endDate } = getCommercialHistoryDefaultDateRange();
  if (historyDateFrom) historyDateFrom.value = startDate;
  if (historyDateTo) historyDateTo.value = endDate;
  updateSelect(historyClientFilter, state.clients, "Todos");
  refreshCommercialHistoryPaymentOptions();
  refreshCommercialHistoryProductOptions();
  updateCommercialHistoryProductModeVisibility();
  renderCommercialHistory();
};

historyResetFiltersBtn?.addEventListener("click", () => {
  resetCommercialHistoryFilters();
});

historyCustomerSearch?.addEventListener("input", () => {
  commercialHistoryState.searchTerm = historyCustomerSearch.value || "";
  renderCommercialHistory();
  requestAnimationFrame(() => {
    refreshCollapseHeights();
  });
});

historyFilters?.addEventListener("input", () => {
  commercialHistoryState.selectedClientId = String(historyClientFilter?.value || "").trim();
  const selectedClient = state.clients.find((client) => client.id === commercialHistoryState.selectedClientId);
  if (selectedClient && historyCustomerSearch) {
    historyCustomerSearch.value = selectedClient.name || "";
    commercialHistoryState.searchTerm = selectedClient.name || "";
  }
  updateCommercialHistoryProductModeVisibility();
  renderCommercialHistory();
  requestAnimationFrame(() => {
    refreshCollapseHeights();
  });
});

historyFilters?.addEventListener("change", () => {
  commercialHistoryState.selectedClientId = String(historyClientFilter?.value || "").trim();
  const selectedClient = state.clients.find((client) => client.id === commercialHistoryState.selectedClientId);
  if (selectedClient && historyCustomerSearch) {
    historyCustomerSearch.value = selectedClient.name || "";
    commercialHistoryState.searchTerm = selectedClient.name || "";
  }
  updateCommercialHistoryProductModeVisibility();
  renderCommercialHistory();
  requestAnimationFrame(() => {
    refreshCollapseHeights();
  });
});

historyCustomerResults?.addEventListener("click", (event) => {
  const selectBtn = event.target.closest("[data-select-history-client]");
  if (!selectBtn) return;
  selectCommercialHistoryClient(selectBtn.dataset.selectHistoryClient);
});

historyPeriodClients?.addEventListener("click", (event) => {
  const selectBtn = event.target.closest("[data-select-history-client]");
  if (!selectBtn) return;
  selectCommercialHistoryClient(selectBtn.dataset.selectHistoryClient);
});

purchaseForm.quantity.addEventListener("input", () => {
  updatePurchaseTotal();
});

purchaseForm.totalCost.addEventListener("input", () => {
  updatePurchaseTotal();
});

purchaseForm.material.addEventListener("change", () => {
  const material = state.rawMaterials.find((item) => item.id === purchaseForm.material.value);
  if (material) {
    setUnitGroupValue("purchaseUnit", material.unit || purchaseForm.purchaseUnit.value);
    updatePurchaseTotal();
  }
});

purchaseForm.purchaseUnit.addEventListener("change", updatePurchaseTotal);
stockRecipeSelect?.addEventListener("change", refreshStockSummary);
saleForm?.client?.addEventListener("change", () => {
  const clientSelect = saleForm.client;
  const shouldAdvanceToProduct = isDesktopSalesKeyboardMode() && clientSelect?.dataset.keyboardAdvanceTo === "product";
  if (shouldAdvanceToProduct && clientSelect.value) {
    moveSalesFocusToFirstProduct();
  }
  clearSalesKeyboardSelectState(clientSelect);
});
saleForm?.client?.addEventListener("blur", () => {
  clearSalesKeyboardSelectState(saleForm.client);
});
saleForm?.addEventListener("keydown", (event) => {
  if (!isDesktopSalesKeyboardMode()) return;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (event.key === "Escape") {
    clearSalesKeyboardSelectState(saleForm?.client);
    const row = target.closest(".sale-item");
    clearSalesKeyboardSelectState(row?.querySelector(".sale-item-product"));
    if (quickClientPanel && !quickClientPanel.classList.contains("hidden")) {
      event.preventDefault();
      if (quickClientNotice) quickClientNotice.textContent = "";
      toggleQuickClient(false);
      focusSaleClientField();
    }
    return;
  }

  const saleClientSelect = saleForm?.querySelector('select[name="client"]');

  if (event.key.toLowerCase() === "n" && saleClientSelect && target === saleClientSelect) {
    event.preventDefault();
    if (quickClientNotice) quickClientNotice.textContent = "";
    toggleQuickClient(true);
    return;
  }

  if (event.key.toLowerCase() === "r" && !isSalesFreeTextField(target)) {
    event.preventDefault();
    focusSaleSubmitField();
    return;
  }

  if (event.key !== "Enter") return;
  if (target.tagName === "TEXTAREA") return;

  const saleDateInput = saleForm?.querySelector('input[name="date"]');

  if (saleDateInput && target === saleDateInput) {
    event.preventDefault();
    saleClientSelect?.focus({ preventScroll: false });
    return;
  }

  if (saleClientSelect && target === saleClientSelect) {
    if (saleClientSelect.dataset.keyboardPickerOpen === "true") return;
    event.preventDefault();
    openSalesKeyboardSelect(saleClientSelect, "product");
    return;
  }

  const row = target.closest(".sale-item");
  if (!row) return;

  if (target.classList.contains("sale-item-product")) {
    if (target.dataset.keyboardPickerOpen === "true") return;
    event.preventDefault();
    openSalesKeyboardSelect(target, "qty");
    return;
  }

  if (target.classList.contains("sale-item-qty")) {
    const productKey = String(row.querySelector(".sale-item-product")?.value || "").trim();
    const quantity = Number(target.value || 0);
    if (!productKey || !Number.isFinite(quantity) || quantity <= 0) return;
    event.preventDefault();
    focusSaleRowPrice(row);
    return;
  }

  if (target.classList.contains("sale-item-price")) {
    event.preventDefault();
    handleSalePriceEnter(row);
    return;
  }
});

stockMaterialsList?.addEventListener("input", (event) => {
  const newStockInput = event.target.closest("[data-raw-material-adjustment-new]");
  if (newStockInput) {
    rawMaterialAdjustmentState.openKey = String(newStockInput.dataset.rawMaterialAdjustmentNew || "").trim();
    rawMaterialAdjustmentState.newStock = newStockInput.value;
    refreshStockSummary();
    return;
  }
  const reasonInput = event.target.closest("[data-raw-material-adjustment-reason]");
  if (reasonInput) {
    rawMaterialAdjustmentState.openKey = String(reasonInput.dataset.rawMaterialAdjustmentReason || "").trim();
    rawMaterialAdjustmentState.reason = reasonInput.value;
  }
});

stockMaterialsList?.addEventListener("click", async (event) => {
  const openBtn = event.target.closest("[data-open-raw-material-adjustment]");
  if (openBtn) {
    const materialId = String(openBtn.dataset.openRawMaterialAdjustment || "").trim();
    if (!materialId) return;
    if (rawMaterialAdjustmentState.openKey === materialId) {
      rawMaterialAdjustmentState.openKey = "";
      rawMaterialAdjustmentState.newStock = "";
      rawMaterialAdjustmentState.reason = "";
    } else {
      const { rows } = computeStockTotals();
      const row = rows.find((item) => item.materialId === materialId);
      rawMaterialAdjustmentState.openKey = materialId;
      rawMaterialAdjustmentState.newStock = row ? String(row.available ?? "") : "";
      rawMaterialAdjustmentState.reason = "";
    }
    refreshStockSummary();
    requestAnimationFrame(() => {
      const targetInput = materialId
        ? stockMaterialsList.querySelector(`[data-raw-material-adjustment-new="${materialId}"]`)
        : null;
      targetInput?.focus();
    });
    return;
  }

  const cancelBtn = event.target.closest("[data-cancel-raw-material-adjustment]");
  if (cancelBtn) {
    rawMaterialAdjustmentState.openKey = "";
    rawMaterialAdjustmentState.newStock = "";
    rawMaterialAdjustmentState.reason = "";
    refreshStockSummary();
    return;
  }

  const saveBtn = event.target.closest("[data-save-raw-material-adjustment]");
  if (!saveBtn) return;
  const materialId = String(saveBtn.dataset.saveRawMaterialAdjustment || "").trim();
  if (!materialId) return;
  const { rows } = computeStockTotals();
  const row = rows.find((item) => item.materialId === materialId);
  if (!row) {
    window.alert("No se encontro la materia prima a ajustar.");
    return;
  }
  const newStockRaw = Number(rawMaterialAdjustmentState.newStock);
  const reason = String(rawMaterialAdjustmentState.reason || "").trim();
  if (!Number.isFinite(newStockRaw) || newStockRaw < 0) {
    window.alert("Ingresa un nuevo stock valido.");
    return;
  }
  if (!reason) {
    window.alert("El motivo del ajuste es obligatorio.");
    return;
  }
  const previousStock = Number.isFinite(Number(row.available)) ? Number(row.available) : 0;
  const newStock = Number(newStockRaw);
  const difference = newStock - previousStock;
  if (Math.abs(difference) < 1e-9) {
    window.alert("El nuevo stock es igual al stock actual. No hay ajuste para guardar.");
    return;
  }
  const user = auth.currentUser;
  const now = new Date();
  const payload = {
    date: toDateInputValue(now),
    materialId: row.materialId,
    materialName: row.name || "Materia prima",
    unit: row.unit || "",
    previousStock,
    newStock,
    difference,
    reason,
    userId: user?.uid || "",
    userEmail: user?.email || "",
    userName: user?.displayName || "",
    createdAt: serverTimestamp(),
    createdAtMs: now.getTime()
  };
  try {
    await addDoc(collection(db, "raw_material_adjustments"), payload);
    rawMaterialAdjustmentState.openKey = "";
    rawMaterialAdjustmentState.newStock = "";
    rawMaterialAdjustmentState.reason = "";
    refreshStockSummary();
    requestAnimationFrame(() => {
      refreshCollapseHeights();
    });
  } catch (error) {
    console.error("No se pudo guardar ajuste manual de materia prima:", error);
    window.alert("No se pudo guardar el ajuste manual. Intenta nuevamente.");
  }
});

recipeForm.material.addEventListener("change", updateRecipeIngredientFields);
recipeForm.yieldQuantity.addEventListener("input", renderRecipeDraft);
recipeForm.boxCost.addEventListener("input", renderRecipeDraft);
recipeForm.wrapCost.addEventListener("input", renderRecipeDraft);
recipeForm.wrapCount.addEventListener("input", renderRecipeDraft);

batchForm.recipe.addEventListener("change", () => {
  const recipe = state.recipes.find((item) => item.id === batchForm.recipe.value);
  const unitGroup = document.querySelector('.unit-group[data-target="batchUnit"]');
  if (recipe) {
    setUnitGroupValue("batchUnit", recipe.yieldUnit || "");
    if (unitGroup) unitGroup.classList.add("locked");
    updateBatchProductFromRecipe();
    if (batchRecipeNotice) batchRecipeNotice.textContent = "";
  } else {
    setUnitGroupValue("batchUnit", "");
    if (unitGroup) unitGroup.classList.remove("locked");
    if (batchProductInfo) batchProductInfo.textContent = "";
  }
  updateBatchCostPreview();
});

if (batchProductSelect?.tagName === "SELECT") {
  batchProductSelect.addEventListener("change", () => {
    updateBatchRecipeFromProduct();
  });
}

batchForm.quantity.addEventListener("input", updateBatchCostPreview);

saleCreditToggle?.addEventListener("click", () => {
  const nextState = !Boolean(saleCreditCheckbox?.checked);
  updateDueDateVisibility(nextState);
  if (nextState && saleForm?.dueDate) {
    saleForm.dueDate.focus();
  }
});
saleObservationToggle?.addEventListener("click", () => {
  const nextState = !saleObservationField?.classList.contains("open");
  updateSaleObservationVisibility(nextState);
  if (nextState && saleForm?.observation) {
    saleForm.observation.focus();
  }
});

saleRepurchaseToggle?.addEventListener("click", () => {
  updateSaleRepurchaseVisibility();
});

addSaleItemBtn?.addEventListener("click", () => {
  createSaleItemRow();
  refreshSaleProductOptions();
  requestAnimationFrame(refreshCollapseHeights);
});

saleItems?.addEventListener("click", (event) => {
  const removeBtn = event.target.closest(".sale-item-remove");
  if (!removeBtn) return;
  const row = removeBtn.closest(".sale-item");
  if (row) row.remove();
  if (!saleItems.querySelector(".sale-item")) {
    createSaleItemRow();
  }
  refreshSaleProductOptions();
  requestAnimationFrame(refreshCollapseHeights);
});

[
  { input: clientForm?.rucMain, max: 12 },
  { input: clientForm?.rucDv, max: 3 },
  { input: quickClientRucMain, max: 12 },
  { input: quickClientRucDv, max: 3 },
  { input: clientForm?.phone, max: 9 },
  { input: quickClientPhone, max: 9 }
].forEach(({ input, max }) => {
  if (!input) return;
  input.addEventListener("input", () => {
    input.value = digitsOnly(input.value).slice(0, max);
  });
});

[clientForm?.name, quickClientName].forEach((input) => {
  if (!input) return;
  input.addEventListener("blur", () => {
    input.value = formatClientName(input.value);
  });
});

setupTabs();
setupDashboardResizeObserver();
setDefaultDates();
initializeCommercialHistory();
updateDueDateVisibility();
updateSaleObservationVisibility(false);
updateSaleRepurchaseVisibility(false);
renderRecipeDraft();
updateRecipeIngredientFields();
updateBatchCostPreview();
resetSaleItems();
unitGroups.forEach((group) => {
  const input = document.getElementById(group.dataset.target);
  if (input && input.value) {
    setUnitGroupValue(group.dataset.target, input.value);
  }
});

const setCollapseMax = (body) => {
  if (!body) return;
  body.style.setProperty("--collapse-max", `${body.scrollHeight}px`);
};

const focusFirstSaleProductField = () => {
  moveSalesFocusToFirstProduct();
};

const syncExpandableCardState = (body, isOpen) => {
  const card = body?.closest(".desktop-expandable-card");
  if (!card) return;
  card.classList.toggle("is-expanded", Boolean(isOpen));
};

const openSection = (toggle, body) => {
  setCollapseMax(body);
  body.classList.add("open");
  toggle.classList.add("open");
  toggle.setAttribute("aria-expanded", "true");
  syncExpandableCardState(body, true);
};

const closeSection = (toggle, body) => {
  body.classList.remove("open");
  toggle.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
  syncExpandableCardState(body, false);
};

const openExclusiveCollapseSection = (sectionId) => {
  let activeBody = null;
  document.querySelectorAll(".collapse-toggle[data-collapse]").forEach((toggle) => {
    const body = document.getElementById(toggle.dataset.collapse);
    if (!body) return;
    if (toggle.dataset.collapse === sectionId) {
      openSection(toggle, body);
      activeBody = body;
      return;
    }
    closeSection(toggle, body);
  });
  if (sectionId === "coverageSection" && activeBody?.classList.contains("open")) {
    renderSalesCoverage({ animatePins: true });
  }
  requestAnimationFrame(() => {
    refreshCollapseHeights();
  });
  return activeBody;
};

document.querySelectorAll(".collapse-toggle[data-collapse]").forEach((toggle) => {
  const body = document.getElementById(toggle.dataset.collapse);
  if (!body) return;
  if (["salesGoalSection", "productsSection", "clientsSection", "salesSection", "repurchaseSection", "coverageSection"].includes(toggle.dataset.collapse)) {
    closeSection(toggle, body);
  } else {
    openSection(toggle, body);
  }
});

document.addEventListener("click", (event) => {
  const toggle = event.target.closest(".collapse-toggle[data-collapse]");
  if (!toggle) return;
  const body = document.getElementById(toggle.dataset.collapse);
  if (!body) return;
  document.querySelectorAll(".collapse-toggle[data-collapse]").forEach((otherToggle) => {
    const otherBody = document.getElementById(otherToggle.dataset.collapse);
    if (!otherBody) return;
    if (otherToggle !== toggle) {
      closeSection(otherToggle, otherBody);
    }
  });
  if (body.classList.contains("open")) {
    closeSection(toggle, body);
  } else {
    openSection(toggle, body);
  }
  if (toggle.dataset.collapse === "coverageSection" && body.classList.contains("open")) {
    renderSalesCoverage({ animatePins: true });
  }
  if (toggle.dataset.collapse === "salesSection" && body.classList.contains("open")) {
    focusFirstSaleProductField();
  }
  requestAnimationFrame(() => {
    refreshCollapseHeights();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "F2") return;
  if (!isDesktopSalesKeyboardMode()) return;
  if (dashboardSection?.classList.contains("hidden")) return;
  event.preventDefault();
  setActiveTab("sales");
  openExclusiveCollapseSection("salesSection");
  requestAnimationFrame(() => {
    focusSaleClientField();
  });
});

const refreshCollapseHeights = () => {
  document.querySelectorAll(".collapse-body.open").forEach((body) => {
    setCollapseMax(body);
  });
  const currentTab = document.querySelector(".tab.active")?.dataset.tab || "production";
  syncDashboardSlideHeights(currentTab);
};

window.addEventListener("resize", () => {
  refreshCollapseHeights();
});

requestAnimationFrame(() => {
  refreshCollapseHeights();
});

onAuthStateChanged(auth, (user) => {
  console.log("[auth] state changed", user ? user.uid : "signed-out");
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers = [];
  if (!user) {
    showAuth();
    return;
  }
  setAuthFeedback("");
  showDashboard(user);
  listenCollection("raw_materials", "rawMaterials", user.uid);
  listenCollection("raw_purchases", "purchases", user.uid);
  listenCollection("recipes", "recipes", user.uid);
  listenCollection("batches", "batches", user.uid);
  listenCollection("products", "products", user.uid);
  listenCollection("clients", "clients", user.uid);
  listenCollection("sales", "sales", user.uid);
  listenCollection("sales_goals", "salesGoals", user.uid);
  listenCollection("finished_stock_adjustments", "finishedStockAdjustments", user.uid);
  listenCollection("raw_material_adjustments", "rawMaterialAdjustments", user.uid);
}, (error) => {
  console.error("[auth] observer error", error);
  setAuthFeedback(getAuthMessage(error), "error");
});


