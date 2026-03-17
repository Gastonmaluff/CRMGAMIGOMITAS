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
  serverTimestamp
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
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".tab-panel");

const rawMaterialForm = document.getElementById("rawMaterialForm");
const purchaseForm = document.getElementById("purchaseForm");
const recipeForm = document.getElementById("recipeForm");
const batchForm = document.getElementById("batchForm");
const batchProductSelect = document.getElementById("batchProductSelect");
const batchRecipeNotice = document.getElementById("batchRecipeNotice");
const batchProductInfo = document.getElementById("batchProductInfo");
const metricKgYesterday = document.getElementById("metricKgYesterday");
const metricDisplaysStock = document.getElementById("metricDisplaysStock");
const metricLotsPossible = document.getElementById("metricLotsPossible");
const metricBottleneck = document.getElementById("metricBottleneck");
const productionDashboard = document.getElementById("overviewDashboard");
const salesDashboard = document.getElementById("salesDashboard");
const salesMetricMonth = document.getElementById("salesMetricMonth");
const salesMetricYesterday = document.getElementById("salesMetricYesterday");
const salesMetricAvailable = document.getElementById("salesMetricAvailable");
const salesMetricGoal = document.getElementById("salesMetricGoal");
const productForm = document.getElementById("productForm");
const clientForm = document.getElementById("clientForm");
const saleForm = document.getElementById("saleForm");
const salesGoalForm = document.getElementById("salesGoalForm");
const salesGoalNotice = document.getElementById("salesGoalNotice");
const addIngredientBtn = document.getElementById("addIngredientBtn");

const rawMaterialList = document.getElementById("rawMaterialList");
const purchaseList = document.getElementById("purchaseList");
const recipeIngredientsList = document.getElementById("recipeIngredientsList");
const recipeCostPreview = document.getElementById("recipeCostPreview");
const recipeList = document.getElementById("recipeList");
const batchList = document.getElementById("batchList");
const stockSummaryGeneral = document.getElementById("stockSummaryGeneral");
const stockMaterialsList = document.getElementById("stockMaterialsList");
const stockRecipeSelect = document.getElementById("stockRecipeSelect");
const productList = document.getElementById("productList");
const clientList = document.getElementById("clientList");
const saleList = document.getElementById("saleList");
const finishedStockList = document.getElementById("finishedStockList");

const dueDateField = document.getElementById("dueDateField");
const unitGroups = Array.from(document.querySelectorAll(".unit-group[data-target]"));

const state = {
  rawMaterials: [],
  purchases: [],
  recipes: [],
  batches: [],
  products: [],
  clients: [],
  sales: [],
  salesGoals: []
};

let unsubscribers = [];
const recipeDraft = {
  ingredients: []
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

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-PY");
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
  const options = [`<option value="">${placeholder}</option>`];
  items.forEach((item) => {
    options.push(`<option value="${item.id}">${item.name}</option>`);
  });
  select.innerHTML = options.join("");
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

  const rows = state.rawMaterials.map((material) => {
    const summary = totals[material.id] || { purchased: 0, used: 0 };
    const available = summary.purchased - summary.used;
    return {
      name: material.name,
      unit: material.unit,
      materialId: material.id,
      price: Number(material.price || 0),
      minStock: material.minStock ?? null,
      purchased: summary.purchased,
      used: summary.used,
      available
    };
  });

  const availabilityMap = rows.reduce((acc, row) => {
    acc[row.materialId] = row.available;
    return acc;
  }, {});

  return { rows, availabilityMap };
};

const toDateInputValue = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
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
  const selectedRecipeId = stockRecipeSelect?.value;
  if (selectedRecipeId) {
    return state.recipes.find((recipe) => recipe.id === selectedRecipeId) || null;
  }
  if (state.recipes.length === 1) return state.recipes[0];
  return null;
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
  let hasDisplayUnit = false;
  sales.forEach((sale) => {
    if (!isDateInRange(sale.date, startDate, endDate)) return;
    const product = state.products.find((item) => item.id === sale.productId);
    const unit = normalizeText(product?.unit || "");
    if (unit.includes("display")) {
      total += Number(sale.quantity || 0);
      hasDisplayUnit = true;
    }
  });
  return hasDisplayUnit ? total : null;
};

const computeDisplaysForDate = (sales, dateValue) => {
  let total = 0;
  let hasDisplayUnit = false;
  sales.forEach((sale) => {
    if (sale.date !== dateValue) return;
    const product = state.products.find((item) => item.id === sale.productId);
    const unit = normalizeText(product?.unit || "");
    if (unit.includes("display")) {
      total += Number(sale.quantity || 0);
      hasDisplayUnit = true;
    }
  });
  return hasDisplayUnit ? total : null;
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

const computeDisplaysFromSale = (sale, product, recipe) => {
  const qty = Number(sale.quantity || 0);
  if (!qty) return 0;
  const unit = normalizeText(product?.unit || "");
  if (unit) {
    const converted = computeDisplaysFromUnit(qty, unit);
    if (converted !== null) return converted;
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

const buildFinishedStockRows = () => {
  const map = {};
  const ensureEntry = (key, name) => {
    if (!map[key]) {
      map[key] = {
        key,
        name,
        produced: 0,
        sold: 0,
        canCompute: true
      };
    }
    return map[key];
  };

  state.batches.forEach((batch) => {
    const productId = batch.productId || "";
    const name = batch.productName || batch.recipeName || "Producto";
    const key = productId || normalizeText(name);
    const entry = ensureEntry(key, name);
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
    const productId = sale.productId || "";
    const name = sale.productName || "Producto";
    const key = productId || normalizeText(name);
    const entry = ensureEntry(key, name);
    const product = state.products.find((item) => item.id === productId);
    const recipe = product ? findRecipeForProduct(product) : null;
    const displays = computeDisplaysFromSale(sale, product, recipe);
    if (displays === null) {
      entry.canCompute = false;
    } else {
      entry.sold += displays;
    }
  });

  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
};

const refreshFinishedStock = () => {
  if (!finishedStockList) return;
  const rows = buildFinishedStockRows();
  if (!rows.length) {
    finishedStockList.innerHTML = '<div class="list-item muted">Sin registros todavia.</div>';
    return;
  }
  finishedStockList.innerHTML = rows.map((row) => {
    const stockDisplays = row.canCompute ? row.produced - row.sold : null;
    const stockKg = stockDisplays !== null ? stockDisplays * 0.36 : null;
    return `
      <div class="list-item">
        <strong>${row.name}</strong>
        <div>Displays disponibles: ${stockDisplays !== null ? formatNumber(stockDisplays) : "N/D"}</div>
        <div>Equivalente en kg: ${stockKg !== null ? `${formatNumber(stockKg)} kg` : "N/D"}</div>
      </div>
    `;
  }).join("");
};

const updateDashboardVisibility = (activeTab) => {
  if (!productionDashboard || !salesDashboard) return;
  if (activeTab === "sales") {
    productionDashboard.classList.add("hidden");
    salesDashboard.classList.remove("hidden");
  } else {
    productionDashboard.classList.remove("hidden");
    salesDashboard.classList.add("hidden");
  }
};

const updateSalesGoalForm = (goal) => {
  if (!salesGoalForm) return;
  salesGoalForm.dataset.editId = goal?.id || "";
  salesGoalForm.startDate.value = goal?.startDate || "";
  salesGoalForm.endDate.value = goal?.endDate || "";
  salesGoalForm.targetDisplays.value = goal?.targetDisplays ?? "";
  if (salesGoalNotice) salesGoalNotice.textContent = "";
};

const refreshDashboard = ({ rows, availabilityMap }) => {
  if (!metricKgYesterday) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayValue = toDateInputValue(yesterday);
  const kgYesterday = computeKgForDate(yesterdayValue);
  metricKgYesterday.textContent = `${formatNumber(kgYesterday)} kg`;

  const activeRecipe = getActiveRecipe();
  const metrics = computeRecipeStockMetrics(activeRecipe, availabilityMap);
  const displaysStock = metrics.displaysMax !== null ? formatNumber(metrics.displaysMax) : "N/D";
  const lotsPossible = metrics.maxBatches !== null && Number.isFinite(metrics.maxBatches)
    ? formatNumber(metrics.maxBatches)
    : "N/D";
  const bottleneck = metrics.limitingRow ? metrics.limitingRow.name : "N/D";
  metricDisplaysStock.textContent = displaysStock;
  metricLotsPossible.textContent = lotsPossible;
  metricBottleneck.textContent = bottleneck;
};

const refreshSalesDashboard = ({ rows, availabilityMap }) => {
  if (!salesMetricMonth) return;
  const goal = state.salesGoals[0];
  const startDate = goal?.startDate || "";
  const endDate = goal?.endDate || "";
  const displaysInPeriod = goal ? computeDisplaysFromSales(state.sales, startDate, endDate) : null;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayValue = toDateInputValue(yesterday);
  const displaysYesterday = computeDisplaysForDate(state.sales, yesterdayValue);

  const activeRecipe = getActiveRecipe();
  const metrics = computeRecipeStockMetrics(activeRecipe, availabilityMap);
  const availableDisplays = metrics.displaysMax !== null ? formatNumber(metrics.displaysMax) : "N/D";

  salesMetricMonth.textContent = displaysInPeriod !== null ? formatNumber(displaysInPeriod) : "N/D";
  salesMetricYesterday.textContent = displaysYesterday !== null ? formatNumber(displaysYesterday) : "N/D";
  salesMetricAvailable.textContent = availableDisplays;

  if (!goal || !goal.targetDisplays) {
    salesMetricGoal.textContent = "Sin objetivo";
  } else if (displaysInPeriod === null) {
    salesMetricGoal.textContent = "N/D";
  } else {
    const percent = goal.targetDisplays > 0
      ? (displaysInPeriod / goal.targetDisplays) * 100
      : 0;
    salesMetricGoal.textContent = `${formatNumber(percent)}%`;
  }
};

const refreshStockSummary = () => {
  const { rows, availabilityMap } = computeStockTotals();
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
      </div>
    `;
    const body = ingredientRows.map((row) => {
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
      return `
        <div class="materials-row ${isBottleneck ? "bottleneck" : ""}">
          <div class="materials-cell" data-label="Materia prima"><strong>${row.name}</strong>${badge}</div>
          <div class="materials-cell" data-label="Disponible">${formatNumber(row.available)} ${row.unit}</div>
          <div class="materials-cell" data-label="Requerido/lote">${formatNumber(row.requiredBase)} ${row.unit}</div>
          <div class="materials-cell" data-label="Lotes posibles">${Number.isFinite(lotsPossible) ? formatNumber(lotsPossible) : "N/D"}</div>
          <div class="materials-cell" data-label="Estado"><span class="status-tag ${statusClass}">${statusLabel}</span></div>
        </div>
      `;
    }).join("");
    stockMaterialsList.innerHTML = header + body;
  }

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
    updateSelect(saleForm.product, items, "Seleccionar");
    updateSelect(batchProductSelect, items, "Seleccionar");
    if (batchForm.recipe.value) {
      updateBatchProductFromRecipe();
    }
  }
  if (key === "clients") {
    updateSelect(saleForm.client, items, "Opcional");
  }
  if (key === "salesGoals") {
    updateSalesGoalForm(items[0]);
  }

  if (["rawMaterials", "purchases", "batches"].includes(key)) {
    refreshStockSummary();
  }
  if (["sales", "products", "salesGoals", "rawMaterials", "purchases", "batches"].includes(key)) {
    const stockData = computeStockTotals();
    refreshSalesDashboard(stockData);
  }
  if (["batches", "sales", "products", "recipes"].includes(key)) {
    refreshFinishedStock();
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

  renderList(batchList, state.batches, (item) => `
    <div class="list-item">
      <strong>${item.productName || item.recipeName}</strong>
      Fecha: ${formatDate(item.date)} | Cantidad: ${formatNumber(item.quantityProduced)} ${item.unitProduced}
      ${item.lotNumber ? `<div>Lote: ${item.lotNumber}</div>` : ""}
      <div>Costo total: Gs ${formatGs(item.totalCost)} | Costo por unidad: Gs ${formatGs(item.costPerUnit)}</div>
      <div>Materias primas: ${(item.materialsUsed || [])
        .map((m) => `${m.materialName} ${formatNumber(m.quantity)} ${m.unit}`)
        .join(", ") || "Sin detalle"}</div>
      <div class="list-actions">
        <button class="btn ghost" type="button" data-edit-batch="${item.id}">Editar</button>
        <button class="btn ghost danger" type="button" data-delete-batch="${item.id}">Eliminar</button>
      </div>
    </div>
  `);

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

  renderList(clientList, state.clients, (item) => `
    <div class="list-item">
      <strong>${item.name}</strong>
      ${item.phone ? `Tel: ${item.phone}` : ""}
      ${item.address ? ` | Dir: ${item.address}` : ""}
      <div class="list-actions">
        <button class="btn ghost" type="button" data-edit-client="${item.id}">Editar</button>
        <button class="btn ghost danger" type="button" data-delete-client="${item.id}">Eliminar</button>
      </div>
    </div>
  `);

  renderList(saleList, state.sales, (item) => `
    <div class="list-item">
      <strong>${item.productName}</strong>
      Fecha: ${formatDate(item.date)} | Cantidad: ${formatNumber(item.quantity)}
      <div>Cliente: ${item.clientName || "Sin cliente"} | Total: Gs ${formatGs(item.total)}</div>
      <div>Pago: ${item.payment} | ${item.paid === "si" ? "Pagado" : `Credito hasta ${formatDate(item.dueDate)}`}</div>
      <div class="list-actions">
        <button class="btn ghost" type="button" data-edit-sale="${item.id}">Editar</button>
        <button class="btn ghost danger" type="button" data-delete-sale="${item.id}">Eliminar</button>
      </div>
    </div>
  `);

  requestAnimationFrame(refreshCollapseHeights);
};

const setupTabs = () => {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add("active");
      updateDashboardVisibility(tab.dataset.tab);
    });
  });
  const initialTab = document.querySelector(".tab.active")?.dataset.tab || "production";
  updateDashboardVisibility(initialTab);
};

const updateDueDateVisibility = () => {
  const paid = saleForm.paid.value;
  const payment = saleForm.payment.value;
  if (paid === "no" || payment === "Credito") {
    dueDateField.classList.remove("hidden");
  } else {
    dueDateField.classList.add("hidden");
    saleForm.dueDate.value = "";
  }
};

const setDefaultDates = () => {
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    input.valueAsDate = new Date();
  });
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authError.textContent = "";
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    authError.textContent = error.message;
  }
});

registerBtn.addEventListener("click", async () => {
  authError.textContent = "";
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value.trim();
  if (!email || !password) {
    authError.textContent = "Completa correo y contrasena para crear la cuenta.";
    return;
  }
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    authError.textContent = error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
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

productForm.addEventListener("submit", async (event) => {
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
  const payload = {
    name: clientForm.name.value.trim(),
    phone: clientForm.phone.value.trim(),
    address: clientForm.address.value.trim(),
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
  const productId = saleForm.product.value;
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  const clientId = saleForm.client.value;
  const client = state.clients.find((item) => item.id === clientId);
  const quantity = Number(saleForm.quantity.value);
  const unitPrice = Number(saleForm.unitPrice.value);
  const payload = {
    date: saleForm.date.value,
    productId,
    productName: product.name,
    clientId: client?.id || "",
    clientName: client?.name || "",
    quantity,
    unitPrice,
    total: quantity * unitPrice,
    payment: saleForm.payment.value,
    paid: saleForm.paid.value,
    dueDate: saleForm.dueDate.value || "",
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await saveDoc("sales", saleForm, payload);
  resetForm(saleForm);
  updateDueDateVisibility();
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
  productForm.name.value = item.name || "";
  productForm.unit.value = item.unit || "";
  productForm.price.value = item.price ?? "";
  productForm.dataset.editId = item.id;
  setSubmitLabel(productForm, "Actualizar producto");
};

const startEditClient = (item) => {
  clientForm.name.value = item.name || "";
  clientForm.phone.value = item.phone || "";
  clientForm.address.value = item.address || "";
  clientForm.dataset.editId = item.id;
  setSubmitLabel(clientForm, "Actualizar cliente");
};

const startEditSale = (item) => {
  saleForm.date.value = item.date || "";
  saleForm.client.value = item.clientId || "";
  saleForm.product.value = item.productId || "";
  saleForm.quantity.value = item.quantity ?? "";
  saleForm.unitPrice.value = item.unitPrice ?? "";
  saleForm.payment.value = item.payment || "Efectivo";
  saleForm.paid.value = item.paid || "si";
  saleForm.dueDate.value = item.dueDate || "";
  saleForm.dataset.editId = item.id;
  setSubmitLabel(saleForm, "Actualizar venta");
  updateDueDateVisibility();
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

clientList.addEventListener("click", async (event) => {
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
  const editId = event.target.dataset.editSale;
  const deleteId = event.target.dataset.deleteSale;
  if (editId) {
    const item = state.sales.find((m) => m.id === editId);
    if (item) startEditSale(item);
  }
  if (deleteId && confirmDelete("venta")) {
    await deleteDoc(doc(db, "sales", deleteId));
  }
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

saleForm.product.addEventListener("change", () => {
  const product = state.products.find((item) => item.id === saleForm.product.value);
  if (product) saleForm.unitPrice.value = product.price;
});

saleForm.paid.addEventListener("change", updateDueDateVisibility);
saleForm.payment.addEventListener("change", updateDueDateVisibility);

setupTabs();
setDefaultDates();
updateDueDateVisibility();
renderRecipeDraft();
updateRecipeIngredientFields();
updateBatchCostPreview();
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

const openSection = (toggle, body) => {
  setCollapseMax(body);
  body.classList.add("open");
  toggle.classList.add("open");
  toggle.setAttribute("aria-expanded", "true");
};

const closeSection = (toggle, body) => {
  body.classList.remove("open");
  toggle.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
};

document.querySelectorAll(".collapse-toggle[data-collapse]").forEach((toggle) => {
  const body = document.getElementById(toggle.dataset.collapse);
  if (!body) return;
  openSection(toggle, body);
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
});

const refreshCollapseHeights = () => {
  document.querySelectorAll(".collapse-body.open").forEach((body) => {
    setCollapseMax(body);
  });
};

window.addEventListener("resize", refreshCollapseHeights);

onAuthStateChanged(auth, (user) => {
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers = [];
  if (!user) {
    showAuth();
    return;
  }
  showDashboard(user);
  listenCollection("raw_materials", "rawMaterials", user.uid);
  listenCollection("raw_purchases", "purchases", user.uid);
  listenCollection("recipes", "recipes", user.uid);
  listenCollection("batches", "batches", user.uid);
  listenCollection("products", "products", user.uid);
  listenCollection("clients", "clients", user.uid);
  listenCollection("sales", "sales", user.uid);
  listenCollection("sales_goals", "salesGoals", user.uid);
});


