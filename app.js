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
const usageForm = document.getElementById("usageForm");
const productionForm = document.getElementById("productionForm");
const productForm = document.getElementById("productForm");
const clientForm = document.getElementById("clientForm");
const saleForm = document.getElementById("saleForm");

const rawMaterialList = document.getElementById("rawMaterialList");
const purchaseList = document.getElementById("purchaseList");
const usageList = document.getElementById("usageList");
const productionList = document.getElementById("productionList");
const stockSummary = document.getElementById("stockSummary");
const productList = document.getElementById("productList");
const clientList = document.getElementById("clientList");
const saleList = document.getElementById("saleList");

const dueDateField = document.getElementById("dueDateField");

const state = {
  rawMaterials: [],
  purchases: [],
  usage: [],
  production: [],
  products: [],
  clients: [],
  sales: []
};

let unsubscribers = [];

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

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-PY");
};

const resetForm = (form) => {
  form.reset();
  const dateInputs = form.querySelectorAll('input[type="date"]');
  dateInputs.forEach((input) => {
    input.valueAsDate = new Date();
  });
};

const renderList = (container, items, renderer) => {
  if (!items.length) {
    container.innerHTML = '<div class="list-item muted">Sin registros todav?a.</div>';
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
  state.usage.forEach((usage) => {
    const id = usage.materialId;
    totals[id] = totals[id] || { purchased: 0, used: 0 };
    totals[id].used += Number(usage.quantity || 0);
  });

  const rows = state.rawMaterials.map((material) => {
    const summary = totals[material.id] || { purchased: 0, used: 0 };
    const available = summary.purchased - summary.used;
    return {
      name: material.name,
      unit: material.unit,
      purchased: summary.purchased,
      used: summary.used,
      available
    };
  });

  renderList(stockSummary, rows, (row) => `
    <div class="list-item">
      <strong>${row.name}</strong>
      Comprado: ${formatNumber(row.purchased)} ${row.unit} | Usado: ${formatNumber(row.used)} ${row.unit} | Disponible: ${formatNumber(row.available)} ${row.unit}
    </div>
  `);
};

const syncState = (key, items) => {
  state[key] = items;
  if (key === "rawMaterials") {
    updateSelect(purchaseForm.material, items, "Seleccionar");
    updateSelect(usageForm.material, items, "Seleccionar");
  }
  if (key === "products") {
    updateSelect(saleForm.product, items, "Seleccionar");
  }
  if (key === "clients") {
    updateSelect(saleForm.client, items, "Opcional");
  }

  if (["rawMaterials", "purchases", "usage"].includes(key)) {
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
      Unidad: ${item.unit} | Precio: Gs ${formatNumber(item.price)}${item.supplier ? ` | Proveedor: ${item.supplier}` : ""}
    </div>
  `);

  renderList(purchaseList, state.purchases, (item) => `
    <div class="list-item">
      <strong>${item.materialName}</strong>
      Fecha: ${formatDate(item.date)} | Cantidad: ${formatNumber(item.quantity)} ${item.unit}
      <div>Precio unitario: Gs ${formatNumber(item.unitPrice)} | Total: Gs ${formatNumber(item.total)}</div>
    </div>
  `);

  renderList(usageList, state.usage, (item) => `
    <div class="list-item">
      <strong>${item.materialName}</strong>
      Fecha: ${formatDate(item.date)} | Usado: ${formatNumber(item.quantity)} ${item.unit}
    </div>
  `);

  renderList(productionList, state.production, (item) => `
    <div class="list-item">
      <strong>${item.product}</strong>
      Fecha: ${formatDate(item.date)} | Cantidad: ${formatNumber(item.quantity)}
      ${item.notes ? `<div>Notas: ${item.notes}</div>` : ""}
    </div>
  `);

  renderList(productList, state.products, (item) => `
    <div class="list-item">
      <strong>${item.name}</strong>
      Unidad: ${item.unit} | Precio: Gs ${formatNumber(item.price)}
    </div>
  `);

  renderList(clientList, state.clients, (item) => `
    <div class="list-item">
      <strong>${item.name}</strong>
      ${item.phone ? `Tel: ${item.phone}` : ""}
      ${item.address ? ` | Dir: ${item.address}` : ""}
    </div>
  `);

  renderList(saleList, state.sales, (item) => `
    <div class="list-item">
      <strong>${item.productName}</strong>
      Fecha: ${formatDate(item.date)} | Cantidad: ${formatNumber(item.quantity)}
      <div>Cliente: ${item.clientName || "Sin cliente"} | Total: Gs ${formatNumber(item.total)}</div>
      <div>Pago: ${item.payment} | ${item.paid === "si" ? "Pagado" : `Credito hasta ${formatDate(item.dueDate)}`}</div>
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

rawMaterialForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const payload = {
    name: rawMaterialForm.name.value.trim(),
    unit: rawMaterialForm.unit.value.trim(),
    price: Number(rawMaterialForm.price.value),
    supplier: rawMaterialForm.supplier.value.trim(),
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await addDoc(collection(db, "raw_materials"), payload);
  resetForm(rawMaterialForm);
});

purchaseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const materialId = purchaseForm.material.value;
  const material = state.rawMaterials.find((item) => item.id === materialId);
  if (!material) return;
  const quantity = Number(purchaseForm.quantity.value);
  const unitPrice = Number(purchaseForm.unitPrice.value);
  const payload = {
    materialId,
    materialName: material.name,
    unit: material.unit,
    date: purchaseForm.date.value,
    quantity,
    unitPrice,
    total: quantity * unitPrice,
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await addDoc(collection(db, "raw_purchases"), payload);
  resetForm(purchaseForm);
});

usageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const materialId = usageForm.material.value;
  const material = state.rawMaterials.find((item) => item.id === materialId);
  if (!material) return;
  const payload = {
    materialId,
    materialName: material.name,
    unit: material.unit,
    date: usageForm.date.value,
    quantity: Number(usageForm.quantity.value),
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await addDoc(collection(db, "raw_usage"), payload);
  resetForm(usageForm);
});

productionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const payload = {
    date: productionForm.date.value,
    product: productionForm.product.value.trim(),
    quantity: Number(productionForm.quantity.value),
    notes: productionForm.notes.value.trim(),
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await addDoc(collection(db, "production"), payload);
  resetForm(productionForm);
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
  await addDoc(collection(db, "products"), payload);
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
  await addDoc(collection(db, "clients"), payload);
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
  await addDoc(collection(db, "sales"), payload);
  resetForm(saleForm);
  updateDueDateVisibility();
});

purchaseForm.quantity.addEventListener("input", () => {
  const total = Number(purchaseForm.quantity.value) * Number(purchaseForm.unitPrice.value);
  purchaseForm.total.value = Number.isNaN(total) ? "" : total.toFixed(2);
});

purchaseForm.unitPrice.addEventListener("input", () => {
  const total = Number(purchaseForm.quantity.value) * Number(purchaseForm.unitPrice.value);
  purchaseForm.total.value = Number.isNaN(total) ? "" : total.toFixed(2);
});

saleForm.product.addEventListener("change", () => {
  const product = state.products.find((item) => item.id === saleForm.product.value);
  if (product) saleForm.unitPrice.value = product.price;
});

saleForm.paid.addEventListener("change", updateDueDateVisibility);
saleForm.payment.addEventListener("change", updateDueDateVisibility);

setupTabs();
setDefaultDates();
updateDueDateVisibility();

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
  listenCollection("raw_usage", "usage", user.uid);
  listenCollection("production", "production", user.uid);
  listenCollection("products", "products", user.uid);
  listenCollection("clients", "clients", user.uid);
  listenCollection("sales", "sales", user.uid);
});

