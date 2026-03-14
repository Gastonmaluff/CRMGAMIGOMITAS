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
const productForm = document.getElementById("productForm");
const clientForm = document.getElementById("clientForm");
const saleForm = document.getElementById("saleForm");
const addIngredientBtn = document.getElementById("addIngredientBtn");

const rawMaterialList = document.getElementById("rawMaterialList");
const purchaseList = document.getElementById("purchaseList");
const recipeIngredientsList = document.getElementById("recipeIngredientsList");
const recipeCostPreview = document.getElementById("recipeCostPreview");
const recipeList = document.getElementById("recipeList");
const batchList = document.getElementById("batchList");
const stockSummary = document.getElementById("stockSummary");
const stockSummaryTotals = document.getElementById("stockSummaryTotals");
const stockRecipeSelect = document.getElementById("stockRecipeSelect");
const productList = document.getElementById("productList");
const clientList = document.getElementById("clientList");
const saleList = document.getElementById("saleList");

const dueDateField = document.getElementById("dueDateField");
const unitGroups = Array.from(document.querySelectorAll(".unit-group[data-target]"));

const state = {
  rawMaterials: [],
  purchases: [],
  recipes: [],
  batches: [],
  products: [],
  clients: [],
  sales: []
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
  const options = [`<option value="">${placeholder}</option>`];
  items.forEach((item) => {
    options.push(`<option value="${item.id}">${item.name}</option>`);
  });
  select.innerHTML = options.join("");
};

const refreshStockSummary = () => {
  const totals = {};
  state.purchases.forEach((purchase) => {
    const id = purchase.materialId;
    totals[id] = totals[id] || { purchased: 0, used: 0 };
    totals[id].purchased += Number(purchase.quantity || 0);
  });
  state.batches.forEach((batch) => {
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
      purchased: summary.purchased,
      used: summary.used,
      available
    };
  });

  const totalValue = rows.reduce((sum, row) => sum + row.available * row.price, 0);
  const selectedRecipeId = stockRecipeSelect?.value;
  const selectedRecipe = state.recipes.find((recipe) => recipe.id === selectedRecipeId);
  let totalKg = null;
  let totalDisplays = null;
  if (selectedRecipe && selectedRecipe.ingredients?.length) {
    let minRatio = Infinity;
    selectedRecipe.ingredients.forEach((ing) => {
      const material = state.rawMaterials.find((m) => m.id === ing.materialId);
      const baseUnit = material?.unit || ing.unitBase || ing.unit;
      const requiredBase = Number(ing.quantityBase || 0) ||
        normalizeQuantity(Number(ing.quantity || 0), ing.unit, baseUnit) ||
        Number(ing.quantity || 0);
      const available = rows.find((row) => row.materialId === ing.materialId)?.available || 0;
      if (requiredBase > 0) {
        minRatio = Math.min(minRatio, available / requiredBase);
      }
    });
    const batchesPossible = Number.isFinite(minRatio) ? Math.max(minRatio, 0) : 0;
    const totalYield = batchesPossible * Number(selectedRecipe.yieldQuantity || 0);
    if (selectedRecipe.yieldUnit === "kg") {
      totalKg = totalYield;
    } else if (selectedRecipe.yieldUnit === "g") {
      totalKg = totalYield / 1000;
    }
    if (totalKg !== null) {
      totalDisplays = Math.floor(totalKg / 0.36);
    }
  }

  renderList(stockSummaryTotals, [1], () => `
    <div class="list-item">
      <strong>Resumen general</strong>
      <div>Valor en materia prima: Gs ${formatGs(totalValue)}</div>
      <div>Kilos posibles: ${totalKg !== null ? formatNumber(totalKg) : "Selecciona formula (kg o g)"}</div>
      <div>Displays posibles (360 g): ${totalDisplays !== null ? totalDisplays.toLocaleString("es-PY") : "Selecciona formula (kg o g)"}</div>
    </div>
  `);

  renderList(stockSummary, rows, (row) => `
    <div class="list-item">
      <strong>${row.name}</strong>
      Comprado: ${formatNumber(row.purchased)} ${row.unit} | Usado: ${formatNumber(row.used)} ${row.unit} | Disponible: ${formatNumber(row.available)} ${row.unit}
    </div>
  `);
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
  }
  if (key === "products") {
    updateSelect(saleForm.product, items, "Seleccionar");
  }
  if (key === "clients") {
    updateSelect(saleForm.client, items, "Opcional");
  }

  if (["rawMaterials", "purchases", "batches"].includes(key)) {
    refreshStockSummary();
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
  renderList(rawMaterialList, state.rawMaterials, (item) => `
    <div class="list-item">
      <strong>${item.name}</strong>
      Unidad: ${item.unit} | Precio unitario: Gs ${formatGs(item.price)}
      ${item.referenceQuantity && item.referenceCost ? `<div>Referencia: ${formatNumber(item.referenceQuantity)} ${item.unit} = Gs ${formatGs(item.referenceCost)}</div>` : ""}
      ${item.supplier ? `<div>Proveedor: ${item.supplier}</div>` : ""}
      <div class="list-actions">
        <button class="btn ghost" type="button" data-edit-raw-material="${item.id}">Editar</button>
        <button class="btn ghost danger" type="button" data-delete-raw-material="${item.id}">Eliminar</button>
      </div>
    </div>
  `);

  renderList(purchaseList, state.purchases, (item) => `
    <div class="list-item">
      <strong>${item.materialName}</strong>
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
      <strong>${item.recipeName}</strong>
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
};

const setupTabs = () => {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add("active");
    });
  });
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
  const referenceQuantity = Number(rawMaterialForm.referenceQuantity.value);
  const referenceCost = Number(rawMaterialForm.referenceCost.value);
  const price = referenceQuantity ? referenceCost / referenceQuantity : 0;
  const payload = {
    name: rawMaterialForm.name.value.trim(),
    unit: rawMaterialForm.unit.value.trim(),
    price,
    referenceQuantity,
    referenceCost,
    supplier: rawMaterialForm.supplier.value.trim(),
    userId: user.uid,
    createdAt: serverTimestamp()
  };
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
  const payload = {
    name: recipeForm.name.value.trim(),
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
  const recipeId = batchForm.recipe.value;
  const recipe = state.recipes.find((item) => item.id === recipeId);
  if (!recipe) return;
  const quantityProduced = Number(batchForm.quantity.value);
  const costPerUnit = Number(recipe.costPerUnit || 0);
  const totalCost = costPerUnit * quantityProduced;
  const scale = recipe.yieldQuantity > 0 ? quantityProduced / recipe.yieldQuantity : 0;
  const materialsUsed = (recipe.ingredients || []).map((item) => ({
    materialId: item.materialId,
    materialName: item.materialName,
    unit: item.unit,
    quantity: Number(item.quantity) * scale,
    unitCost: Number(item.unitCost || 0),
    totalCost: Number(item.totalCost || 0) * scale
  }));
  const payload = {
    recipeId,
    recipeName: recipe.name,
    date: batchForm.date.value,
    lotNumber: batchForm.lotNumber.value.trim(),
    quantityProduced,
    unitProduced: batchForm.unit.value.trim(),
    costPerUnit,
    totalCost,
    materialsUsed,
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await saveDoc("batches", batchForm, payload);
  resetForm(batchForm);
  updateBatchCostPreview();
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

const startEditRawMaterial = (item) => {
  rawMaterialForm.name.value = item.name || "";
  setUnitGroupValue("rawMaterialUnit", item.unit || "");
  const fallbackQuantity = item.referenceQuantity ?? (item.price ? 1 : "");
  const fallbackCost = item.referenceCost ?? (item.price ? item.price : "");
  rawMaterialForm.referenceQuantity.value = fallbackQuantity;
  rawMaterialForm.referenceCost.value = fallbackCost;
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
  if (recipe) {
    setUnitGroupValue("batchUnit", recipe.yieldUnit || "");
  }
  updateBatchCostPreview();
});

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
});

const setupCollapsibles = () => {
  document.querySelectorAll(".collapse-header").forEach((header) => {
    header.addEventListener("click", () => {
      const targetId = header.dataset.collapse;
      const body = document.getElementById(targetId);
      if (!body) return;
      const isOpen = body.classList.contains("open");
      body.classList.toggle("open", !isOpen);
      header.classList.toggle("open", !isOpen);
    });
  });
  const first = document.querySelector(".collapse-header");
  if (first) {
    first.click();
  }
};

setupCollapsibles();

