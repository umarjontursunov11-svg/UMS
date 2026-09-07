/**
 * Universal E-Magazin - Admin Dashboard & Management Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminTheme();
  initAdminDashboard();
});

let currentOrderFilter = 'all';
let currentProductCategoryFilter = 'all';
let editingProductId = null;

function initAdminTheme() {
  const savedTheme = localStorage.getItem('megastore_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeBtn = document.getElementById('admin-theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('megastore_theme', next);
      notify.info(`${next === 'dark' ? 'Tungi' : 'Kunduzgi'} rejim yoqildi`);
    });
  }
}

function initAdminDashboard() {
  setupNavigation();
  renderDashboardOverview();
  renderOrdersTable();
  renderProductsTable();
  renderCategoriesAdmin();
  renderPromosAdmin();
  loadSettingsForm();
  setupProductModalEvents();
  setupSettingsEvents();
}

/* ============================================================
   NAVIGATION & TABS
   ============================================================ */
function setupNavigation() {
  const navItems = document.querySelectorAll('.admin-nav-item');
  const sections = document.querySelectorAll('.admin-section');
  const pageTitle = document.getElementById('admin-page-title-text');
  const pageSub = document.getElementById('admin-page-sub-text');

  const titles = {
    'section-dashboard': { title: 'Boshqaruv Paneli (Dashboard)', sub: 'Sotuvlar, buyurtmalar va umumiy do\'kon ko\'rsatkichlari' },
    'section-orders': { title: 'Buyurtmalar Nazorati', sub: 'Mijozlar tomonidan yuborilgan barcha buyurtmalar' },
    'section-products': { title: 'Mahsulotlar Boshqaruvi', sub: 'Ombordagi tovarlar, narxlar va xususiyatlarni boshqarish' },
    'section-categories': { title: 'Kategoriyalar', sub: 'Do\'kon toifalari va menyu tuzilmasi' },
    'section-promos': { title: 'Promokodlar & Chegirmalar', sub: 'Maxsus aksiya kuponlari' },
    'section-settings': { title: 'Tizim Sozlamalari', sub: 'Do\'kon rekvizitlari va Telegram Bot integratsiyasi' }
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.target;
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      sections.forEach(s => s.classList.remove('active'));
      const activeSection = document.getElementById(targetId);
      if (activeSection) activeSection.classList.add('active');

      if (titles[targetId]) {
        if (pageTitle) pageTitle.textContent = titles[targetId].title;
        if (pageSub) pageSub.textContent = titles[targetId].sub;
      }

      // Refresh data on tab switch
      if (targetId === 'section-dashboard') renderDashboardOverview();
      if (targetId === 'section-orders') renderOrdersTable();
      if (targetId === 'section-products') renderProductsTable();
      if (targetId === 'section-categories') renderCategoriesAdmin();
      if (targetId === 'section-promos') renderPromosAdmin();
    });
  });
}

/* ============================================================
   DASHBOARD OVERVIEW & STATS
   ============================================================ */
function renderDashboardOverview() {
  const stats = db.getStatistics();

  const revEl = document.getElementById('stat-total-revenue');
  const ordersEl = document.getElementById('stat-total-orders');
  const pendingEl = document.getElementById('stat-pending-orders');
  const productsEl = document.getElementById('stat-total-products');
  const pendingBadge = document.getElementById('nav-pending-badge');

  if (revEl) revEl.textContent = formatMoney(stats.totalRevenue);
  if (ordersEl) ordersEl.textContent = stats.totalOrders;
  if (pendingEl) pendingEl.textContent = stats.pendingOrdersCount;
  if (productsEl) productsEl.textContent = `${stats.totalProductsCount} dona`;
  if (pendingBadge) {
    pendingBadge.textContent = stats.pendingOrdersCount;
    pendingBadge.style.display = stats.pendingOrdersCount > 0 ? 'inline-block' : 'none';
  }

  // 7-day Sales Bar Chart
  const chartContainer = document.getElementById('sales-bars-container');
  if (chartContainer && stats.salesChart) {
    const maxRev = Math.max(...stats.salesChart.map(d => d.revenue), 100000);

    chartContainer.innerHTML = stats.salesChart.map(d => {
      const heightPercent = Math.max(10, Math.round((d.revenue / maxRev) * 100));
      return `
        <div class="chart-bar-group">
          <div class="chart-bar-pill" style="height: ${heightPercent}%;" data-tooltip="${formatMoney(d.revenue)} (${d.count} ta)"></div>
          <span class="chart-bar-label">${d.label}</span>
        </div>
      `;
    }).join('');
  }

  // Top Selling Products
  const topListContainer = document.getElementById('top-selling-list');
  if (topListContainer) {
    if (stats.topSelling.length === 0) {
      topListContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 20px;">Hozircha sotuvlar mavjud emas</div>`;
    } else {
      topListContainer.innerHTML = stats.topSelling.map(p => `
        <div class="top-product-item">
          <img src="${p.image || 'https://placehold.co/50x50'}" alt="${escapeHtml(p.name)}" class="top-product-img">
          <div class="top-product-info">
            <div class="top-product-name">${escapeHtml(p.name)}</div>
            <div class="top-product-sales">${p.soldCount} dona sotildi</div>
          </div>
          <div class="top-product-badge">${formatMoney(p.totalRevenue)}</div>
        </div>
      `).join('');
    }
  }
}

/* ============================================================
   ORDERS MANAGEMENT
   ============================================================ */
function renderOrdersTable() {
  const tbody = document.getElementById('orders-table-body');
  const searchInput = document.getElementById('orders-search-input');
  if (!tbody) return;

  let orders = db.getOrders();
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  if (query) {
    orders = orders.filter(o => 
      o.id.toLowerCase().includes(query) ||
      o.customer.name.toLowerCase().includes(query) ||
      o.customer.phone.toLowerCase().includes(query)
    );
  }

  if (currentOrderFilter !== 'all') {
    orders = orders.filter(o => o.status === currentOrderFilter);
  }

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
          Hech qanday buyurtma topilmadi
        </td>
      </tr>
    `;
    return;
  }

  const statusLabels = {
    pending: 'Yangi',
    processing: 'Tayyorlanmoqda',
    shipping: 'Yetkazilmoqda',
    completed: 'Bajarildi',
    cancelled: 'Bekor qilindi'
  };

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td><strong>#${order.id}</strong></td>
      <td>
        <div><strong>${escapeHtml(order.customer.name)}</strong></div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(order.customer.phone)}</div>
      </td>
      <td>
        <span style="font-size: 0.8rem;">${order.items.length} xil mahsulot</span>
      </td>
      <td><strong style="color: var(--primary);">${formatMoney(order.totalAmount)}</strong></td>
      <td>
        <span class="status-pill status-${order.status}">${statusLabels[order.status] || order.status}</span>
      </td>
      <td>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(order.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
      </td>
      <td>
        <div class="table-actions">
          <button class="table-action-btn" onclick="printOrderReceipt('${order.id}')" title="Chekni chop etish">
            <i class="fa-solid fa-print"></i>
          </button>
          <button class="table-action-btn" onclick="openAdminOrderModal('${order.id}')" title="Batafsil ko'rish">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="table-action-btn btn-delete" onclick="deleteAdminOrder('${order.id}')" title="O'chirish">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Setup order filter tabs & search
  setupOrderFilterEvents();
}

function setupOrderFilterEvents() {
  const searchInput = document.getElementById('orders-search-input');
  if (searchInput && !searchInput._init) {
    searchInput._init = true;
    searchInput.addEventListener('input', () => renderOrdersTable());
  }

  document.querySelectorAll('.order-tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.order-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderFilter = btn.dataset.status;
      renderOrdersTable();
    };
  });
}

window.openAdminOrderModal = function(orderId) {
  const order = db.getOrderById(orderId);
  if (!order) return;

  const modalBody = document.getElementById('admin-order-modal-body');
  if (!modalBody) return;

  const statusLabels = {
    pending: 'Yangi qabul qilingan',
    processing: 'Tayyorlanmoqda',
    shipping: 'Yetkazilmoqda (Kuryerda)',
    completed: 'Bajarildi (Yetkazildi)',
    cancelled: 'Bekor qilindi'
  };

  const itemsRows = order.items.map((it, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="${it.image || 'https://placehold.co/40x40'}" style="width: 36px; height: 36px; border-radius: 4px; object-fit: cover;">
          <span>${escapeHtml(it.name)}</span>
        </div>
      </td>
      <td>${it.quantity} dona</td>
      <td>${formatMoney(it.price)}</td>
      <td><strong>${formatMoney(it.price * it.quantity)}</strong></td>
    </tr>
  `).join('');

  modalBody.innerHTML = `
    <div style="padding: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 800;">Buyurtma #${order.id}</h2>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Sana: ${new Date(order.date).toLocaleString('uz-UZ')}</div>
        </div>
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">Holatni o'zgartirish:</label>
          <select class="form-select" id="order-status-select" onchange="changeOrderStatus('${order.id}', this.value)" style="padding: 6px 12px; font-size: 0.85rem; font-weight: 700;">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Yangi (Pending)</option>
            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Tayyorlanmoqda (Processing)</option>
            <option value="shipping" ${order.status === 'shipping' ? 'selected' : ''}>Yetkazilmoqda (Shipping)</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Bajarildi (Completed)</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Bekor qilindi (Cancelled)</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <div style="background: var(--bg-main); padding: 16px; border-radius: var(--radius-md);">
          <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Mijoz Ma'lumotlari:</h4>
          <div><strong>${escapeHtml(order.customer.name)}</strong></div>
          <div style="color: var(--primary); font-weight: 600; margin: 4px 0;"><i class="fa-solid fa-phone"></i> ${escapeHtml(order.customer.phone)}</div>
          <div style="font-size: 0.85rem;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(order.customer.city)}, ${escapeHtml(order.customer.address)}</div>
          ${order.customer.notes ? `<div style="font-size: 0.8rem; color: var(--warning); margin-top: 6px;">Izoh: ${escapeHtml(order.customer.notes)}</div>` : ''}
        </div>

        <div style="background: var(--bg-main); padding: 16px; border-radius: var(--radius-md);">
          <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">To'lov va Yetkazish:</h4>
          <div>To'lov turi: <strong>${escapeHtml(order.paymentMethod)}</strong></div>
          <div>Yetkazib berish: <strong>${order.deliveryType === 'express' ? 'Tezkor (Express)' : 'Standart'}</strong></div>
          ${order.promoCode ? `<div style="color: var(--success);">Promokod: <strong>${order.promoCode} (-${formatMoney(order.discountAmount)})</strong></div>` : ''}
          <div style="font-size: 1.15rem; font-weight: 800; color: var(--primary); margin-top: 8px;">Jami: ${formatMoney(order.totalAmount)}</div>
        </div>
      </div>

      <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 10px;">Buyurtma qilingan tovarlar:</h4>
      <table class="admin-table" style="margin-bottom: 20px;">
        <thead>
          <tr>
            <th>#</th>
            <th>Nomi</th>
            <th>Soni</th>
            <th>Narxi</th>
            <th>Jami</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-secondary" onclick="printOrderReceipt('${order.id}')"><i class="fa-solid fa-print"></i> Chekni chop etish</button>
        <button class="btn-primary" onclick="closeModal('admin-order-modal')">Yopish</button>
      </div>
    </div>
  `;

  openModal('admin-order-modal');
};

window.changeOrderStatus = function(orderId, newStatus) {
  const updated = db.updateOrderStatus(orderId, newStatus);
  if (updated) {
    notify.success(`Buyurtma #${orderId} holati yangilandi!`);
    renderOrdersTable();
    renderDashboardOverview();
  }
};

window.deleteAdminOrder = function(orderId) {
  if (confirm(`Haqiqatdan ham #${orderId} raqamli buyurtmani o'chirmoqchimisiz?`)) {
    db.deleteOrder(orderId);
    notify.info("Buyurtma o'chirildi");
    renderOrdersTable();
    renderDashboardOverview();
  }
};

/* ============================================================
   PRODUCTS CRUD MANAGEMENT
   ============================================================ */
function renderProductsTable() {
  const tbody = document.getElementById('products-table-body');
  const searchInput = document.getElementById('admin-product-search');
  if (!tbody) return;

  let products = db.getProducts();
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  if (query) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query))
    );
  }

  if (currentProductCategoryFilter !== 'all') {
    products = products.filter(p => p.category === currentProductCategoryFilter);
  }

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">
          Mahsulotlar topilmadi
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover;" onerror="this.src='https://placehold.co/60x60'">
          <div>
            <strong style="display: block; font-size: 0.9rem;">${escapeHtml(p.name)}</strong>
            <span style="font-size: 0.75rem; color: var(--text-dim);">${escapeHtml(p.brand || 'Original')} | ID: ${p.id}</span>
          </div>
        </div>
      </td>
      <td><span class="badge" style="background: var(--bg-card-hover); color: var(--text-main);">${escapeHtml(p.category)}</span></td>
      <td><strong>${formatMoney(p.price)}</strong></td>
      <td>
        <span style="font-weight: 700; color: ${p.stock > 5 ? 'var(--success)' : (p.stock > 0 ? 'var(--warning)' : 'var(--danger)')};">
          ${p.stock} dona
        </span>
      </td>
      <td>⭐ ${p.rating || 5.0}</td>
      <td>
        <div class="table-actions">
          <button class="table-action-btn" onclick="openEditProductModal('${p.id}')" title="Tahrirlash">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="table-action-btn btn-delete" onclick="deleteAdminProduct('${p.id}')" title="O'chirish">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  setupProductTableFilterEvents();
}

function setupProductTableFilterEvents() {
  const searchInput = document.getElementById('admin-product-search');
  if (searchInput && !searchInput._init) {
    searchInput._init = true;
    searchInput.addEventListener('input', () => renderProductsTable());
  }

  const catSelect = document.getElementById('admin-product-cat-filter');
  if (catSelect && !catSelect._init) {
    catSelect._init = true;
    const cats = db.getCategories();
    catSelect.innerHTML = `<option value="all">Barcha toifalar</option>` + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    catSelect.addEventListener('change', (e) => {
      currentProductCategoryFilter = e.target.value;
      renderProductsTable();
    });
  }
}

function setupProductModalEvents() {
  const form = document.getElementById('product-form');
  const addBtn = document.getElementById('admin-add-product-btn');
  const imgInput = document.getElementById('prod-input-img');
  const imgPreview = document.getElementById('prod-img-preview');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      editingProductId = null;
      if (form) form.reset();
      document.getElementById('product-modal-title').textContent = "Yangi Mahsulot Qo'shish";
      if (imgPreview) imgPreview.src = "https://placehold.co/400x300?text=Mahsulot+Rasmi";
      populateCategorySelect();
      openModal('product-modal');
    });
  }

  if (imgInput && imgPreview) {
    imgInput.addEventListener('input', (e) => {
      imgPreview.src = e.target.value || "https://placehold.co/400x300?text=Mahsulot+Rasmi";
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveProductFromForm();
    });
  }
}

function populateCategorySelect() {
  const select = document.getElementById('prod-input-cat');
  if (!select) return;
  const cats = db.getCategories().filter(c => c.id !== 'all');
  select.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

window.openEditProductModal = function(productId) {
  const product = db.getProductById(productId);
  if (!product) return;

  editingProductId = productId;
  populateCategorySelect();

  document.getElementById('product-modal-title').textContent = "Mahsulotni Tahrirlash";
  document.getElementById('prod-input-name').value = product.name || '';
  document.getElementById('prod-input-cat').value = product.category || 'electronics';
  document.getElementById('prod-input-brand').value = product.brand || '';
  document.getElementById('prod-input-price').value = product.price || '';
  document.getElementById('prod-input-oldprice').value = product.oldPrice || '';
  document.getElementById('prod-input-stock').value = product.stock || 10;
  document.getElementById('prod-input-img').value = product.image || '';
  document.getElementById('prod-input-desc').value = product.description || '';
  document.getElementById('prod-input-featured').checked = !!product.isFeatured;
  document.getElementById('prod-input-popular').checked = !!product.isPopular;

  const preview = document.getElementById('prod-img-preview');
  if (preview) preview.src = product.image || 'https://placehold.co/400x300';

  openModal('product-modal');
};

function saveProductFromForm() {
  const name = document.getElementById('prod-input-name').value.trim();
  const category = document.getElementById('prod-input-cat').value;
  const brand = document.getElementById('prod-input-brand').value.trim();
  const price = Number(document.getElementById('prod-input-price').value) || 0;
  const oldPrice = Number(document.getElementById('prod-input-oldprice').value) || 0;
  const stock = Number(document.getElementById('prod-input-stock').value) || 0;
  const image = document.getElementById('prod-input-img').value.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
  const description = document.getElementById('prod-input-desc').value.trim();
  const isFeatured = document.getElementById('prod-input-featured').checked;
  const isPopular = document.getElementById('prod-input-popular').checked;

  if (!name || price <= 0) {
    notify.warning("Mahsulot nomi va narxini to'g'ri kiriting!");
    return;
  }

  const productData = {
    id: editingProductId,
    name,
    category,
    brand,
    price,
    oldPrice: oldPrice > price ? oldPrice : 0,
    stock,
    image,
    description,
    isFeatured,
    isPopular
  };

  db.saveProduct(productData);
  closeModal('product-modal');
  notify.success(editingProductId ? "Mahsulot muvaffaqiyatli yangilandi!" : "Yangi mahsulot do'konga qo'shildi!");
  renderProductsTable();
  renderDashboardOverview();
}

window.deleteAdminProduct = function(productId) {
  if (confirm("Haqiqatdan ham ushbu mahsulotni o'chirmoqchimisiz?")) {
    db.deleteProduct(productId);
    notify.info("Mahsulot o'chirildi");
    renderProductsTable();
    renderDashboardOverview();
  }
};

/* ============================================================
   CATEGORIES & PROMOS MANAGEMENT
   ============================================================ */
function renderCategoriesAdmin() {
  const container = document.getElementById('admin-categories-list');
  if (!container) return;

  const categories = db.getCategories();
  container.innerHTML = categories.map(c => `
    <div class="admin-info-card">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div class="stat-icon-box" style="width: 42px; height: 42px; font-size: 1.1rem; background: var(--primary-light); color: var(--primary);">
          <i class="${c.icon || 'fa-solid fa-tag'}"></i>
        </div>
        <div>
          <strong style="font-size: 0.95rem;">${escapeHtml(c.name)}</strong>
          <div style="font-size: 0.75rem; color: var(--text-dim);">ID: ${c.id}</div>
        </div>
      </div>
      ${c.id !== 'all' ? `
        <button class="table-action-btn btn-delete" onclick="deleteAdminCategory('${c.id}')" title="O'chirish">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      ` : ''}
    </div>
  `).join('');
}

window.addNewCategory = function() {
  const name = prompt("Yangi kategoriya nomini kiriting:");
  if (!name || !name.trim()) return;

  const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
  db.saveCategory({
    id,
    name: name.trim(),
    icon: 'fa-solid fa-boxes-stacked'
  });

  notify.success(`"${name}" toifasi qo'shildi!`);
  renderCategoriesAdmin();
};

window.deleteAdminCategory = function(catId) {
  if (confirm("Ushbu kategoriyani o'chirishni tasdiqlaysizmi?")) {
    db.deleteCategory(catId);
    notify.info("Kategoriya o'chirildi");
    renderCategoriesAdmin();
  }
};

function renderPromosAdmin() {
  const container = document.getElementById('admin-promos-list');
  if (!container) return;

  const promos = db.getPromoCodes();
  container.innerHTML = promos.map(p => `
    <div class="admin-info-card">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="font-size: 1.1rem; color: var(--primary); letter-spacing: 0.05em;">${escapeHtml(p.code)}</strong>
          <span class="badge badge-discount">-${p.discountPercent}%</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${escapeHtml(p.description || '')}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">Min. xarid: ${formatMoney(p.minAmount || 0)}</div>
      </div>
      <button class="table-action-btn btn-delete" onclick="deleteAdminPromo('${p.code}')" title="O'chirish">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join('');
}

window.addNewPromo = function() {
  const code = prompt("Promokod so'zini kiriting (masalan: SUPER2026):");
  if (!code || !code.trim()) return;

  const percentStr = prompt("Chegirma foizini kiriting (1-90):", "10");
  const percent = Number(percentStr) || 10;

  db.savePromoCode({
    code: code.trim().toUpperCase(),
    discountPercent: percent,
    minAmount: 100000,
    description: `${percent}% maxsus bayram chegirmasi`
  });

  notify.success(`"${code.toUpperCase()}" promokodi yaratildi!`);
  renderPromosAdmin();
};

window.deleteAdminPromo = function(code) {
  if (confirm(`"${code}" promokodini o'chirmoqchimisiz?`)) {
    db.deletePromoCode(code);
    notify.info("Promokod o'chirildi");
    renderPromosAdmin();
  }
};

/* ============================================================
   SETTINGS & TELEGRAM INTEGRATION
   ============================================================ */
function loadSettingsForm() {
  const settings = db.getSettings();

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setVal('set-store-name', settings.storeName || 'Universal MegaStore');
  setVal('set-phone', settings.phone || '+998 (90) 123-45-67');
  setVal('set-email', settings.email || 'info@megastore.uz');
  setVal('set-address', settings.address || 'Toshkent sh., Amir Temur ko\'chasi 45');
  setVal('set-tg-token', settings.telegramBotToken || '');
  setVal('set-tg-chatid', settings.telegramChatId || '');

  const tgToggle = document.getElementById('set-tg-enable');
  if (tgToggle) tgToggle.checked = !!settings.telegramNotificationsEnabled;
}

function setupSettingsEvents() {
  const form = document.getElementById('settings-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        storeName: document.getElementById('set-store-name').value.trim(),
        phone: document.getElementById('set-phone').value.trim(),
        email: document.getElementById('set-email').value.trim(),
        address: document.getElementById('set-address').value.trim(),
        telegramBotToken: document.getElementById('set-tg-token').value.trim(),
        telegramChatId: document.getElementById('set-tg-chatid').value.trim(),
        telegramNotificationsEnabled: document.getElementById('set-tg-enable').checked
      };

      db.saveSettings(updated);
      notify.success("Do'kon va Telegram sozlamalari saqlandi!");
    });
  }

  const autoDetectBtn = document.getElementById('auto-detect-chatid-btn');
  if (autoDetectBtn) {
    autoDetectBtn.addEventListener('click', async () => {
      const token = document.getElementById('set-tg-token').value.trim() || "8657815229:AAEV2N7L0-nQhEcmX5L49d5wyTBWaaKk1l4";
      notify.info("Botingizdan so'nggi xabarlar tekshirilmoqda...");
      const res = await notify.autoDetectChatId(token);
      if (res.success) {
        document.getElementById('set-tg-chatid').value = res.chatId;
        db.saveSettings({ telegramChatId: res.chatId });
        notify.success(`Chat ID muvaffaqiyatli aniqlandi (${res.name}: ${res.chatId}) va saqlandi! 🎉`);
      } else {
        notify.warning("Chat ID topilmadi. Iltimos, Telegramda @universalmegastore_bot ga kiring, /start bosing va so'ng bu tugmani qayta bosing.");
      }
    });
  }

  const testTgBtn = document.getElementById('test-telegram-btn');
  if (testTgBtn) {
    testTgBtn.addEventListener('click', async () => {
      const settings = db.getSettings();
      if (!settings.telegramBotToken) {
        notify.warning("Telegram Bot Token kiritilishi shart!");
        return;
      }

      notify.info("Telegramga sinov xabari yuborilmoqda...");
      const mockOrder = {
        id: "TEST-001",
        date: new Date().toISOString(),
        customer: {
          name: "Sinov Foydalanuvchi",
          phone: "+998 90 123 45 67",
          city: "Toshkent",
          address: "Amir Temur shoh ko'chasi"
        },
        items: [{ name: "Universal Sinov Mahsuloti", quantity: 1, price: 150000 }],
        subtotal: 150000,
        discountAmount: 0,
        shippingCost: 0,
        totalAmount: 150000,
        paymentMethod: "Click",
        deliveryType: "standard"
      };

      const res = await notify.sendTelegramOrderNotification(mockOrder, { ...settings, telegramNotificationsEnabled: true });
      if (res.success) {
        notify.success("Telegram botingizga sinov xabari muvaffaqiyatli yuborildi! 🚀");
      } else {
        notify.error("Telegramga ulanib bo'lmadi. Token yoki Chat ID ni tekshiring: " + (res.error || res.reason || "Noma'lum xatolik"));
      }
    });
  }
}

/* ============================================================
   HELPERS & MODAL UTILITIES
   ============================================================ */
function formatMoney(amount) {
  if (isNaN(amount)) return "0 so'm";
  return Number(amount).toLocaleString('uz-UZ') + " so'm";
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.openModal = function(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeModal = function(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.resetStoreDatabase = function() {
  if (confirm("DIQQAT: Barcha ma'lumotlar (buyurtmalar, yangi tovarlar) o'chiriladi va toza holatga qaytariladi. Davom etasizmi?")) {
    db.resetToDefault();
    notify.success("Baza toza holatga qaytarildi!");
    setTimeout(() => location.reload(), 800);
  }
};

window.loadSampleProductsToStore = function() {
  if (confirm("Namunaviy mahsulotlar bazasini yuklashni xohlaysizmi?")) {
    db.loadSampleProducts();
    notify.success("Namunaviy mahsulotlar muvaffaqiyatli yuklandi!");
    renderProductsTable();
    renderDashboardOverview();
  }
};

window.clearAllProductsFromStore = function() {
  if (confirm("Haqiqatdan ham barcha mahsulotlarni o'chirmoqchimisiz?")) {
    db.clearAllProducts();
    notify.info("Barcha mahsulotlar tozalandi");
    renderProductsTable();
    renderDashboardOverview();
  }
};
