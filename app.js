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
const metricDisplaysBreakdown = document.getElementById("metricDisplaysBreakdown");
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
const saleCreditCheckbox = document.getElementById("saleCredit");
const saleItems = document.getElementById("saleItems");
const saleGrandTotal = document.getElementById("saleGrandTotal");
const addSaleItemBtn = document.getElementById("addSaleItemBtn");
const salesGoalForm = document.getElementById("salesGoalForm");
const salesGoalNotice = document.getElementById("salesGoalNotice");
const addIngredientBtn = document.getElementById("addIngredientBtn");
const quickClientToggle = document.getElementById("quickClientToggle");
const quickClientPanel = document.getElementById("quickClientPanel");
const quickClientName = document.getElementById("quickClientName");
const quickClientRuc = document.getElementById("quickClientRuc");
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
let saleProductIndex = new Map();

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
  let hasDisplayUnit = false;
  sales.forEach((sale) => {
    if (!isDateInRange(sale.date, startDate, endDate)) return;
    getSaleLineItems(sale).forEach((line) => {
      const unit = normalizeText(line.unit || "display");
      if (unit.includes("display")) {
        total += Number(line.quantity || 0);
        hasDisplayUnit = true;
      } else {
        const converted = computeDisplaysFromUnit(Number(line.quantity || 0), unit);
        if (converted !== null) {
          total += converted;
          hasDisplayUnit = true;
        }
      }
    });
  });
  return hasDisplayUnit ? total : null;
};

const computeDisplaysForDate = (sales, dateValue) => {
  let total = 0;
  let hasDisplayUnit = false;
  sales.forEach((sale) => {
    if (sale.date !== dateValue) return;
    getSaleLineItems(sale).forEach((line) => {
      const unit = normalizeText(line.unit || "display");
      if (unit.includes("display")) {
        total += Number(line.quantity || 0);
        hasDisplayUnit = true;
      } else {
        const converted = computeDisplaysFromUnit(Number(line.quantity || 0), unit);
        if (converted !== null) {
          total += converted;
          hasDisplayUnit = true;
        }
      }
    });
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

  state.batches.forEach((batch) => {
    const productId = batch.productId || "";
    const name = batch.productName || batch.recipeName || "Producto";
    const key = productId || normalizeText(name);
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
      const key = productId || normalizeText(name);
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
  const unitPrice = Number(row.querySelector(".sale-item-price")?.value || 0);
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
      <input class="sale-item-price" type="number" min="0" step="1" placeholder="0" aria-label="Precio unitario" value="${item.unitPrice ?? ""}">
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
      if (select.value) {
        const duplicate = Array.from(saleItems.querySelectorAll(".sale-item-product"))
          .some((other) => other !== select && other.value === select.value);
        if (duplicate) {
          window.alert("Ese producto ya fue agregado. Ajusta la cantidad en la linea existente.");
          select.value = "";
        }
      }
      updateSaleItemStock(row);
      updateSaleItemSubtotal(row);
      refreshSaleGrandTotal();
      refreshSaleProductOptions();
      requestAnimationFrame(refreshCollapseHeights);
    });
  }
  qtyInput?.addEventListener("input", () => {
    updateSaleItemStock(row);
    updateSaleItemSubtotal(row);
    refreshSaleGrandTotal();
    requestAnimationFrame(refreshCollapseHeights);
  });
  priceInput?.addEventListener("input", () => {
    updateSaleItemSubtotal(row);
    refreshSaleGrandTotal();
    requestAnimationFrame(refreshCollapseHeights);
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
    const displays = row.canCompute ? row.produced - row.sold : null;
    const optionValue = row.productId ? row.productId : buildSaleOptionKey({ name: row.name });
    const label = displays !== null
      ? `${row.name} (${formatInteger(displays)} disponibles)`
      : `${row.name} (N/D)`;
    options.push({ value: optionValue, label, displays });
    saleProductIndex.set(optionValue, { ...row, displays, optionValue });
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
  const rows = buildFinishedStockRows();
  let total = 0;
  let hasData = false;
  const breakdown = [];
  rows.forEach((row) => {
    if (!row.canCompute) return;
    hasData = true;
    const displays = row.produced - row.sold;
    total += displays;
    breakdown.push({
      name: row.name,
      displays
    });
  });
  return { totalDisplays: hasData ? total : null, rows, breakdown };
};

const refreshFinishedStock = () => {
  if (!finishedStockList) return;
  const { rows } = computeFinishedStockTotals();
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
  const finishedTotals = computeFinishedStockTotals();
  const displaysStock = finishedTotals.totalDisplays !== null
    ? formatInteger(finishedTotals.totalDisplays)
    : "N/D";
  let lotsPossible = "N/D";
  let bottleneck = "N/D";
  if (!activeRecipe) {
    lotsPossible = state.recipes.length ? "Sin formula base" : "Sin formulas";
    bottleneck = state.recipes.length ? "Sin formula base" : "Sin formulas";
  } else if (!rows.length || rows.every((row) => row.available <= 0)) {
    lotsPossible = "Sin stock cargado";
    bottleneck = "Sin stock cargado";
  } else if (metrics.maxBatches !== null && Number.isFinite(metrics.maxBatches)) {
    lotsPossible = formatInteger(Math.floor(metrics.maxBatches));
    bottleneck = metrics.limitingRow ? metrics.limitingRow.name : "N/D";
  }
  metricDisplaysStock.textContent = displaysStock;
  if (metricDisplaysBreakdown) {
    if (!finishedTotals.breakdown.length) {
      metricDisplaysBreakdown.innerHTML = "";
    } else {
      metricDisplaysBreakdown.innerHTML = finishedTotals.breakdown
        .sort((a, b) => b.displays - a.displays)
        .map((item) => `
          <div class="overview-row">
            <span>${item.name}</span>
            <strong>${formatInteger(item.displays)}</strong>
          </div>
        `)
        .join("");
    }
  }
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

  const finishedTotals = computeFinishedStockTotals();
  const availableDisplays = finishedTotals.totalDisplays !== null
    ? formatInteger(finishedTotals.totalDisplays)
    : "N/D";

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
    refreshDashboard(stockData);
  }
  if (["batches", "sales", "products", "recipes"].includes(key)) {
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
      const displays = item.canCompute ? item.produced - item.sold : null;
      return `
        <div class="list-item">
          <strong>${item.name}</strong>
          <div>Displays disponibles: ${displays !== null ? formatInteger(displays) : "N/D"}</div>
        </div>
      `;
    });
  }

  renderList(clientList, state.clients, (item) => `
    <div class="list-item">
      <strong>${item.name}</strong>
      ${item.ruc ? `RUC: ${item.ruc}` : ""}
      ${item.phone ? ` | Tel: ${item.phone}` : ""}
      ${item.address ? ` | Dir: ${item.address}` : ""}
      <div class="list-actions">
        <button class="btn ghost" type="button" data-edit-client="${item.id}">Editar</button>
        <button class="btn ghost danger" type="button" data-delete-client="${item.id}">Eliminar</button>
      </div>
    </div>
  `);

  renderList(saleList, state.sales, (item) => {
    const lines = getSaleLineItems(item);
    const saleTotal = Number.isFinite(Number(item.total))
      ? Number(item.total)
      : lines.reduce((sum, line) => sum + Number(line.total || (line.quantity || 0) * (line.unitPrice || 0)), 0);
    const isCreditSale = item.isCredit === true
      || item.paid === "no"
      || normalizeText(item.payment) === "credito";
    const title = lines.length === 1
      ? lines[0].productName || item.productName || "Venta"
      : `Venta con ${lines.length} productos`;
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
        <strong>${title}</strong>
        <div>Fecha: ${formatDate(item.date)}</div>
        <div class="sale-lines">${lineRows}</div>
        <div>Cliente: ${item.clientName || "Sin cliente"} | Total: Gs ${formatGs(saleTotal)}</div>
        <div>Pago: ${item.payment} | ${isCreditSale ? `A credito hasta ${formatDate(item.dueDate)}` : "Contado"}</div>
        <div class="list-actions">
          <button class="btn ghost" type="button" data-edit-sale="${item.id}">Editar</button>
          <button class="btn ghost danger" type="button" data-delete-sale="${item.id}">Eliminar</button>
        </div>
      </div>
    `;
  });

  requestAnimationFrame(refreshCollapseHeights);
  refreshIcons();
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
  const isCredit = Boolean(saleCreditCheckbox?.checked);
  dueDateField.classList.remove("hidden");
  dueDateField.classList.toggle("open", isCredit);
  if (!isCredit) saleForm.dueDate.value = "";
  requestAnimationFrame(refreshCollapseHeights);
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
  const payload = {
    name: clientForm.name.value.trim(),
    ruc: clientForm.ruc.value.trim(),
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
  const rows = Array.from(saleItems?.querySelectorAll(".sale-item") || []);
  const draftItems = [];
  let hasError = false;
  rows.forEach((row) => {
    const productKey = row.querySelector(".sale-item-product")?.value || "";
    const quantityValue = row.querySelector(".sale-item-qty")?.value;
    const unitPriceValue = row.querySelector(".sale-item-price")?.value;
    const quantity = Number(quantityValue);
    const unitPrice = Number(unitPriceValue);
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
  if (isCredit && !saleForm.dueDate.value) {
    window.alert("Completa la fecha de cobro para ventas a credito.");
    return;
  }
  const payload = {
    date: saleForm.date.value,
    productId: summary.productId || "",
    productName: summary.productName || "",
    clientId: client?.id || "",
    clientName: client?.name || "",
    items: itemsPayload,
    quantity: summary.quantity || 0,
    unitPrice: summary.unitPrice || 0,
    total,
    unit: "display",
    payment: saleForm.payment.value,
    isCredit,
    paid: isCredit ? "no" : "si",
    dueDate: isCredit ? saleForm.dueDate.value : "",
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await saveDoc("sales", saleForm, payload);
  resetForm(saleForm);
  resetSaleItems();
  if (saleCreditCheckbox) saleCreditCheckbox.checked = false;
  updateDueDateVisibility();
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
  const name = quickClientName?.value.trim() || "";
  const ruc = quickClientRuc?.value.trim() || "";
  const phone = quickClientPhone?.value.trim() || "";
  const address = quickClientAddress?.value.trim() || "";
  if (!name) {
    if (quickClientNotice) quickClientNotice.textContent = "Completa el nombre del cliente.";
    return;
  }
  const payload = {
    name,
    ruc,
    phone,
    address,
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
  if (quickClientRuc) quickClientRuc.value = "";
  if (quickClientPhone) quickClientPhone.value = "";
  if (quickClientAddress) quickClientAddress.value = "";
  if (quickClientNotice) quickClientNotice.textContent = "";
  toggleQuickClient(false);
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
  clientForm.ruc.value = item.ruc || "";
  clientForm.phone.value = item.phone || "";
  clientForm.address.value = item.address || "";
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

saleCreditCheckbox?.addEventListener("change", updateDueDateVisibility);

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

setupTabs();
setDefaultDates();
updateDueDateVisibility();
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
  if (["salesGoalSection", "productsSection", "clientsSection", "salesSection"].includes(toggle.dataset.collapse)) {
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


