import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  buildDuplicateMatches,
  formatDuplicateDistance,
  normalizeDuplicatePhone
} from "./duplicate-detection.mjs";
import {
  IMPORT_MAX_RECORDS,
  IMPORT_SCHEMA_TEMPLATE,
  IMPORT_SOURCE_LABEL,
  buildImportSummary,
  canImportRow,
  detectImportedFileDuplicates,
  enrichImportedRowsWithDuplicates,
  getImportedRowStateCodes,
  normalizeImportedProspectFile,
  titleCaseImport
} from "./prospect-import.mjs";

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
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const logoutBtn = document.getElementById("logoutBtn");

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".tab-panel");
const TAB_IDS = Array.from(tabs).map((tab) => tab.dataset.tab).filter(Boolean);
const appShell = document.querySelector(".app-shell");
const appSidebar = document.getElementById("appSidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarCollapseBtn = document.getElementById("sidebarCollapseBtn");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const SIDEBAR_COLLAPSED_KEY = "gg_sidebar_collapsed";
const sidebarLinks = document.querySelectorAll(".sidebar-link[data-app-section]");
const APP_SECTION_CONFIG = {
  dashboard: { tab: "production", collapses: [], label: "Panel de control" },
  sales: { tab: "sales", collapses: ["salesFormSection", "salesHistorySection", "salesGoalSection", "coverageSection"], label: "Ventas" },
  clients: { tab: "sales", collapses: ["clientFormSection", "clientListSection"], label: "Clientes" },
  prospects: { tab: "sales", collapses: ["prospectsSection"], label: "Prospectos" },
  repurchase: { tab: "sales", collapses: ["repurchaseSection"], label: "Recompra de clientes" },
  map: { tab: "sales", collapses: [], label: "Mapa comercial" },
  journeys: { tab: "sales", collapses: [], label: "Jornadas de visitas" },
  production: { tab: "production", collapses: ["prodToday"], label: "Produccion" },
  products: { tab: "production", collapses: ["recipeSection"], label: "Productos" },
  "raw-materials": { tab: "production", collapses: ["rawMaterialSection", "recipeSection"], label: "Materias primas" },
  stock: { tab: "production", collapses: ["finishedStockSection", "stockSummarySection", "stockSection"], label: "Stock" },
  reports: { tab: "commercial-history", collapses: [], label: "Reportes" },
  settings: { tab: "finance", collapses: ["salesGoalSection", "coverageSection", "financeMovementSection", "financeExpenseSection", "financeReceivablesSection", "financeCategorySection"], label: "Configuracion" }
};
let activeAppSection = "dashboard";

const rawMaterialForm = document.getElementById("rawMaterialForm");
const rawMaterialFormPanel = document.getElementById("rawMaterialFormPanel");
const newRawMaterialBtn = document.getElementById("newRawMaterialBtn");
const cancelRawMaterialForm = document.getElementById("cancelRawMaterialForm");
const openStockEntryBtn = document.getElementById("openStockEntryBtn");
const rawMaterialSummary = document.getElementById("rawMaterialSummary");
const rawMaterialSearch = document.getElementById("rawMaterialSearch");
const rawMaterialCategoryFilter = document.getElementById("rawMaterialCategoryFilter");
const rawMaterialStatusFilter = document.getElementById("rawMaterialStatusFilter");
const rawMaterialUnitFilter = document.getElementById("rawMaterialUnitFilter");
const purchaseForm = document.getElementById("purchaseForm");
const recipeForm = document.getElementById("recipeForm");
const recipeProductSelect = document.getElementById("recipeProductSelect");
const recalculateRecipeCostsBtn = document.getElementById("recalculateRecipeCostsBtn");
const recipeRecalculateNotice = document.getElementById("recipeRecalculateNotice");
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
const financeMetricRevenue = document.getElementById("financeMetricRevenue");
const financeMetricExpenses = document.getElementById("financeMetricExpenses");
const financeMetricEstimatedProfit = document.getElementById("financeMetricEstimatedProfit");
const financeMetricNet = document.getElementById("financeMetricNet");
const financeMetricRevenueSub = document.getElementById("financeMetricRevenueSub");
const financeMetricExpensesSub = document.getElementById("financeMetricExpensesSub");
const financeMetricEstimatedProfitSub = document.getElementById("financeMetricEstimatedProfitSub");
const financeMetricNetSub = document.getElementById("financeMetricNetSub");
const productForm = document.getElementById("productForm");
const clientForm = document.getElementById("clientForm");
const prospectForm = document.getElementById("prospectForm");
const prospectCancelEdit = document.getElementById("prospectCancelEdit");
const prospectCancelForm = document.getElementById("prospectCancelForm");
const prospectCloseForm = document.getElementById("prospectCloseForm");
const saleForm = document.getElementById("saleForm");
const saleSubmitButton = saleForm?.querySelector('button[type="submit"]');
const saleCreditCheckbox = document.getElementById("saleCredit");
const saleCreditToggle = document.getElementById("saleCreditToggle");
const saleItems = document.getElementById("saleItems");
const saleGrandTotal = document.getElementById("saleGrandTotal");
const addSaleItemBtn = document.getElementById("addSaleItemBtn");
const salesGoalForm = document.getElementById("salesGoalForm");
const salesGoalNotice = document.getElementById("salesGoalNotice");
const financeExpenseForm = document.getElementById("financeExpenseForm");
const financeExpenseNotice = document.getElementById("financeExpenseNotice");
const financeInitialToggle = document.getElementById("financeInitialToggle");
const financeInitialPanel = document.getElementById("financeInitialPanel");
const financeInitialForm = document.getElementById("financeInitialForm");
const financeInitialNotice = document.getElementById("financeInitialNotice");
const financeInitialHistory = document.getElementById("financeInitialHistory");
const financeManualAdjustmentToggle = document.getElementById("financeManualAdjustmentToggle");
const financeManualAdjustmentPanel = document.getElementById("financeManualAdjustmentPanel");
const financeManualAdjustmentForm = document.getElementById("financeManualAdjustmentForm");
const financeManualAdjustmentNotice = document.getElementById("financeManualAdjustmentNotice");
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
const clientListCount = document.getElementById("clientListCount");
const clientListSearch = document.getElementById("clientListSearch");
const clientListClearFilters = document.getElementById("clientListClearFilters");
const prospectList = document.getElementById("prospectList");
const prospectSearch = document.getElementById("prospectSearch");
const prospectCityFilter = document.getElementById("prospectCityFilter");
const prospectZoneFilter = document.getElementById("prospectZoneFilter");
const prospectBusinessFilter = document.getElementById("prospectBusinessFilter");
const prospectStatusFilter = document.getElementById("prospectStatusFilter");
const prospectPotentialFilter = document.getElementById("prospectPotentialFilter");
const visitClientSearch = document.getElementById("visitClientSearch");
const visitClientList = document.getElementById("visitClientList");
const visitList = document.getElementById("visitList");
const createVisitListBtn = document.getElementById("createVisitListBtn");
const openVisitRouteBtn = document.getElementById("openVisitRouteBtn");
const prospectLocationFilter = document.getElementById("prospectLocationFilter");
const prospectIndicators = document.getElementById("prospectIndicators");
const prospectSelectAll = document.getElementById("prospectSelectAll");
const clearProspectFiltersBtn = document.getElementById("clearProspectFilters");
const newProspectBtn = document.getElementById("newProspectBtn");
const importProspectsBtn = document.getElementById("importProspectsBtn");
const exportProspectsBtn = document.getElementById("exportProspectsBtn");
const prospectImportHistory = document.getElementById("prospectImportHistory");
const prospectBulkbar = document.getElementById("prospectBulkbar");
const prospectSelectedCount = document.getElementById("prospectSelectedCount");
const prospectBulkVisitBtn = document.getElementById("prospectBulkVisit");
const prospectClearSelectionBtn = document.getElementById("prospectClearSelection");
const visitClientsToggle = document.getElementById("visitClientsToggle");
const visitClientsBody = document.getElementById("visitClientsBody");
const visitClientsCount = document.getElementById("visitClientsCount");
const prospectFormHeading = document.getElementById("prospectFormHeading");
const saleList = document.getElementById("saleList");
const salesHistoryCount = document.getElementById("salesHistoryCount");
const salesHistoryTotal = document.getElementById("salesHistoryTotal");
const salesHistoryPeriodSelector = document.getElementById("salesHistoryPeriodSelector");
const salesHistoryRangePanel = document.getElementById("salesHistoryRangePanel");
const salesHistoryRangeFrom = document.getElementById("salesHistoryRangeFrom");
const salesHistoryRangeTo = document.getElementById("salesHistoryRangeTo");
const salesHistoryRangeApply = document.getElementById("salesHistoryRangeApply");
const salesHistoryRangeClear = document.getElementById("salesHistoryRangeClear");
const salesHistoryRangeCancel = document.getElementById("salesHistoryRangeCancel");
const salesHistoryRangeError = document.getElementById("salesHistoryRangeError");
const salesHistoryPeriodLabel = document.getElementById("salesHistoryPeriodLabel");
const salesHistorySearch = document.getElementById("salesHistorySearch");
const salesHistoryPaymentFilter = document.getElementById("salesHistoryPaymentFilter");
const salesHistoryCreditFilter = document.getElementById("salesHistoryCreditFilter");
const salesHistoryClearFilters = document.getElementById("salesHistoryClearFilters");
const commercialRangePanel = document.getElementById("commercialRangePanel");
const commercialRangeFrom = document.getElementById("commercialRangeFrom");
const commercialRangeTo = document.getElementById("commercialRangeTo");
const commercialRangeApply = document.getElementById("commercialRangeApply");
const commercialRangeClear = document.getElementById("commercialRangeClear");
const commercialRangeCancel = document.getElementById("commercialRangeCancel");
const commercialRangeError = document.getElementById("commercialRangeError");
const commercialPeriodLabel = document.getElementById("commercialPeriodLabel");
const mapAddProspectBtn = document.getElementById("mapAddProspectBtn");
const mapImportProspectsBtn = document.getElementById("mapImportProspectsBtn");
const mapQuickModePanel = document.getElementById("mapQuickModePanel");
const mapQuickModeText = document.getElementById("mapQuickModeText");
const mapQuickSessionCount = document.getElementById("mapQuickSessionCount");
const mapQuickCancelSelection = document.getElementById("mapQuickCancelSelection");
const mapQuickFinish = document.getElementById("mapQuickFinish");
const mapQuickToast = document.getElementById("mapQuickToast");
const mapProspectDrawer = document.getElementById("mapProspectDrawer");
const mapProspectForm = document.getElementById("mapProspectForm");
const mapProspectNotice = document.getElementById("mapProspectNotice");
const mapDuplicateWarning = document.getElementById("mapDuplicateWarning");
const mapProspectClose = document.getElementById("mapProspectClose");
const mapProspectCancel = document.getElementById("mapProspectCancel");
const mapProspectChangeLocation = document.getElementById("mapProspectChangeLocation");
const repurchaseList = document.getElementById("repurchaseList");
const repurchaseSummary = document.getElementById("repurchaseSummary");
const salesCoverageSection = document.getElementById("coverageSection");
const salesCoveragePins = document.getElementById("salesCoveragePins");
const salesCoverageSummary = document.getElementById("salesCoverageSummary");
const salesCoverageCities = document.getElementById("salesCoverageCities");
const financeMovementList = document.getElementById("financeMovementList");
const financeReceivablesList = document.getElementById("financeReceivablesList");
const financeCategorySummaryList = document.getElementById("financeCategorySummaryList");
const financeActiveSummary = document.getElementById("financeActiveSummary");
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

const prospectImportModal = document.getElementById("prospectImportModal");
const prospectImportClose = document.getElementById("prospectImportClose");
const prospectImportCancel = document.getElementById("prospectImportCancel");
const prospectImportFile = document.getElementById("prospectImportFile");
const prospectImportChoose = document.getElementById("prospectImportChoose");
const prospectImportTemplate = document.getElementById("prospectImportTemplate");
const prospectImportDropzone = document.getElementById("prospectImportDropzone");
const prospectImportFileMeta = document.getElementById("prospectImportFileMeta");
const prospectImportError = document.getElementById("prospectImportError");
const prospectImportFormat = document.getElementById("prospectImportFormat");
const prospectImportReview = document.getElementById("prospectImportReview");
const prospectImportRows = document.getElementById("prospectImportRows");
const prospectImportSummary = document.getElementById("prospectImportSummary");
const prospectImportConfirm = document.getElementById("prospectImportConfirm");
const prospectImportResult = document.getElementById("prospectImportResult");
const prospectImportProgress = document.getElementById("prospectImportProgress");
const prospectImportPrimary = document.getElementById("prospectImportPrimary");
const prospectImportConfirmBack = document.getElementById("prospectImportConfirmBack");
const prospectImportTableTab = document.getElementById("prospectImportTableTab");
const prospectImportMapTab = document.getElementById("prospectImportMapTab");
const prospectImportTableWrap = document.getElementById("prospectImportTableWrap");
const prospectImportMapPanel = document.getElementById("prospectImportMapPanel");
const prospectImportFitMap = document.getElementById("prospectImportFitMap");
const prospectImportBackTable = document.getElementById("prospectImportBackTable");
const prospectImportBulkRubro = document.getElementById("prospectImportBulkRubro");
const prospectImportBulkPotential = document.getElementById("prospectImportBulkPotential");
const prospectImportSelectAll = document.getElementById("prospectImportSelectAll");
const prospectImportExcludeSelected = document.getElementById("prospectImportExcludeSelected");
const prospectImportSteps = document.getElementById("prospectImportSteps");

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
  prospects: [],
  sales: [],
  salesGoals: [],
  financialExpenses: [],
  financialInitialSettings: [],
  financialManualAdjustments: [],
  finishedStockAdjustments: [],
  rawMaterialAdjustments: [],
  businessTypes: [],
  prospectImportSessions: []
};

let unsubscribers = [];
const recipeDraft = {
  ingredients: []
};
const commercialHistoryState = {
  searchTerm: "",
  selectedClientId: ""
};
const prospectFiltersState = {
  search: "",
  city: "",
  zone: "",
  businessType: "",
  status: "",
  potential: "",
  location: ""
};
const salesHistoryState = {
  period: "month",
  customStart: "",
  customEnd: "",
  search: "",
  payment: "",
  credit: ""
};
const clientListState = {
  search: ""
};
const saleDetailOpenState = new Set();
const prospectDetailOpenState = new Set();
const visitPlannerState = {
  selectedKeys: new Set(),
  activeKeys: []
};
let prospectImportHistoryOpen = false;
const MAX_ROUTE_STOPS = 10;

// ===== Modulo Jornadas de visitas =====
const MIN_VISIT_STOPS = 2;
const RECOMMENDED_MAX_VISIT_STOPS = 10;
const ABSOLUTE_MAX_VISIT_STOPS = 20;

const JOURNEY_STATUS_LABELS = {
  draft: "Borrador", planned: "Planificada", active: "En curso",
  completed: "Completada", cancelled: "Cancelada"
};
const STOP_STATUS_LABELS = {
  pending: "Pendiente", en_route: "En camino",
  sale: "Venta realizada", visited_no_sale: "Visitado sin venta",
  closed: "Local cerrado", unavailable: "No disponible",
  rescheduled: "Reprogramado", skipped: "Omitido"
};
const STOP_TERMINAL_STATES = new Set(["sale", "visited_no_sale", "closed", "unavailable", "rescheduled", "skipped"]);

const mapJourneySelectState = {
  active: false,
  selectedIds: new Set(),
  drawerOpen: false
};

const journeyCreatorState = {
  selectedEntities: [],
  name: "",
  scheduledDate: "",
  startTime: "",
  origin: null,
  mapOriginPicking: false,
  optimizedOrder: [],
  routePolyline: null,
  totalDistanceMeters: 0,
  estimatedDurationSeconds: 0,
  legs: [],
  orderManuallyEdited: false,
  optimizationMethod: "",
  isApproximate: true,
  saving: false
};

let journeyOriginMarker = null;
let journeyRouteData = null;
let activeJourneyId = null;
let activeJourneyStopsUnsubscribe = null;
let journeyStopsCache = [];
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
const rawMaterialFiltersState = {
  search: "",
  category: "",
  status: "",
  unit: ""
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
// Rubros por defecto (fallback seguro y semilla inicial del catalogo dinamico).
const PROSPECT_BUSINESS_TYPE_OPTIONS = [
  { value: "despensa", label: "Despensa" },
  { value: "supermercado", label: "Supermercado" },
  { value: "farmacia", label: "Farmacia" },
  { value: "confiteria", label: "Confiteria" },
  { value: "mayorista", label: "Mayorista" },
  { value: "distribuidor", label: "Distribuidor" },
  { value: "otro", label: "Otro" }
];

// Clave normalizada para deduplicar rubros ignorando mayusculas, tildes y espacios.
const normalizeRubroKey = (value) => String(value || "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/\s+/g, " ").trim();

const titleCaseRubro = (value) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

const rubroDocId = (key) => String(key || "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

// Catalogo unico de rubros: opciones por defecto + coleccion businessTypes (solo activos).
const getBusinessTypeOptions = () => {
  const map = new Map();
  PROSPECT_BUSINESS_TYPE_OPTIONS.forEach((opt) => map.set(opt.value, { value: opt.value, label: opt.label }));
  (state.businessTypes || []).forEach((rt) => {
    if (rt.isActive === false) return;
    const value = normalizeRubroKey(rt.normalizedName || rt.name);
    if (!value) return;
    map.set(value, { value, label: rt.name || titleCaseRubro(value) });
  });
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "es"));
};

const getBusinessTypeLabel = (value) => {
  const key = normalizeRubroKey(value);
  if (!key) return "Sin definir";
  const found = getBusinessTypeOptions().find((opt) => opt.value === key);
  return found ? found.label : titleCaseRubro(value);
};

// Rellena un <select> de rubros con el catalogo (conservando el valor actual,
// y agregando el historico si no esta en el catalogo para no perderlo).
const fillBusinessTypeSelect = (select, { includeAll = false, currentValue } = {}) => {
  if (!select) return;
  const prev = currentValue !== undefined ? currentValue : select.value;
  const prevKey = normalizeRubroKey(prev);
  const options = getBusinessTypeOptions();
  const firstLabel = includeAll ? "Rubro: todos" : "Seleccionar";
  let html = `<option value="">${firstLabel}</option>`;
  html += options.map((opt) => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join("");
  if (prevKey && !options.some((opt) => opt.value === prevKey)) {
    html += `<option value="${escapeHtml(prevKey)}">${escapeHtml(titleCaseRubro(prev))}</option>`;
  }
  select.innerHTML = html;
  select.value = prevKey || "";
};

const renderBusinessTypeSelectors = () => {
  fillBusinessTypeSelect(prospectForm?.businessType, { includeAll: false });
  fillBusinessTypeSelect(document.getElementById("mapProspectForm")?.businessType, { includeAll: false });
  fillBusinessTypeSelect(document.getElementById("prospectBusinessFilter"), { includeAll: true });
  fillBusinessTypeSelect(document.getElementById("mapBusinessFilter"), { includeAll: true });
};

let businessTypesSeedAttempted = false;
// Siembra los rubros por defecto una sola vez si la coleccion esta vacia.
// Usa ids deterministas para que sea idempotente (sin duplicados).
const maybeSeedBusinessTypes = async (items) => {
  if (businessTypesSeedAttempted) return;
  if (Array.isArray(items) && items.length > 0) { businessTypesSeedAttempted = true; return; }
  businessTypesSeedAttempted = true;
  try {
    await Promise.all(PROSPECT_BUSINESS_TYPE_OPTIONS.map((opt) => {
      const key = normalizeRubroKey(opt.label);
      const ref = doc(collection(db, "businessTypes"), rubroDocId(key));
      return setDoc(ref, {
        name: opt.label,
        normalizedName: key,
        description: "",
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }));
  } catch (error) {
    console.warn("[rubros] no se pudo sembrar el catalogo:", error?.message || error);
    businessTypesSeedAttempted = false;
  }
};
const PROSPECT_STATUS_OPTIONS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "visita_pendiente", label: "Visita pendiente" },
  { value: "visitado", label: "Visitado" },
  { value: "interesado", label: "Interesado" },
  { value: "no_interesado", label: "No interesado" },
  { value: "convertido_cliente", label: "Convertido a cliente" }
];
const PROSPECT_POTENTIAL_OPTIONS = [
  { value: "bajo", label: "Bajo" },
  { value: "medio", label: "Medio" },
  { value: "alto", label: "Alto" }
];
const VISIT_RESULT_OPTIONS = [
  { value: "", label: "Seleccionar" },
  { value: "compro", label: "Compro" },
  { value: "pidio_precio", label: "Pidio precio" },
  { value: "reagendar", label: "Reagendar" },
  { value: "no_interesado", label: "No interesado" },
  { value: "no_estaba_encargado", label: "No estaba el encargado" },
  { value: "otro", label: "Otro" }
];
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
  appShell?.classList.add("auth-mode");
  if (sidebarToggle) sidebarToggle.style.display = "none";
  closeSidebar();
};

const showDashboard = (user) => {
  authSection.style.display = "none";
  dashboardSection.style.display = "block";
  userArea.style.display = "flex";
  userEmail.textContent = user.email || "";
  appShell?.classList.remove("auth-mode");
  if (sidebarToggle) sidebarToggle.style.display = "";
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
  },
  finance: {
    revenue: 0,
    expenses: 0,
    estimatedProfit: 0,
    net: 0
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

const animateFinanceDashboardMetrics = ({ force = false } = {}) => {
  const snapshot = dashboardMetricSnapshot.finance;
  if (financeMetricRevenue) {
    animateMetricNumber(financeMetricRevenue, snapshot.revenue, {
      force,
      formatFrame: (value) => `Gs ${formatGs(value)}`,
      formatFinal: (value) => `Gs ${formatGs(value)}`
    });
  }
  if (financeMetricExpenses) {
    animateMetricNumber(financeMetricExpenses, snapshot.expenses, {
      force,
      formatFrame: (value) => `Gs ${formatGs(value)}`,
      formatFinal: (value) => `Gs ${formatGs(value)}`
    });
  }
  if (financeMetricEstimatedProfit) {
    animateMetricNumber(financeMetricEstimatedProfit, snapshot.estimatedProfit, {
      force,
      formatFrame: (value) => `Gs ${formatGs(value)}`,
      formatFinal: (value) => `Gs ${formatGs(value)}`
    });
  }
  if (financeMetricNet) {
    animateMetricNumber(financeMetricNet, snapshot.net, {
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
  if (tab === "finance") {
    animateFinanceDashboardMetrics({ force });
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

const getAuthFriendlyMessage = (code, error) => {
  if (code === "auth/invalid-email") return "Correo invalido.";
  if (code === "auth/user-not-found") return "No existe una cuenta con ese correo.";
  if (code === "auth/wrong-password") return "Contrasena incorrecta.";
  if (code === "auth/invalid-credential") return "Correo o contrasena incorrectos.";
  if (code === "auth/too-many-requests") return "Demasiados intentos. Espera un momento y vuelve a intentar.";
  if (code === "auth/network-request-failed") return "Sin conexion a internet. Revisa tu red.";
  if (code === "auth/email-already-in-use") return "Ese correo ya esta registrado.";
  if (code === "auth/weak-password") return "La contrasena es demasiado debil (usa al menos 6 caracteres).";
  if (code === "auth/missing-password") return "Falta la contrasena.";
  if (code === "auth/operation-not-allowed") return "El metodo de inicio de sesion esta deshabilitado en Firebase.";
  return error?.message || "No se pudo completar la autenticacion.";
};

// Devuelve el mensaje amigable + el codigo exacto de Firebase, para ver la razon real del fallo.
const getAuthMessage = (error) => {
  const code = String(error?.code || "").trim();
  const friendly = getAuthFriendlyMessage(code, error);
  return code ? `${friendly} [${code}]` : friendly;
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
    return { key: "critico", label: "Critico", tagClass: "status-critical", alertClass: "alert-critical" };
  }
  if (minNum > 0 && availableNum <= minNum) {
    return { key: "critico", label: "Critico", tagClass: "status-critical", alertClass: "alert-critical" };
  }
  if (minNum > 0 && availableNum <= minNum * 1.25) {
    return { key: "bajo", label: "Bajo", tagClass: "status-low", alertClass: "alert-low" };
  }
  return { key: "optimo", label: "Optimo", tagClass: "status-ok", alertClass: "" };
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
    return editId;
  } else {
    const docRef = await addDoc(collection(db, collectionName), payload);
    return docRef.id;
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

const formatIsoDateLabel = (value) => {
  const normalized = normalizeDateValue(value);
  const [year, month, day] = String(normalized || "").split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
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

const getCurrentMonthDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end)
  };
};

const isDateWithinRange = (dateValue, startDate, endDate) => {
  const iso = normalizeDateValue(dateValue);
  if (!iso) return false;
  return (!startDate || iso >= startDate) && (!endDate || iso <= endDate);
};

const getEstimatedDisplayCostForProduct = ({ productId = "", productName = "" } = {}) => {
  const normalizedName = normalizeText(productName);
  const recentBatch = state.batches.find((batch) => {
    if (productId && batch.productId === productId) return true;
    return normalizedName && normalizeText(batch.productName || "") === normalizedName;
  });
  const batchCost = Number(recentBatch?.costPerUnit || 0);
  if (Number.isFinite(batchCost) && batchCost > 0) return batchCost;

  const product = state.products.find((item) => item.id === productId)
    || state.products.find((item) => normalizeText(item.name) === normalizedName);
  const recipe = state.recipes.find((item) => {
    if (product?.id && item.productId === product.id) return true;
    const linkedProduct = findProductForRecipe(item);
    return Boolean(linkedProduct && normalizeText(linkedProduct.name) === normalizeText(product?.name || productName));
  });
  const recipeTotals = recipe ? calculateRecipeCurrentTotals(recipe) : null;
  const recipeDisplayCost = Number(recipeTotals?.totalDisplayCost || recipe?.productCostPerDisplay || recipe?.totalDisplayCost || 0);
  if (Number.isFinite(recipeDisplayCost) && recipeDisplayCost > 0) return recipeDisplayCost;
  return 0;
};

const getSaleEstimatedProfit = (sale) => {
  const estimatedCost = getSaleLineItems(sale).reduce((sum, line) => {
    const unitCost = getEstimatedDisplayCostForProduct({
      productId: line.productId || "",
      productName: line.productName || ""
    });
    return sum + (Number(line.quantity || 0) * unitCost);
  }, 0);
  return getSaleTotalAmount(sale) - estimatedCost;
};

const isSaleCollected = (sale) => {
  const paidLabel = normalizeText(sale?.paid || sale?.status || "");
  if (paidLabel === "si" || paidLabel === "pagado" || paidLabel === "cobrado") return true;
  return !isCreditSaleRecord(sale);
};

const getSaleCollectedAmount = (sale) => {
  if (!isSaleCollected(sale)) return 0;
  return getSaleTotalAmount(sale);
};

const getReceivableStatus = (sale) => {
  const dueDate = normalizeDateValue(sale?.dueDate);
  const today = toDateInputValue(new Date());
  if (!dueDate) return "Pendiente";
  if (dueDate < today) return "Vencido";
  if (dueDate === today) return "Vence hoy";
  return "Pendiente";
};

const getLatestFinancialStartSetting = () => {
  return [...state.financialInitialSettings]
    .sort((a, b) => {
      const aTime = Number(a.createdAt?.seconds || a.createdAt?._seconds || 0);
      const bTime = Number(b.createdAt?.seconds || b.createdAt?._seconds || 0);
      if (bTime !== aTime) return bTime - aTime;
      return String(b.startDate || "").localeCompare(String(a.startDate || ""));
    })[0] || null;
};

const getFinanceAnalysisRange = () => {
  const fallback = getCurrentMonthDateRange();
  const latestSetting = getLatestFinancialStartSetting();
  const today = toDateInputValue(new Date());
  return {
    start: normalizeDateValue(latestSetting?.startDate) || fallback.start,
    end: today,
    configuredStart: normalizeDateValue(latestSetting?.startDate) || "",
    setting: latestSetting
  };
};

const isDateWithinFinanceAnalysis = (dateValue) => {
  const range = getFinanceAnalysisRange();
  return isDateWithinRange(dateValue, range.start, range.end);
};

const buildFinanceMovementRows = () => {
  const saleRows = state.sales.map((sale) => {
    const client = getSaleClientDetails(sale);
    const saleDate = normalizeDateValue(getSaleDateValue(sale));
    const lineSummary = getSaleLineItems(sale)
      .map((line) => `${formatInteger(line.quantity || 0)}x ${line.productName || "Producto"}`)
      .join(" | ");
    const isCollected = isSaleCollected(sale);
    return {
      id: `sale-${sale.id}`,
      sourceType: "sale",
      date: saleDate,
      movementType: isCollected ? "Ingreso" : "Venta a credito",
      category: isCreditSaleRecord(sale) ? "Facturacion a credito" : "Venta contado",
      description: lineSummary || "Venta registrada",
      counterparty: client.name || "Sin cliente",
      income: getSaleCollectedAmount(sale),
      expense: 0,
      estimatedProfit: getSaleEstimatedProfit(sale),
      paymentMethod: sale.payment || "-",
      status: isCreditSaleRecord(sale) ? getReceivableStatus(sale) : "Pagado",
      observation: String(sale.observation || "").trim(),
      createdAt: sale.createdAt?.seconds || 0
    };
  });

  const purchaseRows = state.purchases
    .filter((purchase) => normalizeText(purchase.type || "") !== "consumo por produccion")
    .map((purchase) => ({
    id: `purchase-${purchase.id}`,
    sourceType: "purchase",
    date: normalizeDateValue(purchase.date),
    movementType: "Egreso",
    category: normalizeText(purchase.type || "") === "ingreso" ? "Materia prima" : (purchase.type || "Materia prima"),
    description: purchase.materialName || "Compra registrada",
    counterparty: purchase.supplier || purchase.materialName || "-",
    income: 0,
    expense: Number(purchase.total || 0),
    estimatedProfit: 0,
    paymentMethod: purchase.paymentMethod || "-",
    status: purchase.status || "Registrado",
    observation: String(purchase.observation || "").trim(),
    createdAt: purchase.createdAt?.seconds || 0
  }));

  const manualExpenseRows = state.financialExpenses.map((expense) => ({
    id: `expense-${expense.id}`,
    sourceType: "manual-expense",
    date: normalizeDateValue(expense.date),
    movementType: "Egreso",
    category: expense.category || "Otros",
    description: expense.description || "Egreso manual",
    counterparty: expense.counterparty || "-",
    income: 0,
    expense: Number(expense.amount || 0),
    estimatedProfit: 0,
    paymentMethod: expense.paymentMethod || "-",
    status: expense.status || "Pagado",
    observation: String(expense.observation || "").trim(),
    createdAt: expense.createdAt?.seconds || 0
  }));

  const manualAdjustmentRows = state.financialManualAdjustments.map((adjustment) => {
    const type = String(adjustment.type || "").trim().toLowerCase();
    const rawAmount = Number(adjustment.amount || 0);
    const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
    const income = type === "ingreso" ? Math.abs(amount) : (type === "correccion" && amount > 0 ? amount : 0);
    const expense = type === "egreso" ? Math.abs(amount) : (type === "correccion" && amount < 0 ? Math.abs(amount) : 0);
    return {
      id: `adjustment-${adjustment.id}`,
      sourceType: "manual-adjustment",
      date: normalizeDateValue(adjustment.date),
      movementType: type === "correccion" ? "Correccion" : "Ajuste manual",
      category: type === "ingreso"
        ? "Ingreso manual"
        : type === "egreso"
          ? "Egreso manual"
          : "Correccion financiera",
      description: adjustment.reason || "Ajuste financiero",
      counterparty: "Sistema",
      income,
      expense,
      estimatedProfit: 0,
      paymentMethod: "-",
      status: "Aplicado",
      observation: String(adjustment.observation || "").trim(),
      createdAt: adjustment.createdAt?.seconds || 0
    };
  });

  return [...saleRows, ...purchaseRows, ...manualExpenseRows, ...manualAdjustmentRows]
    .filter((item) => item.date || item.createdAt)
    .sort((a, b) => {
      const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
      if (dateCompare !== 0) return dateCompare;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
};

const computeFinanceSummary = () => {
  const { start, end } = getFinanceAnalysisRange();
  const salesInPeriod = state.sales.filter((sale) => isDateWithinRange(getSaleDateValue(sale), start, end));
  const purchasesInPeriod = state.purchases.filter((purchase) => (
    normalizeText(purchase.type || "") !== "consumo por produccion"
    && isDateWithinRange(purchase.date, start, end)
  ));
  const expensesInPeriod = state.financialExpenses.filter((expense) => isDateWithinRange(expense.date, start, end));
  const adjustmentsInPeriod = state.financialManualAdjustments.filter((adjustment) => isDateWithinRange(adjustment.date, start, end));
  const revenue = salesInPeriod.reduce((sum, sale) => sum + getSaleTotalAmount(sale), 0);
  const collected = salesInPeriod.reduce((sum, sale) => sum + getSaleCollectedAmount(sale), 0);
  const purchaseExpenses = purchasesInPeriod.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
  const manualExpenses = expensesInPeriod.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const manualAdjustmentIncome = adjustmentsInPeriod.reduce((sum, adjustment) => {
    const type = String(adjustment.type || "").trim().toLowerCase();
    const amount = Number(adjustment.amount || 0);
    if (type === "ingreso") return sum + Math.abs(amount);
    if (type === "correccion" && amount > 0) return sum + amount;
    return sum;
  }, 0);
  const manualAdjustmentExpense = adjustmentsInPeriod.reduce((sum, adjustment) => {
    const type = String(adjustment.type || "").trim().toLowerCase();
    const amount = Number(adjustment.amount || 0);
    if (type === "egreso") return sum + Math.abs(amount);
    if (type === "correccion" && amount < 0) return sum + Math.abs(amount);
    return sum;
  }, 0);
  const expenses = purchaseExpenses + manualExpenses + manualAdjustmentExpense;
  const estimatedProfit = salesInPeriod.reduce((sum, sale) => sum + getSaleEstimatedProfit(sale), 0);
  const actualInflow = collected + manualAdjustmentIncome;
  const net = actualInflow - expenses;
  return {
    periodStart: start,
    periodEnd: end,
    revenue,
    collected: actualInflow,
    expenses,
    estimatedProfit,
    net,
    manualAdjustmentIncome,
    manualAdjustmentExpense
  };
};

const refreshFinanceDashboard = () => {
  const summary = computeFinanceSummary();
  const hasCutoff = Boolean(getFinanceAnalysisRange().setting);
  dashboardMetricSnapshot.finance.revenue = Number(summary.revenue || 0);
  dashboardMetricSnapshot.finance.expenses = Number(summary.expenses || 0);
  dashboardMetricSnapshot.finance.estimatedProfit = Number(summary.estimatedProfit || 0);
  dashboardMetricSnapshot.finance.net = Number(summary.net || 0);
  if (financeMetricRevenueSub) {
    financeMetricRevenueSub.textContent = summary.manualAdjustmentIncome > 0
      ? `Ingresado realmente (incluye ajustes): Gs ${formatGs(summary.collected || 0)}`
      : `Ingresado realmente: Gs ${formatGs(summary.collected || 0)}`;
  }
  if (financeMetricExpensesSub) {
    financeMetricExpensesSub.textContent = hasCutoff
      ? `Desde corte activo | ajustes: Gs ${formatGs(summary.manualAdjustmentExpense || 0)}`
      : `Incluye ajustes: Gs ${formatGs(summary.manualAdjustmentExpense || 0)}`;
  }
  if (financeMetricEstimatedProfitSub) {
    financeMetricEstimatedProfitSub.textContent = `Desde ${formatDate(summary.periodStart)} hasta ${formatDate(summary.periodEnd)}`;
  }
  if (financeMetricNetSub) {
    financeMetricNetSub.textContent = hasCutoff
      ? "Resultado neto real desde el corte financiero"
      : "Resultado neto real del periodo actual";
  }
  animateFinanceDashboardMetrics();
};

const renderFinanceMovement = () => {
  if (!financeMovementList) return;
  const rows = buildFinanceMovementRows().filter((row) => isDateWithinFinanceAnalysis(row.date));
  if (!rows.length) {
    financeMovementList.innerHTML = '<tr><td colspan="11" class="muted">Todavia no hay movimientos financieros dentro del tramo activo.</td></tr>';
    return;
  }
  financeMovementList.innerHTML = rows.map((row) => `
    <tr>
      <td>${formatDate(row.date)}</td>
      <td>${escapeHtml(row.movementType)}</td>
      <td>${escapeHtml(row.category || "-")}</td>
      <td>${escapeHtml(row.description || "-")}</td>
      <td>${escapeHtml(row.counterparty || "-")}</td>
      <td>${row.income > 0 ? `Gs ${formatGs(row.income)}` : "-"}</td>
      <td>${row.expense > 0 ? `Gs ${formatGs(row.expense)}` : "-"}</td>
      <td>${Number.isFinite(row.estimatedProfit) ? `Gs ${formatGs(row.estimatedProfit)}` : "-"}</td>
      <td>${escapeHtml(row.paymentMethod || "-")}</td>
      <td>${escapeHtml(row.status || "-")}</td>
      <td>${escapeHtml(row.observation || "-")}</td>
    </tr>
  `).join("");
};

const renderFinanceReceivables = () => {
  if (!financeReceivablesList) return;
  const receivables = state.sales
    .filter((sale) => isCreditSaleRecord(sale) && !isSaleCollected(sale) && isDateWithinFinanceAnalysis(getSaleDateValue(sale)))
    .map((sale) => ({
      id: sale.id,
      clientName: getSaleClientDetails(sale).name,
      saleDate: normalizeDateValue(getSaleDateValue(sale)),
      dueDate: normalizeDateValue(sale.dueDate),
      amount: getSaleTotalAmount(sale),
      status: getReceivableStatus(sale)
    }))
    .sort((a, b) => {
      const statusWeight = { "Vencido": 0, "Vence hoy": 1, "Pendiente": 2 };
      const weightDiff = (statusWeight[a.status] ?? 3) - (statusWeight[b.status] ?? 3);
      if (weightDiff !== 0) return weightDiff;
      return String(a.dueDate || "").localeCompare(String(b.dueDate || ""));
    });

  if (!receivables.length) {
    financeReceivablesList.innerHTML = '<div class="list-item muted">No hay ventas a credito pendientes de cobro.</div>';
    return;
  }

  financeReceivablesList.innerHTML = receivables.map((entry) => `
    <div class="list-item finance-receivable-item">
      <strong>${escapeHtml(entry.clientName || "Sin cliente")}</strong>
      <div>Fecha de venta: ${formatDate(entry.saleDate)}</div>
      <div>Fecha de cobro: ${entry.dueDate ? formatDate(entry.dueDate) : "Sin fecha"}</div>
      <div>Monto pendiente: <strong>Gs ${formatGs(entry.amount || 0)}</strong></div>
      <div>Estado: <span class="finance-status-badge ${entry.status === "Vencido" ? "is-overdue" : entry.status === "Vence hoy" ? "is-today" : "is-pending"}">${entry.status}</span></div>
    </div>
  `).join("");
};

const renderFinanceCategorySummary = () => {
  if (!financeCategorySummaryList) return;
  const { start, end } = getFinanceAnalysisRange();
  const expenseRows = buildFinanceMovementRows()
    .filter((row) => row.expense > 0 && isDateWithinRange(row.date, start, end));

  if (!expenseRows.length) {
    financeCategorySummaryList.innerHTML = '<div class="list-item muted">Todavia no hay egresos dentro del tramo financiero activo.</div>';
    return;
  }

  const grouped = expenseRows.reduce((map, row) => {
    const key = row.category || "Sin categoria";
    const current = map.get(key) || { category: key, total: 0, count: 0 };
    current.total += Number(row.expense || 0);
    current.count += 1;
    map.set(key, current);
    return map;
  }, new Map());

  financeCategorySummaryList.innerHTML = [...grouped.values()]
    .sort((a, b) => b.total - a.total)
    .map((entry) => `
      <div class="list-item finance-category-item">
        <strong>${escapeHtml(entry.category)}</strong>
        <div>Cantidad de movimientos: ${formatInteger(entry.count)}</div>
        <div>Total egresado: <strong>Gs ${formatGs(entry.total)}</strong></div>
      </div>
    `).join("");
};

const renderFinanceInitialHistory = () => {
  if (!financeInitialHistory) return;
  const history = [...state.financialInitialSettings]
    .sort((a, b) => {
      const aTime = Number(a.createdAt?.seconds || a.createdAt?._seconds || 0);
      const bTime = Number(b.createdAt?.seconds || b.createdAt?._seconds || 0);
      return bTime - aTime;
    });
  if (!history.length) {
    financeInitialHistory.innerHTML = '<div class="list-item muted">Aun no configuraste un inicio financiero real.</div>';
    return;
  }
  financeInitialHistory.innerHTML = history.slice(0, 5).map((entry, index) => {
    const userLabel = String(entry.userName || entry.userEmail || "").trim() || "Sin usuario";
    const createdLabel = formatDate(normalizeDateValue(entry.createdAt) || normalizeDateValue(entry.createdAtMs) || "");
    return `
      <div class="list-item finance-initial-history-item">
        <strong>${index === 0 ? "Activo" : "Historico"}</strong>
        <div>Fecha de corte: ${formatDate(entry.startDate)}</div>
        <div>Motivo: ${escapeHtml(entry.reason || "-")}</div>
        <div>Registrado por: ${escapeHtml(userLabel)}</div>
        <div>Creado: ${createdLabel || "Sin fecha"}</div>
      </div>
    `;
  }).join("");
};

const renderFinanceActiveSummary = () => {
  if (!financeActiveSummary) return;
  const range = getFinanceAnalysisRange();
  if (!range.setting) {
    financeActiveSummary.innerHTML = `
      <strong>Modo financiero actual</strong>
      <div>Sin ajuste inicial configurado. El analisis usa el mes actual desde ${formatDate(range.start)}.</div>
    `;
    return;
  }
  const userLabel = String(range.setting.userName || range.setting.userEmail || "").trim() || "Sin usuario";
  financeActiveSummary.innerHTML = `
    <strong>Inicio financiero real activo</strong>
    <div>Desde: <strong>${formatDate(range.start)}</strong></div>
    <div>Motivo: ${escapeHtml(range.setting.reason || "-")}</div>
    <div>Registrado por: ${escapeHtml(userLabel)}</div>
  `;
};

const toggleFinanceInlinePanel = (panel, shouldOpen) => {
  if (!panel) return;
  panel.classList.toggle("hidden", !shouldOpen);
  requestAnimationFrame(() => {
    refreshCollapseHeights();
  });
};

const closeFinanceInlinePanels = () => {
  toggleFinanceInlinePanel(financeInitialPanel, false);
  toggleFinanceInlinePanel(financeManualAdjustmentPanel, false);
  if (financeInitialNotice) financeInitialNotice.textContent = "";
  if (financeManualAdjustmentNotice) financeManualAdjustmentNotice.textContent = "";
};

const openFinanceInitialPanel = () => {
  toggleFinanceInlinePanel(financeManualAdjustmentPanel, false);
  toggleFinanceInlinePanel(financeInitialPanel, true);
  if (financeInitialForm?.startDate) {
    financeInitialForm.startDate.value = getFinanceAnalysisRange().configuredStart || toDateInputValue(new Date());
    requestAnimationFrame(() => {
      financeInitialForm.startDate.focus({ preventScroll: false });
    });
  }
};

const openFinanceManualAdjustmentPanel = () => {
  toggleFinanceInlinePanel(financeInitialPanel, false);
  toggleFinanceInlinePanel(financeManualAdjustmentPanel, true);
  if (financeManualAdjustmentForm?.date) {
    financeManualAdjustmentForm.date.value = financeManualAdjustmentForm.date.value || toDateInputValue(new Date());
    requestAnimationFrame(() => {
      financeManualAdjustmentForm.date.focus({ preventScroll: false });
    });
  }
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

const renderRepurchaseSummary = (followups) => {
  if (!repurchaseSummary) return;
  const overdue = followups.filter((f) => f.statusClass === "overdue").length;
  const today = followups.filter((f) => f.statusClass === "today").length;
  const upcoming = followups.filter((f) => f.statusClass === "upcoming").length;
  const cards = [
    { label: "En seguimiento", value: followups.length, cls: "" },
    { label: "Atrasados", value: overdue, cls: overdue ? "is-danger" : "" },
    { label: "Vencen hoy", value: today, cls: today ? "is-warn" : "" },
    { label: "Proximos", value: upcoming, cls: "" }
  ];
  repurchaseSummary.innerHTML = cards.map((c) => `
    <div class="prospect-indicator ${c.cls}">
      <span class="prospect-indicator-value">${formatInteger(c.value)}</span>
      <span class="prospect-indicator-label">${c.label}</span>
    </div>
  `).join("");
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
  renderRepurchaseSummary(followups);
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

const focusQuickClientField = (field) => {
  if (!field) return;
  requestAnimationFrame(() => {
    field.focus({ preventScroll: false });
    field.select?.();
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
  // Los paneles fluyen con el scroll natural de la pagina: no se fija altura.
  if (dashboardPanelsViewport) {
    dashboardPanelsViewport.style.height = "";
  }
};

let dashboardResizeObserver = null;
let isNavigatingToSales = false;

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
  // El track de paneles ya no se desplaza con translateX (sin carrusel de altura fija).
  if (dashboardPanelsTrack) {
    dashboardPanelsTrack.style.transform = "";
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

const waitForNextFrame = () => new Promise((resolve) => {
  requestAnimationFrame(() => resolve());
});

const waitForDelay = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

const waitForCondition = async (check, { attempts = 12, delayMs = 35 } = {}) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (check()) return true;
    await waitForNextFrame();
    if (check()) return true;
    await waitForDelay(delayMs);
  }
  return check();
};

const setDashboardTransitionsEnabled = (enabled) => {
  const transitionValue = enabled ? "" : "none";
  [
    dashboardOverviewViewport,
    dashboardPanelsViewport,
    dashboardOverviewTrack,
    dashboardPanelsTrack
  ].forEach((node) => {
    if (!node) return;
    node.style.transition = transitionValue;
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
  const matchedProduct = state.products.find((item) => normalizeText(item.name) === normalizeText(recipeName));
  const salePrice = Number(matchedProduct?.price || 0);
  const grossMargin = salePrice > 0 && totals.totalDisplayCost !== null ? salePrice - totals.totalDisplayCost : null;
  const grossMarginPct = grossMargin !== null && salePrice > 0 ? (grossMargin / salePrice) * 100 : null;
  const costPerEnvelope = totals.totalDisplayCost !== null && totals.wrapCount > 0
    ? totals.totalDisplayCost / totals.wrapCount
    : null;
  const yieldLabel = totals.yieldQuantity && totals.yieldUnit
    ? `${formatNumber(totals.yieldQuantity)} ${totals.yieldUnit}`
    : "Definir rendimiento";
  recipeCostPreview.innerHTML = `
    <div class="list-item">
      <strong>${recipeName} rinde ${yieldLabel}</strong>
      <div>Costo formula total: Gs ${formatGs(totals.totalCost)}</div>
      <div>Costo por unidad producida: Gs ${formatGs(totals.costPerUnit)}</div>
      <div>Costo de formula por kg: ${totals.costPerKg !== null ? `Gs ${formatGs(totals.costPerKg)}` : "Definir rendimiento en kg o g"}</div>
      <div>Costo por sobre: ${costPerEnvelope !== null ? `Gs ${formatGs(costPerEnvelope)}` : "Definir empaques por display"}</div>
      <div>Costo por display de 360 g: ${totals.totalDisplayCost !== null ? `Gs ${formatGs(totals.totalDisplayCost)}` : "Definir rendimiento en kg o g"}</div>
      <div>Margen bruto estimado: ${grossMargin !== null ? `Gs ${formatGs(grossMargin)}` : "Vincular un producto con precio de venta"}</div>
      <div>Rentabilidad estimada: ${grossMarginPct !== null ? `${formatNumber(grossMarginPct)}%` : "Vincular un producto con precio de venta"}</div>
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
  recipeForm.unitCost.value = Math.round(getMaterialUnitCost(material)).toString();
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
  const currentTotals = calculateRecipeCurrentTotals(recipe);
  const costPerUnit = Number(currentTotals.costPerUnit || recipe.costPerUnit || 0);
  const totalCost = costPerUnit * quantity;
  batchForm.unitCost.value = costPerUnit ? Math.round(costPerUnit).toString() : "";
  batchForm.totalCost.value = totalCost ? Math.round(totalCost).toString() : "";
};

const normalizeText = (value) => (value || "").trim().toLowerCase();
const digitsOnly = (value) => String(value || "").replace(/\D+/g, "");
const getOptionLabel = (options, value, fallback = "Sin definir") => {
  const normalized = normalizeText(value);
  const match = options.find((option) => option.value === normalized);
  return match?.label || fallback;
};

const normalizeOptionValue = (options, value, fallback = "") => {
  const normalized = normalizeText(value);
  return options.some((option) => option.value === normalized) ? normalized : fallback;
};

const normalizeProspectPhone = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const normalized = normalizePhoneForStorage(raw);
  if (normalized !== null) return normalized;
  return raw;
};

const parseOptionalCoordinate = (value) => {
  const raw = String(value ?? "").replace(",", ".").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasCoordinates = (item) => Number.isFinite(Number(item?.latitude)) && Number.isFinite(Number(item?.longitude));

const buildGoogleMapsLocationUrl = (item) => {
  const link = String(item?.mapsLink || "").trim();
  if (link) return link;
  if (hasCoordinates(item)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${Number(item.latitude)},${Number(item.longitude)}`)}`;
  }
  const addressParts = [item?.address, item?.zone, item?.city].filter(Boolean).join(", ");
  if (addressParts) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressParts)}`;
  }
  return "";
};

const getRouteStopValue = (item) => {
  if (hasCoordinates(item)) return `${Number(item.latitude)},${Number(item.longitude)}`;
  const addressParts = [item?.address, item?.zone, item?.city].filter(Boolean).join(", ");
  if (addressParts) return addressParts;
  return String(item?.mapsLink || "").trim();
};

// ===== Optimizacion de rutas (fallback Haversine) =====
const haversineMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000, toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const estimateDriveSeconds = (meters) => Math.round((meters / 30000) * 3600);

const buildHaversineMatrix = (points) =>
  points.map((a) => points.map((b) => haversineMeters(a.lat, a.lng, b.lat, b.lng)));

const nearestNeighborOpen = (matrix) => {
  const n = matrix.length - 1;
  const unvisited = new Set(Array.from({ length: n }, (_, i) => i + 1));
  const tour = [];
  let cur = 0;
  while (unvisited.size > 0) {
    let best = -1, bestDist = Infinity;
    for (const j of unvisited) { if (matrix[cur][j] < bestDist) { bestDist = matrix[cur][j]; best = j; } }
    tour.push(best); unvisited.delete(best); cur = best;
  }
  return tour;
};

const twoOptImprove = (tour, matrix) => {
  const cost = (t) => { let d = matrix[0][t[0]]; for (let i = 0; i < t.length - 1; i++) d += matrix[t[i]][t[i + 1]]; return d; };
  let best = [...tour], improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const cand = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)];
        if (cost(cand) < cost(best)) { best = cand; improved = true; }
      }
    }
  }
  return best;
};

const heldKarpOpen = (matrix) => {
  const n = matrix.length - 1;
  if (n === 0) return [];
  if (n === 1) return [1];
  const INF = Infinity, size = 1 << n;
  const dp = Array.from({ length: size }, () => new Float64Array(n + 1).fill(INF));
  const parent = Array.from({ length: size }, () => new Int8Array(n + 1).fill(-1));
  for (let i = 1; i <= n; i++) { dp[1 << (i - 1)][i] = matrix[0][i]; }
  for (let mask = 1; mask < size; mask++) {
    for (let i = 1; i <= n; i++) {
      if (!(mask & (1 << (i - 1))) || dp[mask][i] === INF) continue;
      for (let j = 1; j <= n; j++) {
        if (mask & (1 << (j - 1))) continue;
        const nm = mask | (1 << (j - 1)), nc = dp[mask][i] + matrix[i][j];
        if (nc < dp[nm][j]) { dp[nm][j] = nc; parent[nm][j] = i; }
      }
    }
  }
  const full = size - 1;
  let bestEnd = 1, bestCost = dp[full][1];
  for (let i = 2; i <= n; i++) { if (dp[full][i] < bestCost) { bestCost = dp[full][i]; bestEnd = i; } }
  const tour = [];
  let mask = full, cur = bestEnd;
  while (cur !== -1) { tour.unshift(cur); const prev = parent[mask][cur]; mask ^= (1 << (cur - 1)); cur = prev; }
  return tour;
};

const optimizeRouteHaversine = (originCoords, stopCoords) => {
  if (!stopCoords.length) return { order: [], legs: [], totalDistanceMeters: 0, estimatedDurationSeconds: 0 };
  const points = [originCoords, ...stopCoords];
  const matrix = buildHaversineMatrix(points);
  let tour;
  try {
    tour = stopCoords.length <= 12 ? heldKarpOpen(matrix) : nearestNeighborOpen(matrix);
  } catch (e) { tour = nearestNeighborOpen(matrix); }
  tour = twoOptImprove(tour, matrix);
  const legs = [];
  let totalDist = matrix[0][tour[0]], totalSec = estimateDriveSeconds(matrix[0][tour[0]]);
  legs.push({ fromIndex: -1, toIndex: tour[0] - 1, distanceMeters: Math.round(matrix[0][tour[0]]), durationSeconds: estimateDriveSeconds(matrix[0][tour[0]]) });
  for (let i = 0; i < tour.length - 1; i++) {
    const d = matrix[tour[i]][tour[i + 1]];
    totalDist += d; totalSec += estimateDriveSeconds(d);
    legs.push({ fromIndex: tour[i] - 1, toIndex: tour[i + 1] - 1, distanceMeters: Math.round(d), durationSeconds: estimateDriveSeconds(d) });
  }
  return { order: tour.map((i) => i - 1), legs, totalDistanceMeters: Math.round(totalDist), estimatedDurationSeconds: totalSec };
};

const formatDistance = (meters) => !meters ? "0 m" : meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
const formatDuration = (sec) => { if (!sec) return "0 min"; const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60); return h > 0 ? `${h} h ${m} min` : `${m} min`; };

const buildGoogleMapsRouteUrl = (items) => {
  const stops = items
    .map((item) => getRouteStopValue(item))
    .filter(Boolean)
    .slice(0, MAX_ROUTE_STOPS);
  if (!stops.length) return "";
  if (stops.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stops[0])}`;
  }
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(0, -1);
  const params = new URLSearchParams({
    api: "1",
    travelmode: "driving",
    destination
  });
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

const buildProspectStatusOptions = (selectedValue = "") => PROSPECT_STATUS_OPTIONS
  .map((option) => `<option value="${option.value}"${option.value === selectedValue ? " selected" : ""}>${option.label}</option>`)
  .join("");

const buildVisitResultOptions = (selectedValue = "") => VISIT_RESULT_OPTIONS
  .map((option) => `<option value="${option.value}"${option.value === selectedValue ? " selected" : ""}>${option.label}</option>`)
  .join("");

const getVisitKey = (type, id) => `${type}:${id}`;

const getVisitEntityByKey = (key) => {
  const [type, id] = String(key || "").split(":");
  if (!type || !id) return null;
  if (type === "prospect") {
    const prospect = state.prospects.find((item) => item.id === id);
    return prospect ? { type, id, item: prospect, name: prospect.name || "Prospecto" } : null;
  }
  if (type === "client") {
    const client = state.clients.find((item) => item.id === id);
    return client ? { type, id, item: client, name: client.name || "Cliente" } : null;
  }
  return null;
};

const getActiveVisitEntities = () => visitPlannerState.activeKeys
  .map((key) => getVisitEntityByKey(key))
  .filter(Boolean);

const pruneVisitPlannerState = () => {
  const validKeys = new Set([
    ...state.prospects.map((item) => getVisitKey("prospect", item.id)),
    ...state.clients.map((item) => getVisitKey("client", item.id))
  ]);
  Array.from(visitPlannerState.selectedKeys).forEach((key) => {
    if (!validKeys.has(key)) visitPlannerState.selectedKeys.delete(key);
  });
  visitPlannerState.activeKeys = visitPlannerState.activeKeys.filter((key) => validKeys.has(key));
};

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
  const totals = calculateRecipeCurrentTotals(item);
  const product = findProductForRecipe(item);
  const salePrice = Number(product?.price || 0);
  const displayCost = Number(totals.totalDisplayCost || 0);
  const grossMargin = salePrice > 0 && displayCost > 0 ? salePrice - displayCost : null;
  const grossMarginPct = grossMargin !== null && salePrice > 0 ? (grossMargin / salePrice) * 100 : null;
  const wrapCount = Number(totals.wrapCount || item.packaging?.wrapCount || 12);
  const costPerEnvelope = displayCost > 0 && wrapCount > 0 ? displayCost / wrapCount : null;
  const formulaStatus = (item.ingredients || []).length
    ? "Formula vinculada"
    : "Sin formula vinculada";
  return `
    <div>Rinde: ${yieldLabel}</div>
    <div>Estado: ${formulaStatus}</div>
    <div>Costo total actual: Gs ${formatGs(totals.totalCost)}</div>
    <div>Costo por unidad: Gs ${formatGs(totals.costPerUnit)}</div>
    <div>Costo por kg: ${totals.costPerKg !== null ? `Gs ${formatGs(totals.costPerKg)}` : "Definir rendimiento en kg o g"}</div>
    <div>Costo por sobre: ${costPerEnvelope !== null ? `Gs ${formatGs(costPerEnvelope)}` : "Definir display y empaques"}</div>
    <div>Costo por display/caja: ${displayCost ? `Gs ${formatGs(displayCost)}` : "Definir rendimiento en kg o g"}</div>
    <div>Margen bruto estimado: ${grossMargin !== null ? `Gs ${formatGs(grossMargin)}` : "Vincular precio de venta"}</div>
    <div>Rentabilidad: ${grossMarginPct !== null ? `${formatNumber(grossMarginPct)}%` : "Vincular precio de venta"}</div>
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

const getMaterialUnitCost = (material) => {
  const values = [
    material?.price,
    material?.referenceCost,
    material?.unitPrice
  ];
  const match = values.map(Number).find((value) => Number.isFinite(value) && value > 0);
  return match || 0;
};

const getIngredientWithCurrentCost = (ing) => {
  const material = state.rawMaterials.find((item) => item.id === ing.materialId);
  const unit = ing.unit || material?.unit || ing.unitBase || "";
  const unitBase = material?.unit || ing.unitBase || unit;
  const quantity = Number(ing.quantity || 0);
  const normalized = normalizeQuantity(quantity, unit, unitBase);
  const quantityBase = Number(ing.quantityBase || 0) || normalized || quantity;
  const unitCost = getMaterialUnitCost(material) || Number(ing.unitCost || 0);
  return {
    ...ing,
    materialName: material?.name || ing.materialName || "Materia prima",
    quantity,
    unit,
    quantityBase,
    unitBase,
    unitCost,
    totalCost: quantityBase * unitCost,
    costSource: material ? "current" : "stored"
  };
};

const calculateRecipeCurrentTotals = (recipe) => {
  const ingredients = (recipe?.ingredients || []).map(getIngredientWithCurrentCost);
  const totalCost = ingredients.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
  const yieldQuantity = Number(recipe?.yieldQuantity || 0);
  const yieldUnit = recipe?.yieldUnit || "";
  const costPerUnit = yieldQuantity > 0 ? totalCost / yieldQuantity : 0;
  let costPerKg = null;
  if (yieldQuantity > 0 && yieldUnit === "kg") costPerKg = costPerUnit;
  if (yieldQuantity > 0 && yieldUnit === "g") costPerKg = costPerUnit * 1000;
  const packaging = recipe?.packaging || {};
  const boxCost = Number(packaging.boxCost || 0);
  const wrapCost = Number(packaging.wrapCost || 0);
  const wrapCount = Number(packaging.wrapCount || 0);
  const packagingCost = Number(packaging.packagingCost || 0) || (boxCost + wrapCost * wrapCount);
  const productCostPerDisplay = costPerKg !== null ? costPerKg * 0.36 : null;
  const totalDisplayCost = productCostPerDisplay !== null ? productCostPerDisplay + packagingCost : null;
  return {
    ingredients,
    totalCost,
    costPerUnit,
    costPerKg,
    packagingCost,
    productCostPerDisplay,
    totalDisplayCost,
    boxCost,
    wrapCost,
    wrapCount
  };
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
  if (normalized === null) {
    purchaseForm.unitPrice.value = "";
    return;
  }
  const baseQuantity = normalized ?? quantity;
  const unitPriceBase = baseQuantity ? totalCost / baseQuantity : 0;
  purchaseForm.unitPrice.value = Number.isNaN(unitPriceBase) ? "" : Math.round(unitPriceBase).toString();
};

const updateRawMaterialUnitCost = () => {
  if (!rawMaterialForm?.referenceCost || !rawMaterialForm?.referenceCostTotal || !rawMaterialForm?.referenceQuantity) return;
  const quantity = Number(rawMaterialForm.referenceQuantity.value);
  const totalCost = Number(rawMaterialForm.referenceCostTotal.value);
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(totalCost)) {
    rawMaterialForm.referenceCost.value = "";
    return;
  }
  rawMaterialForm.referenceCost.value = Math.round(totalCost / quantity).toString();
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
    updateSelect(recipeProductSelect, items, "Seleccionar producto");
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
    pruneVisitPlannerState();
  }
  if (key === "prospects") {
    pruneVisitPlannerState();
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
  if (["sales", "products", "recipes", "salesGoals", "rawMaterials", "purchases", "batches", "finishedStockAdjustments", "rawMaterialAdjustments", "financialExpenses", "financialInitialSettings", "financialManualAdjustments"].includes(key)) {
    const stockData = computeStockTotals();
    refreshSalesDashboard(stockData);
    refreshDashboard(stockData);
    refreshFinanceDashboard();
  }
  if (["batches", "sales", "products", "recipes", "finishedStockAdjustments"].includes(key)) {
    refreshFinishedStock();
    refreshSaleProductOptions();
  }
  if (key === "businessTypes") {
    renderBusinessTypeSelectors();
    maybeSeedBusinessTypes(items);
  }
};

// Shared company data should remain visible to any authenticated user.
const listenCollection = (collectionName, key) => {
  const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
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

const getFilteredProspects = () => {
  const search = normalizeText(prospectFiltersState.search);
  const city = normalizeText(prospectFiltersState.city);
  const zone = normalizeText(prospectFiltersState.zone);
  const businessType = normalizeText(prospectFiltersState.businessType);
  const status = normalizeText(prospectFiltersState.status);
  const potential = normalizeText(prospectFiltersState.potential);
  const location = prospectFiltersState.location;
  return state.prospects.filter((item) => {
    if (search) {
      const haystack = normalizeText([item.name, item.contactName, item.phone, item.address].filter(Boolean).join(" "));
      if (!haystack.includes(search)) return false;
    }
    if (city && !normalizeText(item.city).includes(city)) return false;
    if (zone && !normalizeText(item.zone).includes(zone)) return false;
    if (businessType && normalizeText(item.businessType) !== businessType) return false;
    if (status && normalizeText(item.status) !== status) return false;
    if (potential && normalizeText(item.potential) !== potential) return false;
    if (location) {
      const hasLocation = Boolean(buildGoogleMapsLocationUrl(item));
      if (location === "with" && !hasLocation) return false;
      if (location === "without" && hasLocation) return false;
    }
    return true;
  });
};

const PROSPECT_INDICATOR_DEFS = [
  { key: "total", label: "Total" },
  { key: "nuevo", label: "Nuevos" },
  { key: "por_contactar", label: "Por contactar" },
  { key: "visita_pendiente", label: "Visitas pendientes" },
  { key: "interesado", label: "Interesados" },
  { key: "sin_accion", label: "Sin proxima accion" },
  { key: "convertido", label: "Convertidos" }
];

const renderProspectIndicators = () => {
  if (!prospectIndicators) return;
  const inactive = new Set(["convertido_cliente", "no_interesado", "descartado"]);
  const counts = {
    total: state.prospects.length,
    nuevo: 0,
    por_contactar: 0,
    visita_pendiente: 0,
    interesado: 0,
    sin_accion: 0,
    convertido: 0
  };
  state.prospects.forEach((item) => {
    const status = normalizeOptionValue(PROSPECT_STATUS_OPTIONS, item.status, "nuevo");
    if (status === "nuevo") counts.nuevo += 1;
    if (status === "nuevo" || status === "contactado") counts.por_contactar += 1;
    if (status === "visita_pendiente") counts.visita_pendiente += 1;
    if (status === "interesado") counts.interesado += 1;
    if (status === "convertido_cliente") counts.convertido += 1;
    if (!normalizeDateValue(item.nextActionDate) && !item.nextAction && !inactive.has(status)) counts.sin_accion += 1;
  });
  prospectIndicators.innerHTML = PROSPECT_INDICATOR_DEFS.map((def) => `
    <div class="prospect-indicator ${def.key === "sin_accion" && counts.sin_accion ? "is-warn" : ""}">
      <span class="prospect-indicator-value">${formatInteger(counts[def.key])}</span>
      <span class="prospect-indicator-label">${def.label}</span>
    </div>
  `).join("");
};

const renderProspectList = () => {
  if (!prospectList) return;
  const prospects = getFilteredProspects();
  if (!prospects.length) {
    prospectList.innerHTML = '<tr class="empty-row"><td colspan="7">Sin prospectos para los filtros actuales.</td></tr>';
    syncProspectSelectAll();
    return;
  }
  prospectList.innerHTML = prospects.map((item) => {
    const visitKey = getVisitKey("prospect", item.id);
    const selected = visitPlannerState.selectedKeys.has(visitKey);
    const status = normalizeOptionValue(PROSPECT_STATUS_OPTIONS, item.status, "nuevo");
    const potential = normalizeOptionValue(PROSPECT_POTENTIAL_OPTIONS, item.potential);
    const mapsUrl = buildGoogleMapsLocationUrl(item);
    const whatsappLink = buildWhatsAppLink(item.phone, item.name);
    const nextAction = item.nextAction ? escapeHtml(item.nextAction) : '<span class="muted">-</span>';
    const nextDate = item.nextActionDate ? formatDate(item.nextActionDate) : '<span class="muted">-</span>';
    const isDetailOpen = prospectDetailOpenState.has(item.id);
    const locCell = mapsUrl
      ? `<a class="table-loc-link" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer" title="Abrir en Google Maps"><i data-lucide="map-pin"></i></a>`
      : '<span class="muted" title="Sin ubicacion">-</span>';
    return `
      <tr class="prospect-row ${selected ? "is-selected" : ""}" data-prospect-id="${item.id}">
        <td class="col-check" data-label=""><input type="checkbox" data-visit-select="prospect" data-visit-id="${item.id}" ${selected ? "checked" : ""} aria-label="Seleccionar prospecto" /></td>
        <td class="cell-strong prospect-name-cell" data-label="Negocio" title="${escapeHtml(item.name || "Sin nombre")}">${escapeHtml(item.name || "Sin nombre")}</td>
        <td class="text-truncate" data-label="Rubro">${item.businessType ? escapeHtml(getBusinessTypeLabel(item.businessType)) : '<span class="muted">-</span>'}</td>
        <td class="prospect-place-cell" data-label="Ciudad / zona">
          <strong>${item.city ? escapeHtml(item.city) : '<span class="muted">Sin ciudad</span>'}</strong>
          <span>${item.zone ? escapeHtml(item.zone) : '<span class="muted">Sin zona</span>'}</span>
        </td>
        <td data-label="Estado"><span class="prospect-status status-${status}">${getOptionLabel(PROSPECT_STATUS_OPTIONS, status)}</span></td>
        <td data-label="Potencial">${potential ? `<span class="prospect-potential potential-${potential}">${getOptionLabel(PROSPECT_POTENTIAL_OPTIONS, potential)}</span>` : '<span class="muted">-</span>'}</td>
        <td class="col-actions" data-label="Acciones">
          <div class="table-actions">
            <button class="icon-btn" type="button" data-toggle-prospect-detail="${item.id}" title="Ver mas" aria-expanded="${isDetailOpen ? "true" : "false"}"><i data-lucide="${isDetailOpen ? "chevron-up" : "chevron-down"}"></i></button>
            ${whatsappLink ? `<button class="icon-btn" type="button" data-whatsapp-link="${whatsappLink}" title="WhatsApp"><i data-lucide="message-circle"></i></button>` : ""}
            ${mapsUrl ? `<button class="icon-btn" type="button" data-open-maps="${escapeHtml(mapsUrl)}" title="Abrir en Google Maps"><i data-lucide="map-pin"></i></button>` : ""}
            <button class="icon-btn" type="button" data-edit-prospect="${item.id}" title="Editar"><i data-lucide="pencil"></i></button>
            <button class="icon-btn icon-btn-success" type="button" data-convert-prospect="${item.id}" ${status === "convertido_cliente" ? "disabled" : ""} title="Convertir a cliente"><i data-lucide="user-plus"></i></button>
            <button class="icon-btn icon-btn-danger" type="button" data-delete-prospect="${item.id}" title="Eliminar"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
      <tr class="prospect-detail-row ${isDetailOpen ? "open" : ""}">
        <td colspan="7">
          <div class="prospect-detail-grid">
            <div><span>Contacto</span><strong>${item.contactName ? escapeHtml(item.contactName) : "-"}</strong></div>
            <div><span>Telefono</span><strong>${item.phone ? escapeHtml(item.phone) : "-"}</strong></div>
            <div><span>Direccion</span><strong>${item.address ? escapeHtml(item.address) : "-"}</strong></div>
            <div><span>Ciudad / zona</span><strong>${item.city || item.zone ? `${escapeHtml(item.city || "-")} / ${escapeHtml(item.zone || "-")}` : "-"}</strong></div>
            <div><span>Ubicacion</span><strong>${item.latitude || item.longitude ? `${escapeHtml(item.latitude ?? "-")}, ${escapeHtml(item.longitude ?? "-")}` : "-"}</strong></div>
            <div><span>Maps</span><strong>${mapsUrl ? locCell : "-"}</strong></div>
            <div><span>Proxima accion</span><strong>${nextAction}</strong></div>
            <div><span>Fecha</span><strong>${nextDate}</strong></div>
            <div><span>Origen</span><strong>${item.source ? escapeHtml(item.source) : "-"}</strong></div>
            <div><span>Responsable</span><strong>${item.responsible ? escapeHtml(item.responsible) : "-"}</strong></div>
            <div class="prospect-detail-wide"><span>Observaciones</span><strong>${item.observations ? escapeHtml(item.observations) : "-"}</strong></div>
          </div>
        </td>
      </tr>
    `;
  }).join("");
  syncProspectSelectAll();
  refreshIcons();
};

const syncProspectSelectAll = () => {
  const total = updateProspectSelectionUi();
  if (!prospectSelectAll) return;
  const visible = getFilteredProspects();
  const allSelected = visible.length > 0 && visible.every((item) => visitPlannerState.selectedKeys.has(getVisitKey("prospect", item.id)));
  prospectSelectAll.checked = allSelected;
  prospectSelectAll.indeterminate = !allSelected && total > 0;
};

const updateProspectSelectionUi = () => {
  const count = visitPlannerState.selectedKeys.size;
  if (prospectBulkbar) prospectBulkbar.classList.toggle("hidden", count === 0);
  if (prospectSelectedCount) prospectSelectedCount.textContent = `${count} seleccionado${count === 1 ? "" : "s"}`;
  return count;
};

const exportProspectsToCsv = () => {
  const prospects = getFilteredProspects();
  if (!prospects.length) {
    window.alert("No hay prospectos para exportar con los filtros actuales.");
    return;
  }
  const headers = ["Negocio", "Contacto", "Telefono", "Rubro", "Ciudad", "Zona", "Direccion", "Estado", "Potencial", "Proxima accion", "Fecha proxima accion", "Latitud", "Longitud", "Maps"];
  const escapeCsv = (value) => {
    const text = String(value ?? "");
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const rows = prospects.map((item) => [
    item.name || "",
    item.contactName || "",
    item.phone || "",
    item.businessType ? getBusinessTypeLabel(item.businessType) : "",
    item.city || "",
    item.zone || "",
    item.address || "",
    getOptionLabel(PROSPECT_STATUS_OPTIONS, normalizeOptionValue(PROSPECT_STATUS_OPTIONS, item.status, "nuevo")),
    item.potential ? getOptionLabel(PROSPECT_POTENTIAL_OPTIONS, item.potential) : "",
    item.nextAction || "",
    normalizeDateValue(item.nextActionDate) || "",
    item.latitude ?? "",
    item.longitude ?? "",
    item.mapsLink || ""
  ].map(escapeCsv).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `prospectos-${toDateInputValue(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const renderVisitClientList = () => {
  if (!visitClientList) return;
  const search = normalizeText(visitClientSearch?.value || "");
  const clients = state.clients
    .filter((item) => {
      if (!search) return true;
      const haystack = normalizeText([item.name, item.phone, item.address, item.city, item.zone].filter(Boolean).join(" "));
      return haystack.includes(search);
    })
    .slice(0, 40);
  if (!clients.length) {
    visitClientList.innerHTML = '<div class="list-item muted">Sin clientes para mostrar.</div>';
    return;
  }
  visitClientList.innerHTML = clients.map((item) => {
    const visitKey = getVisitKey("client", item.id);
    const selected = visitPlannerState.selectedKeys.has(visitKey);
    const mapsUrl = buildGoogleMapsLocationUrl(item);
    return `
      <div class="list-item visit-client-item">
        <label class="visit-check">
          <input type="checkbox" data-visit-select="client" data-visit-id="${item.id}" ${selected ? "checked" : ""} />
          <span>${escapeHtml(item.name || "Sin nombre")}</span>
        </label>
        <div class="client-item-details">
          ${item.phone ? `<span><b>Tel</b>${escapeHtml(item.phone)}</span>` : ""}
          ${item.city ? `<span><b>Ciudad</b>${escapeHtml(item.city)}</span>` : ""}
          ${item.zone ? `<span><b>Zona</b>${escapeHtml(item.zone)}</span>` : ""}
          ${item.address ? `<span><b>Dir</b>${escapeHtml(item.address)}</span>` : ""}
        </div>
        ${mapsUrl ? `<div class="list-actions"><button class="btn ghost" type="button" data-open-maps="${escapeHtml(mapsUrl)}">Abrir en Google Maps</button></div>` : ""}
      </div>
    `;
  }).join("");
};

const renderVisitList = () => {
  if (!visitList) return;
  const entities = getActiveVisitEntities();
  if (!entities.length) {
    visitList.innerHTML = '<div class="list-item muted">Selecciona prospectos o clientes y crea una lista de visitas.</div>';
    return;
  }
  visitList.innerHTML = entities.map((entity, index) => {
    const item = entity.item;
    const lastVisit = item.visitLast || {};
    const result = String(lastVisit.result || "").trim();
    const observation = escapeHtml(lastVisit.observation || "");
    const mapsUrl = buildGoogleMapsLocationUrl(item);
    return `
      <div class="list-item visit-item" data-visit-key="${entity.type}:${entity.id}">
        <div class="visit-item-head">
          <strong>${index + 1}. ${escapeHtml(entity.name)}</strong>
          <span>${entity.type === "prospect" ? "Prospecto" : "Cliente"}</span>
        </div>
        <div class="client-item-details">
          ${item.phone ? `<span><b>Tel</b>${escapeHtml(item.phone)}</span>` : ""}
          ${item.address ? `<span><b>Dir</b>${escapeHtml(item.address)}</span>` : ""}
          ${item.city ? `<span><b>Ciudad</b>${escapeHtml(item.city)}</span>` : ""}
          ${item.zone ? `<span><b>Zona</b>${escapeHtml(item.zone)}</span>` : ""}
        </div>
        <div class="visit-result-grid">
          <label>
            Resultado de visita
            <select data-visit-result>
              ${buildVisitResultOptions(result)}
            </select>
          </label>
          <label>
            Observacion
            <textarea data-visit-observation rows="2">${observation}</textarea>
          </label>
        </div>
        <div class="list-actions">
          <button class="btn ghost" type="button" data-mark-visited="${entity.type}:${entity.id}">Marcar como visitado</button>
          ${mapsUrl ? `<button class="btn ghost" type="button" data-open-maps="${escapeHtml(mapsUrl)}">Abrir en Google Maps</button>` : ""}
        </div>
      </div>
    `;
  }).join("");
};

const buildRawMaterialRows = () => {
  const { availabilityMap } = computeStockTotals();
  return state.rawMaterials.map((item) => {
    const available = availabilityMap[item.id] ?? 0;
    const unitCost = getMaterialUnitCost(item);
    const stockValue = available * unitCost;
    const status = getStockStatus({ available, minStock: item.minStock });
    return {
      ...item,
      available,
      unitCost,
      stockValue,
      status
    };
  });
};

const updateRawMaterialFilterOptions = (rows) => {
  const buildOptions = (values, placeholder) => {
    const unique = Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, "es"));
    return [`<option value="">${placeholder}</option>`]
      .concat(unique.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
      .join("");
  };
  if (rawMaterialCategoryFilter) {
    const current = rawMaterialCategoryFilter.value;
    rawMaterialCategoryFilter.innerHTML = buildOptions(rows.map((row) => row.category), "Todas");
    rawMaterialCategoryFilter.value = Array.from(rawMaterialCategoryFilter.options).some((option) => option.value === current) ? current : "";
  }
  if (rawMaterialUnitFilter) {
    const current = rawMaterialUnitFilter.value;
    rawMaterialUnitFilter.innerHTML = buildOptions(rows.map((row) => row.unit), "Todas");
    rawMaterialUnitFilter.value = Array.from(rawMaterialUnitFilter.options).some((option) => option.value === current) ? current : "";
  }
};

const getFilteredRawMaterialRows = (rows) => {
  const search = normalizeText(rawMaterialFiltersState.search);
  const category = normalizeText(rawMaterialFiltersState.category);
  const status = normalizeText(rawMaterialFiltersState.status);
  const unit = normalizeText(rawMaterialFiltersState.unit);
  return rows.filter((row) => {
    if (search && !normalizeText(row.name).includes(search)) return false;
    if (category && normalizeText(row.category) !== category) return false;
    if (status && row.status.key !== status) return false;
    if (unit && normalizeText(row.unit) !== unit) return false;
    return true;
  });
};

const renderRawMaterialSummary = (rows) => {
  if (!rawMaterialSummary) return;
  const totalValue = rows.reduce((sum, row) => sum + Number(row.stockValue || 0), 0);
  const totalStock = rows.reduce((sum, row) => sum + Math.max(0, Number(row.available || 0)), 0);
  const lowRows = rows.filter((row) => row.status.key === "bajo");
  const criticalRows = rows.filter((row) => row.status.key === "critico");
  rawMaterialSummary.innerHTML = `
    <div class="raw-material-summary-item">
      <span>Total registradas</span>
      <strong>${formatInteger(rows.length)}</strong>
    </div>
    <div class="raw-material-summary-item">
      <span>Stock total disponible</span>
      <strong>${formatNumber(totalStock)}</strong>
      <small>unidades base mixtas</small>
    </div>
    <div class="raw-material-summary-item">
      <span>Valor total en stock</span>
      <strong>Gs ${formatGs(totalValue)}</strong>
    </div>
    <div class="raw-material-summary-item warning">
      <span>Stock bajo</span>
      <strong>${formatInteger(lowRows.length)}</strong>
    </div>
    <div class="raw-material-summary-item danger">
      <span>Criticas</span>
      <strong>${formatInteger(criticalRows.length)}</strong>
    </div>
  `;
};

const renderRawMaterialControlCenter = () => {
  if (!rawMaterialList) return;
  const rows = buildRawMaterialRows();
  updateRawMaterialFilterOptions(rows);
  renderRawMaterialSummary(rows);
  const filteredRows = getFilteredRawMaterialRows(rows);
  if (!filteredRows.length) {
    rawMaterialList.innerHTML = '<div class="list-item muted">No hay materias primas para los filtros seleccionados.</div>';
    return;
  }
  rawMaterialList.innerHTML = `
    <table class="raw-material-table">
      <thead>
        <tr>
          <th>Materia prima</th>
          <th>Categoria</th>
          <th>Unidad</th>
          <th>Stock actual</th>
          <th>Stock minimo</th>
          <th>Costo unitario</th>
          <th>Valor en stock</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${filteredRows.map((row) => `
          <tr class="${row.status.alertClass}">
            <td data-label="Materia prima">
              <strong>${escapeHtml(row.name || "Materia prima")}</strong>
              ${row.supplier ? `<small>Proveedor: ${escapeHtml(row.supplier)}</small>` : ""}
            </td>
            <td data-label="Categoria">${escapeHtml(row.category || "Sin categoria")}</td>
            <td data-label="Unidad">${escapeHtml(row.unit || "-")}</td>
            <td data-label="Stock actual">${formatNumber(row.available)} ${escapeHtml(row.unit || "")}</td>
            <td data-label="Stock minimo">${row.minStock ? `${formatNumber(row.minStock)} ${escapeHtml(row.unit || "")}` : "-"}</td>
            <td data-label="Costo unitario">Gs ${formatGs(row.unitCost)}</td>
            <td data-label="Valor en stock">Gs ${formatGs(row.stockValue)}</td>
            <td data-label="Estado"><span class="status-tag ${row.status.tagClass}">${row.status.label}</span></td>
            <td data-label="Acciones">
              <div class="raw-material-row-actions">
                <button class="btn ghost" type="button" data-edit-raw-material="${row.id}">Editar</button>
                <button class="btn ghost" type="button" data-view-raw-material-movements="${row.id}">Movimientos</button>
                <button class="btn ghost danger" type="button" data-delete-raw-material="${row.id}">Eliminar</button>
              </div>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
};

const renderProspectsWorkspace = () => {
  pruneVisitPlannerState();
  renderProspectIndicators();
  renderProspectImportHistory();
  renderProspectList();
  renderVisitClientList();
  renderVisitList();
  if (visitClientsCount) visitClientsCount.textContent = formatInteger(state.clients.length);
};

const renderProspectImportHistory = () => {
  if (!prospectImportHistory) return;
  const sessions = (state.prospectImportSessions || []).slice(0, 4);
  if (!sessions.length) {
    prospectImportHistory.innerHTML = "";
    return;
  }
  const latest = sessions[0];
  const latestDate = latest?.createdAt?.seconds ? formatDate(new Date(latest.createdAt.seconds * 1000).toISOString().slice(0, 10)) : "-";
  const totalImported = sessions.reduce((sum, session) => sum + Number(session.importedCount || 0), 0);
  prospectImportHistory.innerHTML = `
    <div class="import-history-card ${prospectImportHistoryOpen ? "open" : ""}">
      <button class="import-history-head" type="button" data-toggle-import-history aria-expanded="${prospectImportHistoryOpen ? "true" : "false"}">
        <span>
          <strong>Historial de importaciones</strong>
          <small>${formatInteger(sessions.length)} sesion${sessions.length === 1 ? "" : "es"} - ${formatInteger(totalImported)} prospecto${totalImported === 1 ? "" : "s"} importado${totalImported === 1 ? "" : "s"} - Ultima: ${escapeHtml(latestDate)}</small>
        </span>
        <i data-lucide="chevron-down" class="import-history-chevron"></i>
      </button>
      <div class="import-history-body" ${prospectImportHistoryOpen ? "" : "hidden"}>
        ${sessions.map((session) => {
          const date = session.createdAt?.seconds ? formatDate(new Date(session.createdAt.seconds * 1000).toISOString().slice(0, 10)) : "-";
          return `
            <div class="import-history-row">
              <div>
                <strong>${escapeHtml(session.fileName || "JSON")}</strong>
                <div class="muted">${date} - ${formatInteger(session.importedCount || 0)} importados - ${escapeHtml(session.status || "completed")}</div>
              </div>
              <button class="btn ghost btn-xs" type="button" data-open-import-history="${escapeHtml(session.importSessionId || "")}">Ver en mapa</button>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
  refreshIcons();
  return;
  /*
  prospectImportHistory.innerHTML = `
    <div class="import-history-row">
      <div>
        <strong>Historial de importaciones</strong>
        <div class="muted">${sessions.map((session) => {
          const date = session.createdAt?.seconds ? formatDate(new Date(session.createdAt.seconds * 1000).toISOString().slice(0, 10)) : "-";
          return `${date}: ${escapeHtml(session.fileName || "JSON")} (${formatInteger(session.importedCount || 0)} importados)`;
        }).join(" · ")}</div>
      </div>
      <button class="btn ghost btn-xs" type="button" data-open-import-history>Ver ultimo</button>
    </div>
  `;
  */
};

/* ===================== Panel de control comercial ===================== */
const commercialDashboardState = { period: "month", customStart: "", customEnd: "" };
let commercialSalesChart = null;

const getRollingPeriodRange = (period, customStart = "", customEnd = "") => {
  const todayIso = toDateInputValue(new Date());
  if (period === "today") {
    const prev = addDaysToDateValue(todayIso, -1);
    return { startDate: todayIso, endDate: todayIso, prevStart: prev, prevEnd: prev, label: "Hoy" };
  }
  if (period === "week") {
    const start = addDaysToDateValue(todayIso, -6);
    const prevEnd = addDaysToDateValue(start, -1);
    const prevStart = addDaysToDateValue(prevEnd, -6);
    return { startDate: start, endDate: todayIso, prevStart, prevEnd, label: "Esta semana" };
  }
  if (period === "custom") {
    const startDate = normalizeDateValue(customStart);
    const endDate = normalizeDateValue(customEnd);
    if (startDate && endDate && startDate <= endDate) {
      const dayCount = Math.max(1, (toIsoDayNumber(endDate) ?? 0) - (toIsoDayNumber(startDate) ?? 0) + 1);
      const prevEnd = addDaysToDateValue(startDate, -1);
      const prevStart = addDaysToDateValue(prevEnd, -(dayCount - 1));
      return {
        startDate,
        endDate,
        prevStart,
        prevEnd,
        label: `${formatIsoDateLabel(startDate)} - ${formatIsoDateLabel(endDate)}`
      };
    }
  }
  const r = getCurrentMonthRange();
  const pr = getPreviousMonthRange();
  return { ...r, prevStart: pr.startDate, prevEnd: pr.endDate, label: "Este mes" };
};

const getCommercialPeriodRange = (period) => {
  return getRollingPeriodRange(period, commercialDashboardState.customStart, commercialDashboardState.customEnd);
};

const getSalesInRange = (startDate, endDate) => state.sales.filter((sale) => {
  const d = getSaleDateValue(sale);
  return d && d >= startDate && d <= endDate;
});

const getClientCommercialKey = (sale) => sale.clientId
  ? `id:${sale.clientId}`
  : `name:${normalizeText(sale.clientName || "")}`;

const isRecordInRange = (value, startDate, endDate) => {
  const d = normalizeDateValue(value);
  return d && d >= startDate && d <= endDate;
};

const renderCommercialKpis = (range) => {
  const row = document.getElementById("commercialKpiRow");
  if (!row) return;
  const sales = getSalesInRange(range.startDate, range.endDate);
  const prevSales = getSalesInRange(range.prevStart, range.prevEnd);
  const totalAmount = sales.reduce((sum, s) => sum + getSaleTotalAmount(s), 0);
  const prevAmount = prevSales.reduce((sum, s) => sum + getSaleTotalAmount(s), 0);
  const count = sales.length;
  const ticket = count ? totalAmount / count : 0;
  const buyers = new Set(sales.map(getClientCommercialKey).filter((k) => k && k !== "name:")).size;
  const newClients = state.clients.filter((c) => isRecordInRange(c.createdAt, range.startDate, range.endDate)).length;
  const followups = buildRepurchaseFollowups();
  const repurchasePending = followups.filter((f) => f.statusClass === "overdue" || f.statusClass === "today").length;
  const newProspects = state.prospects.filter((p) => isRecordInRange(p.createdAt, range.startDate, range.endDate)).length;
  const visitsPending = state.prospects.filter((p) => p.status === "visita_pendiente").length;

  let variation = "";
  if (prevAmount > 0) {
    const pct = Math.round(((totalAmount - prevAmount) / prevAmount) * 100);
    const cls = pct >= 0 ? "up" : "down";
    const arrow = pct >= 0 ? "▲" : "▼";
    variation = `<div class="kpi-sub ${cls}">${arrow} ${Math.abs(pct)}% vs periodo previo</div>`;
  } else {
    variation = `<div class="kpi-sub">Sin datos del periodo previo</div>`;
  }

  const cards = [
    { label: "Ventas del periodo", value: `Gs ${formatGs(totalAmount)}`, extra: variation, accent: "kpi-accent" },
    { label: "Cantidad de ventas", value: formatInteger(count), sub: "ventas registradas" },
    { label: "Ticket promedio", value: `Gs ${formatGs(ticket)}`, sub: "por venta" },
    { label: "Clientes que compraron", value: formatInteger(buyers), sub: "clientes distintos" },
    { label: "Nuevos clientes", value: formatInteger(newClients), sub: "altas del periodo" },
    { label: "Recompra pendiente", value: formatInteger(repurchasePending), sub: "vencidas o de hoy", accent: repurchasePending ? "kpi-warn" : "" },
    { label: "Prospectos nuevos", value: formatInteger(newProspects), sub: "cargados en el periodo" },
    { label: "Visitas pendientes", value: formatInteger(visitsPending), sub: "prospectos por visitar" }
  ];

  row.innerHTML = cards.map((c) => `
    <div class="kpi-card ${c.accent || ""}">
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-value">${c.value}</div>
      ${c.extra || (c.sub ? `<div class="kpi-sub">${c.sub}</div>` : "")}
    </div>
  `).join("");
};

const renderCommercialTopProducts = (range) => {
  const tbody = document.querySelector("#commercialTopProductsTable tbody");
  if (!tbody) return;
  const sales = getSalesInRange(range.startDate, range.endDate);
  const byProduct = new Map();
  let totalRevenue = 0;
  sales.forEach((sale) => {
    getSaleLineItems(sale).forEach((line) => {
      const name = String(line.productName || "Sin nombre").trim() || "Sin nombre";
      const key = line.productId || `name:${normalizeText(name)}`;
      const units = Number(line.quantity || 0);
      const revenue = Number.isFinite(Number(line.total))
        ? Number(line.total)
        : units * Number(line.unitPrice || 0);
      totalRevenue += revenue;
      const current = byProduct.get(key) || { name, units: 0, revenue: 0 };
      current.units += units;
      current.revenue += revenue;
      byProduct.set(key, current);
    });
  });
  const rows = Array.from(byProduct.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  if (!rows.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Sin ventas en el periodo</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((r) => {
    const share = totalRevenue > 0 ? Math.round((r.revenue / totalRevenue) * 100) : 0;
    return `<tr>
      <td>${escapeHtml(r.name)}</td>
      <td class="num">${formatNumber(r.units)}</td>
      <td class="num">Gs ${formatGs(r.revenue)}</td>
      <td class="num">${share}%</td>
    </tr>`;
  }).join("");
};

const renderCommercialTopClients = (range) => {
  const tbody = document.querySelector("#commercialTopClientsTable tbody");
  if (!tbody) return;
  const sales = getSalesInRange(range.startDate, range.endDate);
  const byClient = new Map();
  sales.forEach((sale) => {
    const key = getClientCommercialKey(sale);
    if (!key || key === "name:") return;
    const name = sale.clientName || getSaleClientDetails(sale).name || "Sin cliente";
    const date = getSaleDateValue(sale);
    const current = byClient.get(key) || { name, total: 0, count: 0, lastDate: "" };
    current.total += getSaleTotalAmount(sale);
    current.count += 1;
    if (date > current.lastDate) current.lastDate = date;
    byClient.set(key, current);
  });
  const rows = Array.from(byClient.values()).sort((a, b) => b.total - a.total).slice(0, 6);
  if (!rows.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Sin ventas en el periodo</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((r) => `<tr>
    <td>${escapeHtml(r.name)}</td>
    <td class="num">Gs ${formatGs(r.total)}</td>
    <td class="num">${formatInteger(r.count)}</td>
    <td>${r.lastDate ? formatDate(r.lastDate) : "-"}</td>
  </tr>`).join("");
};

const renderCommercialCoverage = (range) => {
  const tbody = document.querySelector("#commercialCoverageTable tbody");
  if (!tbody) return;
  const sales = getSalesInRange(range.startDate, range.endDate);
  const byCity = new Map();
  const cityOf = (raw) => {
    const c = String(raw || "").trim();
    return c || "Sin ciudad";
  };
  const ensure = (city) => {
    if (!byCity.has(city)) byCity.set(city, { city, sales: 0, revenue: 0, clients: 0, prospects: 0 });
    return byCity.get(city);
  };
  sales.forEach((sale) => {
    const linked = state.clients.find((c) => c.id === sale.clientId);
    const city = cityOf(linked?.city || sale.city);
    const entry = ensure(city);
    entry.sales += 1;
    entry.revenue += getSaleTotalAmount(sale);
  });
  state.clients.forEach((c) => { ensure(cityOf(c.city)).clients += 1; });
  state.prospects.forEach((p) => { ensure(cityOf(p.city)).prospects += 1; });
  const rows = Array.from(byCity.values())
    .sort((a, b) => b.revenue - a.revenue || b.clients - a.clients)
    .slice(0, 8);
  if (!rows.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Sin datos de cobertura</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((r) => `<tr>
    <td>${escapeHtml(r.city)}</td>
    <td class="num">${formatInteger(r.sales)}</td>
    <td class="num">Gs ${formatGs(r.revenue)}</td>
    <td class="num">${formatInteger(r.clients)}</td>
    <td class="num">${formatInteger(r.prospects)}</td>
  </tr>`).join("");
};

const renderCommercialFollowups = () => {
  const repurchaseEl = document.getElementById("commercialRepurchaseList");
  const prospectsEl = document.getElementById("commercialProspectsList");
  if (repurchaseEl) {
    const followups = buildRepurchaseFollowups()
      .filter((f) => f.statusClass === "overdue" || f.statusClass === "today")
      .slice(0, 6);
    repurchaseEl.innerHTML = followups.length
      ? followups.map((f) => {
        const tag = f.statusClass === "overdue"
          ? `<span class="followup-tag overdue">${f.overdueDays}d vencida</span>`
          : `<span class="followup-tag today">Hoy</span>`;
        return `<div class="followup-row"><span class="followup-name">${escapeHtml(f.clientName)}</span>${tag}</div>`;
      }).join("")
      : `<div class="empty-hint">Sin recompras vencidas. Buen trabajo.</div>`;
  }
  if (prospectsEl) {
    const inactiveStatuses = new Set(["convertido_cliente", "no_interesado", "descartado"]);
    const pending = state.prospects
      .filter((p) => !normalizeDateValue(p.nextActionDate) && !inactiveStatuses.has(p.status))
      .slice(0, 6);
    prospectsEl.innerHTML = pending.length
      ? pending.map((p) => {
        const city = String(p.city || "").trim();
        return `<div class="followup-row"><span class="followup-name">${escapeHtml(p.name || "Prospecto")}</span><span class="followup-tag upcoming">${escapeHtml(city || "Sin ciudad")}</span></div>`;
      }).join("")
      : `<div class="empty-hint">Todos los prospectos tienen proxima accion.</div>`;
  }
};

const renderCommercialSalesChart = (range) => {
  const canvas = document.getElementById("commercialSalesChart");
  const meta = document.getElementById("commercialEvolutionMeta");
  if (!canvas || typeof window.Chart !== "function") return;
  const visible = canvas.offsetParent !== null;
  if (!visible) {
    if (commercialSalesChart) { commercialSalesChart.destroy(); commercialSalesChart = null; }
    return;
  }
  const sales = getSalesInRange(range.startDate, range.endDate);
  const totals = new Map();
  const startDay = toIsoDayNumber(range.startDate);
  const endDay = toIsoDayNumber(range.endDate);
  const labels = [];
  const data = [];
  if (startDay !== null && endDay !== null && endDay - startDay <= 92) {
    for (let day = startDay; day <= endDay; day += 1) {
      const iso = addDaysToDateValue(range.startDate, day - startDay);
      totals.set(iso, 0);
    }
    sales.forEach((sale) => {
      const d = getSaleDateValue(sale);
      if (totals.has(d)) totals.set(d, totals.get(d) + getSaleTotalAmount(sale));
    });
    totals.forEach((value, iso) => {
      const [, m, dd] = iso.split("-");
      labels.push(`${dd}/${m}`);
      data.push(value);
    });
  }
  const total = data.reduce((sum, v) => sum + v, 0);
  if (meta) meta.textContent = `${range.label} · Gs ${formatGs(total)}`;
  if (commercialSalesChart) commercialSalesChart.destroy();
  commercialSalesChart = new window.Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Facturacion",
        data,
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.12)",
        fill: true,
        tension: 0.3,
        pointRadius: data.length > 31 ? 0 : 3,
        pointBackgroundColor: "#16a34a"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => `Gs ${formatGs(ctx.parsed.y)}` }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (value) => formatGs(value) }
        }
      }
    }
  });
};

const renderCommercialDashboard = () => {
  if (!document.getElementById("commercialDashboard")) return;
  const range = getCommercialPeriodRange(commercialDashboardState.period);
  if (commercialPeriodLabel) commercialPeriodLabel.textContent = range.label;
  renderCommercialKpis(range);
  renderCommercialTopProducts(range);
  renderCommercialTopClients(range);
  renderCommercialCoverage(range);
  renderCommercialFollowups();
  renderCommercialSalesChart(range);
};

const setupCommercialDashboard = () => {
  const selector = document.getElementById("commercialPeriodSelector");
  if (selector) {
    selector.addEventListener("click", (event) => {
      const btn = event.target.closest(".period-btn");
      if (!btn) return;
      const nextPeriod = btn.dataset.period || "month";
      if (nextPeriod === "custom") {
        commercialRangePanel?.classList.toggle("hidden");
        btn.setAttribute("aria-expanded", commercialRangePanel?.classList.contains("hidden") ? "false" : "true");
        if (commercialRangeFrom && commercialDashboardState.customStart) commercialRangeFrom.value = commercialDashboardState.customStart;
        if (commercialRangeTo && commercialDashboardState.customEnd) commercialRangeTo.value = commercialDashboardState.customEnd;
        return;
      }
      commercialDashboardState.period = nextPeriod;
      commercialDashboardState.customStart = "";
      commercialDashboardState.customEnd = "";
      commercialRangePanel?.classList.add("hidden");
      selector.querySelectorAll(".period-btn").forEach((b) => {
        b.classList.toggle("active", b === btn);
        if (b.dataset.period === "custom") b.setAttribute("aria-expanded", "false");
      });
      renderCommercialDashboard();
    });
  }
  commercialRangeApply?.addEventListener("click", () => {
    const start = normalizeDateValue(commercialRangeFrom?.value);
    const end = normalizeDateValue(commercialRangeTo?.value);
    if (!start || !end || start > end) {
      if (commercialRangeError) commercialRangeError.textContent = "Selecciona un rango valido.";
      return;
    }
    if (commercialRangeError) commercialRangeError.textContent = "";
    commercialDashboardState.period = "custom";
    commercialDashboardState.customStart = start;
    commercialDashboardState.customEnd = end;
    commercialRangePanel?.classList.add("hidden");
    selector?.querySelectorAll(".period-btn").forEach((b) => {
      const isCustom = b.dataset.period === "custom";
      b.classList.toggle("active", isCustom);
      if (isCustom) b.setAttribute("aria-expanded", "false");
    });
    renderCommercialDashboard();
  });
  commercialRangeClear?.addEventListener("click", () => {
    if (commercialRangeFrom) commercialRangeFrom.value = "";
    if (commercialRangeTo) commercialRangeTo.value = "";
    if (commercialRangeError) commercialRangeError.textContent = "";
    commercialDashboardState.period = "month";
    commercialDashboardState.customStart = "";
    commercialDashboardState.customEnd = "";
    commercialRangePanel?.classList.add("hidden");
    selector?.querySelectorAll(".period-btn").forEach((b) => {
      const isMonth = b.dataset.period === "month";
      b.classList.toggle("active", isMonth);
      if (b.dataset.period === "custom") b.setAttribute("aria-expanded", "false");
    });
    renderCommercialDashboard();
  });
  commercialRangeCancel?.addEventListener("click", () => {
    commercialRangePanel?.classList.add("hidden");
    selector?.querySelector('[data-period="custom"]')?.setAttribute("aria-expanded", "false");
  });
  const dashboard = document.getElementById("commercialDashboard");
  if (dashboard) {
    dashboard.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-open-section]");
      if (!opener) return;
      setActiveAppSection(opener.dataset.openSection);
    });
  }
};

const getSalesHistoryRange = () => getRollingPeriodRange(
  salesHistoryState.period,
  salesHistoryState.customStart,
  salesHistoryState.customEnd
);

const updateSalesHistoryPaymentOptions = () => {
  if (!salesHistoryPaymentFilter) return;
  const selected = salesHistoryPaymentFilter.value;
  const methods = Array.from(new Set(state.sales.map((sale) => String(sale.payment || "").trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "es"));
  salesHistoryPaymentFilter.innerHTML = [
    '<option value="">Metodo: todos</option>',
    ...methods.map((method) => `<option value="${escapeHtml(method)}">${escapeHtml(method)}</option>`)
  ].join("");
  if (methods.includes(selected)) salesHistoryPaymentFilter.value = selected;
};

const getFilteredSalesHistory = () => {
  const range = getSalesHistoryRange();
  const search = normalizeText(salesHistoryState.search);
  const payment = normalizeText(salesHistoryState.payment);
  const credit = salesHistoryState.credit;
  return state.sales
    .filter((sale) => {
      const saleDate = getSaleDateValue(sale);
      if (!saleDate || saleDate < range.startDate || saleDate > range.endDate) return false;
      const details = getSaleClientDetails(sale);
      if (search && !normalizeText([details.name, sale.clientName].filter(Boolean).join(" ")).includes(search)) return false;
      if (payment && normalizeText(sale.payment) !== payment) return false;
      if (credit === "cash" && isCreditSaleRecord(sale)) return false;
      if (credit === "credit" && !isCreditSaleRecord(sale)) return false;
      return true;
    })
    .sort((a, b) => {
      const bDay = toIsoDayNumber(getSaleDateValue(b)) ?? 0;
      const aDay = toIsoDayNumber(getSaleDateValue(a)) ?? 0;
      if (bDay !== aDay) return bDay - aDay;
      return getSaleCreatedTimestamp(b) - getSaleCreatedTimestamp(a);
    });
};

const getSaleTimeLabel = (sale) => {
  const raw = sale?.createdAt?.toDate?.()
    || (typeof sale?.createdAt?.seconds === "number" ? new Date(sale.createdAt.seconds * 1000) : null)
    || (typeof sale?.createdAtMs === "number" ? new Date(sale.createdAtMs) : null);
  return raw ? formatTime(raw) : "";
};

const renderSalesHistory = () => {
  if (!saleList) return;
  updateSalesHistoryPaymentOptions();
  const range = getSalesHistoryRange();
  const sales = getFilteredSalesHistory();
  const total = sales.reduce((sum, sale) => sum + getSaleTotalAmount(sale), 0);
  if (salesHistoryCount) salesHistoryCount.textContent = `${formatInteger(sales.length)} venta${sales.length === 1 ? "" : "s"}`;
  if (salesHistoryTotal) salesHistoryTotal.textContent = `Gs ${formatGs(total)}`;
  if (salesHistoryPeriodLabel) salesHistoryPeriodLabel.textContent = range.label;
  if (!sales.length) {
    saleList.innerHTML = '<div class="list-item muted">No hay ventas para los filtros seleccionados.</div>';
    return;
  }
  saleList.innerHTML = sales.map((item) => {
    const lines = getSaleLineItems(item);
    const saleTotal = getSaleTotalAmount(item);
    const isCreditSale = isCreditSaleRecord(item);
    const productsPreview = lines.slice(0, 2).map((line) => `
      <span class="sale-product-pill">${escapeHtml(line.productName || "Producto")} · ${formatInteger(line.quantity)} ${escapeHtml(line.unit || "disp")}</span>
    `).join("");
    const hiddenCount = Math.max(0, lines.length - 2);
    const detailOpen = saleDetailOpenState.has(item.id);
    const repurchaseText = item.repurchaseActive
      ? `Cada ${formatInteger(item.repurchaseFrequencyDays || 0)} dias`
      : "Sin recompra";
    const nextRepurchase = item.repurchaseNextContactDate ? formatDate(item.repurchaseNextContactDate) : "-";
    return `
      <div class="sale-history-item">
        <div class="sale-history-main">
          <div class="sale-history-block sale-history-client">
            <strong>${escapeHtml(item.clientName || getSaleClientDetails(item).name || "Sin cliente")}</strong>
            <span>${formatDate(getSaleDateValue(item))}${getSaleTimeLabel(item) ? ` · ${getSaleTimeLabel(item)}` : ""}</span>
          </div>
          <div class="sale-history-block sale-history-products">
            ${productsPreview || '<span class="muted">Sin productos</span>'}
            ${hiddenCount ? `<span class="sale-product-more">+${hiddenCount} productos</span>` : ""}
          </div>
          <div class="sale-history-block sale-history-payment">
            <strong>Gs ${formatGs(saleTotal)}</strong>
            <span>${escapeHtml(item.payment || "-")} · ${isCreditSale ? "Credito" : "Contado"}</span>
          </div>
          <div class="sale-history-block sale-history-followup">
            <span>${repurchaseText}</span>
            <small>Proxima: ${nextRepurchase}</small>
            ${item.observation ? `<small title="${escapeHtml(item.observation)}">${escapeHtml(item.observation)}</small>` : ""}
          </div>
          <div class="sale-history-actions">
            <button class="icon-btn" type="button" data-share-sale="${item.id}" title="Compartir"><i data-lucide="share-2"></i></button>
            <button class="icon-btn" type="button" data-edit-sale="${item.id}" title="Editar"><i data-lucide="pencil"></i></button>
            <button class="icon-btn" type="button" data-toggle-sale-detail="${item.id}" title="Ver detalle"><i data-lucide="${detailOpen ? "chevron-up" : "chevron-down"}"></i></button>
            <button class="icon-btn icon-btn-danger" type="button" data-delete-sale="${item.id}" title="Eliminar"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        <div class="sale-history-detail ${detailOpen ? "open" : ""}">
          ${lines.map((line) => `
            <div><span>${escapeHtml(line.productName || "Producto")}</span><strong>${formatInteger(line.quantity)} x Gs ${formatGs(line.unitPrice)} = Gs ${formatGs(line.total ?? Number(line.quantity || 0) * Number(line.unitPrice || 0))}</strong></div>
          `).join("") || '<div class="muted">Sin detalle de productos.</div>'}
        </div>
      </div>
    `;
  }).join("");
  refreshIcons();
};

const renderClientDirectory = () => {
  if (!clientList) return;
  const search = normalizeText(clientListState.search);
  const clients = state.clients.filter((item) => {
    if (!search) return true;
    const haystack = normalizeText([item.name, item.phone, item.ruc, item.city, item.zone, item.address].filter(Boolean).join(" "));
    return haystack.includes(search);
  });
  if (clientListCount) clientListCount.textContent = `${formatInteger(clients.length)} cliente${clients.length === 1 ? "" : "s"}`;
  renderList(clientList, clients, (item) => {
    const historyOpen = clientHistoryOpenState.has(item.id);
    const mapsUrl = buildGoogleMapsLocationUrl(item);
    const clientDetails = [
      item.ruc ? `<span><b>RUC</b>${escapeHtml(item.ruc)}</span>` : "",
      item.phone ? `<span><b>Tel</b>${escapeHtml(item.phone)}</span>` : "",
      item.city ? `<span><b>Ciudad</b>${escapeHtml(item.city)}</span>` : "",
      item.zone ? `<span><b>Zona</b>${escapeHtml(item.zone)}</span>` : "",
      item.address ? `<span><b>Dir</b>${escapeHtml(item.address)}</span>` : ""
    ].filter(Boolean).join("");
    return `
    <div class="list-item client-item">
      <div class="client-item-main">
        <strong>${escapeHtml(item.name)}</strong>
        ${item.notes ? `<div class="muted">Notas: ${escapeHtml(item.notes)}</div>` : ""}
      </div>
      <div class="client-item-details">
        ${clientDetails || '<span class="muted">Sin datos comerciales cargados</span>'}
      </div>
      <div class="list-actions client-item-actions">
        ${mapsUrl ? `<button class="btn ghost" type="button" data-open-maps="${escapeHtml(mapsUrl)}">Maps</button>` : ""}
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
};

const renderAll = () => {
  renderRawMaterialControlCenter();

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

  if (recipeList) {
    const recipeCards = state.recipes.map((item) => `
      <div class="list-item">
        <strong>${item.name}</strong>
        ${buildRecipeSummary(item)}
        <div class="list-actions">
          <button class="btn ghost" type="button" data-edit-recipe="${item.id}">Editar</button>
          <button class="btn ghost danger" type="button" data-delete-recipe="${item.id}">Eliminar</button>
        </div>
      </div>
    `);
    const missingFormulaCards = state.products
      .filter((product) => !state.recipes.some((recipe) => {
        if (recipe.productId && recipe.productId === product.id) return true;
        return normalizeText(recipe.name) === normalizeText(product.name);
      }))
      .map((product) => `
        <div class="list-item">
          <strong>${escapeHtml(product.name || "Producto")}</strong>
          <div><span class="status-tag status-low">Sin formula</span></div>
          <div class="muted">Puede vincularse cargando una formula con este producto.</div>
        </div>
      `);
    const recipeMarkup = recipeCards.concat(missingFormulaCards);
    recipeList.innerHTML = recipeMarkup.length
      ? recipeMarkup.join("")
      : '<div class="list-item muted">Sin formulas ni productos registrados todavia.</div>';
  }

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

  renderClientDirectory();
  renderSalesHistory();

  renderProspectsWorkspace();
  renderRepurchaseList();
  renderSalesCoverage();
  renderCommercialHistory();
  renderCommercialDashboard();
  if (commercialMap) refreshCommercialMap();
  renderFinanceMovement();
  renderFinanceReceivables();
  renderFinanceCategorySummary();
  renderFinanceActiveSummary();
  renderFinanceInitialHistory();

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

const closeSidebar = () => {
  appShell?.classList.remove("sidebar-open");
  sidebarToggle?.setAttribute("aria-expanded", "false");
};

const toggleSidebar = () => {
  if (window.matchMedia("(min-width: 721px)").matches) {
    toggleSidebarCollapsed();
    return;
  }
  const isOpen = appShell?.classList.toggle("sidebar-open");
  sidebarToggle?.setAttribute("aria-expanded", isOpen ? "true" : "false");
};

const applySidebarCollapsed = (collapsed) => {
  appShell?.classList.toggle("sidebar-collapsed", collapsed);
  document.body.classList.toggle("sidebar-is-collapsed", Boolean(collapsed));
  if (sidebarToggle) {
    sidebarToggle.setAttribute("aria-label", collapsed ? "Abrir menu" : "Cerrar menu");
    sidebarToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    sidebarToggle.title = collapsed ? "Abrir menu" : "Cerrar menu";
  }
  requestAnimationFrame(() => {
    refreshCollapseHeights();
    resizeCommercialMap(260);
  });
};

const toggleSidebarCollapsed = () => {
  const collapsed = !appShell?.classList.contains("sidebar-collapsed");
  applySidebarCollapsed(collapsed);
  resizeCommercialMap(300);
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch (error) {
    /* localStorage no disponible */
  }
};

const restoreSidebarCollapsed = () => {
  let collapsed = false;
  try {
    collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch (error) {
    collapsed = false;
  }
  applySidebarCollapsed(collapsed);
};

const classifyAppSectionCards = () => {
  const sectionByCollapse = {
    prodToday: "production",
    finishedStockSection: "stock",
    stockSummarySection: "stock",
    stockSection: "stock",
    rawMaterialSection: "raw-materials",
    recipeSection: "products raw-materials",
    salesFormSection: "sales",
    salesHistorySection: "sales",
    clientFormSection: "clients",
    clientListSection: "clients",
    prospectsSection: "prospects",
    productsSection: "products",
    salesGoalSection: "sales",
    repurchaseSection: "repurchase",
    coverageSection: "sales"
  };
  Object.entries(sectionByCollapse).forEach(([collapseId, section]) => {
    const card = document.getElementById(collapseId)?.closest(".card");
    if (card) card.dataset.appSection = section;
  });
};

const applyAppSectionCardVisibility = (section) => {
  const config = APP_SECTION_CONFIG[section] || APP_SECTION_CONFIG.dashboard;
  panels.forEach((panel) => {
    const isActivePanel = panel.id === config.tab;
    panel.querySelectorAll(".card[data-app-section]").forEach((card) => {
      const sections = String(card.dataset.appSection || "").split(/\s+/).filter(Boolean);
      const shouldHide = isActivePanel && !sections.includes(section);
      card.classList.toggle("app-section-hidden", shouldHide);
    });
  });
};

const syncAppSectionCollapses = (section) => {
  const config = APP_SECTION_CONFIG[section] || APP_SECTION_CONFIG.dashboard;
  const allowed = new Set(config.collapses || []);
  document.querySelectorAll(".collapse-toggle[data-collapse]").forEach((toggle) => {
    const body = document.getElementById(toggle.dataset.collapse);
    if (!body) return;
    const card = body.closest(".card");
    const isRelevant = allowed.has(toggle.dataset.collapse) && !card?.classList.contains("app-section-hidden");
    if (isRelevant) {
      openSection(toggle, body);
    } else if (section !== "reports" && section !== "settings") {
      closeSection(toggle, body);
    }
  });
};

const setActiveAppSection = (section) => {
  const safeSection = APP_SECTION_CONFIG[section] ? section : "dashboard";
  activeAppSection = safeSection;
  const config = APP_SECTION_CONFIG[safeSection];
  if (dashboardSection) dashboardSection.dataset.appSection = safeSection;
  sidebarLinks.forEach((link) => {
    const isActive = link.dataset.appSection === safeSection;
    link.classList.toggle("active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
  setActiveTab(config.tab);
  applyAppSectionCardVisibility(safeSection);
  syncAppSectionCollapses(safeSection);
  closeSidebar();
  requestAnimationFrame(() => {
    refreshCollapseHeights();
    if (safeSection === "sales") focusFirstSaleProductField();
    if (safeSection === "dashboard") renderCommercialDashboard();
    if (safeSection === "map") { ensureCommercialMap(); resizeCommercialMap(80); resizeCommercialMap(380); }
    if (safeSection === "journeys") {
      document.getElementById("journeyListSection")?.removeAttribute("hidden");
      document.getElementById("journeyActiveSection")?.setAttribute("hidden", "");
      if (activeJourneyId) {
        document.getElementById("journeyListSection")?.setAttribute("hidden", "");
        document.getElementById("journeyActiveSection")?.removeAttribute("hidden");
        renderActiveJourney(activeJourneyId);
      } else {
        loadAndRenderJourneys();
      }
    }
    if (config.collapses?.includes("coverageSection")) renderSalesCoverage({ animatePins: true });
  });
};

const setupSidebarNavigation = () => {
  classifyAppSectionCards();
  sidebarToggle?.addEventListener("click", toggleSidebar);
  sidebarCollapseBtn?.addEventListener("click", toggleSidebarCollapsed);
  sidebarBackdrop?.addEventListener("click", closeSidebar);
  restoreSidebarCollapsed();
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setActiveAppSection(link.dataset.appSection || "dashboard");
    });
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });
  setActiveAppSection(activeAppSection);
};

const showRawMaterialForm = () => {
  rawMaterialFormPanel?.classList.remove("hidden");
  requestAnimationFrame(() => {
    refreshCollapseHeights();
    rawMaterialForm?.name?.focus();
  });
};

const hideRawMaterialForm = () => {
  rawMaterialFormPanel?.classList.add("hidden");
  resetForm(rawMaterialForm);
  setUnitGroupValue("rawMaterialUnit", "");
  requestAnimationFrame(refreshCollapseHeights);
};

const openRawMaterialStockEntry = (materialId = "") => {
  setActiveAppSection("stock");
  const stockBody = openExclusiveCollapseSection("stockSection");
  if (purchaseForm?.material && materialId) {
    purchaseForm.material.value = materialId;
    const material = state.rawMaterials.find((item) => item.id === materialId);
    if (material) setUnitGroupValue("purchaseUnit", material.unit || "");
    updatePurchaseTotal();
  }
  requestAnimationFrame(() => {
    refreshCollapseHeights();
    const stockCard = stockBody?.closest(".card") || document.getElementById("stockSection");
    stockCard?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
};

const updateRawMaterialFiltersFromInputs = () => {
  rawMaterialFiltersState.search = rawMaterialSearch?.value || "";
  rawMaterialFiltersState.category = rawMaterialCategoryFilter?.value || "";
  rawMaterialFiltersState.status = rawMaterialStatusFilter?.value || "";
  rawMaterialFiltersState.unit = rawMaterialUnitFilter?.value || "";
};

const recalculateAndPersistRecipeCosts = async () => {
  const user = auth.currentUser;
  if (!user) return;
  if (recipeRecalculateNotice) {
    recipeRecalculateNotice.className = "error info";
    recipeRecalculateNotice.textContent = "Actualizando costos...";
  }
  try {
    const operations = [];
    state.recipes.forEach((recipe) => {
      const totals = calculateRecipeCurrentTotals(recipe);
      operations.push(updateDoc(doc(db, "recipes", recipe.id), {
        ingredients: totals.ingredients.map((ing) => ({
          materialId: ing.materialId,
          materialName: ing.materialName,
          quantity: ing.quantity,
          unit: ing.unit,
          quantityBase: ing.quantityBase,
          unitBase: ing.unitBase,
          unitCost: ing.unitCost,
          totalCost: ing.totalCost
        })),
        totalCost: totals.totalCost,
        costPerUnit: totals.costPerUnit,
        costPerKg: totals.costPerKg ?? 0,
        productCostPerDisplay: totals.productCostPerDisplay ?? 0,
        totalDisplayCost: totals.totalDisplayCost ?? 0,
        packaging: {
          ...(recipe.packaging || {}),
          packagingCost: totals.packagingCost
        },
        updatedAt: serverTimestamp(),
        costUpdatedAt: serverTimestamp()
      }));
      const product = findProductForRecipe(recipe);
      if (product?.id) {
        operations.push(updateDoc(doc(db, "products", product.id), {
          estimatedCost: totals.totalDisplayCost ?? totals.costPerUnit ?? 0,
          estimatedFormulaCost: totals.totalCost,
          estimatedCostPerUnit: totals.costPerUnit,
          estimatedCostPerDisplay: totals.totalDisplayCost ?? 0,
          formulaId: recipe.id,
          formulaStatus: "vinculada",
          costUpdatedAt: serverTimestamp()
        }));
      }
    });
    await Promise.all(operations);
    if (recipeRecalculateNotice) {
      recipeRecalculateNotice.className = "error success";
      recipeRecalculateNotice.textContent = `Costos actualizados en ${formatInteger(state.recipes.length)} formulas.`;
    }
  } catch (error) {
    console.error("No se pudieron actualizar costos de productos:", error);
    if (recipeRecalculateNotice) {
      recipeRecalculateNotice.className = "error";
      recipeRecalculateNotice.textContent = "No se pudieron actualizar los costos. Intenta nuevamente.";
    }
  }
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

forgotPasswordBtn?.addEventListener("click", async () => {
  const { email } = getLoginCredentials();
  if (!email) {
    setAuthFeedback("Escribi tu correo arriba y volve a tocar 'Olvide mi contrasena'.", "error");
    return;
  }
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!looksLikeEmail) {
    setAuthFeedback("Ingresa un correo valido para recuperar la contrasena.", "error");
    return;
  }
  try {
    console.log("[auth] reset password", email);
    forgotPasswordBtn.disabled = true;
    setAuthFeedback("Enviando correo de recuperacion...", "info");
    await sendPasswordResetEmail(auth, email);
    setAuthFeedback(`Listo: te enviamos un correo a ${email} para restablecer la contrasena. Revisa tu bandeja de entrada y la carpeta de spam.`, "success");
  } catch (error) {
    console.error("[auth] reset error", error);
    setAuthFeedback(getAuthMessage(error), "error");
  } finally {
    forgotPasswordBtn.disabled = false;
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
  updateRawMaterialUnitCost();
  const referenceQuantity = Number(rawMaterialForm.referenceQuantity.value) || 1;
  const referenceCostTotal = Number(rawMaterialForm.referenceCostTotal.value);
  const referenceCost = Number(rawMaterialForm.referenceCost.value);
  const price = Number.isNaN(referenceCost) ? 0 : referenceCost;
  const minStock = rawMaterialForm.minStock.value ? Number(rawMaterialForm.minStock.value) : null;
  const legacyReferenceQuantity = rawMaterialForm.legacyReferenceQuantity.value;
  const legacyReferenceCostTotal = rawMaterialForm.legacyReferenceCostTotal.value;
  const editId = rawMaterialForm.dataset.editId || "";
  const payload = {
    name: rawMaterialForm.name.value.trim(),
    category: rawMaterialForm.category?.value.trim() || "",
    unit: rawMaterialForm.unit.value.trim(),
    price,
    referenceQuantity,
    referenceCostTotal: Number.isNaN(referenceCostTotal) ? 0 : referenceCostTotal,
    referenceCost: Number.isNaN(referenceCost) ? 0 : referenceCost,
    minStock,
    supplier: rawMaterialForm.supplier.value.trim(),
    lastPurchaseDate: rawMaterialForm.lastPurchaseDate?.value || "",
    observations: rawMaterialForm.observations?.value.trim() || "",
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  if (legacyReferenceQuantity) payload.legacyReferenceQuantity = Number(legacyReferenceQuantity);
  if (legacyReferenceCostTotal) payload.legacyReferenceCostTotal = Number(legacyReferenceCostTotal);
  const materialDocId = await saveDoc("raw_materials", rawMaterialForm, payload);
  if (!editId && materialDocId && referenceQuantity > 0 && price > 0) {
    await addDoc(collection(db, "raw_purchases"), {
      materialId: materialDocId,
      materialName: payload.name,
      unit: payload.unit,
      quantityPurchased: referenceQuantity,
      unitPurchased: payload.unit,
      date: payload.lastPurchaseDate || toDateInputValue(new Date()),
      quantity: referenceQuantity,
      unitPrice: price,
      total: Number.isNaN(referenceCostTotal) ? price * referenceQuantity : referenceCostTotal,
      supplier: payload.supplier,
      type: "ingreso inicial",
      userId: user.uid,
      createdAt: serverTimestamp()
    });
  }
  resetForm(rawMaterialForm);
  setUnitGroupValue("rawMaterialUnit", rawMaterialForm.unit.value);
  rawMaterialFormPanel?.classList.add("hidden");
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
  if (normalized === null) {
    window.alert(`No se puede convertir ${unitRaw} a ${material.unit}. Usa la misma unidad base de la materia prima.`);
    return;
  }
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
  await updateDoc(doc(db, "raw_materials", materialId), {
    price: unitPriceBase,
    referenceCost: unitPriceBase,
    referenceCostTotal: totalCost,
    referenceQuantity: quantityBase,
    lastPurchaseDate: purchaseForm.date.value,
    updatedAt: serverTimestamp()
  });
  resetForm(purchaseForm);
});


addIngredientBtn.addEventListener("click", () => {
  const materialId = recipeForm.material.value;
  const material = state.rawMaterials.find((item) => item.id === materialId);
  const quantity = Number(recipeForm.quantity.value);
  if (!material || !quantity) return;
  const unit = recipeForm.unit.value.trim() || material.unit;
  const unitCost = getMaterialUnitCost(material);
  const normalized = normalizeQuantity(quantity, unit, material.unit);
  if (normalized === null) {
    window.alert(`No se puede convertir ${unit} a ${material.unit}. Usa una unidad compatible con la materia prima.`);
    return;
  }
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
  const selectedProduct = state.products.find((item) => item.id === recipeProductSelect?.value);
  const matchedProduct = selectedProduct || state.products.find((item) => normalizeText(item.name) === normalizeText(productName));
  const payload = {
    name: matchedProduct?.name || productName,
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
  const currentRecipeTotals = calculateRecipeCurrentTotals(recipe);
  const { availabilityMap } = computeStockTotals();
  const shortages = [];
  const materialsToConsume = currentRecipeTotals.ingredients.map((ing) => {
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
      unitCost: getMaterialUnitCost(material) || Number(ing.unitCost || 0)
    };
  });

  if (shortages.length) {
    if (batchRecipeNotice) {
      batchRecipeNotice.textContent = `Stock insuficiente. ${shortages.join(" | ")}`;
    }
    return;
  }
  const criticalMaterials = materialsToConsume.filter((item) => {
    const rawMaterial = state.rawMaterials.find((material) => material.id === item.materialId);
    const status = getStockStatus({
      available: availabilityMap[item.materialId] ?? 0,
      minStock: rawMaterial?.minStock
    });
    return status.key === "critico";
  });
  if (criticalMaterials.length) {
    const names = criticalMaterials.map((item) => item.materialName).join(", ");
    const shouldContinue = window.confirm(`Advertencia: estas materias primas estan en estado critico: ${names}. ¿Registrar produccion de todos modos?`);
    if (!shouldContinue) return;
  }

  const costPerUnit = Number(currentRecipeTotals.costPerUnit || recipe.costPerUnit || 0);
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
    city: String(clientForm.city?.value || "").trim(),
    zone: String(clientForm.zone?.value || "").trim(),
    latitude: parseOptionalCoordinate(clientForm.latitude?.value),
    longitude: parseOptionalCoordinate(clientForm.longitude?.value),
    mapsLink: String(clientForm.mapsLink?.value || "").trim(),
    notes: String(clientForm.notes?.value || "").trim(),
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await saveDoc("clients", clientForm, payload);
  resetForm(clientForm);
});

const resetProspectForm = () => {
  if (!prospectForm) return;
  resetForm(prospectForm);
  if (prospectForm.nextActionDate) prospectForm.nextActionDate.value = "";
  prospectForm.dataset.editId = "";
  setSubmitLabel(prospectForm, "");
  prospectCancelEdit?.classList.add("hidden");
  if (prospectFormHeading) prospectFormHeading.textContent = "Nuevo prospecto";
};

const getProspectPayloadFromForm = (form = prospectForm) => {
  const status = normalizeOptionValue(PROSPECT_STATUS_OPTIONS, form.status?.value, "nuevo");
  return {
    name: formatClientName(form.name?.value || ""),
    contactName: String(form.contactName?.value || "").trim(),
    phone: normalizeProspectPhone(form.phone?.value || ""),
    city: String(form.city?.value || "").trim(),
    zone: String(form.zone?.value || "").trim(),
    address: String(form.address?.value || "").trim(),
    businessType: normalizeRubroKey(form.businessType?.value),
    status,
    potential: normalizeOptionValue(PROSPECT_POTENTIAL_OPTIONS, form.potential?.value),
    observations: String(form.observations?.value || "").trim(),
    nextAction: String(form.nextAction?.value || "").trim(),
    nextActionDate: normalizeDateValue(form.nextActionDate?.value || ""),
    latitude: parseOptionalCoordinate(form.latitude?.value),
    longitude: parseOptionalCoordinate(form.longitude?.value),
    mapsLink: String(form.mapsLink?.value || "").trim()
  };
};

const saveProspectFromForm = async (form, extraPayload = {}) => {
  const user = auth.currentUser;
  if (!user) return null;
  const payload = getProspectPayloadFromForm(form);
  if (!payload.name) {
    window.alert("Completa el nombre del local.");
    return null;
  }
  if (payload.latitude !== null && (payload.latitude < -90 || payload.latitude > 90)) {
    window.alert("La latitud no es valida.");
    return null;
  }
  if (payload.longitude !== null && (payload.longitude < -180 || payload.longitude > 180)) {
    window.alert("La longitud no es valida.");
    return null;
  }
  if (form?.name) form.name.value = payload.name;
  return saveDoc("prospects", form, {
    ...payload,
    ...extraPayload,
    userId: user.uid,
    createdAt: serverTimestamp()
  });
};

prospectForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const saved = await saveProspectFromForm(prospectForm);
  if (!saved) return;
  resetProspectForm();
  document.getElementById("prospectFormPanel")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
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
  if (show && quickClientNotice) {
    quickClientNotice.textContent = "";
  }
  if (show && quickClientName) focusQuickClientField(quickClientName);
};

quickClientToggle?.addEventListener("click", () => {
  const isHidden = quickClientPanel?.classList.contains("hidden");
  toggleQuickClient(isHidden);
});

quickClientCancel?.addEventListener("click", () => {
  if (quickClientNotice) quickClientNotice.textContent = "";
  toggleQuickClient(false);
  focusSaleClientField();
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

quickClientPanel?.addEventListener("keydown", (event) => {
  if (!isDesktopSalesKeyboardMode()) return;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    if (quickClientNotice) quickClientNotice.textContent = "";
    toggleQuickClient(false);
    focusSaleClientField();
    return;
  }

  if (event.key !== "Enter") return;
  event.preventDefault();
  event.stopPropagation();

  if (target === quickClientName) {
    focusQuickClientField(quickClientRucMain);
    return;
  }

  if (target === quickClientRucMain) {
    focusQuickClientField(quickClientRucDv);
    return;
  }

  if (target === quickClientRucDv) {
    focusQuickClientField(quickClientPhone);
    return;
  }

  if (target === quickClientPhone) {
    focusQuickClientField(quickClientAddress);
    return;
  }

  if (target === quickClientAddress) {
    focusQuickClientField(quickClientSave);
    return;
  }

  if (target === quickClientSave) {
    quickClientSave.click();
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

financeExpenseForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const amount = Number(financeExpenseForm.amount.value);
  if (!financeExpenseForm.date.value) {
    if (financeExpenseNotice) financeExpenseNotice.textContent = "Completa la fecha del egreso.";
    return;
  }
  if (!financeExpenseForm.category.value) {
    if (financeExpenseNotice) financeExpenseNotice.textContent = "Selecciona una categoria.";
    return;
  }
  if (!financeExpenseForm.description.value.trim()) {
    if (financeExpenseNotice) financeExpenseNotice.textContent = "Completa la descripcion del egreso.";
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    if (financeExpenseNotice) financeExpenseNotice.textContent = "Ingresa un monto valido mayor que 0.";
    return;
  }
  const payload = {
    date: financeExpenseForm.date.value,
    category: financeExpenseForm.category.value,
    description: financeExpenseForm.description.value.trim(),
    counterparty: financeExpenseForm.counterparty.value.trim(),
    amount,
    paymentMethod: financeExpenseForm.paymentMethod.value || "",
    status: "Pagado",
    observation: financeExpenseForm.observation.value.trim(),
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await saveDoc("financial_expenses", financeExpenseForm, payload);
  resetForm(financeExpenseForm);
  financeExpenseForm.date.valueAsDate = new Date();
  if (financeExpenseNotice) financeExpenseNotice.textContent = "";
});

financeInitialToggle?.addEventListener("click", () => {
  const isHidden = financeInitialPanel?.classList.contains("hidden");
  if (!isHidden) {
    closeFinanceInlinePanels();
    return;
  }
  openFinanceInitialPanel();
});

financeManualAdjustmentToggle?.addEventListener("click", () => {
  const isHidden = financeManualAdjustmentPanel?.classList.contains("hidden");
  if (!isHidden) {
    closeFinanceInlinePanels();
    return;
  }
  openFinanceManualAdjustmentPanel();
});

financeInitialForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const startDate = normalizeDateValue(financeInitialForm.startDate.value);
  const reason = String(financeInitialForm.reason.value || "").trim();
  if (!startDate) {
    if (financeInitialNotice) financeInitialNotice.textContent = "Completa la fecha de inicio financiero real.";
    return;
  }
  if (!reason) {
    if (financeInitialNotice) financeInitialNotice.textContent = "El motivo del corte financiero es obligatorio.";
    return;
  }
  const payload = {
    startDate,
    reason,
    userId: user.uid,
    userEmail: user.email || "",
    userName: user.displayName || "",
    createdAt: serverTimestamp(),
    createdAtMs: Date.now()
  };
  try {
    await addDoc(collection(db, "financial_initial_settings"), payload);
    if (financeInitialNotice) financeInitialNotice.textContent = "";
    closeFinanceInlinePanels();
  } catch (error) {
    console.error("No se pudo guardar el ajuste inicial financiero:", error);
    if (financeInitialNotice) financeInitialNotice.textContent = "No se pudo guardar el ajuste inicial financiero.";
  }
});

financeManualAdjustmentForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const date = normalizeDateValue(financeManualAdjustmentForm.date.value);
  const type = String(financeManualAdjustmentForm.type.value || "").trim().toLowerCase();
  const amount = Number(financeManualAdjustmentForm.amount.value);
  const reason = String(financeManualAdjustmentForm.reason.value || "").trim();
  const observation = String(financeManualAdjustmentForm.observation.value || "").trim();
  if (!date) {
    if (financeManualAdjustmentNotice) financeManualAdjustmentNotice.textContent = "Completa la fecha del ajuste.";
    return;
  }
  if (!["ingreso", "egreso", "correccion"].includes(type)) {
    if (financeManualAdjustmentNotice) financeManualAdjustmentNotice.textContent = "Selecciona un tipo de ajuste valido.";
    return;
  }
  if (!Number.isFinite(amount) || amount === 0) {
    if (financeManualAdjustmentNotice) financeManualAdjustmentNotice.textContent = "Ingresa un monto valido distinto de 0.";
    return;
  }
  if (!reason) {
    if (financeManualAdjustmentNotice) financeManualAdjustmentNotice.textContent = "El motivo del ajuste es obligatorio.";
    return;
  }
  const payload = {
    date,
    type,
    amount,
    reason,
    observation,
    userId: user.uid,
    userEmail: user.email || "",
    userName: user.displayName || "",
    createdAt: serverTimestamp(),
    createdAtMs: Date.now()
  };
  try {
    await addDoc(collection(db, "financial_manual_adjustments"), payload);
    resetForm(financeManualAdjustmentForm);
    financeManualAdjustmentForm.date.valueAsDate = new Date();
    if (financeManualAdjustmentNotice) financeManualAdjustmentNotice.textContent = "";
    closeFinanceInlinePanels();
  } catch (error) {
    console.error("No se pudo guardar el ajuste financiero:", error);
    if (financeManualAdjustmentNotice) financeManualAdjustmentNotice.textContent = "No se pudo guardar el ajuste financiero.";
  }
});

const startEditRawMaterial = (item) => {
  rawMaterialForm.name.value = item.name || "";
  if (rawMaterialForm.category) rawMaterialForm.category.value = item.category || "";
  setUnitGroupValue("rawMaterialUnit", item.unit || "");
  rawMaterialForm.referenceQuantity.value = item.referenceQuantity ?? 1;
  if (rawMaterialForm.referenceCostTotal) {
    rawMaterialForm.referenceCostTotal.value = item.referenceCostTotal ?? item.legacyReferenceCostTotal ?? "";
  }
  rawMaterialForm.referenceCost.value = item.price ?? item.referenceCost ?? "";
  rawMaterialForm.minStock.value = item.minStock ?? "";
  rawMaterialForm.legacyReferenceQuantity.value = item.referenceQuantity ?? "";
  rawMaterialForm.legacyReferenceCostTotal.value = item.referenceCost ?? "";
  rawMaterialForm.supplier.value = item.supplier || "";
  if (rawMaterialForm.lastPurchaseDate) rawMaterialForm.lastPurchaseDate.value = item.lastPurchaseDate || "";
  if (rawMaterialForm.observations) rawMaterialForm.observations.value = item.observations || "";
  rawMaterialForm.dataset.editId = item.id;
  setSubmitLabel(rawMaterialForm, "Actualizar materia prima");
  showRawMaterialForm();
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
  if (recipeProductSelect) {
    const product = state.products.find((productItem) => productItem.id === item.productId)
      || state.products.find((productItem) => normalizeText(productItem.name) === normalizeText(item.name));
    recipeProductSelect.value = product?.id || "";
  }
  recipeForm.yieldQuantity.value = item.yieldQuantity ?? "";
  setUnitGroupValue("recipeYieldUnit", item.yieldUnit || "");
  recipeForm.boxCost.value = item.packaging?.boxCost ?? "";
  recipeForm.wrapCost.value = item.packaging?.wrapCost ?? "";
  recipeForm.wrapCount.value = item.packaging?.wrapCount ?? 12;
  recipeForm.dataset.editId = item.id;
  recipeDraft.ingredients = (item.ingredients || []).map((ing) => {
    const material = state.rawMaterials.find((m) => m.id === ing.materialId);
    const unitCost = material ? getMaterialUnitCost(material) : Number(ing.unitCost || 0);
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
  if (clientForm.city) clientForm.city.value = item.city || "";
  if (clientForm.zone) clientForm.zone.value = item.zone || "";
  if (clientForm.latitude) clientForm.latitude.value = item.latitude ?? "";
  if (clientForm.longitude) clientForm.longitude.value = item.longitude ?? "";
  if (clientForm.mapsLink) clientForm.mapsLink.value = item.mapsLink || "";
  if (clientForm.notes) clientForm.notes.value = item.notes || "";
  clientForm.dataset.editId = item.id;
  setSubmitLabel(clientForm, "Actualizar cliente");
  const body = document.getElementById("clientFormSection");
  const toggle = document.querySelector('.collapse-toggle[data-collapse="clientFormSection"]');
  if (body && toggle) openSection(toggle, body);
  requestAnimationFrame(() => {
    refreshCollapseHeights();
    clientForm.name?.focus();
  });
};

const isProspectFormDirty = () => {
  if (!prospectForm) return false;
  return Array.from(new FormData(prospectForm).values()).some((value) => String(value || "").trim());
};

const openProspectFormPanel = () => {
  const panel = document.getElementById("prospectFormPanel");
  panel?.classList.remove("hidden");
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => {
    prospectForm?.name?.focus();
    refreshIcons();
  });
};

const closeProspectFormPanel = ({ force = false } = {}) => {
  if (!force && isProspectFormDirty() && !window.confirm("Cerrar el formulario sin guardar los cambios?")) return false;
  document.getElementById("prospectFormPanel")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
  resetProspectForm();
  return true;
};

const startEditProspect = (item) => {
  if (!prospectForm) return;
  prospectForm.name.value = item.name || "";
  prospectForm.contactName.value = item.contactName || "";
  prospectForm.phone.value = item.phone || "";
  prospectForm.city.value = item.city || "";
  prospectForm.zone.value = item.zone || "";
  prospectForm.address.value = item.address || "";
  fillBusinessTypeSelect(prospectForm.businessType, { includeAll: false, currentValue: item.businessType });
  prospectForm.status.value = normalizeOptionValue(PROSPECT_STATUS_OPTIONS, item.status, "nuevo");
  prospectForm.potential.value = normalizeOptionValue(PROSPECT_POTENTIAL_OPTIONS, item.potential);
  prospectForm.observations.value = item.observations || "";
  prospectForm.nextAction.value = item.nextAction || "";
  prospectForm.nextActionDate.value = normalizeDateValue(item.nextActionDate || "");
  prospectForm.latitude.value = item.latitude ?? "";
  prospectForm.longitude.value = item.longitude ?? "";
  prospectForm.mapsLink.value = item.mapsLink || "";
  prospectForm.dataset.editId = item.id;
  setSubmitLabel(prospectForm, "Actualizar prospecto");
  prospectCancelEdit?.classList.remove("hidden");
  if (prospectFormHeading) prospectFormHeading.textContent = `Editar: ${item.name || "prospecto"}`;
  openProspectFormPanel();
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
  const body = document.getElementById("salesFormSection");
  const toggle = document.querySelector('.collapse-toggle[data-collapse="salesFormSection"]');
  if (body && toggle) openSection(toggle, body);
  requestAnimationFrame(() => {
    refreshCollapseHeights();
    saleForm.client?.focus();
  });
};

const confirmDelete = (label) => window.confirm(`Eliminar ${label}?`);

const convertProspectToClient = async (prospect) => {
  const user = auth.currentUser;
  if (!user || !prospect?.id) return;
  const clientRef = doc(collection(db, "clients"));
  const prospectRef = doc(db, "prospects", prospect.id);
  const convertedAt = toDateInputValue(new Date());
  const originNote = [
    `Origen: prospecto "${prospect.name || "sin nombre"}"`,
    prospect.contactName ? `Contacto: ${prospect.contactName}` : "",
    prospect.businessType ? `Rubro: ${getBusinessTypeLabel(prospect.businessType)}` : "",
    prospect.potential ? `Potencial: ${getOptionLabel(PROSPECT_POTENTIAL_OPTIONS, prospect.potential)}` : "",
    prospect.observations ? `Observaciones: ${prospect.observations}` : ""
  ].filter(Boolean).join("\n");
  const normalizedPhone = normalizePhoneForStorage(prospect.phone) || normalizeProspectPhone(prospect.phone);
  const batch = writeBatch(db);
  batch.set(clientRef, {
    name: formatClientName(prospect.name || "") || prospect.name || "Cliente sin nombre",
    ruc: "",
    phone: normalizedPhone || "",
    address: prospect.address || "",
    city: prospect.city || "",
    zone: prospect.zone || "",
    latitude: Number.isFinite(Number(prospect.latitude)) ? Number(prospect.latitude) : null,
    longitude: Number.isFinite(Number(prospect.longitude)) ? Number(prospect.longitude) : null,
    mapsLink: prospect.mapsLink || "",
    notes: originNote,
    source: {
      type: "prospect",
      prospectId: prospect.id,
      convertedAt
    },
    userId: user.uid,
    createdAt: serverTimestamp()
  });
  batch.update(prospectRef, {
    status: "convertido_cliente",
    convertedClientId: clientRef.id,
    convertedAt,
    conversionObservation: `Convertido a cliente el ${formatDate(convertedAt)}.`,
    updatedAt: serverTimestamp()
  });
  await batch.commit();
};

const getProspectStatusAfterVisit = (currentStatus, result) => {
  if (result === "no_interesado") return "no_interesado";
  if (result === "reagendar") return "visita_pendiente";
  if (result === "compro" || result === "pidio_precio") return "interesado";
  return normalizeOptionValue(PROSPECT_STATUS_OPTIONS, currentStatus, "visitado") === "convertido_cliente"
    ? "convertido_cliente"
    : "visitado";
};

const saveVisitResult = async (visitKey, result, observation) => {
  const entity = getVisitEntityByKey(visitKey);
  if (!entity) return;
  const user = auth.currentUser;
  const visitedAt = toDateInputValue(new Date());
  const historyEntry = {
    date: visitedAt,
    result: normalizeOptionValue(VISIT_RESULT_OPTIONS, result),
    observation: String(observation || "").trim(),
    userName: String(user?.displayName || "").trim(),
    userEmail: String(user?.email || "").trim(),
    createdAtMs: Date.now()
  };
  const collectionName = entity.type === "prospect" ? "prospects" : "clients";
  const payload = {
    visitLast: historyEntry,
    visitHistory: arrayUnion(historyEntry),
    updatedAt: serverTimestamp()
  };
  if (entity.type === "prospect") {
    payload.status = getProspectStatusAfterVisit(entity.item.status, historyEntry.result);
  }
  await updateDoc(doc(db, collectionName, entity.id), payload);
};

rawMaterialList.addEventListener("click", async (event) => {
  const editId = event.target.dataset.editRawMaterial;
  const deleteId = event.target.dataset.deleteRawMaterial;
  const movementId = event.target.dataset.viewRawMaterialMovements;
  if (editId) {
    const item = state.rawMaterials.find((m) => m.id === editId);
    if (item) startEditRawMaterial(item);
  }
  if (movementId) {
    openRawMaterialStockEntry(movementId);
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
  const mapsBtn = event.target.closest("[data-open-maps]");
  if (mapsBtn) {
    event.stopPropagation();
    const link = String(mapsBtn.dataset.openMaps || "").trim();
    if (link) window.open(link, "_blank", "noopener,noreferrer");
    return;
  }
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

prospectList?.addEventListener("click", async (event) => {
  const mapsBtn = event.target.closest("[data-open-maps]");
  if (mapsBtn) {
    event.stopPropagation();
    const link = String(mapsBtn.dataset.openMaps || "").trim();
    if (link) window.open(link, "_blank", "noopener,noreferrer");
    return;
  }

  const whatsappBtn = event.target.closest("[data-whatsapp-link]");
  if (whatsappBtn) {
    const link = String(whatsappBtn.dataset.whatsappLink || "").trim();
    if (link) window.open(link, "_blank", "noopener,noreferrer");
    return;
  }

  const detailId = event.target.closest("[data-toggle-prospect-detail]")?.dataset.toggleProspectDetail;
  if (detailId) {
    const safeId = String(detailId).trim();
    if (prospectDetailOpenState.has(safeId)) {
      prospectDetailOpenState.delete(safeId);
    } else {
      prospectDetailOpenState.clear();
      prospectDetailOpenState.add(safeId);
    }
    renderProspectList();
    requestAnimationFrame(refreshCollapseHeights);
    return;
  }

  const convertId = event.target.closest("[data-convert-prospect]")?.dataset.convertProspect;
  if (convertId) {
    const prospect = state.prospects.find((item) => item.id === convertId);
    if (!prospect) return;
    if (!window.confirm(`Convertir "${prospect.name || "prospecto"}" a cliente?`)) return;
    try {
      await convertProspectToClient(prospect);
    } catch (error) {
      console.error("No se pudo convertir prospecto:", error);
      window.alert("No se pudo convertir el prospecto. Intenta nuevamente.");
    }
    return;
  }

  const editId = event.target.closest("[data-edit-prospect]")?.dataset.editProspect;
  if (editId) {
    const item = state.prospects.find((prospect) => prospect.id === editId);
    if (item) startEditProspect(item);
    return;
  }

  const deleteId = event.target.closest("[data-delete-prospect]")?.dataset.deleteProspect;
  if (deleteId && confirmDelete("prospecto")) {
    await deleteDoc(doc(db, "prospects", deleteId));
  }
});

visitClientList?.addEventListener("click", (event) => {
  const mapsBtn = event.target.closest("[data-open-maps]");
  if (!mapsBtn) return;
  const link = String(mapsBtn.dataset.openMaps || "").trim();
  if (link) window.open(link, "_blank", "noopener,noreferrer");
});

visitList?.addEventListener("click", async (event) => {
  const mapsBtn = event.target.closest("[data-open-maps]");
  if (mapsBtn) {
    const link = String(mapsBtn.dataset.openMaps || "").trim();
    if (link) window.open(link, "_blank", "noopener,noreferrer");
    return;
  }

  const markBtn = event.target.closest("[data-mark-visited]");
  if (!markBtn) return;
  const visitKey = String(markBtn.dataset.markVisited || "").trim();
  const row = markBtn.closest(".visit-item");
  const result = String(row?.querySelector("[data-visit-result]")?.value || "").trim();
  const observation = String(row?.querySelector("[data-visit-observation]")?.value || "").trim();
  try {
    await saveVisitResult(visitKey, result, observation);
    renderProspectsWorkspace();
  } catch (error) {
    console.error("No se pudo guardar resultado de visita:", error);
    window.alert("No se pudo guardar el resultado de la visita.");
  }
});

saleList.addEventListener("click", async (event) => {
  const shareId = event.target.closest("[data-share-sale]")?.dataset.shareSale;
  const editId = event.target.closest("[data-edit-sale]")?.dataset.editSale;
  const deleteId = event.target.closest("[data-delete-sale]")?.dataset.deleteSale;
  const detailId = event.target.closest("[data-toggle-sale-detail]")?.dataset.toggleSaleDetail;
  if (detailId) {
    const safeId = String(detailId).trim();
    if (saleDetailOpenState.has(safeId)) {
      saleDetailOpenState.delete(safeId);
    } else {
      saleDetailOpenState.add(safeId);
    }
    renderSalesHistory();
    requestAnimationFrame(refreshCollapseHeights);
    return;
  }
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

const updateProspectFilterState = () => {
  prospectFiltersState.search = prospectSearch?.value || "";
  prospectFiltersState.city = prospectCityFilter?.value || "";
  prospectFiltersState.zone = prospectZoneFilter?.value || "";
  prospectFiltersState.businessType = prospectBusinessFilter?.value || "";
  prospectFiltersState.status = prospectStatusFilter?.value || "";
  prospectFiltersState.potential = prospectPotentialFilter?.value || "";
  prospectFiltersState.location = prospectLocationFilter?.value || "";
};

[prospectSearch, prospectCityFilter, prospectZoneFilter, prospectBusinessFilter, prospectStatusFilter, prospectPotentialFilter, prospectLocationFilter]
  .forEach((input) => {
    input?.addEventListener("input", () => {
      updateProspectFilterState();
      renderProspectList();
      requestAnimationFrame(refreshCollapseHeights);
    });
    input?.addEventListener("change", () => {
      updateProspectFilterState();
      renderProspectList();
      requestAnimationFrame(refreshCollapseHeights);
    });
  });

clearProspectFiltersBtn?.addEventListener("click", () => {
  [prospectSearch, prospectCityFilter, prospectZoneFilter, prospectBusinessFilter, prospectStatusFilter, prospectPotentialFilter, prospectLocationFilter]
    .forEach((input) => { if (input) input.value = ""; });
  updateProspectFilterState();
  renderProspectList();
  requestAnimationFrame(refreshCollapseHeights);
});

clientListSearch?.addEventListener("input", () => {
  clientListState.search = clientListSearch.value || "";
  renderClientDirectory();
  requestAnimationFrame(refreshCollapseHeights);
});

clientListClearFilters?.addEventListener("click", () => {
  clientListState.search = "";
  if (clientListSearch) clientListSearch.value = "";
  renderClientDirectory();
  requestAnimationFrame(refreshCollapseHeights);
});

salesHistoryPeriodSelector?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-sales-period]");
  if (!btn) return;
  const nextPeriod = btn.dataset.salesPeriod || "month";
  if (nextPeriod === "custom") {
    salesHistoryRangePanel?.classList.toggle("hidden");
    btn.setAttribute("aria-expanded", salesHistoryRangePanel?.classList.contains("hidden") ? "false" : "true");
    if (salesHistoryRangeFrom && salesHistoryState.customStart) salesHistoryRangeFrom.value = salesHistoryState.customStart;
    if (salesHistoryRangeTo && salesHistoryState.customEnd) salesHistoryRangeTo.value = salesHistoryState.customEnd;
    return;
  }
  salesHistoryState.period = nextPeriod;
  salesHistoryState.customStart = "";
  salesHistoryState.customEnd = "";
  salesHistoryRangePanel?.classList.add("hidden");
  salesHistoryPeriodSelector.querySelectorAll("[data-sales-period]").forEach((periodBtn) => {
    periodBtn.classList.toggle("active", periodBtn === btn);
    if (periodBtn.dataset.salesPeriod === "custom") periodBtn.setAttribute("aria-expanded", "false");
  });
  renderSalesHistory();
  requestAnimationFrame(refreshCollapseHeights);
});

salesHistoryRangeApply?.addEventListener("click", () => {
  const start = normalizeDateValue(salesHistoryRangeFrom?.value);
  const end = normalizeDateValue(salesHistoryRangeTo?.value);
  if (!start || !end || start > end) {
    if (salesHistoryRangeError) salesHistoryRangeError.textContent = "Selecciona un rango valido.";
    return;
  }
  if (salesHistoryRangeError) salesHistoryRangeError.textContent = "";
  salesHistoryState.period = "custom";
  salesHistoryState.customStart = start;
  salesHistoryState.customEnd = end;
  salesHistoryRangePanel?.classList.add("hidden");
  salesHistoryPeriodSelector?.querySelectorAll("[data-sales-period]").forEach((btn) => {
    const isCustom = btn.dataset.salesPeriod === "custom";
    btn.classList.toggle("active", isCustom);
    if (isCustom) btn.setAttribute("aria-expanded", "false");
  });
  renderSalesHistory();
  requestAnimationFrame(refreshCollapseHeights);
});

salesHistoryRangeClear?.addEventListener("click", () => {
  if (salesHistoryRangeFrom) salesHistoryRangeFrom.value = "";
  if (salesHistoryRangeTo) salesHistoryRangeTo.value = "";
  if (salesHistoryRangeError) salesHistoryRangeError.textContent = "";
  salesHistoryState.period = "month";
  salesHistoryState.customStart = "";
  salesHistoryState.customEnd = "";
  salesHistoryRangePanel?.classList.add("hidden");
  salesHistoryPeriodSelector?.querySelectorAll("[data-sales-period]").forEach((btn) => {
    const isMonth = btn.dataset.salesPeriod === "month";
    btn.classList.toggle("active", isMonth);
    if (btn.dataset.salesPeriod === "custom") btn.setAttribute("aria-expanded", "false");
  });
  renderSalesHistory();
  requestAnimationFrame(refreshCollapseHeights);
});

salesHistoryRangeCancel?.addEventListener("click", () => {
  salesHistoryRangePanel?.classList.add("hidden");
  salesHistoryPeriodSelector?.querySelector('[data-sales-period="custom"]')?.setAttribute("aria-expanded", "false");
});

[salesHistorySearch, salesHistoryPaymentFilter, salesHistoryCreditFilter].forEach((input) => {
  input?.addEventListener("input", () => {
    salesHistoryState.search = salesHistorySearch?.value || "";
    salesHistoryState.payment = salesHistoryPaymentFilter?.value || "";
    salesHistoryState.credit = salesHistoryCreditFilter?.value || "";
    renderSalesHistory();
    requestAnimationFrame(refreshCollapseHeights);
  });
  input?.addEventListener("change", () => {
    salesHistoryState.search = salesHistorySearch?.value || "";
    salesHistoryState.payment = salesHistoryPaymentFilter?.value || "";
    salesHistoryState.credit = salesHistoryCreditFilter?.value || "";
    renderSalesHistory();
    requestAnimationFrame(refreshCollapseHeights);
  });
});

salesHistoryClearFilters?.addEventListener("click", () => {
  salesHistoryState.search = "";
  salesHistoryState.payment = "";
  salesHistoryState.credit = "";
  if (salesHistorySearch) salesHistorySearch.value = "";
  if (salesHistoryPaymentFilter) salesHistoryPaymentFilter.value = "";
  if (salesHistoryCreditFilter) salesHistoryCreditFilter.value = "";
  renderSalesHistory();
  requestAnimationFrame(refreshCollapseHeights);
});

newProspectBtn?.addEventListener("click", () => {
  resetProspectForm();
  openProspectFormPanel();
});

prospectSelectAll?.addEventListener("change", () => {
  const visible = getFilteredProspects();
  if (prospectSelectAll.checked) {
    visible.forEach((item) => {
      const key = getVisitKey("prospect", item.id);
      if (visitPlannerState.selectedKeys.size < MAX_ROUTE_STOPS) visitPlannerState.selectedKeys.add(key);
    });
  } else {
    visible.forEach((item) => visitPlannerState.selectedKeys.delete(getVisitKey("prospect", item.id)));
  }
  renderProspectsWorkspace();
  requestAnimationFrame(refreshCollapseHeights);
});

prospectClearSelectionBtn?.addEventListener("click", () => {
  visitPlannerState.selectedKeys.clear();
  visitPlannerState.activeKeys = [];
  renderProspectsWorkspace();
  requestAnimationFrame(refreshCollapseHeights);
});

prospectBulkVisitBtn?.addEventListener("click", () => {
  const selected = Array.from(visitPlannerState.selectedKeys).slice(0, MAX_ROUTE_STOPS);
  if (!selected.length) {
    window.alert("Selecciona al menos un prospecto.");
    return;
  }
  visitPlannerState.activeKeys = selected;
  renderVisitList();
  document.getElementById("visitPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  requestAnimationFrame(refreshCollapseHeights);
});

exportProspectsBtn?.addEventListener("click", () => {
  exportProspectsToCsv();
});

visitClientsToggle?.addEventListener("click", () => {
  const expanded = visitClientsToggle.getAttribute("aria-expanded") === "true";
  visitClientsToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
  if (visitClientsBody) visitClientsBody.hidden = expanded;
  visitClientsToggle.closest(".collapsible-panel")?.classList.toggle("open", !expanded);
  requestAnimationFrame(refreshCollapseHeights);
});

visitClientSearch?.addEventListener("input", () => {
  renderVisitClientList();
  requestAnimationFrame(refreshCollapseHeights);
});

prospectCancelEdit?.addEventListener("click", () => {
  closeProspectFormPanel({ force: true });
});

prospectCancelForm?.addEventListener("click", () => {
  closeProspectFormPanel();
});

prospectCloseForm?.addEventListener("click", () => {
  closeProspectFormPanel();
});

createVisitListBtn?.addEventListener("click", () => {
  const selected = Array.from(visitPlannerState.selectedKeys).slice(0, MAX_ROUTE_STOPS);
  if (!selected.length) {
    window.alert("Selecciona al menos un prospecto o cliente.");
    return;
  }
  visitPlannerState.activeKeys = selected;
  renderVisitList();
  requestAnimationFrame(refreshCollapseHeights);
});

openVisitRouteBtn?.addEventListener("click", () => {
  const activeEntities = getActiveVisitEntities();
  const selectedEntities = Array.from(visitPlannerState.selectedKeys)
    .map((key) => getVisitEntityByKey(key))
    .filter(Boolean);
  const entities = activeEntities.length ? activeEntities : selectedEntities;
  const routeUrl = buildGoogleMapsRouteUrl(entities.map((entity) => entity.item));
  if (!routeUrl) {
    window.alert("Carga direccion, latitud/longitud o link de Maps para abrir la ruta.");
    return;
  }
  window.open(routeUrl, "_blank", "noopener,noreferrer");
});

document.addEventListener("change", async (event) => {
  const visitInput = event.target.closest("[data-visit-select]");
  if (visitInput) {
    const key = getVisitKey(visitInput.dataset.visitSelect, visitInput.dataset.visitId);
    if (visitInput.checked && !visitPlannerState.selectedKeys.has(key) && visitPlannerState.selectedKeys.size >= MAX_ROUTE_STOPS) {
      visitInput.checked = false;
      window.alert(`Selecciona hasta ${MAX_ROUTE_STOPS} paradas por ruta.`);
      return;
    }
    if (visitInput.checked) {
      visitPlannerState.selectedKeys.add(key);
    } else {
      visitPlannerState.selectedKeys.delete(key);
      visitPlannerState.activeKeys = visitPlannerState.activeKeys.filter((itemKey) => itemKey !== key);
    }
    renderProspectsWorkspace();
    requestAnimationFrame(refreshCollapseHeights);
    return;
  }

  const statusInput = event.target.closest("[data-prospect-status]");
  if (!statusInput) return;
  const prospectId = String(statusInput.dataset.prospectStatus || "").trim();
  const status = normalizeOptionValue(PROSPECT_STATUS_OPTIONS, statusInput.value, "nuevo");
  if (!prospectId) return;
  try {
    await updateDoc(doc(db, "prospects", prospectId), {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("No se pudo actualizar estado comercial:", error);
    window.alert("No se pudo actualizar el estado del prospecto.");
  }
});

purchaseForm.quantity.addEventListener("input", () => {
  updatePurchaseTotal();
});

purchaseForm.totalCost.addEventListener("input", () => {
  updatePurchaseTotal();
});

rawMaterialForm.referenceCostTotal?.addEventListener("input", updateRawMaterialUnitCost);
rawMaterialForm.referenceQuantity?.addEventListener("input", updateRawMaterialUnitCost);

newRawMaterialBtn?.addEventListener("click", () => {
  resetForm(rawMaterialForm);
  setUnitGroupValue("rawMaterialUnit", "");
  showRawMaterialForm();
});

cancelRawMaterialForm?.addEventListener("click", hideRawMaterialForm);
openStockEntryBtn?.addEventListener("click", () => openRawMaterialStockEntry());

[rawMaterialSearch, rawMaterialCategoryFilter, rawMaterialStatusFilter, rawMaterialUnitFilter]
  .forEach((input) => {
    input?.addEventListener("input", () => {
      updateRawMaterialFiltersFromInputs();
      renderRawMaterialControlCenter();
      requestAnimationFrame(refreshCollapseHeights);
    });
    input?.addEventListener("change", () => {
      updateRawMaterialFiltersFromInputs();
      renderRawMaterialControlCenter();
      requestAnimationFrame(refreshCollapseHeights);
    });
  });

recipeProductSelect?.addEventListener("change", () => {
  const product = state.products.find((item) => item.id === recipeProductSelect.value);
  if (product && recipeForm.name) {
    recipeForm.name.value = product.name || "";
    renderRecipeDraft();
  }
});

recalculateRecipeCostsBtn?.addEventListener("click", () => {
  void recalculateAndPersistRecipeCosts();
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

[clientForm?.name, quickClientName, prospectForm?.name].forEach((input) => {
  if (!input) return;
  input.addEventListener("blur", () => {
    input.value = formatClientName(input.value);
  });
});

setupTabs();
setupDashboardResizeObserver();
setupCommercialDashboard();
setDefaultDates();
initializeCommercialHistory();
updateDueDateVisibility();
updateSaleObservationVisibility(false);
updateSaleRepurchaseVisibility(false);
renderRecipeDraft();
renderRawMaterialControlCenter();
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

const COLLAPSE_ANIM_MS = 280;

const openSection = (toggle, body) => {
  body.classList.remove("is-open-static");
  setCollapseMax(body);
  body.classList.add("open");
  toggle.classList.add("open");
  toggle.setAttribute("aria-expanded", "true");
  syncExpandableCardState(body, true);
  // Tras la animacion liberamos el tope de altura: el contenido async
  // (listas de Firestore) puede crecer sin recortarse ni atrapar el scroll.
  if (body._collapseStaticTimer) window.clearTimeout(body._collapseStaticTimer);
  body._collapseStaticTimer = window.setTimeout(() => {
    if (body.classList.contains("open")) body.classList.add("is-open-static");
  }, COLLAPSE_ANIM_MS);
};

const closeSection = (toggle, body) => {
  // Re-fijamos la altura actual antes de cerrar para que la animacion funcione.
  if (body.classList.contains("is-open-static")) {
    setCollapseMax(body);
    body.classList.remove("is-open-static");
    void body.offsetHeight; // forzar reflow para reanclar el max-height
  }
  if (body._collapseStaticTimer) {
    window.clearTimeout(body._collapseStaticTimer);
    body._collapseStaticTimer = null;
  }
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

const getSalesShortcutTarget = () => {
  const clientSelect = saleForm?.querySelector('select[name="client"]');
  if (clientSelect && !clientSelect.disabled) return clientSelect;
  const productSelect = saleItems?.querySelector(".sale-item-product");
  if (productSelect && !productSelect.disabled) return productSelect;
  return null;
};

const isElementReadyForFocus = (element) => Boolean(
  element
  && element.isConnected
  && !element.disabled
  && element.getClientRects().length > 0
);

const scrollSalesCardIntoView = () => {
  const salesBody = document.getElementById("salesFormSection");
  const salesCard = salesBody?.closest(".card");
  const scrollTarget = salesCard || salesBody || document.getElementById("sales");
  if (!scrollTarget) return;
  const targetTop = Math.max(0, Math.round(scrollTarget.getBoundingClientRect().top + window.scrollY - 12));
  window.scrollTo({
    top: targetTop,
    behavior: "auto"
  });
};

const navigateToSalesShortcut = async () => {
  if (isNavigatingToSales) return;
  isNavigatingToSales = true;
  console.log("F2 pressed");
  try {
    console.log("Switching to Ventas");
    setDashboardTransitionsEnabled(false);
    await waitForNextFrame();
    setActiveAppSection("sales");
    const salesBody = openExclusiveCollapseSection("salesFormSection");
    refreshCollapseHeights();

    const salesPanelReady = await waitForCondition(() => {
      const activeTab = document.querySelector(".tab.active")?.dataset.tab;
      const salesPanel = document.getElementById("sales");
      return activeTab === "sales"
        && dashboardSection?.dataset.view === "sales"
        && salesPanel?.classList.contains("active")
        && salesPanel?.getAttribute("aria-hidden") !== "true";
    }, { attempts: 14, delayMs: 45 });

    if (!salesPanelReady) return;
    console.log("Ventas section ready");

    const salesCardReady = await waitForCondition(() => {
      refreshCollapseHeights();
      return Boolean(
        salesBody
        && salesBody.classList.contains("open")
        && getLayoutHeight(salesBody) > 0
      );
    }, { attempts: 14, delayMs: 45 });

    if (!salesCardReady) return;
    console.log("Ventas card opened");

    scrollSalesCardIntoView();
    await waitForNextFrame();
    refreshCollapseHeights();
    await waitForDelay(60);

    const targetReady = await waitForCondition(() => {
      const target = getSalesShortcutTarget();
      return isElementReadyForFocus(target);
    }, { attempts: 16, delayMs: 35 });

    if (targetReady) {
      console.log("Focusing target input");
      const target = getSalesShortcutTarget();
      target?.focus({ preventScroll: true });
    }

    refreshCollapseHeights();
    console.log("F2 navigation completed");
  } finally {
    setDashboardTransitionsEnabled(true);
    await waitForDelay(120);
    isNavigatingToSales = false;
  }
};

const INDEPENDENT_COLLAPSE_IDS = new Set([
  "salesFormSection",
  "salesHistorySection",
  "clientFormSection",
  "clientListSection",
  "prospectsSection"
]);

document.querySelectorAll(".collapse-toggle[data-collapse]").forEach((toggle) => {
  const body = document.getElementById(toggle.dataset.collapse);
  if (!body) return;
  if (["salesGoalSection", "productsSection", "clientFormSection", "clientListSection", "prospectsSection", "salesFormSection", "salesHistorySection", "repurchaseSection", "coverageSection", "financeExpenseSection", "financeReceivablesSection", "financeCategorySection"].includes(toggle.dataset.collapse)) {
    closeSection(toggle, body);
  } else {
    openSection(toggle, body);
  }
});

setupSidebarNavigation();

document.addEventListener("click", (event) => {
  const toggle = event.target.closest(".collapse-toggle[data-collapse]");
  if (!toggle) return;
  const body = document.getElementById(toggle.dataset.collapse);
  if (!body) return;
  if (!INDEPENDENT_COLLAPSE_IDS.has(toggle.dataset.collapse)) {
    document.querySelectorAll(".collapse-toggle[data-collapse]").forEach((otherToggle) => {
      const otherBody = document.getElementById(otherToggle.dataset.collapse);
      if (!otherBody) return;
      if (otherToggle !== toggle && !INDEPENDENT_COLLAPSE_IDS.has(otherToggle.dataset.collapse)) {
        closeSection(otherToggle, otherBody);
      }
    });
  }
  if (body.classList.contains("open")) {
    closeSection(toggle, body);
  } else {
    openSection(toggle, body);
  }
  if (toggle.dataset.collapse === "coverageSection" && body.classList.contains("open")) {
    renderSalesCoverage({ animatePins: true });
  }
  if (toggle.dataset.collapse === "salesFormSection" && body.classList.contains("open")) {
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
  if (event.repeat) return;
  if (isNavigatingToSales) return;
  event.preventDefault();
  void navigateToSalesShortcut();
});

const refreshCollapseHeights = () => {
  document.querySelectorAll(".collapse-body.open").forEach((body) => {
    // Los ya liberados (is-open-static) no se vuelven a topar: crecen libres.
    if (body.classList.contains("is-open-static")) return;
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

/* ===================== Mapa comercial (MapLibre + MapTiler) ===================== */
const MAPTILER_API_KEY = "XIOrnXPz3pNmBSbHdwx5";
const MAP_STYLES = {
  streets: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`,
  satellite: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`,
  hybrid: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_API_KEY}`
};
const MAP_COLORS = { prospect: "#F59E0B", client: "#16A34A", overdue: "#DC2626" };
const MAP_PIN_ICONS = { prospect: "marker-prospecto", client: "marker-cliente", overdue: "marker-recompra-vencida" };
const MAP_PIN_ICON_EXPR = ["match", ["get", "commercialStatus"], "prospect", "marker-prospecto", "client", "marker-cliente", "overdue", "marker-recompra-vencida", "marker-prospecto"];
const PY_BOUNDS = [[-62.7, -27.7], [-54.2, -19.2]];
const CDE_CENTER = [-54.6111, -25.5097];
const MAP_EMPTY_FC = { type: "FeatureCollection", features: [] };

let commercialMap = null;
let commercialMapReady = false;
let commercialMapDidIntro = false;
let commercialMapEntities = [];
let mapSelectedId = "";
let mapHoverId = "";
let mapGeoSearchTimer = null;
const mapFilterState = { type: "all", city: "", zone: "", business: "", location: "" };
let commercialMapImportSessionFilter = "";
let commercialClusterEnabled = sessionStorage.getItem("mapClusterEnabled") !== "false";

// --- Clustering del mapa comercial ---
// clusterMaxZoom: zoom maximo en que se generan clusters (inclusive).
// Al superar este zoom todos los puntos son individuales.
// Zoom 9+ = vista de ciudad/barrio → pines individuales.
// Zoom 8   = departamento (Alto Parana) → empieza clustering.
// Zoom 7   = pais → clustering activo.
const COMMERCIAL_CLUSTER_MAX_ZOOM = 8;
const COMMERCIAL_CLUSTER_RADIUS = 30;
const quickMapProspectState = {
  active: false,
  selecting: false,
  drawerOpen: false,
  selectedLngLat: null,
  sessionCount: 0,
  forceDuplicateSave: false,
  lastFocus: null,
  geocodeAbort: null,
  saveAction: "save",
  cameraAtStart: null,
  preserveFormOnNextPoint: false
};
let quickMapProspectMarker = null;
const prospectImportState = {
  rows: [],
  fileName: "",
  fileSize: 0,
  metadata: {},
  selectedRowId: "",
  step: "file",
  mode: "table",
  busy: false,
  runLock: false,
  importSessionId: "",
  plannedProspectIds: [],
  importedIds: [],
  lastImportSessionId: "",
  result: null
};
let prospectImportPreviewMarkers = [];
const PROSPECT_IMPORT_DRAFT_KEY = "gg_prospect_import_draft_v1";

const mapToNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(num) ? num : null;
};

const buildMapsLinkFromCoords = (lat, lng) => {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return "";
  return `https://www.google.com/maps?q=${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
};

const captureCommercialMapCamera = () => {
  if (!commercialMap) return null;
  const center = commercialMap.getCenter();
  return {
    center: [center.lng, center.lat],
    zoom: commercialMap.getZoom(),
    bearing: commercialMap.getBearing(),
    pitch: commercialMap.getPitch()
  };
};

const restoreCommercialMapCamera = (camera) => {
  if (!commercialMap || !camera) return;
  commercialMap.jumpTo({
    center: camera.center,
    zoom: camera.zoom,
    bearing: camera.bearing,
    pitch: camera.pitch
  });
};

const updateQuickMapSessionUi = () => {
  mapQuickModePanel?.classList.toggle("hidden", !quickMapProspectState.active);
  if (mapQuickModeText) {
    mapQuickModeText.textContent = quickMapProspectState.selecting
      ? "Hace clic en el mapa para marcar la ubicacion del prospecto."
      : "Completando los datos del comercio marcado.";
  }
  if (mapQuickSessionCount) {
    const count = quickMapProspectState.sessionCount;
    mapQuickSessionCount.textContent = `${formatInteger(count)} prospecto${count === 1 ? "" : "s"} agregado${count === 1 ? "" : "s"} en esta zona`;
  }
  commercialMap?.getCanvas()?.classList.toggle("map-crosshair-mode", quickMapProspectState.active && quickMapProspectState.selecting);
};

const showQuickMapToast = (message, actionLabel = "", action = null) => {
  if (!mapQuickToast) return;
  mapQuickToast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    ${actionLabel ? `<button class="btn ghost btn-xs" type="button" data-map-toast-action>${escapeHtml(actionLabel)}</button>` : ""}
  `;
  mapQuickToast.classList.remove("hidden");
  const actionBtn = mapQuickToast.querySelector("[data-map-toast-action]");
  if (actionBtn && typeof action === "function") {
    actionBtn.addEventListener("click", () => {
      action();
      mapQuickToast.classList.add("hidden");
    }, { once: true });
  }
  window.setTimeout(() => {
    mapQuickToast?.classList.add("hidden");
  }, actionLabel ? 9000 : 4200);
};

const createQuickMapMarkerElement = () => {
  const el = document.createElement("div");
  el.className = "map-temp-prospect-pin";
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", "Ubicacion temporal del prospecto");
  el.innerHTML = "<span></span>";
  return el;
};

const setQuickMapProspectMarker = (lng, lat) => {
  if (!commercialMap || !window.maplibregl) return;
  if (!quickMapProspectMarker) {
    quickMapProspectMarker = new maplibregl.Marker({
      element: createQuickMapMarkerElement(),
      draggable: true,
      anchor: "bottom"
    });
    quickMapProspectMarker.on("dragend", () => {
      const point = quickMapProspectMarker.getLngLat();
      setQuickMapProspectPoint(point.lng, point.lat, { fromDrag: true });
    });
  }
  quickMapProspectMarker.setLngLat([lng, lat]).addTo(commercialMap);
};

const clearQuickMapProspectMarker = () => {
  if (quickMapProspectMarker) {
    quickMapProspectMarker.remove();
    quickMapProspectMarker = null;
  }
  quickMapProspectState.selectedLngLat = null;
};

const fillMapProspectLocationFields = (lng, lat) => {
  if (!mapProspectForm) return;
  mapProspectForm.latitude.value = Number(lat).toFixed(6);
  mapProspectForm.longitude.value = Number(lng).toFixed(6);
  if (mapProspectForm.mapsLink) mapProspectForm.mapsLink.value = buildMapsLinkFromCoords(lat, lng);
};

const applyMapReverseGeocodeToForm = (data) => {
  if (!mapProspectForm || !data) return;
  const feature = data.features?.[0];
  if (!feature) return;
  const placeName = String(feature.place_name || feature.place_name_es || "").trim();
  const context = Array.isArray(feature.context) ? feature.context : [];
  const findContext = (prefixes) => {
    const item = context.find((ctx) => prefixes.some((prefix) => String(ctx.id || "").startsWith(prefix)));
    return String(item?.text_es || item?.text || "").trim();
  };
  const city = findContext(["place", "municipality", "region"]) || String(feature.place_type?.includes("place") ? feature.text : "").trim();
  const zone = findContext(["neighborhood", "locality", "district"]);
  if (mapProspectForm.address && !mapProspectForm.address.value.trim()) mapProspectForm.address.value = placeName;
  if (mapProspectForm.city && !mapProspectForm.city.value.trim()) mapProspectForm.city.value = city;
  if (mapProspectForm.zone && !mapProspectForm.zone.value.trim()) mapProspectForm.zone.value = zone;
};

const reverseGeocodeMapProspectPoint = async (lng, lat) => {
  if (!mapProspectNotice) return;
  if (quickMapProspectState.geocodeAbort) quickMapProspectState.geocodeAbort.abort();
  quickMapProspectState.geocodeAbort = new AbortController();
  mapProspectNotice.textContent = "Buscando direccion aproximada...";
  try {
    const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_API_KEY}&language=es&limit=1`;
    const response = await fetch(url, { signal: quickMapProspectState.geocodeAbort.signal });
    if (!response.ok) throw new Error("reverse-geocode");
    const data = await response.json();
    applyMapReverseGeocodeToForm(data);
    mapProspectNotice.textContent = "";
  } catch (error) {
    if (error?.name === "AbortError") return;
    mapProspectNotice.textContent = "No se pudo obtener automaticamente la direccion.";
  }
};

const findPossibleProspectDuplicates = (payload) => {
  const mapRecord = (record, type) => {
    const coords = normalizeCoordinates(record);
    return {
      id: record.id,
      type,
      name: record.name || "Sin nombre",
      phone: record.phone || "",
      address: record.address || "",
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null
    };
  };
  return buildDuplicateMatches({
    payload: {
      ...payload,
      phone: normalizeDuplicatePhone(payload.phone)
    },
    records: [
      ...state.prospects.map((item) => mapRecord(item, "Prospecto")),
      ...state.clients.map((item) => mapRecord(item, "Cliente"))
    ]
  }).slice(0, 5);
};

const renderPreciseMapDuplicateWarning = (duplicates, action) => {
  if (!mapDuplicateWarning) return;
  if (!duplicates.length) {
    mapDuplicateWarning.classList.add("hidden");
    mapDuplicateWarning.innerHTML = "";
    return;
  }
  mapDuplicateWarning.classList.remove("hidden");
  mapDuplicateWarning.innerHTML = `
    <strong>Encontramos un negocio muy cercano</strong>
    <p>Revisa si el prospecto que estas cargando ya existe en el sistema.</p>
    <div class="map-duplicate-list">
      ${duplicates.map((item) => `
        <div class="map-duplicate-item">
          <span>${escapeHtml(item.name)} - ${escapeHtml(item.type)}</span>
          ${Number.isFinite(item.distance) ? `<small>Distancia: ${escapeHtml(formatDuplicateDistance(item.distance))}</small>` : ""}
          <small>Coincidencia: ${escapeHtml(item.reasons.join(", "))}</small>
          ${item.phone ? `<small>Telefono: ${escapeHtml(item.phone)}</small>` : ""}
          <button class="btn ghost btn-xs" type="button" data-map-duplicate-view="${escapeHtml(item.id)}" data-map-duplicate-type="${escapeHtml(item.type)}">Ver registro</button>
        </div>
      `).join("")}
    </div>
    <div class="map-duplicate-actions">
      <button class="btn ghost btn-xs" type="button" data-map-duplicate-cancel>Cancelar</button>
      <button class="btn primary btn-xs" type="button" data-map-duplicate-force>Guardar de todas formas</button>
    </div>
  `;
  mapDuplicateWarning.querySelectorAll("[data-map-duplicate-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (getMapEntityById(btn.dataset.mapDuplicateView)) {
        openMapDetail(btn.dataset.mapDuplicateView);
        return;
      }
      setActiveAppSection(btn.dataset.mapDuplicateType === "Cliente" ? "clients" : "prospects");
    });
  });
  mapDuplicateWarning.querySelector("[data-map-duplicate-cancel]")?.addEventListener("click", () => {
    quickMapProspectState.forceDuplicateSave = false;
    mapDuplicateWarning.classList.add("hidden");
  });
  mapDuplicateWarning.querySelector("[data-map-duplicate-force]")?.addEventListener("click", () => {
    quickMapProspectState.forceDuplicateSave = true;
    void saveQuickMapProspect(action);
  });
};

const getProspectImportBusinessOptions = () => getBusinessTypeOptions().map((option) => ({
  value: option.value,
  label: option.label
}));

const getProspectImportExistingRecords = () => {
  const mapRecord = (record, type) => {
    const coords = normalizeCoordinates(record);
    return {
      id: record.id,
      type,
      name: record.name || "Sin nombre",
      phone: record.phone || "",
      address: record.address || "",
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null
    };
  };
  return [
    ...state.prospects.map((item) => mapRecord(item, "Prospecto")),
    ...state.clients.map((item) => mapRecord(item, "Cliente"))
  ];
};

const rebuildImportRow = (row, index) => ({
  businessName: row.name,
  contactName: row.contactName,
  phone: row.phone,
  businessTypeName: row.businessTypeName || row.businessType,
  address: row.address,
  city: row.city,
  zone: row.zone,
  latitude: row.latitude,
  longitude: row.longitude,
  googleMapsUrl: row.mapsLink,
  potential: row.potential,
  status: row.status,
  notes: row.observations,
  externalId: row.externalId || `row-${index + 1}`
});

const revalidateImportRows = () => {
  const selectedMap = new Map(prospectImportState.rows.map((row) => [row.rowId, { selected: row.selected, excluded: row.excluded }]));
  let rows = prospectImportState.rows.map((row, index) => {
    const rebuilt = normalizeImportedProspectFile({ prospects: [rebuildImportRow(row, index)] }, {
      businessTypes: getProspectImportBusinessOptions()
    }).rows[0];
    const selection = selectedMap.get(row.rowId) || {};
    return {
      ...rebuilt,
      rowId: row.rowId,
      selected: selection.selected !== false,
      excluded: Boolean(selection.excluded),
      duplicateMatches: []
    };
  });
  rows = detectImportedFileDuplicates(rows);
  rows = enrichImportedRowsWithDuplicates(rows, getProspectImportExistingRecords());
  prospectImportState.rows = rows;
};

const getImportableRows = () => prospectImportState.rows.filter(canImportRow);

const setImportStep = (step) => {
  prospectImportState.step = step;
  const labels = Array.from(prospectImportSteps?.querySelectorAll("span") || []);
  const order = ["file", "validation", "review", "map", "confirm", "result"];
  const activeIndex = Math.max(0, order.indexOf(step));
  labels.forEach((label, index) => {
    label.classList.toggle("active", index === activeIndex);
    label.classList.toggle("is-complete", index < activeIndex);
    label.classList.toggle("is-current", index === activeIndex);
    label.classList.toggle("is-pending", index > activeIndex);
  });
  if (step !== "file" && step !== "result") saveProspectImportDraft();
};

const setProspectImportError = (message) => {
  if (prospectImportError) prospectImportError.textContent = message || "";
};

const setProspectImportProgress = (message) => {
  if (prospectImportProgress) prospectImportProgress.textContent = message || "";
};

const createProspectImportSessionId = () => `import_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const saveProspectImportDraft = () => {
  try {
    if (!prospectImportState.rows.length) {
      sessionStorage.removeItem(PROSPECT_IMPORT_DRAFT_KEY);
      return;
    }
    sessionStorage.setItem(PROSPECT_IMPORT_DRAFT_KEY, JSON.stringify({
      rows: prospectImportState.rows,
      fileName: prospectImportState.fileName,
      fileSize: prospectImportState.fileSize,
      metadata: prospectImportState.metadata,
      importSessionId: prospectImportState.importSessionId,
      plannedProspectIds: prospectImportState.plannedProspectIds,
      step: prospectImportState.step,
      mode: prospectImportState.mode
    }));
  } catch (error) {
    /* sessionStorage no disponible */
  }
};

const clearProspectImportDraft = () => {
  try {
    sessionStorage.removeItem(PROSPECT_IMPORT_DRAFT_KEY);
  } catch (error) {
    /* sessionStorage no disponible */
  }
};

const loadProspectImportDraft = () => {
  try {
    const raw = sessionStorage.getItem(PROSPECT_IMPORT_DRAFT_KEY);
    if (!raw) return false;
    const draft = JSON.parse(raw);
    if (!Array.isArray(draft.rows) || !draft.rows.length) return false;
    prospectImportState.rows = draft.rows;
    prospectImportState.fileName = draft.fileName || "";
    prospectImportState.fileSize = Number(draft.fileSize || 0);
    prospectImportState.metadata = draft.metadata || {};
    prospectImportState.importSessionId = draft.importSessionId || createProspectImportSessionId();
    prospectImportState.plannedProspectIds = Array.isArray(draft.plannedProspectIds) ? draft.plannedProspectIds : [];
    prospectImportState.step = ["review", "map", "confirm"].includes(draft.step) ? draft.step : "review";
    prospectImportState.mode = draft.mode === "map" ? "map" : "table";
    return true;
  } catch (error) {
    clearProspectImportDraft();
    return false;
  }
};

const resetProspectImportState = () => {
  clearProspectImportPreviewMarkers();
  prospectImportState.rows = [];
  prospectImportState.fileName = "";
  prospectImportState.fileSize = 0;
  prospectImportState.metadata = {};
  prospectImportState.selectedRowId = "";
  prospectImportState.mode = "table";
  prospectImportState.busy = false;
  prospectImportState.runLock = false;
  prospectImportState.importSessionId = "";
  prospectImportState.plannedProspectIds = [];
  prospectImportState.importedIds = [];
  prospectImportState.result = null;
  prospectImportModal?.classList.remove("is-map-mode");
  prospectImportReview?.classList.add("hidden");
  prospectImportResult?.classList.add("hidden");
  prospectImportFormat?.classList.remove("hidden");
  prospectImportConfirm?.classList.add("hidden");
  if (prospectImportRows) prospectImportRows.innerHTML = "";
  if (prospectImportFile) prospectImportFile.value = "";
  if (prospectImportFileMeta) prospectImportFileMeta.textContent = "Sin archivo seleccionado.";
  if (prospectImportPrimary) {
    prospectImportPrimary.disabled = true;
    prospectImportPrimary.textContent = "Importar prospectos";
  }
  if (prospectImportConfirmBack) prospectImportConfirmBack.hidden = true;
  setProspectImportError("");
  setProspectImportProgress("");
  setImportStep("file");
};

const openProspectImportModal = () => {
  resetProspectImportState();
  const restored = loadProspectImportDraft();
  prospectImportModal?.classList.remove("hidden");
  document.body.classList.add("modal-open");
  fillBusinessTypeSelect(prospectImportBulkRubro, { includeAll: false });
  if (restored) {
    if (prospectImportFileMeta) {
      prospectImportFileMeta.textContent = `${prospectImportState.fileName || "Borrador"} - ${formatFileSize(prospectImportState.fileSize)} - ${prospectImportState.rows.length} registros en borrador`;
    }
    prospectImportReview?.classList.remove("hidden");
    prospectImportFormat?.classList.add("hidden");
    prospectImportResult?.classList.add("hidden");
    setImportStep(prospectImportState.step);
    if (prospectImportState.mode === "map") showProspectImportMap();
    else renderProspectImport();
  }
  requestAnimationFrame(() => {
    (restored ? prospectImportRows?.querySelector("input, select, textarea") : prospectImportChoose)?.focus();
    refreshIcons();
  });
};

const closeProspectImportModal = ({ force = false } = {}) => {
  if (prospectImportState.busy) return false;
  if (!force && prospectImportState.rows.length && !window.confirm("Se perderan los cambios realizados en esta importacion.")) return false;
  resetProspectImportState();
  clearProspectImportDraft();
  prospectImportModal?.classList.add("hidden");
  document.body.classList.remove("modal-open");
  return true;
};

const downloadProspectImportTemplate = () => {
  const blob = new Blob([JSON.stringify(IMPORT_SCHEMA_TEMPLATE, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla-prospectos-gami.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const formatFileSize = (size) => {
  const value = Number(size || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const loadProspectImportFile = async (file) => {
  if (!file) return;
  setProspectImportError("");
  if (!file.name.toLowerCase().endsWith(".json")) {
    setProspectImportError("Selecciona un archivo con extension .json.");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    setProspectImportError("El archivo es demasiado grande para este importador inicial.");
    return;
  }
  try {
    const text = await file.text();
    if (!text.trim()) {
      setProspectImportError("El archivo esta vacio.");
      return;
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch (error) {
      setProspectImportError("Este archivo no contiene un JSON valido.");
      return;
    }
    const result = normalizeImportedProspectFile(json, {
      businessTypes: getProspectImportBusinessOptions(),
      existingRecords: getProspectImportExistingRecords(),
      maxRecords: IMPORT_MAX_RECORDS
    });
    if (!result.ok) {
      setProspectImportError(result.error || "Este archivo no contiene prospectos validos.");
      return;
    }
    prospectImportState.rows = result.rows;
    prospectImportState.fileName = file.name;
    prospectImportState.fileSize = file.size;
    prospectImportState.metadata = result.metadata || {};
    prospectImportState.importSessionId = createProspectImportSessionId();
    prospectImportState.plannedProspectIds = [];
    prospectImportState.runLock = false;
    if (prospectImportFileMeta) {
      prospectImportFileMeta.textContent = `${file.name} - ${formatFileSize(file.size)} - ${result.rows.length} registros detectados`;
    }
    prospectImportReview?.classList.remove("hidden");
    prospectImportFormat?.classList.add("hidden");
    prospectImportResult?.classList.add("hidden");
    setImportStep("review");
    renderProspectImport();
    saveProspectImportDraft();
  } catch (error) {
    console.error("No se pudo leer JSON:", error);
    setProspectImportError("Este archivo no contiene un JSON valido.");
  }
};

const IMPORT_STATE_LABELS = {
  ready: "Listo para importar",
  missing: "Falta informacion",
  "invalid-coordinates": "Coordenadas invalidas",
  duplicate: "Posible duplicado",
  "new-business-type": "Rubro nuevo",
  "file-duplicate": "Registro repetido dentro del archivo",
  "branch-warning": "Posible sucursal",
  excluded: "Excluido por el usuario"
};

const renderImportBadges = (row) => {
  const states = getImportedRowStateCodes(row);
  const priority = ["excluded", "missing", "invalid-coordinates", "duplicate", "file-duplicate", "new-business-type", "branch-warning", "ready"];
  const ordered = states.slice().sort((a, b) => priority.indexOf(a) - priority.indexOf(b));
  const visible = ordered.slice(0, 2);
  const extra = ordered.length - visible.length;
  return `<div class="json-import-badges">${visible.map((stateCode) => (
    `<span class="json-import-badge ${stateCode}">${IMPORT_STATE_LABELS[stateCode] || stateCode}</span>`
  )).join("")}${extra > 0 ? `<span class="json-import-badge neutral">+${extra} aviso${extra === 1 ? "" : "s"}</span>` : ""}</div>`;
};

const renderImportDuplicates = (row) => {
  const existing = (row.duplicateMatches || []).slice(0, 3).map((match) => `
    <small><b>${escapeHtml(match.name)}</b> · ${escapeHtml(match.type)}${Number.isFinite(match.distance) ? ` · ${escapeHtml(formatDuplicateDistance(match.distance))}` : ""}<br>${escapeHtml((match.reasons || []).join(", "))}</small>
  `).join("");
  const inFile = (row.fileDuplicateMatches || []).slice(0, 2).map((match) => `
    <small><b>${escapeHtml(match.name)}</b> · archivo${Number.isFinite(match.distance) ? ` · ${escapeHtml(formatDuplicateDistance(match.distance))}` : ""}<br>${escapeHtml((match.reasons || []).join(", "))}</small>
  `).join("");
  const branches = (row.fileBranchMatches || []).slice(0, 2).map((match) => `
    <small><b>${escapeHtml(match.name)}</b> Â· posible sucursal${Number.isFinite(match.distance) ? ` Â· ${escapeHtml(formatDuplicateDistance(match.distance))}` : ""}<br>${escapeHtml((match.reasons || []).join(", "))}</small>
  `).join("");
  return `<div class="json-import-duplicate-list">${existing || inFile || branches ? existing + inFile + branches : '<span class="muted">-</span>'}</div>`;
};

const buildImportBusinessTypeOptionsHtml = (row) => {
  const options = getBusinessTypeOptions();
  let html = '<option value="">Sin rubro</option>';
  html += options.map((option) => `<option value="${escapeHtml(option.value)}"${option.value === row.businessType ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("");
  if (row.businessType && !options.some((option) => option.value === row.businessType)) {
    html += `<option value="${escapeHtml(row.businessType)}" selected>${escapeHtml(row.businessTypeName || titleCaseImport(row.businessType))} (nuevo)</option>`;
  }
  return html;
};

const renderProspectImportRows = () => {
  if (!prospectImportRows) return;
  if (!prospectImportState.rows.length) {
    prospectImportRows.innerHTML = '<tr><td colspan="10">Sin registros para revisar.</td></tr>';
    return;
  }
  prospectImportRows.innerHTML = prospectImportState.rows.map((row) => `
    <tr data-import-row="${escapeHtml(row.rowId)}" class="${row.rowId === prospectImportState.selectedRowId ? "is-selected" : ""}">
      <td data-label="Sel."><input type="checkbox" data-import-field="selected" ${row.selected && !row.excluded ? "checked" : ""} /></td>
      <td data-label="Estado">${renderImportBadges(row)}</td>
      <td data-label="Negocio"><input data-import-field="name" value="${escapeHtml(row.name)}" /></td>
      <td data-label="Rubro"><select data-import-field="businessType">${buildImportBusinessTypeOptionsHtml(row)}</select></td>
      <td data-label="Telefono"><input data-import-field="phone" value="${escapeHtml(row.phone)}" /></td>
      <td data-label="Direccion"><textarea data-import-field="address">${escapeHtml(row.address)}</textarea></td>
      <td data-label="Ciudad/Zona">
        <input data-import-field="city" value="${escapeHtml(row.city)}" placeholder="Ciudad" />
        <input data-import-field="zone" value="${escapeHtml(row.zone)}" placeholder="Zona" />
      </td>
      <td data-label="Lat/Lng">
        <input data-import-field="latitude" value="${row.latitude ?? ""}" inputmode="decimal" />
        <input data-import-field="longitude" value="${row.longitude ?? ""}" inputmode="decimal" />
      </td>
      <td data-label="Duplicados">${renderImportDuplicates(row)}</td>
      <td data-label="Acciones">
        <div class="json-import-row-actions">
          <button class="btn ghost btn-xs" type="button" data-import-row-map="${escapeHtml(row.rowId)}">Mapa</button>
          <button class="btn ghost btn-xs" type="button" data-import-row-toggle="${escapeHtml(row.rowId)}">${row.excluded || !row.selected ? "Incluir" : "Excluir"}</button>
        </div>
      </td>
    </tr>
  `).join("");
};

const renderProspectImportSummary = () => {
  if (!prospectImportSummary) return;
  const summary = buildImportSummary(prospectImportState.rows);
  const stats = [
    ["Totales", summary.total],
    ["Listos", summary.importable],
    ["Excluidos", summary.excluded],
    ["Con errores", summary.errors],
    ["Duplicados", summary.duplicates + summary.fileDuplicates],
    ["Sucursales", summary.branchWarnings || 0],
    ["Rubros nuevos", summary.newBusinessTypes],
    ["Sin telefono", summary.withoutPhone],
    ["Sin direccion", summary.withoutAddress]
  ];
  prospectImportSummary.innerHTML = stats.map(([label, value]) => `
    <div class="json-import-stat"><strong>${formatInteger(value)}</strong><span>${escapeHtml(label)}</span></div>
  `).join("");
  if (prospectImportPrimary) {
    prospectImportPrimary.disabled = prospectImportState.busy || summary.importable <= 0 || summary.errors > 0;
    if (prospectImportState.busy) {
      prospectImportPrimary.textContent = "Importando...";
    } else if (prospectImportState.step === "confirm") {
      prospectImportPrimary.textContent = `Confirmar e importar ${formatInteger(summary.importable)} prospecto${summary.importable === 1 ? "" : "s"}`;
    } else {
      prospectImportPrimary.textContent = "Revisar y confirmar";
    }
  }
  if (prospectImportConfirm) {
    prospectImportConfirm.classList.toggle("hidden", prospectImportState.step !== "confirm");
    prospectImportConfirm.innerHTML = `
      <strong>Resumen antes de importar</strong>
      <p>Se crearan ${formatInteger(summary.importable)} prospectos. ${summary.newBusinessTypes ? `Se crearan ${formatInteger(summary.newBusinessTypes)} rubros nuevos confirmados en esta vista previa.` : "No hay rubros nuevos pendientes."}</p>
      <p>${summary.duplicates + summary.fileDuplicates ? "Hay posibles duplicados aceptados para revisar antes de confirmar." : "No hay duplicados marcados en las filas importables."}${summary.branchWarnings ? ` ${formatInteger(summary.branchWarnings)} registro${summary.branchWarnings === 1 ? "" : "s"} parecen sucursales, no duplicados.` : ""}</p>
    `;
  }
};

const renderProspectImport = () => {
  revalidateImportRows();
  renderProspectImportSummary();
  renderProspectImportRows();
  renderProspectImportPreviewMarkers();
  saveProspectImportDraft();
  refreshIcons();
};

const clearProspectImportPreviewMarkers = () => {
  prospectImportPreviewMarkers.forEach((marker) => marker.remove());
  prospectImportPreviewMarkers = [];
};

const highlightImportRow = (rowId) => {
  prospectImportState.selectedRowId = rowId || "";
  document.querySelectorAll("[data-import-row]").forEach((rowEl) => {
    rowEl.classList.toggle("is-selected", rowEl.dataset.importRow === rowId);
  });
  prospectImportPreviewMarkers.forEach((marker) => {
    marker.getElement().classList.toggle("is-selected", marker._importRowId === rowId);
  });
};

const renderProspectImportPreviewMarkers = () => {
  clearProspectImportPreviewMarkers();
  if (prospectImportState.mode !== "map") return;
  if (!commercialMap || !window.maplibregl) return;
  getImportableRows().forEach((row) => {
    if (!Number.isFinite(Number(row.latitude)) || !Number.isFinite(Number(row.longitude))) return;
    const el = document.createElement("button");
    el.type = "button";
    el.className = "json-import-preview-pin";
    el.setAttribute("aria-label", `Vista previa: ${row.name}`);
    el.addEventListener("click", () => {
      highlightImportRow(row.rowId);
      const popup = new maplibregl.Popup({ offset: 28 })
        .setLngLat([Number(row.longitude), Number(row.latitude)])
        .setHTML(`
          <strong>${escapeHtml(row.name)}</strong>
          <div>${escapeHtml(row.businessTypeName || getBusinessTypeLabel(row.businessType) || "Sin rubro")}</div>
          <div>${escapeHtml(row.address || row.city || "")}</div>
          <div>${renderImportBadges(row)}</div>
          <button class="btn ghost btn-xs" type="button" data-import-popup-edit="${escapeHtml(row.rowId)}">Editar</button>
          <button class="btn ghost btn-xs" type="button" data-import-popup-exclude="${escapeHtml(row.rowId)}">Excluir</button>
        `)
        .addTo(commercialMap);
      popup.getElement()?.addEventListener("click", (event) => {
        const edit = event.target.closest("[data-import-popup-edit]");
        const exclude = event.target.closest("[data-import-popup-exclude]");
        if (edit) {
          showProspectImportTable();
          document.querySelector(`[data-import-row="${CSS.escape(row.rowId)}"]`)?.scrollIntoView({ block: "center" });
        }
        if (exclude) {
          const target = prospectImportState.rows.find((item) => item.rowId === row.rowId);
          if (target) {
            target.selected = false;
            target.excluded = true;
            renderProspectImport();
          }
          popup.remove();
        }
      });
    });
    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([Number(row.longitude), Number(row.latitude)])
      .addTo(commercialMap);
    marker._importRowId = row.rowId;
    prospectImportPreviewMarkers.push(marker);
  });
};

const fitProspectImportPreview = () => {
  if (!commercialMap) return;
  const located = getImportableRows().filter((row) => Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude)));
  if (!located.length) return;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  located.forEach((row) => {
    const lng = Number(row.longitude);
    const lat = Number(row.latitude);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });
  commercialMap.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 15, duration: getMapPrefersReduced() ? 0 : 900 });
};

const showProspectImportMap = () => {
  if (!prospectImportState.rows.length) return;
  prospectImportState.mode = "map";
  setImportStep("map");
  setActiveAppSection("map");
  prospectImportModal?.classList.add("is-map-mode");
  prospectImportTableTab?.classList.remove("active");
  prospectImportMapTab?.classList.add("active");
  prospectImportTableWrap?.classList.add("hidden");
  prospectImportMapPanel?.classList.remove("hidden");
  ensureCommercialMap();
  window.setTimeout(() => {
    resizeCommercialMap(0);
    renderProspectImportPreviewMarkers();
    fitProspectImportPreview();
  }, 260);
};

const showProspectImportTable = () => {
  prospectImportState.mode = "table";
  setImportStep(prospectImportState.step === "confirm" ? "confirm" : "review");
  prospectImportModal?.classList.remove("is-map-mode");
  prospectImportTableTab?.classList.add("active");
  prospectImportMapTab?.classList.remove("active");
  prospectImportTableWrap?.classList.remove("hidden");
  prospectImportMapPanel?.classList.add("hidden");
  clearProspectImportPreviewMarkers();
};

const mutateImportRowField = (rowId, field, value) => {
  const row = prospectImportState.rows.find((item) => item.rowId === rowId);
  if (!row) return null;
  if (field === "selected") {
    row.selected = Boolean(value);
    row.excluded = !row.selected;
  } else if (field === "businessType") {
    row.businessType = normalizeRubroKey(value);
    row.businessTypeName = row.businessType ? getBusinessTypeLabel(row.businessType) : "";
    const exists = getBusinessTypeOptions().some((option) => option.value === row.businessType);
    row.businessTypeIsNew = Boolean(row.businessType && !exists);
  } else if (field === "latitude" || field === "longitude") {
    const parsed = String(value || "").trim();
    row[field] = parsed === "" ? null : parsed;
  } else {
    row[field] = value;
  }
  saveProspectImportDraft();
  return row;
};

const updateImportRowField = (rowId, field, value, { render = true } = {}) => {
  const row = mutateImportRowField(rowId, field, value);
  if (!row || !render) return;
  renderProspectImport();
};

const setProspectImportBusy = (busy) => {
  prospectImportState.busy = Boolean(busy);
  prospectImportModal?.querySelectorAll("button, input, select, textarea").forEach((el) => {
    if (el.id === "prospectImportCancel") return;
    el.disabled = Boolean(busy);
  });
};

const buildImportedProspectPayload = (row, importSessionId) => {
  const mapsLink = row.mapsLink || buildMapsLinkFromCoords(row.latitude, row.longitude);
  return {
    name: row.name,
    contactName: row.contactName || "",
    phone: normalizeProspectPhone(row.phone || ""),
    city: row.city || "",
    zone: row.zone || "",
    address: row.address || "",
    businessType: normalizeRubroKey(row.businessType || ""),
    status: normalizeOptionValue(PROSPECT_STATUS_OPTIONS, row.status, "nuevo"),
    potential: normalizeOptionValue(PROSPECT_POTENTIAL_OPTIONS, row.potential),
    observations: row.observations || "",
    nextAction: "",
    nextActionDate: "",
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    mapsLink,
    source: IMPORT_SOURCE_LABEL,
    importSessionId,
    externalImportId: row.externalId || ""
  };
};

const ensurePlannedProspectIds = (rows) => {
  if (prospectImportState.plannedProspectIds.length === rows.length) return prospectImportState.plannedProspectIds;
  prospectImportState.plannedProspectIds = rows.map(() => doc(collection(db, "prospects")).id);
  saveProspectImportDraft();
  return prospectImportState.plannedProspectIds;
};

const createImportBatches = async ({ rows, businessTypesToCreate, importSessionId, plannedProspectIds }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("auth");
  const importedProspectIds = [];
  const operations = [];
  businessTypesToCreate.forEach((type) => {
    const ref = doc(collection(db, "businessTypes"), rubroDocId(type.key));
    operations.push({ ref, data: {
      name: type.label,
      normalizedName: type.key,
      description: "Creado durante importacion JSON de prospectos.",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    } });
  });
  rows.forEach((row) => {
    const plannedId = plannedProspectIds[importedProspectIds.length] || doc(collection(db, "prospects")).id;
    const ref = doc(db, "prospects", plannedId);
    importedProspectIds.push(ref.id);
    operations.push({ ref, data: {
      ...buildImportedProspectPayload(row, importSessionId),
      userId: user.uid,
      userEmail: user.email || "",
      userName: user.displayName || "",
      createdAt: serverTimestamp()
    } });
  });

  const chunkSize = 450;
  for (let i = 0; i < operations.length; i += chunkSize) {
    const batch = writeBatch(db);
    operations.slice(i, i + chunkSize).forEach((op) => batch.set(op.ref, op.data));
    await batch.commit();
  }
  return importedProspectIds;
};

const confirmProspectImport = async () => {
  if (prospectImportState.busy || prospectImportState.runLock) return;
  if (prospectImportState.step !== "confirm") {
    setImportStep("confirm");
    prospectImportConfirmBack.hidden = false;
    renderProspectImportSummary();
    return;
  }
  const rows = getImportableRows();
  if (!rows.length) return;
  const newTypeMap = new Map();
  rows.forEach((row) => {
    if (!row.businessTypeIsNew || !row.businessType) return;
    newTypeMap.set(row.businessType, { key: row.businessType, label: row.businessTypeName || titleCaseImport(row.businessType) });
  });
  const importSessionId = prospectImportState.importSessionId || createProspectImportSessionId();
  prospectImportState.importSessionId = importSessionId;
  const plannedProspectIds = ensurePlannedProspectIds(rows);
  const startedAt = performance.now();
  const user = auth.currentUser;
  if (!user) {
    setProspectImportError("Inicia sesion para importar prospectos.");
    return;
  }
  prospectImportState.runLock = true;
  setProspectImportBusy(true);
  setProspectImportProgress("Preparando datos...");
  const sessionRef = doc(db, "prospect_import_sessions", importSessionId);
  try {
    const sessionSnapshot = await getDoc(sessionRef);
    if (sessionSnapshot.exists()) {
      const session = sessionSnapshot.data() || {};
      if (session.status === "completed") {
        prospectImportState.importedIds = session.importedProspectIds || plannedProspectIds;
        prospectImportState.lastImportSessionId = importSessionId;
        prospectImportState.result = {
          importedCount: session.importedCount || prospectImportState.importedIds.length,
          skippedCount: session.skippedCount || 0,
          errorCount: session.errorCount || 0,
          createdRubricCount: session.createdRubricCount || 0,
          duplicateAcceptedCount: session.duplicateAcceptedCount || 0,
          durationMs: session.durationMs || 0
        };
        setProspectImportProgress("Esta importacion ya estaba completada.");
        setImportStep("result");
        prospectImportReview?.classList.add("hidden");
        prospectImportResult?.classList.remove("hidden");
        clearProspectImportPreviewMarkers();
        renderProspectImportResult();
        return;
      }
      if (session.status === "processing") {
        setProspectImportError("Esta importacion ya se esta procesando. Espera a que termine antes de reintentar.");
        return;
      }
      if (Array.isArray(session.plannedProspectIds) && session.plannedProspectIds.length === rows.length) {
        prospectImportState.plannedProspectIds = session.plannedProspectIds;
      }
    }
    await setDoc(sessionRef, {
      importSessionId,
      fileName: prospectImportState.fileName,
      source: IMPORT_SOURCE_LABEL,
      status: "processing",
      plannedProspectIds: prospectImportState.plannedProspectIds,
      plannedCount: rows.length,
      skippedCount: prospectImportState.rows.length - rows.length,
      errorCount: prospectImportState.rows.filter((row) => (row.errors || []).length).length,
      createdBy: user.uid,
      createdByEmail: user.email || "",
      updatedAt: serverTimestamp(),
      createdAt: sessionSnapshot.exists() ? (sessionSnapshot.data()?.createdAt || serverTimestamp()) : serverTimestamp()
    }, { merge: true });
    setProspectImportProgress(newTypeMap.size ? "Creando rubros..." : "Guardando prospectos...");
    const importedIds = await createImportBatches({
      rows,
      businessTypesToCreate: Array.from(newTypeMap.values()),
      importSessionId,
      plannedProspectIds: prospectImportState.plannedProspectIds
    });
    await setDoc(sessionRef, {
      importSessionId,
      fileName: prospectImportState.fileName,
      source: IMPORT_SOURCE_LABEL,
      importedCount: importedIds.length,
      skippedCount: prospectImportState.rows.length - rows.length,
      errorCount: prospectImportState.rows.filter((row) => (row.errors || []).length).length,
      createdRubricCount: newTypeMap.size,
      duplicateAcceptedCount: rows.filter((row) => (row.duplicateMatches || []).length || (row.fileDuplicateMatches || []).length).length,
      status: "completed",
      updatedAt: serverTimestamp(),
      completedAt: serverTimestamp(),
      durationMs: Math.round(performance.now() - startedAt),
      importedProspectIds: importedIds
    }, { merge: true });
    prospectImportState.importedIds = importedIds;
    prospectImportState.lastImportSessionId = importSessionId;
    prospectImportState.result = {
      importedCount: importedIds.length,
      skippedCount: prospectImportState.rows.length - rows.length,
      errorCount: prospectImportState.rows.filter((row) => (row.errors || []).length).length,
      createdRubricCount: newTypeMap.size,
      duplicateAcceptedCount: rows.filter((row) => (row.duplicateMatches || []).length || (row.fileDuplicateMatches || []).length).length,
      durationMs: Math.round(performance.now() - startedAt)
    };
    setProspectImportProgress("Importacion finalizada.");
    setImportStep("result");
    prospectImportReview?.classList.add("hidden");
    prospectImportResult?.classList.remove("hidden");
    clearProspectImportPreviewMarkers();
    renderProspectImportResult();
    clearProspectImportDraft();
  } catch (error) {
    console.error("No se pudo importar JSON:", error);
    try {
      await setDoc(sessionRef, {
        status: "failed",
        updatedAt: serverTimestamp(),
        errorMessage: String(error?.message || "import-error").slice(0, 220),
        plannedProspectIds: prospectImportState.plannedProspectIds
      }, { merge: true });
    } catch (sessionError) {
      console.warn("No se pudo marcar la sesion como fallida:", sessionError);
    }
    setProspectImportProgress("");
    setProspectImportError("No se pudo completar la importacion. La sesion quedo marcada como fallida para evitar duplicados antes de reintentar.");
  } finally {
    setProspectImportBusy(false);
    prospectImportState.runLock = false;
  }
};

const renderProspectImportResult = () => {
  if (!prospectImportResult) return;
  const result = prospectImportState.result || {};
  prospectImportResult.innerHTML = `
    <strong>Importacion finalizada</strong>
    <div class="json-import-summary">
      <div class="json-import-stat"><strong>${formatInteger(result.importedCount || 0)}</strong><span>Prospectos creados</span></div>
      <div class="json-import-stat"><strong>${formatInteger(result.skippedCount || 0)}</strong><span>Omitidos</span></div>
      <div class="json-import-stat"><strong>${formatInteger(result.errorCount || 0)}</strong><span>Con error</span></div>
      <div class="json-import-stat"><strong>${formatInteger(result.createdRubricCount || 0)}</strong><span>Rubros creados</span></div>
      <div class="json-import-stat"><strong>${formatInteger(result.duplicateAcceptedCount || 0)}</strong><span>Duplicados aceptados</span></div>
      <div class="json-import-stat"><strong>${((result.durationMs || 0) / 1000).toFixed(1)}s</strong><span>Duracion</span></div>
    </div>
    <div class="json-import-row-actions">
      <button class="btn ghost" type="button" data-import-result-prospects>Ver prospectos importados</button>
      <button class="btn primary" type="button" data-import-result-map>Ver en Mapa comercial</button>
      <button class="btn ghost" type="button" data-import-result-errors>Descargar informe de errores</button>
      <button class="btn ghost" type="button" data-import-result-close>Cerrar</button>
    </div>
  `;
  if (prospectImportPrimary) prospectImportPrimary.disabled = true;
};

const downloadProspectImportErrorReport = () => {
  const report = {
    fileName: prospectImportState.fileName,
    generatedAt: new Date().toISOString(),
    rows: prospectImportState.rows.map((row) => ({
      externalId: row.externalId,
      name: row.name,
      selected: row.selected && !row.excluded,
      errors: row.errors,
      warnings: row.warnings,
      duplicates: row.duplicateMatches,
      fileDuplicates: row.fileDuplicateMatches,
      fileBranchMatches: row.fileBranchMatches
    }))
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "informe-importacion-prospectos.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const showImportedProspectsOnMap = () => {
  const sessionId = prospectImportState.lastImportSessionId;
  if (!sessionId) return;
  commercialMapImportSessionFilter = sessionId;
  setActiveAppSection("map");
  closeProspectImportModal({ force: true });
  window.setTimeout(() => {
    refreshCommercialMap();
    const located = commercialMapEntities.filter((entity) => entity.importSessionId === sessionId && entity.hasLocation);
    if (commercialMap && located.length) {
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      located.forEach((e) => {
        minLng = Math.min(minLng, e.longitude);
        maxLng = Math.max(maxLng, e.longitude);
        minLat = Math.min(minLat, e.latitude);
        maxLat = Math.max(maxLat, e.latitude);
      });
      commercialMap.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 15, duration: getMapPrefersReduced() ? 0 : 900 });
    }
    showQuickMapToast("Mostrando prospectos importados.", "Quitar filtro", () => {
      commercialMapImportSessionFilter = "";
      refreshCommercialMap();
    });
  }, 700);
};

const setMapProspectBusy = (busy) => {
  if (!mapProspectForm) return;
  mapProspectForm.querySelectorAll("button, input, select, textarea").forEach((el) => {
    if (el.id === "mapProspectCancel" && busy) return;
    el.disabled = Boolean(busy);
  });
  if (mapProspectNotice && busy) mapProspectNotice.textContent = "Guardando prospecto...";
};

const openQuickMapProspectDrawer = () => {
  if (!mapProspectDrawer || !mapProspectForm) return;
  mapProspectDrawer.classList.remove("hidden");
  quickMapProspectState.drawerOpen = true;
  quickMapProspectState.selecting = false;
  quickMapProspectState.forceDuplicateSave = false;
  if (mapDuplicateWarning) {
    mapDuplicateWarning.classList.add("hidden");
    mapDuplicateWarning.innerHTML = "";
  }
  updateQuickMapSessionUi();
  refreshIcons();
  requestAnimationFrame(() => mapProspectForm.name?.focus());
};

const closeQuickMapProspectDrawer = ({ force = false, clearMarker = true } = {}) => {
  if (!force && mapProspectForm && Array.from(new FormData(mapProspectForm).values()).some((value) => String(value || "").trim())) {
    if (!window.confirm("Cerrar el formulario sin guardar los cambios?")) return false;
  }
  mapProspectDrawer?.classList.add("hidden");
  quickMapProspectState.drawerOpen = false;
  quickMapProspectState.forceDuplicateSave = false;
  quickMapProspectState.saveAction = "save";
  if (mapProspectForm) resetForm(mapProspectForm);
  if (mapProspectNotice) mapProspectNotice.textContent = "";
  if (mapDuplicateWarning) {
    mapDuplicateWarning.classList.add("hidden");
    mapDuplicateWarning.innerHTML = "";
  }
  if (clearMarker) clearQuickMapProspectMarker();
  updateQuickMapSessionUi();
  quickMapProspectState.lastFocus?.focus?.();
  return true;
};

const startQuickMapProspectMode = () => {
  if (!commercialMap) ensureCommercialMap();
  if (!commercialMap) {
    window.alert("El mapa todavia no esta disponible.");
    return;
  }
  quickMapProspectState.active = true;
  quickMapProspectState.selecting = true;
  quickMapProspectState.drawerOpen = false;
  quickMapProspectState.sessionCount = quickMapProspectState.sessionCount || 0;
  quickMapProspectState.cameraAtStart = captureCommercialMapCamera();
  quickMapProspectState.lastFocus = document.activeElement;
  clearQuickMapProspectMarker();
  mapProspectDrawer?.classList.add("hidden");
  updateQuickMapSessionUi();
  mapQuickModePanel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

const finishQuickMapProspectMode = ({ showSummary = true, force = false } = {}) => {
  const count = quickMapProspectState.sessionCount;
  const closed = closeQuickMapProspectDrawer({ force, clearMarker: true });
  if (!closed) return false;
  quickMapProspectState.active = false;
  quickMapProspectState.selecting = false;
  quickMapProspectState.drawerOpen = false;
  quickMapProspectState.sessionCount = 0;
  updateQuickMapSessionUi();
  if (showSummary && count) showQuickMapToast(`Se agregaron ${formatInteger(count)} prospecto${count === 1 ? "" : "s"}.`);
  return true;
};

const setQuickMapProspectPoint = (lng, lat, { fromDrag = false } = {}) => {
  const safeLng = Number(lng);
  const safeLat = Number(lat);
  if (!Number.isFinite(safeLng) || !Number.isFinite(safeLat)) return;
  quickMapProspectState.selectedLngLat = { lng: safeLng, lat: safeLat };
  setQuickMapProspectMarker(safeLng, safeLat);
  if (!mapProspectForm || !quickMapProspectState.drawerOpen) {
    if (!quickMapProspectState.preserveFormOnNextPoint) mapProspectForm?.reset?.();
  }
  quickMapProspectState.preserveFormOnNextPoint = false;
  fillMapProspectLocationFields(safeLng, safeLat);
  if (mapProspectForm?.status && !mapProspectForm.status.value) mapProspectForm.status.value = "nuevo";
  openQuickMapProspectDrawer();
  if (fromDrag && mapProspectNotice) mapProspectNotice.textContent = "Ubicacion actualizada.";
  void reverseGeocodeMapProspectPoint(safeLng, safeLat);
};

const resumeQuickMapProspectSelection = ({ clearForm = true } = {}) => {
  if (clearForm && quickMapProspectState.drawerOpen && mapProspectForm) {
    const isDirty = Array.from(new FormData(mapProspectForm).values()).some((value) => String(value || "").trim());
    if (isDirty && !window.confirm("Descartar los datos escritos y seleccionar otra ubicacion?")) return false;
  }
  if (clearForm && mapProspectForm) resetForm(mapProspectForm);
  quickMapProspectState.preserveFormOnNextPoint = !clearForm;
  mapProspectDrawer?.classList.add("hidden");
  quickMapProspectState.drawerOpen = false;
  quickMapProspectState.selecting = true;
  quickMapProspectState.forceDuplicateSave = false;
  clearQuickMapProspectMarker();
  updateQuickMapSessionUi();
  return true;
};

const saveQuickMapProspect = async (action = "save") => {
  if (!mapProspectForm) return;
  const cameraBeforeSave = captureCommercialMapCamera();
  const payload = getProspectPayloadFromForm(mapProspectForm);
  if (payload.latitude === null || payload.longitude === null) {
    if (mapProspectNotice) mapProspectNotice.textContent = "Latitud y longitud son obligatorias para guardar desde el mapa.";
    return;
  }
  if (!payload.mapsLink && mapProspectForm.mapsLink) {
    mapProspectForm.mapsLink.value = buildMapsLinkFromCoords(payload.latitude, payload.longitude);
  }
  const duplicates = quickMapProspectState.forceDuplicateSave ? [] : findPossibleProspectDuplicates(payload);
  if (duplicates.length) {
    renderPreciseMapDuplicateWarning(duplicates, action);
    if (mapProspectNotice) mapProspectNotice.textContent = "";
    return;
  }
  setMapProspectBusy(true);
  try {
    const savedId = await saveProspectFromForm(mapProspectForm, {
      source: "Mapa comercial",
      origin: "Mapa comercial",
      createdFrom: "commercial_map"
    });
    if (!savedId) {
      setMapProspectBusy(false);
      return;
    }
    quickMapProspectState.sessionCount += 1;
    quickMapProspectState.forceDuplicateSave = false;
    restoreCommercialMapCamera(cameraBeforeSave);
    closeQuickMapProspectDrawer({ force: true, clearMarker: true });
    showQuickMapToast("Prospecto creado correctamente.", "Ver en el mapa", () => {
      const id = `prospect_${savedId}`;
      const waitForEntity = () => {
        const entity = getMapEntityById(id);
        if (entity) {
          openMapDetail(id);
          return true;
        }
        return false;
      };
      if (!waitForEntity()) window.setTimeout(waitForEntity, 900);
    });
    if (action === "save-more") {
      quickMapProspectState.active = true;
      quickMapProspectState.selecting = true;
      updateQuickMapSessionUi();
    } else {
      quickMapProspectState.active = false;
      quickMapProspectState.selecting = false;
      updateQuickMapSessionUi();
    }
  } catch (error) {
    console.error("No se pudo guardar prospecto desde mapa:", error);
    if (mapProspectNotice) mapProspectNotice.textContent = "No se pudo guardar el prospecto. Reintenta sin perder los datos.";
  } finally {
    setMapProspectBusy(false);
  }
};

// Normaliza coordenadas desde multiples formatos. Devuelve {lat,lng} valido o null.
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

const getClientSalesInfo = (clientId, name) => {
  const targetName = normalizeText(name || "");
  let lastDate = "";
  let lastAmount = 0;
  let count = 0;
  state.sales.forEach((sale) => {
    const matches = (clientId && sale.clientId === clientId)
      || (!sale.clientId && targetName && normalizeText(sale.clientName || "") === targetName)
      || (sale.clientId && clientId && sale.clientId === clientId);
    if (!matches) return;
    count += 1;
    const date = getSaleDateValue(sale);
    if (date && date > lastDate) {
      lastDate = date;
      lastAmount = getSaleTotalAmount(sale);
    }
  });
  return { lastDate, lastAmount, count };
};

// Estado comercial unificado para el mapa (gris / verde / rojo).
const getCommercialMapStatus = (params) => {
  const { entityType, raw, clientId, name, followupMap } = params;
  if (entityType === "prospect") {
    const statusLabel = getOptionLabel(PROSPECT_STATUS_OPTIONS, normalizeOptionValue(PROSPECT_STATUS_OPTIONS, raw.status, "nuevo"));
    return {
      status: "prospect",
      color: MAP_COLORS.prospect,
      label: "Prospecto",
      reason: statusLabel,
      lastPurchaseDate: "",
      expectedRepurchaseDate: "",
      repurchaseFrequencyDays: null,
      lastAmount: 0,
      daysRemaining: null,
      daysLate: null
    };
  }
  const followup = followupMap.get(`id:${clientId}`) || followupMap.get(`name:${normalizeText(name || "")}`);
  if (followup) {
    const overdue = followup.statusClass === "overdue";
    return {
      status: overdue ? "overdue" : "client",
      color: overdue ? MAP_COLORS.overdue : MAP_COLORS.client,
      label: overdue ? "Recompra vencida" : "Cliente activo",
      reason: overdue ? `Vencida hace ${followup.overdueDays} dia(s)` : "Recompra al dia",
      lastPurchaseDate: followup.saleDate || "",
      expectedRepurchaseDate: followup.operativeDate || followup.nextContactDate || "",
      repurchaseFrequencyDays: followup.frequency || null,
      lastAmount: 0,
      daysRemaining: overdue ? null : (followup.daysUntil ?? null),
      daysLate: overdue ? (followup.overdueDays ?? null) : null
    };
  }
  const info = getClientSalesInfo(clientId, name);
  return {
    status: "client",
    color: MAP_COLORS.client,
    label: "Cliente activo",
    reason: "Sin frecuencia de recompra configurada",
    lastPurchaseDate: info.lastDate || "",
    expectedRepurchaseDate: "",
    repurchaseFrequencyDays: null,
    lastAmount: info.lastAmount || 0,
    daysRemaining: null,
    daysLate: null
  };
};

const buildCommercialMapEntities = () => {
  const followups = buildRepurchaseFollowups();
  const followupMap = new Map();
  followups.forEach((f) => {
    if (f.clientId) followupMap.set(`id:${f.clientId}`, f);
    if (f.clientName) followupMap.set(`name:${normalizeText(f.clientName)}`, f);
  });
  const makeEntity = (raw, entityType) => {
    const coords = normalizeCoordinates(raw);
    const clientId = entityType === "client" ? raw.id : "";
    const status = getCommercialMapStatus({ entityType, raw, clientId, name: raw.name, followupMap });
    return {
      id: `${entityType}_${raw.id}`,
      entityType,
      name: raw.name || "Sin nombre",
      contactName: raw.contactName || "",
      phone: raw.phone || "",
      businessType: raw.businessType || "",
      city: raw.city || "",
      neighborhood: raw.zone || "",
      address: raw.address || "",
      mapsLink: raw.mapsLink || "",
      latitude: coords ? coords.lat : null,
      longitude: coords ? coords.lng : null,
      hasLocation: Boolean(coords),
      nextVisitDate: normalizeDateValue(raw.nextActionDate || "") || "",
      importSessionId: raw.importSessionId || "",
      sourceCollection: entityType === "client" ? "clients" : "prospects",
      sourceDocumentId: raw.id,
      ...status
    };
  };
  const entities = [];
  state.prospects.forEach((p) => entities.push(makeEntity(p, "prospect")));
  state.clients.forEach((c) => entities.push(makeEntity(c, "client")));
  return entities;
};

const applyMapFilters = (entities) => entities.filter((e) => {
  const f = mapFilterState;
  if (f.type === "prospect" && e.entityType !== "prospect") return false;
  if (f.type === "client" && !(e.entityType === "client" && e.status === "client")) return false;
  if (f.type === "overdue" && e.status !== "overdue") return false;
  if (f.city && !normalizeText(e.city).includes(normalizeText(f.city))) return false;
  if (f.zone && !normalizeText(e.neighborhood).includes(normalizeText(f.zone))) return false;
  if (f.business && normalizeText(e.businessType) !== normalizeText(f.business)) return false;
  if (f.location === "with" && !e.hasLocation) return false;
  if (f.location === "without" && e.hasLocation) return false;
  if (commercialMapImportSessionFilter && e.importSessionId !== commercialMapImportSessionFilter) return false;
  return true;
});

const commercialEntitiesToGeoJSON = (entities) => ({
  type: "FeatureCollection",
  features: entities.filter((e) => e.hasLocation).map((e) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [e.longitude, e.latitude] },
    properties: {
      id: e.id,
      name: e.name,
      entityType: e.entityType,
      commercialStatus: e.status,
      color: e.color,
      city: e.city,
      neighborhood: e.neighborhood,
      phone: e.phone,
      lastPurchaseDate: e.lastPurchaseDate || "",
      expectedRepurchaseDate: e.expectedRepurchaseDate || "",
      daysLate: e.daysLate ?? 0,
      importSessionId: e.importSessionId || "",
      sourceCollection: e.sourceCollection,
      sourceDocumentId: e.sourceDocumentId,
      journeySelected: mapJourneySelectState.selectedIds.has(e.id)
    }
  }))
});

const showMapFallback = (message) => {
  const fb = document.getElementById("mapFallback");
  if (!fb) return;
  fb.hidden = false;
  fb.innerHTML = `<div class="map-fallback-box"><p>${escapeHtml(message)}</p><button class="btn ghost btn-xs" type="button" id="mapRetryBtn">Reintentar</button></div>`;
  document.getElementById("mapRetryBtn")?.addEventListener("click", () => {
    fb.hidden = true;
    if (commercialMap) { try { commercialMap.remove(); } catch (e) { /* noop */ } commercialMap = null; commercialMapReady = false; }
    ensureCommercialMap();
  });
};

const updateMapIndicators = (filtered) => {
  const el = document.getElementById("mapIndicators");
  if (!el) return;
  const prospects = filtered.filter((e) => e.entityType === "prospect").length;
  const clients = filtered.filter((e) => e.entityType === "client" && e.status === "client").length;
  const overdue = filtered.filter((e) => e.status === "overdue").length;
  const noLoc = filtered.filter((e) => !e.hasLocation).length;
  el.innerHTML = `
    <span class="map-cap"><i class="map-dot map-dot-orange"></i>${formatInteger(prospects)} prospectos</span>
    <span class="map-cap"><i class="map-dot map-dot-green"></i>${formatInteger(clients)} clientes activos</span>
    <span class="map-cap"><i class="map-dot map-dot-red"></i>${formatInteger(overdue)} recompras vencidas</span>
    <span class="map-cap map-cap-muted">Sin ubicacion: ${formatInteger(noLoc)}</span>
  `;
};

const renderMapVisibleList = (filtered) => {
  const list = document.getElementById("mapVisibleList");
  const count = document.getElementById("mapVisibleCount");
  if (count) count.textContent = formatInteger(filtered.length);
  if (!list) return;
  if (!filtered.length) {
    list.innerHTML = '<div class="empty-hint">Sin negocios para los filtros actuales.</div>';
    return;
  }
  list.innerHTML = filtered.slice(0, 200).map((e) => `
    <div class="map-visible-row" data-map-entity="${e.id}">
      <div class="map-visible-main">
        <span class="map-dot map-dot-${e.status === "overdue" ? "red" : e.status === "prospect" ? "orange" : "green"}"></span>
        <div>
          <div class="map-visible-name">${escapeHtml(e.name)}</div>
          <div class="map-visible-meta">${escapeHtml(e.label)}${e.city ? " · " + escapeHtml(e.city) : ""}${e.neighborhood ? " · " + escapeHtml(e.neighborhood) : ""}</div>
        </div>
      </div>
      <div class="map-visible-actions">
        ${e.hasLocation ? `<button class="icon-btn" type="button" data-map-locate="${e.id}" title="Ver en el mapa"><i data-lucide="map-pin"></i></button>` : '<span class="map-noloc" title="Sin ubicacion">s/ubic.</span>'}
        <button class="icon-btn" type="button" data-map-detail="${e.id}" title="Detalle"><i data-lucide="panel-right-open"></i></button>
      </div>
    </div>
  `).join("");
  refreshIcons();
};

const updateMapFilterBadge = () => {
  const badge = document.getElementById("mapFilterBadge");
  const chipsEl = document.getElementById("mapActiveChips");
  const f = mapFilterState;
  const typeLabels = { prospect: "Prospectos", client: "Clientes activos", overdue: "Recompra vencida" };
  const locLabels = { with: "Con ubicacion", without: "Sin ubicacion" };
  const items = [];
  if (f.type && f.type !== "all") items.push({ key: "type", label: typeLabels[f.type] || f.type });
  if (f.city) items.push({ key: "city", label: f.city });
  if (f.zone) items.push({ key: "zone", label: f.zone });
  if (f.business) items.push({ key: "business", label: f.business });
  if (f.location) items.push({ key: "location", label: locLabels[f.location] || f.location });
  if (badge) { badge.hidden = !items.length; badge.textContent = items.length; }
  if (chipsEl) {
    chipsEl.innerHTML = items.map((it) =>
      `<span class="map-active-chip" data-chip-key="${escapeHtml(it.key)}"><span>${escapeHtml(it.label)}</span><button type="button" aria-label="Quitar filtro">&times;</button></span>`
    ).join("");
    chipsEl.querySelectorAll(".map-active-chip button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.closest("[data-chip-key]").dataset.chipKey;
        if (key === "type") {
          mapFilterState.type = "all";
          document.querySelectorAll("#mapFilters .map-chip").forEach((c) => c.classList.toggle("active", c.dataset.mapFilter === "all"));
        } else {
          mapFilterState[key] = "";
          const idMap = { city: "mapCityFilter", zone: "mapZoneFilter", business: "mapBusinessFilter", location: "mapLocationFilter" };
          const el = document.getElementById(idMap[key]);
          if (el) el.value = "";
        }
        refreshCommercialMap();
        updateMapFilterBadge();
      });
    });
  }
};

const refreshCommercialMap = () => {
  if (!document.getElementById("commercialMapSection")) return;
  commercialMapEntities = buildCommercialMapEntities();
  const filtered = applyMapFilters(commercialMapEntities);
  updateMapIndicators(filtered);
  renderMapVisibleList(filtered);
  updateMapFilterBadge();
  if (commercialMap && commercialMap.getSource && commercialMap.getSource("commercial")) {
    commercialMap.getSource("commercial").setData(commercialEntitiesToGeoJSON(filtered));
  }
};

const getMapEntityById = (id) => commercialMapEntities.find((e) => e.id === id) || null;

// Reconstruye la fuente y las capas del mapa conservando zoom/centro/filtros.
// Solo se usa al activar o desactivar el clustering, ya que el parametro
// `cluster` de una fuente GeoJSON no se puede cambiar en caliente.
const rebuildCommercialMapSource = () => {
  if (!commercialMap || !commercialMapReady) return;
  // Eliminar capas en orden (de mas alta a mas baja).
  ["points-emph", "points", "select-glow", "cluster-count", "clusters"].forEach((id) => {
    try { if (commercialMap.getLayer(id)) commercialMap.removeLayer(id); } catch (e) { /* noop */ }
  });
  try { if (commercialMap.getSource("commercial")) commercialMap.removeSource("commercial"); } catch (e) { /* noop */ }
  addCommercialMapLayers();
  updateMapEmphasis();
  refreshCommercialMap();
};

// Resalta el pin activo (hover y/o seleccionado) sin mover la punta de la coordenada.
const updateMapEmphasis = () => {
  if (!commercialMap || !commercialMap.getLayer) return;
  if (commercialMap.getLayer("points-emph")) {
    const ids = [mapHoverId, mapSelectedId].filter(Boolean);
    commercialMap.setFilter("points-emph", ["all", ["!", ["has", "point_count"]], ["in", ["get", "id"], ["literal", ids]]]);
  }
  if (commercialMap.getLayer("select-glow")) {
    commercialMap.setFilter("select-glow", ["==", ["get", "id"], mapSelectedId || ""]);
  }
};

const highlightMapEntity = (id) => {
  mapSelectedId = id || "";
  updateMapEmphasis();
};

// Construye un pin SVG (forma de gota, borde blanco, circulo blanco al centro)
// y lo registra como imagen del mapa. Sin assets externos ni rutas absolutas.
const loadCommercialPinImage = (id, color) => new Promise((resolve) => {
  if (!commercialMap) { resolve(); return; }
  if (commercialMap.hasImage(id)) { resolve(); return; }
  const w = 64;
  const h = 84;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 32 42">`
    + `<path d="M16 1.5C9.1 1.5 3.5 7.1 3.5 14c0 8.9 12.5 25.5 12.5 25.5S28.5 22.9 28.5 14C28.5 7.1 22.9 1.5 16 1.5z" fill="${color}" stroke="#ffffff" stroke-width="2.4"/>`
    + `<circle cx="16" cy="14" r="5" fill="#ffffff"/></svg>`;
  const img = new Image(w, h);
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      if (commercialMap && !commercialMap.hasImage(id)) {
        commercialMap.addImage(id, ctx.getImageData(0, 0, w, h), { pixelRatio: 2 });
      }
    } catch (error) { /* noop */ }
    resolve();
  };
  img.onerror = () => resolve();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
});

const ensureCommercialMapImages = () => Promise.all([
  loadCommercialPinImage(MAP_PIN_ICONS.prospect, MAP_COLORS.prospect),
  loadCommercialPinImage(MAP_PIN_ICONS.client, MAP_COLORS.client),
  loadCommercialPinImage(MAP_PIN_ICONS.overdue, MAP_COLORS.overdue)
]);

const openMapDetail = (id) => {
  const e = getMapEntityById(id);
  const panel = document.getElementById("mapDetail");
  if (!e || !panel) return;
  highlightMapEntity(id);
  const gmaps = buildGoogleMapsLocationUrl({ latitude: e.latitude, longitude: e.longitude, mapsLink: e.mapsLink, address: e.address, zone: e.neighborhood, city: e.city });
  const wa = buildWhatsAppLink(e.phone, e.name);
  const fmt = (d) => d ? formatDate(d) : "-";
  const rows = [];
  rows.push(`<div class="map-detail-row"><b>Contacto</b><span>${escapeHtml(e.contactName || "-")}</span></div>`);
  rows.push(`<div class="map-detail-row"><b>Telefono</b><span>${escapeHtml(e.phone || "-")}</span></div>`);
  rows.push(`<div class="map-detail-row"><b>Rubro</b><span>${e.businessType ? escapeHtml(getBusinessTypeLabel(e.businessType)) : "-"}</span></div>`);
  rows.push(`<div class="map-detail-row"><b>Direccion</b><span>${escapeHtml(e.address || "-")}</span></div>`);
  rows.push(`<div class="map-detail-row"><b>Ciudad</b><span>${escapeHtml(e.city || "-")}${e.neighborhood ? " / " + escapeHtml(e.neighborhood) : ""}</span></div>`);
  rows.push(`<div class="map-detail-row"><b>Coordenadas</b><span>${e.hasLocation ? `${e.latitude.toFixed(5)}, ${e.longitude.toFixed(5)}` : "Sin ubicacion"}</span></div>`);
  if (e.entityType === "client") {
    rows.push(`<div class="map-detail-row"><b>Ultima compra</b><span>${fmt(e.lastPurchaseDate)}${e.lastAmount ? " · Gs " + formatGs(e.lastAmount) : ""}</span></div>`);
    rows.push(`<div class="map-detail-row"><b>Frecuencia</b><span>${e.repurchaseFrequencyDays ? "cada " + e.repurchaseFrequencyDays + " dias" : "Sin frecuencia configurada"}</span></div>`);
    rows.push(`<div class="map-detail-row"><b>Proxima recompra</b><span>${fmt(e.expectedRepurchaseDate)}</span></div>`);
    if (e.daysLate) rows.push(`<div class="map-detail-row"><b>Atraso</b><span>${e.daysLate} dia(s)</span></div>`);
    else if (e.daysRemaining !== null && e.daysRemaining !== undefined) rows.push(`<div class="map-detail-row"><b>Faltan</b><span>${e.daysRemaining} dia(s)</span></div>`);
  } else {
    rows.push(`<div class="map-detail-row"><b>Estado</b><span>${escapeHtml(e.reason)}</span></div>`);
  }
  const navTarget = e.entityType === "client" ? "clients" : "prospects";
  panel.hidden = false;
  panel.innerHTML = `
    <div class="map-detail-head">
      <div>
        <span class="map-badge map-badge-${e.status === "overdue" ? "red" : e.status === "prospect" ? "orange" : "green"}">${escapeHtml(e.label)}</span>
        <h3>${escapeHtml(e.name)}</h3>
      </div>
      <button class="icon-btn" type="button" id="mapDetailClose" title="Cerrar"><i data-lucide="x"></i></button>
    </div>
    <div class="map-detail-body">${rows.join("")}</div>
    <div class="map-detail-actions">
      ${wa ? `<a class="btn ghost btn-xs" href="${wa}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ""}
      ${gmaps ? `<a class="btn ghost btn-xs" href="${escapeHtml(gmaps)}" target="_blank" rel="noopener noreferrer">Google Maps</a>` : ""}
      <button class="btn ghost btn-xs" type="button" data-map-nav="${navTarget}">Ver ${e.entityType === "client" ? "cliente" : "prospecto"}</button>
      <button class="btn ghost btn-xs" type="button" data-map-nav="sales">Registrar venta</button>
    </div>
  `;
  refreshIcons();
  document.getElementById("mapDetailClose")?.addEventListener("click", () => {
    panel.hidden = true;
    highlightMapEntity("");
  });
  panel.querySelectorAll("[data-map-nav]").forEach((btn) => {
    btn.addEventListener("click", () => setActiveAppSection(btn.dataset.mapNav));
  });
};

const flyToMapEntity = (e) => {
  if (!commercialMap || !e?.hasLocation) return;
  commercialMap.flyTo({ center: [e.longitude, e.latitude], zoom: 15, essential: true });
};

const getMapPrefersReduced = () => Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

const playCommercialMapIntro = () => {
  if (commercialMapDidIntro || !commercialMap) return;
  commercialMapDidIntro = true;
  const located = commercialMapEntities.filter((e) => e.hasLocation);
  const reduced = getMapPrefersReduced();
  if (located.length) {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    located.forEach((e) => {
      minLng = Math.min(minLng, e.longitude); maxLng = Math.max(maxLng, e.longitude);
      minLat = Math.min(minLat, e.latitude); maxLat = Math.max(maxLat, e.latitude);
    });
    try {
      commercialMap.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 13, duration: reduced ? 0 : 2600 });
      return;
    } catch (e) { /* fallback abajo */ }
  }
  if (reduced) commercialMap.jumpTo({ center: CDE_CENTER, zoom: 11 });
  else commercialMap.flyTo({ center: CDE_CENTER, zoom: 11, speed: 0.7, curve: 1.6, essential: true });
};

const addCommercialMapLayers = () => {
  if (!commercialMap || commercialMap.getSource("commercial")) return;
  commercialMap.addSource("commercial", {
    type: "geojson",
    data: MAP_EMPTY_FC,
    cluster: commercialClusterEnabled,
    clusterRadius: COMMERCIAL_CLUSTER_RADIUS,
    clusterMaxZoom: COMMERCIAL_CLUSTER_MAX_ZOOM
  });
  commercialMap.addLayer({
    id: "clusters", type: "circle", source: "commercial", filter: ["has", "point_count"],
    paint: {
      // Azul grisaceo neutral: no confundir con verde de cliente activo.
      "circle-color": "#4a6fa5", "circle-opacity": 0.92,
      "circle-stroke-color": "#ffffff", "circle-stroke-width": 2.5,
      "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 30]
    }
  });
  commercialMap.addLayer({
    id: "cluster-count", type: "symbol", source: "commercial", filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13, "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"] },
    paint: { "text-color": "#ffffff" }
  });
  // Resplandor suave bajo el pin seleccionado (anclado a la coordenada).
  commercialMap.addLayer({
    id: "select-glow", type: "circle", source: "commercial",
    filter: ["==", ["get", "id"], mapSelectedId || ""],
    paint: {
      "circle-color": ["get", "color"],
      "circle-opacity": 0.2,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 12, 11, 18, 15, 26],
      "circle-stroke-color": ["get", "color"],
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0.55
    }
  });
  // Pines base tipo gota (symbol layer con icono SVG segun estado comercial).
  commercialMap.addLayer({
    id: "points", type: "symbol", source: "commercial", filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": MAP_PIN_ICON_EXPR,
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-size": ["interpolate", ["linear"], ["zoom"], 7, 0.55, 11, 0.8, 15, 1]
    }
  });
  // Pin agrandado para hover/seleccion (misma punta anclada abajo).
  commercialMap.addLayer({
    id: "points-emph", type: "symbol", source: "commercial",
    filter: ["all", ["!", ["has", "point_count"]], ["in", ["get", "id"], ["literal", []]]],
    layout: {
      "icon-image": MAP_PIN_ICON_EXPR,
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-size": ["interpolate", ["linear"], ["zoom"], 7, 0.64, 11, 0.94, 15, 1.18]
    }
  });
};

const applyCommercialMapGlobe = () => {
  try { commercialMap.setProjection({ type: "globe" }); } catch (e) { /* estilo sin globe */ }
};

const ensureCommercialMap = () => {
  const canvas = document.getElementById("commercialMapCanvas");
  if (!canvas) return;
  if (commercialMap) {
    window.setTimeout(() => { try { commercialMap.resize(); } catch (e) { /* noop */ } }, 60);
    return;
  }
  if (!window.maplibregl) { showMapFallback("No se pudo cargar MapLibre. Revisa tu conexion e intenta de nuevo."); return; }
  try {
    commercialMap = new maplibregl.Map({
      container: canvas,
      style: MAP_STYLES.streets,
      center: [-58, -16],
      zoom: 2.3,
      attributionControl: true
    });
  } catch (error) {
    console.error("[map] no se pudo iniciar", error);
    showMapFallback("Este dispositivo o navegador no puede mostrar el mapa interactivo.");
    return;
  }
  commercialMap.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left");
  commercialMap.on("error", (e) => console.warn("[map]", e?.error?.message || e));
  commercialMap.on("style.load", async () => {
    applyCommercialMapGlobe();
    try { await ensureCommercialMapImages(); } catch (error) { /* noop */ }
    addCommercialMapLayers();
    updateMapEmphasis();
    commercialMapReady = true;
    refreshCommercialMap();
    playCommercialMapIntro();
  });
  // Interacciones (se registran una vez; sobreviven a cambios de estilo).
  commercialMap.on("click", "clusters", (e) => {
    if (quickMapProspectState.active) return;
    const features = commercialMap.queryRenderedFeatures(e.point, { layers: ["clusters"] });
    const clusterId = features[0]?.properties?.cluster_id;
    if (clusterId === undefined) return;
    commercialMap.getSource("commercial").getClusterExpansionZoom(clusterId)
      .then((zoom) => commercialMap.easeTo({ center: features[0].geometry.coordinates, zoom }))
      .catch(() => {});
  });
  commercialMap.on("click", "points", (e) => {
    if (quickMapProspectState.active) return;
    if (mapJourneySelectState.active) {
      const id = e.features?.[0]?.properties?.id;
      if (id) { toggleMapEntityForJourney(id); e.stopPropagation?.(); }
      return;
    }
    const id = e.features?.[0]?.properties?.id;
    if (id) openMapDetail(id);
  });
  commercialMap.on("click", (e) => {
    if (handleMapClickForJourneySelect(e)) return;
    if (!quickMapProspectState.active || !quickMapProspectState.selecting) return;
    const features = commercialMap.queryRenderedFeatures(e.point, { layers: ["points", "points-emph", "clusters"] });
    if (features.length) {
      if (mapQuickModeText) mapQuickModeText.textContent = "Elegi un punto vacio del mapa, lejos de un marcador existente.";
      return;
    }
    setQuickMapProspectPoint(e.lngLat.lng, e.lngLat.lat);
  });
  commercialMap.on("mouseenter", "clusters", () => { commercialMap.getCanvas().style.cursor = "pointer"; });
  commercialMap.on("mouseleave", "clusters", () => { commercialMap.getCanvas().style.cursor = ""; });
  commercialMap.on("mousemove", "points", (e) => {
    if (quickMapProspectState.active) return;
    commercialMap.getCanvas().style.cursor = "pointer";
    const id = e.features?.[0]?.properties?.id || "";
    if (id !== mapHoverId) { mapHoverId = id; updateMapEmphasis(); }
  });
  commercialMap.on("mouseleave", "points", () => {
    commercialMap.getCanvas().style.cursor = "";
    if (mapHoverId) { mapHoverId = ""; updateMapEmphasis(); }
  });
};

const resizeCommercialMap = (delay = 60) => {
  if (!commercialMap) return;
  window.setTimeout(() => { try { commercialMap.resize(); } catch (e) { /* noop */ } }, delay);
};

const setupCommercialMap = () => {
  if (!document.getElementById("commercialMapSection")) return;
  mapAddProspectBtn?.addEventListener("click", () => {
    startQuickMapProspectMode();
  });
  mapQuickCancelSelection?.addEventListener("click", () => {
    resumeQuickMapProspectSelection({ clearForm: true });
  });
  mapQuickFinish?.addEventListener("click", () => {
    finishQuickMapProspectMode();
  });
  mapProspectForm?.querySelectorAll("[data-map-prospect-action]").forEach((button) => {
    button.addEventListener("click", () => {
      quickMapProspectState.saveAction = button.dataset.mapProspectAction || "save";
    });
  });
  mapProspectForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveQuickMapProspect(event.submitter?.dataset?.mapProspectAction || quickMapProspectState.saveAction || "save");
  });
  mapProspectClose?.addEventListener("click", () => {
    finishQuickMapProspectMode({ showSummary: false });
  });
  mapProspectCancel?.addEventListener("click", () => {
    finishQuickMapProspectMode({ showSummary: false });
  });
  mapProspectChangeLocation?.addEventListener("click", () => {
    resumeQuickMapProspectSelection({ clearForm: false });
  });
  // Filtros tipo (chips)
  document.getElementById("mapFilters")?.addEventListener("click", (event) => {
    const chip = event.target.closest(".map-chip");
    if (!chip) return;
    mapFilterState.type = chip.dataset.mapFilter || "all";
    document.querySelectorAll("#mapFilters .map-chip").forEach((c) => c.classList.toggle("active", c === chip));
    refreshCommercialMap();
  });
  const bindFilter = (id, key) => {
    const el = document.getElementById(id);
    el?.addEventListener("input", () => { mapFilterState[key] = el.value || ""; refreshCommercialMap(); });
    el?.addEventListener("change", () => { mapFilterState[key] = el.value || ""; refreshCommercialMap(); });
  };
  bindFilter("mapCityFilter", "city");
  bindFilter("mapZoneFilter", "zone");
  bindFilter("mapBusinessFilter", "business");
  bindFilter("mapLocationFilter", "location");
  document.getElementById("mapClearFilters")?.addEventListener("click", () => {
    mapFilterState.type = "all"; mapFilterState.city = ""; mapFilterState.zone = ""; mapFilterState.business = ""; mapFilterState.location = "";
    ["mapCityFilter", "mapZoneFilter", "mapBusinessFilter", "mapLocationFilter"].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ""; });
    document.querySelectorAll("#mapFilters .map-chip").forEach((c) => c.classList.toggle("active", c.dataset.mapFilter === "all"));
    refreshCommercialMap();
  });
  document.getElementById("mapViewPy")?.addEventListener("click", () => {
    if (commercialMap) commercialMap.fitBounds(PY_BOUNDS, { padding: 40, duration: getMapPrefersReduced() ? 0 : 1800 });
  });
  const centerResults = () => {
    if (!commercialMap) return;
    const located = applyMapFilters(commercialMapEntities).filter((e) => e.hasLocation);
    if (!located.length) { window.alert("No hay negocios con ubicacion para centrar."); return; }
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    located.forEach((e) => { minLng = Math.min(minLng, e.longitude); maxLng = Math.max(maxLng, e.longitude); minLat = Math.min(minLat, e.latitude); maxLat = Math.max(maxLat, e.latitude); });
    commercialMap.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 15, duration: getMapPrefersReduced() ? 0 : 1400 });
  };
  document.getElementById("mapViewAll")?.addEventListener("click", centerResults);
  document.getElementById("mapCenterResults")?.addEventListener("click", centerResults);
  document.getElementById("mapStyleSelect")?.addEventListener("change", (event) => {
    const key = event.target.value;
    if (commercialMap && MAP_STYLES[key]) commercialMap.setStyle(MAP_STYLES[key]);
  });

  // ===== Menus compactos: Filtros / Capas / Opciones =====
  const mapFilterPanel = document.getElementById("mapFilterPanel");
  const mapFilterBtn = document.getElementById("mapFilterBtn");
  const mapLayersMenu = document.getElementById("mapLayersMenu");
  const mapLayersBtn = document.getElementById("mapLayersBtn");
  const mapOptionsMenu = document.getElementById("mapOptionsMenu");
  const mapOptionsBtn = document.getElementById("mapOptionsBtn");

  const closeMapFilterPanel = () => {
    if (mapFilterPanel) mapFilterPanel.hidden = true;
    mapFilterBtn?.setAttribute("aria-expanded", "false");
  };
  const closeMapLayersMenu = () => {
    if (mapLayersMenu) mapLayersMenu.hidden = true;
    mapLayersBtn?.setAttribute("aria-expanded", "false");
  };
  const closeMapOptionsMenu = () => {
    if (mapOptionsMenu) mapOptionsMenu.hidden = true;
    mapOptionsBtn?.setAttribute("aria-expanded", "false");
  };

  mapFilterBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !mapFilterPanel?.hidden;
    closeMapLayersMenu(); closeMapOptionsMenu();
    if (isOpen) { closeMapFilterPanel(); } else { if (mapFilterPanel) mapFilterPanel.hidden = false; mapFilterBtn.setAttribute("aria-expanded", "true"); }
  });

  mapLayersBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !mapLayersMenu?.hidden;
    closeMapFilterPanel(); closeMapOptionsMenu();
    if (isOpen) { closeMapLayersMenu(); } else { if (mapLayersMenu) mapLayersMenu.hidden = false; mapLayersBtn.setAttribute("aria-expanded", "true"); }
  });

  mapOptionsBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !mapOptionsMenu?.hidden;
    closeMapFilterPanel(); closeMapLayersMenu();
    if (isOpen) { closeMapOptionsMenu(); } else { if (mapOptionsMenu) mapOptionsMenu.hidden = false; mapOptionsBtn.setAttribute("aria-expanded", "true"); }
  });

  // Botones de estilo en el menu Capas
  mapLayersMenu?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-style-btn]");
    if (!btn) return;
    const sel = document.getElementById("mapStyleSelect");
    if (sel) { sel.value = btn.dataset.styleBtn; sel.dispatchEvent(new Event("change")); }
    mapLayersMenu.querySelectorAll("[data-style-btn]").forEach((b) => b.classList.toggle("active", b === btn));
    closeMapLayersMenu();
  });

  // Aplicar / cerrar panel de filtros
  document.getElementById("mapApplyFiltersBtn")?.addEventListener("click", () => { closeMapFilterPanel(); updateMapFilterBadge(); });
  document.getElementById("mapCloseFilterBtn")?.addEventListener("click", closeMapFilterPanel);

  // Toggle "Agrupar puntos"
  const clusterToggle = document.getElementById("mapClusterToggle");
  if (clusterToggle) {
    clusterToggle.checked = commercialClusterEnabled;
    // Sincronizar leyenda al estado inicial
    const legendCluster = document.getElementById("mapLegendCluster");
    if (legendCluster) legendCluster.style.display = commercialClusterEnabled ? "" : "none";
    clusterToggle.addEventListener("change", () => {
      commercialClusterEnabled = clusterToggle.checked;
      sessionStorage.setItem("mapClusterEnabled", commercialClusterEnabled);
      const lc = document.getElementById("mapLegendCluster");
      if (lc) lc.style.display = commercialClusterEnabled ? "" : "none";
      rebuildCommercialMapSource();
    });
  }

  // Buscador geografico (MapTiler)
  const geoInput = document.getElementById("mapGeoSearch");
  const geoResults = document.getElementById("mapGeoResults");
  geoInput?.addEventListener("input", () => {
    const q = geoInput.value.trim();
    window.clearTimeout(mapGeoSearchTimer);
    if (q.length < 3) { if (geoResults) { geoResults.hidden = true; geoResults.innerHTML = ""; } return; }
    mapGeoSearchTimer = window.setTimeout(async () => {
      try {
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${MAPTILER_API_KEY}&country=py&autocomplete=true&limit=6&language=es`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("geocoding");
        const data = await res.json();
        const features = data.features || [];
        if (!geoResults) return;
        geoResults.innerHTML = features.length
          ? features.map((f, i) => `<button type="button" class="map-search-item" data-geo-index="${i}">${escapeHtml(f.place_name || f.text || "")}</button>`).join("")
          : '<div class="map-search-empty">Sin resultados</div>';
        geoResults.hidden = false;
        geoResults._features = features;
      } catch (error) {
        if (geoResults) { geoResults.innerHTML = '<div class="map-search-empty">No se pudo buscar.</div>'; geoResults.hidden = false; }
      }
    }, 350);
  });
  geoResults?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-geo-index]");
    if (!btn) return;
    const feature = geoResults._features?.[Number(btn.dataset.geoIndex)];
    if (feature && commercialMap) {
      const center = feature.center || (feature.geometry && feature.geometry.coordinates);
      if (center) commercialMap.flyTo({ center, zoom: 14, essential: true });
    }
    geoResults.hidden = true;
    geoInput.value = feature?.place_name || geoInput.value;
  });

  // Buscador comercial
  const bizInput = document.getElementById("mapBizSearch");
  const bizResults = document.getElementById("mapBizResults");
  bizInput?.addEventListener("input", () => {
    const q = normalizeText(bizInput.value.trim());
    if (!bizResults) return;
    if (q.length < 2) { bizResults.hidden = true; bizResults.innerHTML = ""; return; }
    const matches = commercialMapEntities.filter((e) => normalizeText([e.name, e.contactName, e.phone, e.city, e.neighborhood].filter(Boolean).join(" ")).includes(q)).slice(0, 8);
    bizResults.innerHTML = matches.length
      ? matches.map((e) => `<button type="button" class="map-search-item" data-biz-id="${e.id}"><span class="map-dot map-dot-${e.status === "overdue" ? "red" : e.status === "prospect" ? "orange" : "green"}"></span>${escapeHtml(e.name)}${e.city ? " · " + escapeHtml(e.city) : ""}</button>`).join("")
      : '<div class="map-search-empty">Sin resultados</div>';
    bizResults.hidden = false;
  });
  bizResults?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-biz-id]");
    if (!btn) return;
    const e = getMapEntityById(btn.dataset.bizId);
    if (e) {
      if (e.hasLocation) flyToMapEntity(e);
      openMapDetail(e.id);
      if (!e.hasLocation) window.alert("Este registro no tiene ubicacion cargada.");
    }
    bizResults.hidden = true;
  });

  // Negocios visibles (colapsable)
  const visToggle = document.getElementById("mapVisibleToggle");
  const visBody = document.getElementById("mapVisibleBody");
  visToggle?.addEventListener("click", () => {
    const expanded = visToggle.getAttribute("aria-expanded") === "true";
    visToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
    if (visBody) visBody.hidden = expanded;
    visToggle.closest(".collapsible-panel")?.classList.toggle("open", !expanded);
  });
  document.getElementById("mapVisibleList")?.addEventListener("click", (event) => {
    const locate = event.target.closest("[data-map-locate]");
    const detail = event.target.closest("[data-map-detail]");
    const row = event.target.closest("[data-map-entity]");
    if (locate) { const e = getMapEntityById(locate.dataset.mapLocate); if (e) flyToMapEntity(e); openMapDetail(locate.dataset.mapLocate); return; }
    if (detail) { openMapDetail(detail.dataset.mapDetail); return; }
    if (row) { const e = getMapEntityById(row.dataset.mapEntity); if (e?.hasLocation) flyToMapEntity(e); openMapDetail(row.dataset.mapEntity); }
  });

  // Cerrar resultados y menus al clickear fuera
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#mapGeoSearch") && !event.target.closest("#mapGeoResults") && geoResults) geoResults.hidden = true;
    if (!event.target.closest("#mapBizSearch") && !event.target.closest("#mapBizResults") && bizResults) bizResults.hidden = true;
    if (!event.target.closest("#mapFilterBtn") && !event.target.closest("#mapFilterPanel")) closeMapFilterPanel?.();
    if (!event.target.closest("#mapLayersWrap")) closeMapLayersMenu?.();
    if (!event.target.closest("#mapOptionsWrap")) closeMapOptionsMenu?.();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMapFilterPanel?.();
      closeMapLayersMenu?.();
      closeMapOptionsMenu?.();
      if (quickMapProspectState.active) finishQuickMapProspectMode({ showSummary: false });
    }
  });

  window.addEventListener("resize", () => resizeCommercialMap(120));
  window.addEventListener("orientationchange", () => resizeCommercialMap(300));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) resizeCommercialMap(120); });
};

/* ---- Selector de ubicacion en formularios (Clientes/Prospectos) ---- */
let locPickerMap = null;
let locPickerMarker = null;
let locPickerLatLng = null;
let locTargetForm = "";

const getLocFormInputs = (formName) => {
  const form = document.getElementById(formName === "client" ? "clientForm" : "prospectForm");
  if (!form) return null;
  return {
    lat: form.querySelector('[name="latitude"]'),
    lng: form.querySelector('[name="longitude"]')
  };
};

const updateLocPickerCoords = (lng, lat) => {
  locPickerLatLng = { lng, lat };
  const el = document.getElementById("locationPickerCoords");
  if (el) el.textContent = `Lat: ${lat.toFixed(6)}  ·  Lng: ${lng.toFixed(6)}`;
};

const setLocPickerMarker = (lng, lat) => {
  if (!locPickerMap) return;
  if (!locPickerMarker) {
    locPickerMarker = new maplibregl.Marker({ draggable: true, color: "#16a34a" });
    locPickerMarker.on("dragend", () => {
      const p = locPickerMarker.getLngLat();
      updateLocPickerCoords(p.lng, p.lat);
    });
  }
  locPickerMarker.setLngLat([lng, lat]).addTo(locPickerMap);
  updateLocPickerCoords(lng, lat);
};

const openLocationPicker = (formName) => {
  const modal = document.getElementById("locationPickerModal");
  const mapEl = document.getElementById("locationPickerMap");
  if (!modal || !mapEl) return;
  if (!window.maplibregl) { window.alert("No se pudo cargar el mapa. Revisa tu conexion."); return; }
  locTargetForm = formName;
  const inputs = getLocFormInputs(formName);
  const curLat = mapToNumber(inputs?.lat?.value);
  const curLng = mapToNumber(inputs?.lng?.value);
  const hasCur = curLat !== null && curLng !== null;
  const center = hasCur ? [curLng, curLat] : CDE_CENTER;
  modal.hidden = false;
  if (!locPickerMap) {
    try {
      locPickerMap = new maplibregl.Map({ container: mapEl, style: MAP_STYLES.streets, center, zoom: hasCur ? 15 : 11 });
      locPickerMap.addControl(new maplibregl.NavigationControl(), "top-right");
      locPickerMap.on("click", (e) => setLocPickerMarker(e.lngLat.lng, e.lngLat.lat));
    } catch (error) {
      console.error("[loc-picker]", error);
      window.alert("Este navegador no puede mostrar el mapa interactivo.");
      return;
    }
  } else {
    locPickerMap.jumpTo({ center, zoom: hasCur ? 15 : 11 });
  }
  locPickerLatLng = hasCur ? { lng: curLng, lat: curLat } : null;
  window.setTimeout(() => {
    try { locPickerMap.resize(); } catch (e) { /* noop */ }
    if (hasCur) {
      setLocPickerMarker(curLng, curLat);
    } else {
      if (locPickerMarker) locPickerMarker.remove();
      const el = document.getElementById("locationPickerCoords");
      if (el) el.textContent = "Toca el mapa para elegir la ubicacion.";
    }
  }, 90);
};

const closeLocationPicker = () => {
  const modal = document.getElementById("locationPickerModal");
  if (modal) modal.hidden = true;
};

const useCurrentLocationForForm = (formName) => {
  const inputs = getLocFormInputs(formName);
  if (!inputs?.lat || !inputs?.lng) return;
  if (!navigator.geolocation) { window.alert("Tu navegador no soporta geolocalizacion."); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      inputs.lat.value = pos.coords.latitude.toFixed(6);
      inputs.lng.value = pos.coords.longitude.toFixed(6);
      window.alert("Ubicacion actual cargada. Podes ajustarla con 'Seleccionar en el mapa'.");
    },
    (error) => {
      window.alert(error?.code === 1
        ? "Permiso de ubicacion denegado. Activalo en el navegador para usar esta funcion."
        : "No se pudo obtener tu ubicacion. Intenta de nuevo.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

const setupLocationPicker = () => {
  document.querySelectorAll(".location-tools").forEach((row) => {
    const formName = row.dataset.locForm;
    row.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-loc-action]");
      if (!btn) return;
      const action = btn.dataset.locAction;
      if (action === "current") {
        useCurrentLocationForForm(formName);
      } else if (action === "pick") {
        openLocationPicker(formName);
      } else if (action === "verify") {
        const inputs = getLocFormInputs(formName);
        if (mapToNumber(inputs?.lat?.value) === null || mapToNumber(inputs?.lng?.value) === null) {
          window.alert("Carga latitud y longitud (o usa 'Seleccionar en el mapa') antes de verificar.");
          return;
        }
        openLocationPicker(formName);
      }
    });
  });
  const modal = document.getElementById("locationPickerModal");
  modal?.addEventListener("click", (event) => {
    if (event.target.closest("[data-loc-close]")) closeLocationPicker();
  });
  document.getElementById("locationPickerConfirm")?.addEventListener("click", () => {
    if (!locPickerLatLng) { window.alert("Selecciona un punto en el mapa primero."); return; }
    const inputs = getLocFormInputs(locTargetForm);
    if (inputs?.lat && inputs?.lng) {
      inputs.lat.value = locPickerLatLng.lat.toFixed(6);
      inputs.lng.value = locPickerLatLng.lng.toFixed(6);
    }
    closeLocationPicker();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLocationPicker();
  });
};

/* ---- Toast discreto ---- */
let ggToastTimer = null;
const showToast = (message) => {
  let toast = document.getElementById("ggToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "ggToast";
    toast.className = "gg-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(ggToastTimer);
  ggToastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
};

/* ---- Modal "Nuevo rubro" (catalogo dinamico compartido) ---- */
let rubroTargetSelect = null;

const setRubroError = (message) => {
  const el = document.getElementById("rubroError");
  if (el) el.innerHTML = message || "";
};

const selectRubroInTarget = (key, label) => {
  if (!rubroTargetSelect) return;
  if (![...rubroTargetSelect.options].some((opt) => opt.value === key)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = label;
    rubroTargetSelect.appendChild(opt);
  }
  rubroTargetSelect.value = key;
  rubroTargetSelect.dispatchEvent(new Event("change", { bubbles: true }));
};

const openRubroModal = (targetSelect) => {
  rubroTargetSelect = targetSelect || prospectForm?.businessType || null;
  const modal = document.getElementById("rubroModal");
  if (!modal) return;
  const nameInput = document.getElementById("rubroName");
  const descInput = document.getElementById("rubroDesc");
  if (nameInput) nameInput.value = "";
  if (descInput) descInput.value = "";
  setRubroError("");
  modal.hidden = false;
  requestAnimationFrame(() => nameInput?.focus());
};

const closeRubroModal = () => {
  const modal = document.getElementById("rubroModal");
  if (modal) modal.hidden = true;
};

const createRubro = async () => {
  const nameInput = document.getElementById("rubroName");
  const descInput = document.getElementById("rubroDesc");
  const createBtn = document.getElementById("rubroCreateBtn");
  const rawName = String(nameInput?.value || "").replace(/\s+/g, " ").trim();
  const key = normalizeRubroKey(rawName);
  if (!rawName || !key || !/[a-z0-9]/i.test(key)) {
    setRubroError("Ingresá un nombre de rubro válido.");
    return;
  }
  // Duplicado (ignora mayusculas/tildes/espacios) contra el catalogo y los inactivos.
  const existingActive = getBusinessTypeOptions().find((opt) => opt.value === key);
  const existingAny = (state.businessTypes || []).find((rt) => normalizeRubroKey(rt.normalizedName || rt.name) === key);
  if (existingActive || existingAny) {
    const label = existingActive?.label || existingAny?.name || titleCaseRubro(rawName);
    setRubroError(`Este rubro ya existe. <button type="button" class="link-btn" id="rubroUseExisting">Seleccionar rubro existente</button>`);
    document.getElementById("rubroUseExisting")?.addEventListener("click", () => {
      selectRubroInTarget(key, label);
      closeRubroModal();
      showToast("Rubro seleccionado.");
    });
    return;
  }
  try {
    if (createBtn) { createBtn.disabled = true; createBtn.textContent = "Creando..."; }
    const ref = doc(collection(db, "businessTypes"), rubroDocId(key));
    await setDoc(ref, {
      name: rawName,
      normalizedName: key,
      description: String(descInput?.value || "").trim(),
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    selectRubroInTarget(key, rawName);
    closeRubroModal();
    showToast("Rubro creado correctamente.");
  } catch (error) {
    console.error("[rubros] no se pudo crear:", error);
    setRubroError("No se pudo guardar el rubro. Revisá tu conexión e intentá de nuevo.");
  } finally {
    if (createBtn) { createBtn.disabled = false; createBtn.textContent = "Crear rubro"; }
  }
};

const setupRubroModal = () => {
  renderBusinessTypeSelectors();
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-new-rubro]");
    if (trigger) {
      const select = trigger.closest("form")?.querySelector('[name="businessType"]') || prospectForm?.businessType;
      openRubroModal(select);
      return;
    }
    if (event.target.closest("[data-rubro-close]")) closeRubroModal();
  });
  document.getElementById("rubroCreateBtn")?.addEventListener("click", createRubro);
  document.getElementById("rubroName")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); createRubro(); }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeRubroModal();
  });
};

// ============================================================
// MODULO JORNADAS DE VISITAS
// ============================================================

// ----- Firestore CRUD -----
const saveNewJourney = async (journeyData, stops) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No autenticado");
  const journeyRef = doc(collection(db, "visitJourneys"));
  const now = serverTimestamp();
  const batch = writeBatch(db);
  batch.set(journeyRef, {
    ...journeyData,
    assignedUserId: user.uid,
    assignedUserName: user.email || user.uid,
    createdBy: user.uid,
    createdAt: now,
    updatedAt: now
  });
  stops.forEach((stop) => {
    const stopRef = doc(collection(db, "visitJourneys", journeyRef.id, "stops"));
    batch.set(stopRef, { ...stop, createdAt: now, updatedAt: now });
  });
  await batch.commit();
  return journeyRef.id;
};

const updateStopResult = async (journeyId, stopId, result, notes = "") => {
  if (!journeyId || !stopId) return;
  const stopRef = doc(db, "visitJourneys", journeyId, "stops", stopId);
  const isComplete = STOP_TERMINAL_STATES.has(result);
  const update = { status: result, resultNotes: notes, updatedAt: serverTimestamp() };
  if (isComplete) update.completedAt = serverTimestamp();
  await updateDoc(stopRef, update);
  await recalcJourneyProgress(journeyId);
};

const recalcJourneyProgress = async (journeyId) => {
  const snap = await getDocs(collection(db, "visitJourneys", journeyId, "stops"));
  const stops = snap.docs.map((d) => d.data());
  const completed = stops.filter((s) => STOP_TERMINAL_STATES.has(s.status)).length;
  await updateDoc(doc(db, "visitJourneys", journeyId), {
    completedStops: completed,
    totalStops: stops.length,
    status: completed === stops.length && stops.length > 0 ? "completed" : "active",
    updatedAt: serverTimestamp()
  });
};

const startJourney = async (journeyId) => {
  await updateDoc(doc(db, "visitJourneys", journeyId), { status: "active", startedAt: serverTimestamp(), updatedAt: serverTimestamp() });
};

const finalizeJourney = async (journeyId) => {
  await updateDoc(doc(db, "visitJourneys", journeyId), { status: "completed", completedAt: serverTimestamp(), updatedAt: serverTimestamp() });
};

const deleteJourney = async (journeyId) => {
  await updateDoc(doc(db, "visitJourneys", journeyId), { status: "cancelled", updatedAt: serverTimestamp() });
};

// ----- Helpers -----
const todayStr = () => toDateInputValue(new Date());
const suggestJourneyName = () => {
  const entities = journeyCreatorState.selectedEntities;
  const cities = [...new Set(entities.map((e) => e.city).filter(Boolean))];
  const cityStr = cities.slice(0, 2).join(" y ") || "Visitas";
  return `Jornada ${cityStr} · ${formatDate(todayStr())}`;
};

const buildOpenMapsUrl = (stop) => {
  if (stop.latitude && stop.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}&travelmode=driving`;
  }
  const address = [stop.address, stop.city].filter(Boolean).join(", ");
  return address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving` : "";
};

// ----- Journey list rendering -----
const renderJourneysList = (journeys) => {
  const el = document.getElementById("journeysList");
  if (!el) return;
  if (!journeys.length) {
    el.innerHTML = '<div class="empty-hint">Sin jornadas todavia. Crea una desde el Mapa comercial.</div>';
    return;
  }
  const sorted = [...journeys].sort((a, b) => (b.scheduledDate || "").localeCompare(a.scheduledDate || ""));
  el.innerHTML = sorted.map((j) => {
    const pct = j.totalStops > 0 ? Math.round((j.completedStops || 0) / j.totalStops * 100) : 0;
    const statusLabel = JOURNEY_STATUS_LABELS[j.status] || j.status || "Borrador";
    const statusClass = { draft: "muted", planned: "blue", active: "green", completed: "green-dark", cancelled: "red" }[j.status] || "muted";
    return `
    <div class="journey-card" data-journey-id="${j.id}">
      <div class="journey-card-head">
        <div class="journey-card-title">${escapeHtml(j.name || "Sin nombre")}</div>
        <span class="journey-status-badge journey-status-${statusClass}">${statusLabel}</span>
      </div>
      <div class="journey-card-meta">
        <span>${j.scheduledDate ? formatDate(j.scheduledDate) : "-"}</span>
        <span>${j.totalStops || 0} paradas</span>
        ${j.totalDistanceMeters ? `<span>${formatDistance(j.totalDistanceMeters)}</span>` : ""}
        ${j.estimatedDurationSeconds ? `<span>${formatDuration(j.estimatedDurationSeconds)}</span>` : ""}
        ${j.isApproximate ? '<span class="muted" title="Orden aproximado sin informacion vial">~Aprox.</span>' : ""}
      </div>
      ${j.totalStops > 0 ? `
        <div class="journey-progress-wrap">
          <div class="journey-progress-bar" style="width:${pct}%"></div>
        </div>
        <div class="journey-progress-label">${j.completedStops || 0} de ${j.totalStops} completadas</div>
      ` : ""}
      <div class="journey-card-actions">
        ${j.status === "planned" || j.status === "draft" ? `<button class="btn primary btn-xs" type="button" data-journey-start="${j.id}">Iniciar</button>` : ""}
        ${j.status === "active" ? `<button class="btn primary btn-xs" type="button" data-journey-open="${j.id}">Continuar</button>` : ""}
        ${j.status === "completed" ? `<button class="btn ghost btn-xs" type="button" data-journey-open="${j.id}">Ver resumen</button>` : ""}
        <button class="btn ghost btn-xs" type="button" data-journey-open="${j.id}">Abrir</button>
        ${j.status !== "completed" ? `<button class="btn ghost btn-xs" type="button" data-journey-cancel="${j.id}">Cancelar</button>` : ""}
      </div>
    </div>`;
  }).join("");
};

// ----- Active journey rendering -----
const renderActiveJourney = async (journeyId) => {
  const jEl = document.getElementById("journeyActiveSectionContent");
  if (!jEl) return;
  const journeySnap = await getDoc(doc(db, "visitJourneys", journeyId));
  if (!journeySnap.exists()) { jEl.innerHTML = '<div class="empty-hint">Jornada no encontrada.</div>'; return; }
  const j = { id: journeySnap.id, ...journeySnap.data() };
  const stopsSnap = await getDocs(query(collection(db, "visitJourneys", journeyId, "stops"), orderBy("order", "asc")));
  const stops = stopsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  journeyStopsCache = stops;
  const pct = j.totalStops > 0 ? Math.round((j.completedStops || 0) / j.totalStops * 100) : 0;
  jEl.innerHTML = `
    <div class="journey-active-head">
      <div>
        <div class="journey-active-title">${escapeHtml(j.name || "Jornada")}</div>
        <div class="journey-active-sub">${j.completedStops || 0} de ${j.totalStops || 0} visitas completadas</div>
      </div>
      <div class="journey-active-controls">
        ${j.status === "planned" || j.status === "draft" ? '<button class="btn primary" type="button" id="journeyStartBtn">Iniciar jornada</button>' : ""}
        ${j.status === "active" ? '<button class="btn ghost" type="button" id="journeyFinalizeBtn">Finalizar</button>' : ""}
      </div>
    </div>
    <div class="journey-active-progress">
      <div class="journey-active-progress-bar" style="width:${pct}%"></div>
    </div>
    ${j.totalDistanceMeters || j.estimatedDurationSeconds ? `
    <div class="journey-active-stats">
      ${j.totalDistanceMeters ? `<span>${formatDistance(j.totalDistanceMeters)} totales</span>` : ""}
      ${j.estimatedDurationSeconds ? `<span>${formatDuration(j.estimatedDurationSeconds)} estimados</span>` : ""}
      ${j.isApproximate ? '<span class="muted">Orden aproximado</span>' : '<span class="journey-stat-exact">Ruta optimizada</span>'}
    </div>` : ""}
    <div class="journey-stops-list" id="journeyStopsList">
      ${stops.map((stop, idx) => renderStopCard(stop, idx, j.status)).join("")}
    </div>
    ${j.status === "active" ? `
    <div class="journey-active-footer">
      <button class="btn ghost" type="button" id="journeyFinalizeBtn2">Finalizar jornada</button>
    </div>` : ""}
  `;
  refreshIcons();
  // journeyBackToList is a static button handled in setupJourneysModule
  document.getElementById("journeyStartBtn")?.addEventListener("click", async () => {
    await startJourney(journeyId);
    renderActiveJourney(journeyId);
  });
  const finalize = async () => {
    if (!window.confirm("Finalizar la jornada? Las paradas pendientes quedarán sin visitar.")) return;
    await finalizeJourney(journeyId);
    renderActiveJourney(journeyId);
  };
  document.getElementById("journeyFinalizeBtn")?.addEventListener("click", finalize);
  document.getElementById("journeyFinalizeBtn2")?.addEventListener("click", finalize);
  jEl.querySelectorAll("[data-stop-maps]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stop = journeyStopsCache.find((s) => s.id === btn.dataset.stopMaps);
      const url = stop ? buildOpenMapsUrl(stop) : "";
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else window.alert("Este negocio no tiene coordenadas para navegar.");
    });
  });
  jEl.querySelectorAll("[data-stop-result]").forEach((btn) => {
    btn.addEventListener("click", () => openResultModal(journeyId, btn.dataset.stopResult));
  });
};

const renderStopCard = (stop, idx, journeyStatus) => {
  const isComplete = STOP_TERMINAL_STATES.has(stop.status);
  const isPending = stop.status === "pending" || stop.status === "en_route";
  const statusLabel = STOP_STATUS_LABELS[stop.status] || stop.status || "Pendiente";
  const typeLabel = stop.commercialStatus === "overdue" ? "Recompra vencida" : stop.entityType === "client" ? "Cliente activo" : "Prospecto";
  const dotClass = stop.commercialStatus === "overdue" ? "red" : stop.entityType === "client" ? "green" : "orange";
  return `
  <div class="stop-card ${isComplete ? "stop-complete" : isPending ? "stop-pending" : ""}" data-stop-id="${stop.id}">
    <div class="stop-number">${idx + 1}</div>
    <div class="stop-info">
      <div class="stop-name"><i class="map-dot map-dot-${dotClass}"></i> ${escapeHtml(stop.businessName || "-")}</div>
      <div class="stop-meta">${typeLabel}${stop.city ? " · " + escapeHtml(stop.city) : ""}${stop.address ? " · " + escapeHtml(stop.address) : ""}</div>
      ${stop.distanceFromPreviousMeters || stop.durationFromPreviousSeconds ? `
      <div class="stop-leg">${stop.distanceFromPreviousMeters ? formatDistance(stop.distanceFromPreviousMeters) : ""} ${stop.durationFromPreviousSeconds ? "· " + formatDuration(stop.durationFromPreviousSeconds) : ""}</div>` : ""}
      <div class="stop-status-label">${statusLabel}</div>
      ${stop.resultNotes ? `<div class="stop-notes">${escapeHtml(stop.resultNotes)}</div>` : ""}
    </div>
    <div class="stop-actions">
      ${journeyStatus === "active" && isPending ? `
        <button class="btn primary btn-xs" type="button" data-stop-maps="${stop.id}">
          <i data-lucide="navigation"></i> Ir ahora
        </button>
        <button class="btn ghost btn-xs" type="button" data-stop-result="${stop.id}">Registrar resultado</button>
      ` : ""}
      ${isComplete ? `<span class="stop-check"><i data-lucide="check-circle"></i></span>` : ""}
    </div>
  </div>`;
};

// ----- Result modal -----
const openResultModal = (journeyId, stopId) => {
  const stop = journeyStopsCache.find((s) => s.id === stopId);
  const modal = document.getElementById("journeyResultModal");
  if (!modal) return;
  modal.dataset.journeyId = journeyId;
  modal.dataset.stopId = stopId;
  const name = document.getElementById("resultModalName");
  if (name) name.textContent = stop?.businessName || "Sin nombre";
  const notesEl = document.getElementById("resultNotes");
  if (notesEl) notesEl.value = "";
  const btns = modal.querySelectorAll("[data-result-value]");
  btns.forEach((b) => b.classList.remove("active"));
  modal.hidden = false;
};

const closeResultModal = () => {
  const modal = document.getElementById("journeyResultModal");
  if (modal) modal.hidden = true;
};

// ----- Nuevo modal de jornada -----
const openNewJourneyModal = () => {
  const modal = document.getElementById("newJourneyModal");
  if (!modal) return;
  const nameEl = document.getElementById("journeyName");
  const dateEl = document.getElementById("journeyDate");
  if (nameEl) nameEl.value = suggestJourneyName();
  if (dateEl) dateEl.value = todayStr();
  document.getElementById("journeyOriginStatus")?.setAttribute("hidden", "");
  journeyCreatorState.origin = null;
  journeyCreatorState.optimizedOrder = [];
  journeyCreatorState.routePolyline = null;
  journeyCreatorState.orderManuallyEdited = false;
  journeyCreatorState.saving = false;
  renderJourneyStopList();
  renderJourneyOptimizationResult();
  modal.hidden = false;
};

const closeNewJourneyModal = () => {
  const modal = document.getElementById("newJourneyModal");
  if (modal) modal.hidden = true;
};

const renderJourneyStopList = () => {
  const el = document.getElementById("journeyStopListPreview");
  if (!el) return;
  const entities = journeyCreatorState.selectedEntities;
  const countEl = document.getElementById("journeyStopCount");
  if (countEl) countEl.textContent = entities.length;
  const warnEl = document.getElementById("journeyCountWarn");
  if (warnEl) warnEl.hidden = entities.length <= RECOMMENDED_MAX_VISIT_STOPS;
  if (!entities.length) { el.innerHTML = '<div class="empty-hint">Sin negocios seleccionados.</div>'; return; }
  const order = journeyCreatorState.optimizedOrder.length ? journeyCreatorState.optimizedOrder : entities.map((_, i) => i);
  el.innerHTML = order.map((idx, pos) => {
    const e = entities[idx];
    if (!e) return "";
    const dotClass = e.status === "overdue" ? "red" : e.entityType === "client" ? "green" : "orange";
    return `
    <div class="journey-stop-row" data-stop-pos="${pos}" data-stop-idx="${idx}">
      <span class="stop-drag-handle" title="Arrastrar">⠿</span>
      <span class="stop-num">${pos + 1}</span>
      <span class="map-dot map-dot-${dotClass}"></span>
      <div class="stop-row-info">
        <div class="stop-row-name">${escapeHtml(e.name || "-")}</div>
        <div class="stop-row-meta">${e.city || ""}${e.neighborhood ? " · " + e.neighborhood : ""}</div>
      </div>
      <div class="stop-row-actions">
        <button class="icon-btn" type="button" data-move-up="${pos}" title="Subir" ${pos === 0 ? "disabled" : ""}><i data-lucide="chevron-up"></i></button>
        <button class="icon-btn" type="button" data-move-down="${pos}" title="Bajar" ${pos === order.length - 1 ? "disabled" : ""}><i data-lucide="chevron-down"></i></button>
        <button class="icon-btn icon-btn-danger" type="button" data-remove-stop="${idx}" title="Quitar"><i data-lucide="x"></i></button>
      </div>
    </div>`;
  }).join("");
  refreshIcons();
  el.querySelectorAll("[data-move-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pos = Number(btn.dataset.moveUp);
      if (pos <= 0) return;
      const o = [...journeyCreatorState.optimizedOrder.length ? journeyCreatorState.optimizedOrder : entities.map((_, i) => i)];
      [o[pos - 1], o[pos]] = [o[pos], o[pos - 1]];
      journeyCreatorState.optimizedOrder = o;
      journeyCreatorState.orderManuallyEdited = true;
      renderJourneyStopList();
      updateJourneyRouteAfterReorder();
    });
  });
  el.querySelectorAll("[data-move-down]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pos = Number(btn.dataset.moveDown);
      const o = [...journeyCreatorState.optimizedOrder.length ? journeyCreatorState.optimizedOrder : entities.map((_, i) => i)];
      if (pos >= o.length - 1) return;
      [o[pos], o[pos + 1]] = [o[pos + 1], o[pos]];
      journeyCreatorState.optimizedOrder = o;
      journeyCreatorState.orderManuallyEdited = true;
      renderJourneyStopList();
      updateJourneyRouteAfterReorder();
    });
  });
  el.querySelectorAll("[data-remove-stop]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.removeStop);
      journeyCreatorState.selectedEntities.splice(idx, 1);
      journeyCreatorState.optimizedOrder = [];
      journeyCreatorState.orderManuallyEdited = false;
      renderJourneyStopList();
      syncMapJourneySelectState();
      renderJourneySelectionBar();
    });
  });
  setupDragAndDropStops(el);
};

const setupDragAndDropStops = (container) => {
  let dragging = null;
  container.querySelectorAll(".journey-stop-row").forEach((row) => {
    row.setAttribute("draggable", "true");
    row.addEventListener("dragstart", () => { dragging = row; row.classList.add("dragging"); });
    row.addEventListener("dragend", () => { row.classList.remove("dragging"); dragging = null; });
    row.addEventListener("dragover", (e) => { e.preventDefault(); if (dragging && dragging !== row) row.classList.add("drag-over"); });
    row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
    row.addEventListener("drop", (e) => {
      e.preventDefault(); row.classList.remove("drag-over");
      if (!dragging || dragging === row) return;
      const fromPos = Number(dragging.dataset.stopPos);
      const toPos = Number(row.dataset.stopPos);
      const entities = journeyCreatorState.selectedEntities;
      const o = [...journeyCreatorState.optimizedOrder.length ? journeyCreatorState.optimizedOrder : entities.map((_, i) => i)];
      const [moved] = o.splice(fromPos, 1);
      o.splice(toPos, 0, moved);
      journeyCreatorState.optimizedOrder = o;
      journeyCreatorState.orderManuallyEdited = true;
      renderJourneyStopList();
      updateJourneyRouteAfterReorder();
    });
  });
};

const updateJourneyRouteAfterReorder = () => {
  if (!journeyCreatorState.origin) return;
  const order = journeyCreatorState.optimizedOrder;
  const entities = journeyCreatorState.selectedEntities;
  const stops = order.map((i) => entities[i]);
  const stopCoords = stops.map((e) => ({ lat: Number(e.latitude), lng: Number(e.longitude) }));
  const originCoords = { lat: journeyCreatorState.origin.latitude, lng: journeyCreatorState.origin.longitude };
  const result = optimizeRouteHaversine(originCoords, stopCoords);
  const legs = result.legs;
  stops.forEach((stop, i) => {
    stop._legDist = legs[i]?.distanceMeters || 0;
    stop._legSec = legs[i]?.durationSeconds || 0;
  });
  journeyCreatorState.totalDistanceMeters = result.totalDistanceMeters;
  journeyCreatorState.estimatedDurationSeconds = result.estimatedDurationSeconds;
  journeyCreatorState.legs = legs;
  renderJourneyOptimizationResult();
  drawJourneyRouteOnMap(originCoords, stops);
};

const renderJourneyOptimizationResult = () => {
  const el = document.getElementById("journeyOptResult");
  if (!el) return;
  if (!journeyCreatorState.origin || !journeyCreatorState.totalDistanceMeters) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <div class="journey-opt-summary">
      <span><b>${journeyCreatorState.selectedEntities.length}</b> paradas</span>
      <span><b>${formatDistance(journeyCreatorState.totalDistanceMeters)}</b> totales</span>
      <span><b>${formatDuration(journeyCreatorState.estimatedDurationSeconds)}</b> estimados</span>
      ${journeyCreatorState.isApproximate ? '<span class="journey-approx-badge">Orden aproximado — sin info vial</span>' : '<span class="journey-exact-badge">Ruta optimizada</span>'}
      ${journeyCreatorState.orderManuallyEdited ? '<span class="journey-manual-badge">Editado manualmente</span>' : ""}
    </div>`;
};

// ----- Origin selection -----
const requestGPSOrigin = () => {
  const statusEl = document.getElementById("journeyOriginStatus");
  if (statusEl) { statusEl.removeAttribute("hidden"); statusEl.textContent = "Obteniendo ubicacion..."; }
  if (!navigator.geolocation) {
    if (statusEl) statusEl.textContent = "El navegador no soporta geolocalizacion.";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      journeyCreatorState.origin = { type: "current-location", latitude: pos.coords.latitude, longitude: pos.coords.longitude, label: "Mi ubicacion actual", accuracy: pos.coords.accuracy };
      if (statusEl) statusEl.textContent = `Ubicacion obtenida (precisión ~${Math.round(pos.coords.accuracy)}m)`;
      triggerRouteOptimization();
    },
    (err) => {
      const msg = err.code === 1 ? "Permiso de ubicacion denegado. Elige un punto en el mapa." : "No se pudo obtener la ubicacion. Intenta de nuevo.";
      if (statusEl) statusEl.textContent = msg;
    },
    { timeout: 10000, maximumAge: 60000 }
  );
};

const activateMapOriginPicker = () => {
  closeNewJourneyModal();
  const toast = document.getElementById("journeyOriginPickerToast");
  if (toast) { toast.hidden = false; toast.textContent = "Haz clic en el mapa para marcar el punto de partida"; }
  if (commercialMap) commercialMap.getCanvas().style.cursor = "crosshair";
  journeyCreatorState.mapOriginPicking = true;
};

const deactivateMapOriginPicker = () => {
  journeyCreatorState.mapOriginPicking = false;
  if (commercialMap) commercialMap.getCanvas().style.cursor = "";
  const toast = document.getElementById("journeyOriginPickerToast");
  if (toast) toast.hidden = true;
};

// ----- Route optimization trigger -----
const triggerRouteOptimization = () => {
  const entities = journeyCreatorState.selectedEntities;
  const origin = journeyCreatorState.origin;
  if (!origin || entities.length < MIN_VISIT_STOPS) { renderJourneyOptimizationResult(); return; }
  const stopCoords = entities.map((e) => ({ lat: Number(e.latitude), lng: Number(e.longitude) }));
  const originCoords = { lat: origin.latitude, lng: origin.longitude };
  const result = optimizeRouteHaversine(originCoords, stopCoords);
  journeyCreatorState.optimizedOrder = result.order;
  journeyCreatorState.legs = result.legs;
  journeyCreatorState.totalDistanceMeters = result.totalDistanceMeters;
  journeyCreatorState.estimatedDurationSeconds = result.estimatedDurationSeconds;
  journeyCreatorState.isApproximate = true;
  journeyCreatorState.optimizationMethod = "haversine-heuristic";
  journeyCreatorState.orderManuallyEdited = false;
  const orderedStops = result.order.map((i) => entities[i]);
  result.legs.forEach((leg, i) => { if (orderedStops[i]) { orderedStops[i]._legDist = leg.distanceMeters; orderedStops[i]._legSec = leg.durationSeconds; } });
  renderJourneyStopList();
  renderJourneyOptimizationResult();
  drawJourneyRouteOnMap(originCoords, orderedStops);
};

// ----- Route polyline on MapLibre -----
const JOURNEY_SOURCE = "journey-route";
const JOURNEY_LINE_LAYER = "journey-line";
const JOURNEY_ORIGIN_LAYER = "journey-origin";

const ensureJourneyMapLayers = () => {
  if (!commercialMap || !commercialMapReady) return;
  if (!commercialMap.getSource(JOURNEY_SOURCE)) {
    commercialMap.addSource(JOURNEY_SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    commercialMap.addLayer({ id: JOURNEY_LINE_LAYER, type: "line", source: JOURNEY_SOURCE, filter: ["==", ["get", "type"], "route"], layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#1e40af", "line-width": 3.5, "line-opacity": 0.85 } }, "clusters");
  }
  // Anillo de seleccion sobre los pines seleccionados para jornada
  if (!commercialMap.getLayer("journey-selected-ring")) {
    commercialMap.addLayer({
      id: "journey-selected-ring",
      type: "circle",
      source: "commercial",
      filter: ["==", ["get", "journeySelected"], true],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 14, 11, 20, 15, 28],
        "circle-color": "#1e40af",
        "circle-opacity": 0.18,
        "circle-stroke-color": "#1e40af",
        "circle-stroke-width": 2.5,
        "circle-stroke-opacity": 0.7
      }
    }, "points");
  }
};

const drawJourneyRouteOnMap = (originCoords, orderedStops) => {
  if (!commercialMap || !commercialMapReady) return;
  ensureJourneyMapLayers();
  const coords = [[originCoords.lng, originCoords.lat], ...orderedStops.filter((s) => s.latitude && s.longitude).map((s) => [Number(s.longitude), Number(s.latitude)])];
  const fc = {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { type: "route" }, geometry: { type: "LineString", coordinates: coords } }
    ]
  };
  commercialMap.getSource(JOURNEY_SOURCE)?.setData(fc);
  if (coords.length > 1) {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    coords.forEach(([lng, lat]) => { minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng); minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat); });
    try { commercialMap.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 14, duration: 900 }); } catch (e) { /* noop */ }
  }
};

const clearJourneyRouteFromMap = () => {
  if (!commercialMap || !commercialMap.getSource(JOURNEY_SOURCE)) return;
  commercialMap.getSource(JOURNEY_SOURCE).setData({ type: "FeatureCollection", features: [] });
};

// ----- Save journey -----
const doSaveJourney = async () => {
  if (journeyCreatorState.saving) return;
  const user = auth.currentUser;
  if (!user) { window.alert("Debes estar autenticado."); return; }
  const entities = journeyCreatorState.selectedEntities;
  if (entities.length < MIN_VISIT_STOPS) { window.alert(`Agrega al menos ${MIN_VISIT_STOPS} paradas.`); return; }
  const name = document.getElementById("journeyName")?.value.trim() || suggestJourneyName();
  const scheduledDate = document.getElementById("journeyDate")?.value || todayStr();
  const startTime = document.getElementById("journeyTime")?.value || "";
  const origin = journeyCreatorState.origin;
  const order = journeyCreatorState.optimizedOrder.length ? journeyCreatorState.optimizedOrder : entities.map((_, i) => i);
  const orderedEntities = order.map((i) => entities[i]);
  const journeyData = {
    name, scheduledDate, startTime, status: "planned",
    origin: origin || null,
    endMode: "last-stop",
    optimizationMethod: journeyCreatorState.optimizationMethod || "none",
    isApproximate: journeyCreatorState.isApproximate,
    optimizedAt: origin ? new Date().toISOString() : null,
    optimizedOrder: order,
    finalOrder: order,
    orderWasManuallyEdited: journeyCreatorState.orderManuallyEdited,
    totalStops: orderedEntities.length,
    completedStops: 0,
    totalDistanceMeters: journeyCreatorState.totalDistanceMeters || 0,
    estimatedDurationSeconds: journeyCreatorState.estimatedDurationSeconds || 0,
    routePolyline: null
  };
  const stops = orderedEntities.map((e, pos) => ({
    order: pos,
    originalOrder: order[pos],
    entityId: e.id,
    entityType: e.entityType,
    commercialStatus: e.status,
    businessName: e.name || "",
    phone: e.phone || "",
    address: e.address || "",
    city: e.city || "",
    zone: e.neighborhood || "",
    latitude: Number(e.latitude) || 0,
    longitude: Number(e.longitude) || 0,
    distanceFromPreviousMeters: e._legDist || 0,
    durationFromPreviousSeconds: e._legSec || 0,
    status: "pending",
    resultNotes: "",
    saleId: null,
    rescheduledDate: null,
    arrivedAt: null,
    completedAt: null
  }));
  journeyCreatorState.saving = true;
  const saveBtn = document.getElementById("journeySaveBtn");
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Guardando..."; }
  try {
    const journeyId = await saveNewJourney(journeyData, stops);
    closeNewJourneyModal();
    deactivateMapJourneySelectMode();
    clearJourneyRouteFromMap();
    window.alert(`Jornada "${name}" guardada. Ahora puedes iniciarla desde Jornadas de visitas.`);
    setActiveAppSection("journeys");
    activeJourneyId = journeyId;
    setTimeout(() => renderActiveJourney(journeyId), 300);
  } catch (error) {
    console.error("Error guardando jornada:", error);
    window.alert("Error al guardar la jornada. Intenta de nuevo.");
  } finally {
    journeyCreatorState.saving = false;
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Guardar jornada"; }
  }
};

// ----- Map selection mode -----
const activateMapJourneySelectMode = () => {
  mapJourneySelectState.active = true;
  mapJourneySelectState.selectedIds = new Set();
  journeyCreatorState.selectedEntities = [];
  document.getElementById("mapJourneySelectBar")?.removeAttribute("hidden");
  document.getElementById("mapCreateJourneyBtn")?.setAttribute("aria-pressed", "true");
  renderJourneySelectionBar();
  ensureJourneyMapLayers();
};

const deactivateMapJourneySelectMode = () => {
  mapJourneySelectState.active = false;
  mapJourneySelectState.drawerOpen = false;
  document.getElementById("mapJourneySelectBar")?.setAttribute("hidden", "");
  document.getElementById("mapJourneySelectDrawer")?.setAttribute("hidden", "");
  document.getElementById("mapCreateJourneyBtn")?.removeAttribute("aria-pressed");
  clearJourneyRouteFromMap();
  if (journeyOriginMarker) { try { journeyOriginMarker.remove(); } catch (e) {} journeyOriginMarker = null; }
  refreshCommercialMap();
};

const syncMapJourneySelectState = () => {
  mapJourneySelectState.selectedIds = new Set(journeyCreatorState.selectedEntities.map((e) => e.id));
};

const toggleMapEntityForJourney = (entityId) => {
  const entity = commercialMapEntities.find((e) => e.id === entityId);
  if (!entity) return;
  if (!entity.hasLocation) { window.alert("Este negocio todavia no tiene ubicacion registrada."); return; }
  const idx = journeyCreatorState.selectedEntities.findIndex((e) => e.id === entityId);
  if (idx >= 0) {
    journeyCreatorState.selectedEntities.splice(idx, 1);
    mapJourneySelectState.selectedIds.delete(entityId);
  } else {
    if (journeyCreatorState.selectedEntities.length >= ABSOLUTE_MAX_VISIT_STOPS) {
      window.alert(`Maximo ${ABSOLUTE_MAX_VISIT_STOPS} paradas por jornada.`); return;
    }
    if (journeyCreatorState.selectedEntities.length >= RECOMMENDED_MAX_VISIT_STOPS) {
      if (!window.confirm(`Las jornadas extensas pueden tardar mas en optimizarse. Agregar igual?`)) return;
    }
    journeyCreatorState.selectedEntities.push(entity);
    mapJourneySelectState.selectedIds.add(entityId);
  }
  journeyCreatorState.optimizedOrder = [];
  renderJourneySelectionBar();
  highlightJourneySelectedEntities();
};

const highlightJourneySelectedEntities = () => {
  if (!commercialMap || !commercialMap.getSource) return;
  const source = commercialMap.getSource("commercial");
  if (!source) return;
  const filtered = applyMapFilters(commercialMapEntities);
  const geoJson = commercialEntitiesToGeoJSON(filtered);
  geoJson.features.forEach((f) => {
    if (mapJourneySelectState.selectedIds.has(f.properties.id)) f.properties.journeySelected = true;
    else f.properties.journeySelected = false;
  });
  source.setData(geoJson);
};

const renderJourneySelectionBar = () => {
  const bar = document.getElementById("mapJourneySelectBar");
  if (!bar) return;
  const count = journeyCreatorState.selectedEntities.length;
  const countEl = bar.querySelector("[data-journey-count]");
  if (countEl) countEl.textContent = `${count} negocio${count !== 1 ? "s" : ""} seleccionado${count !== 1 ? "s" : ""}`;
  const continueBtn = bar.querySelector("[data-journey-continue]");
  if (continueBtn) continueBtn.disabled = count < MIN_VISIT_STOPS;
};

const renderJourneySelectionDrawer = () => {
  const el = document.getElementById("journeySelectDrawerList");
  if (!el) return;
  const entities = journeyCreatorState.selectedEntities;
  if (!entities.length) { el.innerHTML = '<div class="empty-hint">Sin negocios seleccionados.</div>'; return; }
  el.innerHTML = entities.map((e, i) => {
    const dotClass = e.status === "overdue" ? "red" : e.entityType === "client" ? "green" : "orange";
    return `
    <div class="journey-select-item">
      <i class="map-dot map-dot-${dotClass}"></i>
      <div class="journey-select-item-info">
        <div class="journey-select-item-name">${escapeHtml(e.name || "-")}</div>
        <div class="journey-select-item-meta">${e.city || ""}${e.neighborhood ? " · " + e.neighborhood : ""}</div>
      </div>
      <button class="icon-btn icon-btn-danger" type="button" data-remove-entity="${i}" title="Quitar"><i data-lucide="x"></i></button>
    </div>`;
  }).join("");
  refreshIcons();
  el.querySelectorAll("[data-remove-entity]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.removeEntity);
      journeyCreatorState.selectedEntities.splice(idx, 1);
      syncMapJourneySelectState();
      renderJourneySelectionBar();
      renderJourneySelectionDrawer();
      highlightJourneySelectedEntities();
    });
  });
};

// ----- Journeys section setup -----
const setupJourneysModule = () => {
  // Journey list actions (delegated)
  document.getElementById("journeysList")?.parentElement?.addEventListener("click", async (event) => {
    const openBtn = event.target.closest("[data-journey-open]");
    const startBtn = event.target.closest("[data-journey-start]");
    const cancelBtn = event.target.closest("[data-journey-cancel]");
    if (openBtn) {
      activeJourneyId = openBtn.dataset.journeyOpen;
      document.getElementById("journeyActiveSection")?.removeAttribute("hidden");
      document.getElementById("journeyListSection")?.setAttribute("hidden", "");
      await renderActiveJourney(activeJourneyId);
    }
    if (startBtn) {
      await startJourney(startBtn.dataset.journeyStart);
      activeJourneyId = startBtn.dataset.journeyStart;
      document.getElementById("journeyActiveSection")?.removeAttribute("hidden");
      document.getElementById("journeyListSection")?.setAttribute("hidden", "");
      await renderActiveJourney(activeJourneyId);
    }
    if (cancelBtn) {
      if (!window.confirm("Cancelar esta jornada?")) return;
      await deleteJourney(cancelBtn.dataset.journeyCancel);
    }
  });

  // Result modal actions
  document.getElementById("journeyResultModal")?.addEventListener("click", async (event) => {
    const modal = document.getElementById("journeyResultModal");
    const journeyId = modal?.dataset.journeyId;
    const stopId = modal?.dataset.stopId;
    const resultBtn = event.target.closest("[data-result-value]");
    const closeBtn = event.target.closest("[data-result-close]");
    const confirmBtn = event.target.closest("[data-result-confirm]");
    if (closeBtn) closeResultModal();
    if (resultBtn) {
      modal.querySelectorAll("[data-result-value]").forEach((b) => b.classList.toggle("active", b === resultBtn));
    }
    if (confirmBtn) {
      const selected = modal.querySelector("[data-result-value].active");
      if (!selected) { window.alert("Elige un resultado."); return; }
      const result = selected.dataset.resultValue;
      const notes = document.getElementById("resultNotes")?.value.trim() || "";
      confirmBtn.disabled = true;
      try {
        await updateStopResult(journeyId, stopId, result, notes);
        closeResultModal();
        await renderActiveJourney(journeyId);
      } catch (e) {
        console.error("Error registrando resultado:", e);
        window.alert("Error al registrar. Intenta de nuevo.");
      } finally { confirmBtn.disabled = false; }
    }
  });

  // New journey modal actions
  document.getElementById("newJourneyModal")?.addEventListener("click", (event) => {
    if (event.target.closest("[data-journey-modal-close]")) closeNewJourneyModal();
    if (event.target.closest("[data-journey-gps]")) requestGPSOrigin();
    if (event.target.closest("[data-journey-map-origin]")) activateMapOriginPicker();
    if (event.target.closest("[data-journey-optimize]")) triggerRouteOptimization();
  });

  document.getElementById("journeySaveBtn")?.addEventListener("click", () => { void doSaveJourney(); });

  // Map selection bar actions
  document.getElementById("mapJourneySelectBar")?.addEventListener("click", (event) => {
    if (event.target.closest("[data-journey-view-selection]")) {
      const drawer = document.getElementById("mapJourneySelectDrawer");
      if (drawer) {
        mapJourneySelectState.drawerOpen = !mapJourneySelectState.drawerOpen;
        drawer.hidden = !mapJourneySelectState.drawerOpen;
        if (mapJourneySelectState.drawerOpen) renderJourneySelectionDrawer();
      }
    }
    if (event.target.closest("[data-journey-clear]")) {
      journeyCreatorState.selectedEntities = [];
      mapJourneySelectState.selectedIds.clear();
      journeyCreatorState.optimizedOrder = [];
      renderJourneySelectionBar();
      highlightJourneySelectedEntities();
    }
    if (event.target.closest("[data-journey-cancel]")) deactivateMapJourneySelectMode();
    if (event.target.closest("[data-journey-continue]")) {
      openNewJourneyModal();
    }
  });

  // Origin picker toast cancel
  document.getElementById("journeyOriginPickerToast")?.addEventListener("click", (event) => {
    if (event.target.closest("[data-cancel-origin-pick]")) {
      deactivateMapOriginPicker();
      openNewJourneyModal();
    }
  });

  // Crear jornada desde mapa
  document.getElementById("mapCreateJourneyBtn")?.addEventListener("click", () => {
    if (mapJourneySelectState.active) { deactivateMapJourneySelectMode(); }
    else { setActiveAppSection("map"); activateMapJourneySelectMode(); }
  });

  // Crear jornada desde la lista de jornadas
  document.getElementById("journeyNewFromListBtn")?.addEventListener("click", () => {
    setActiveAppSection("map");
    activateMapJourneySelectMode();
  });

  // Volver a lista desde vista activa
  document.getElementById("journeyBackToList")?.addEventListener("click", () => {
    document.getElementById("journeyActiveSection")?.setAttribute("hidden", "");
    document.getElementById("journeyListSection")?.removeAttribute("hidden");
    activeJourneyId = null;
    loadAndRenderJourneys();
  });
};

// ----- Wiring into map clicks -----
const handleMapClickForJourneySelect = (e) => {
  if (journeyCreatorState.mapOriginPicking) {
    const { lng, lat } = e.lngLat;
    journeyCreatorState.origin = { type: "map-point", latitude: lat, longitude: lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
    deactivateMapOriginPicker();
    openNewJourneyModal();
    const statusEl = document.getElementById("journeyOriginStatus");
    if (statusEl) { statusEl.removeAttribute("hidden"); statusEl.textContent = `Punto seleccionado: ${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
    triggerRouteOptimization();
    return true;
  }
  if (mapJourneySelectState.active) {
    const features = commercialMap.queryRenderedFeatures(e.point, { layers: ["points", "points-emph"] });
    if (features.length) {
      const entityId = features[0].properties?.id;
      if (entityId) { toggleMapEntityForJourney(entityId); return true; }
    }
  }
  return false;
};

// ----- Load journeys for section -----
const loadAndRenderJourneys = async () => {
  const user = auth.currentUser;
  if (!user) return;
  const el = document.getElementById("journeysList");
  if (el) el.innerHTML = '<div class="empty-hint">Cargando...</div>';
  try {
    const snap = await getDocs(query(collection(db, "visitJourneys"), where("assignedUserId", "==", user.uid), orderBy("createdAt", "desc")));
    const journeys = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderJourneysList(journeys);
  } catch (e) { console.error("Error cargando jornadas:", e); if (el) el.innerHTML = '<div class="empty-hint">Error al cargar jornadas.</div>'; }
};

const setupProspectImport = () => {
  importProspectsBtn?.addEventListener("click", openProspectImportModal);
  mapImportProspectsBtn?.addEventListener("click", openProspectImportModal);
  prospectImportChoose?.addEventListener("click", () => prospectImportFile?.click());
  prospectImportTemplate?.addEventListener("click", downloadProspectImportTemplate);
  prospectImportFile?.addEventListener("change", () => {
    void loadProspectImportFile(prospectImportFile.files?.[0]);
  });
  prospectImportClose?.addEventListener("click", () => closeProspectImportModal());
  prospectImportCancel?.addEventListener("click", () => closeProspectImportModal());
  document.getElementById("prospectImportBackdrop")?.addEventListener("click", () => closeProspectImportModal());
  prospectImportDropzone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    prospectImportDropzone.classList.add("is-dragover");
  });
  prospectImportDropzone?.addEventListener("dragleave", () => prospectImportDropzone.classList.remove("is-dragover"));
  prospectImportDropzone?.addEventListener("drop", (event) => {
    event.preventDefault();
    prospectImportDropzone.classList.remove("is-dragover");
    void loadProspectImportFile(event.dataTransfer?.files?.[0]);
  });
  prospectImportRows?.addEventListener("change", (event) => {
    const rowEl = event.target.closest("[data-import-row]");
    const field = event.target.dataset.importField;
    if (!rowEl || !field) return;
    updateImportRowField(rowEl.dataset.importRow, field, field === "selected" ? event.target.checked : event.target.value);
  });
  prospectImportRows?.addEventListener("input", (event) => {
    const field = event.target.dataset.importField;
    if (!field || field === "selected" || field === "businessType") return;
    const rowEl = event.target.closest("[data-import-row]");
    if (rowEl) updateImportRowField(rowEl.dataset.importRow, field, event.target.value, { render: false });
  });
  prospectImportRows?.addEventListener("focusout", (event) => {
    const field = event.target.dataset.importField;
    if (!field || field === "selected" || field === "businessType") return;
    const rowEl = event.target.closest("[data-import-row]");
    if (rowEl) updateImportRowField(rowEl.dataset.importRow, field, event.target.value);
  });
  prospectImportRows?.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-import-row-toggle]");
    const mapBtn = event.target.closest("[data-import-row-map]");
    if (toggle) {
      const row = prospectImportState.rows.find((item) => item.rowId === toggle.dataset.importRowToggle);
      if (row) {
        const include = row.excluded || !row.selected;
        row.selected = include;
        row.excluded = !include;
        saveProspectImportDraft();
        renderProspectImport();
      }
      return;
    }
    if (mapBtn) {
      const rowId = mapBtn.dataset.importRowMap;
      highlightImportRow(rowId);
      showProspectImportMap();
      const row = prospectImportState.rows.find((item) => item.rowId === rowId);
      if (commercialMap && row && Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude))) {
        window.setTimeout(() => commercialMap.flyTo({ center: [Number(row.longitude), Number(row.latitude)], zoom: 16, essential: true }), 350);
      }
    }
  });
  prospectImportTableTab?.addEventListener("click", showProspectImportTable);
  prospectImportMapTab?.addEventListener("click", showProspectImportMap);
  prospectImportBackTable?.addEventListener("click", showProspectImportTable);
  prospectImportFitMap?.addEventListener("click", fitProspectImportPreview);
  prospectImportSelectAll?.addEventListener("click", () => {
    const shouldSelect = prospectImportState.rows.some((row) => !row.selected || row.excluded);
    prospectImportState.rows.forEach((row) => {
      row.selected = shouldSelect;
      row.excluded = !shouldSelect;
    });
    saveProspectImportDraft();
    renderProspectImport();
  });
  prospectImportExcludeSelected?.addEventListener("click", () => {
    prospectImportState.rows.forEach((row) => {
      if (row.selected && !row.excluded) {
        row.selected = false;
        row.excluded = true;
      }
    });
    saveProspectImportDraft();
    renderProspectImport();
  });
  prospectImportBulkRubro?.addEventListener("change", () => {
    const value = prospectImportBulkRubro.value;
    if (!value) return;
    prospectImportState.rows.forEach((row) => {
      if (row.selected && !row.excluded) {
        row.businessType = normalizeRubroKey(value);
        row.businessTypeName = getBusinessTypeLabel(value);
      }
    });
    prospectImportBulkRubro.value = "";
    saveProspectImportDraft();
    renderProspectImport();
  });
  prospectImportBulkPotential?.addEventListener("change", () => {
    const value = prospectImportBulkPotential.value;
    if (!value) return;
    prospectImportState.rows.forEach((row) => {
      if (row.selected && !row.excluded) row.potential = value;
    });
    prospectImportBulkPotential.value = "";
    saveProspectImportDraft();
    renderProspectImport();
  });
  prospectImportPrimary?.addEventListener("click", () => { void confirmProspectImport(); });
  prospectImportConfirmBack?.addEventListener("click", () => {
    prospectImportConfirmBack.hidden = true;
    setImportStep("review");
    renderProspectImportSummary();
  });
  prospectImportResult?.addEventListener("click", (event) => {
    if (event.target.closest("[data-import-result-prospects]")) {
      setActiveAppSection("prospects");
      closeProspectImportModal({ force: true });
    }
    if (event.target.closest("[data-import-result-map]")) showImportedProspectsOnMap();
    if (event.target.closest("[data-import-result-errors]")) downloadProspectImportErrorReport();
    if (event.target.closest("[data-import-result-close]")) closeProspectImportModal({ force: true });
  });
  prospectImportHistory?.addEventListener("click", (event) => {
    if (event.target.closest("[data-toggle-import-history]")) {
      prospectImportHistoryOpen = !prospectImportHistoryOpen;
      renderProspectImportHistory();
      return;
    }
    const historyBtn = event.target.closest("[data-open-import-history]");
    if (!historyBtn) return;
    const fallback = state.prospectImportSessions?.[0];
    const sessionId = historyBtn.dataset.openImportHistory || fallback?.importSessionId || "";
    if (!sessionId) return;
    commercialMapImportSessionFilter = sessionId;
    setActiveAppSection("map");
    refreshCommercialMap();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !prospectImportModal?.classList.contains("hidden")) closeProspectImportModal();
  });
};

setupProspectImport();
setupCommercialMap();
setupLocationPicker();
setupRubroModal();
setupJourneysModule();

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
  listenCollection("raw_materials", "rawMaterials");
  listenCollection("raw_purchases", "purchases");
  listenCollection("recipes", "recipes");
  listenCollection("batches", "batches");
  listenCollection("products", "products");
  listenCollection("clients", "clients");
  listenCollection("prospects", "prospects");
  listenCollection("sales", "sales");
  listenCollection("sales_goals", "salesGoals");
  listenCollection("financial_expenses", "financialExpenses");
  listenCollection("financial_initial_settings", "financialInitialSettings");
  listenCollection("financial_manual_adjustments", "financialManualAdjustments");
  listenCollection("finished_stock_adjustments", "finishedStockAdjustments");
  listenCollection("raw_material_adjustments", "rawMaterialAdjustments");
  listenCollection("businessTypes", "businessTypes");
  listenCollection("prospect_import_sessions", "prospectImportSessions");
}, (error) => {
  console.error("[auth] observer error", error);
  setAuthFeedback(getAuthMessage(error), "error");
});


