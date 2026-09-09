/**
 * Universal E-Magazin - Client Application Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initApp();
});

// Global state
let currentFilters = {
  query: "",
  category: "all",
  brand: "all",
  minPrice: 0,
  maxPrice: 20000000,
  rating: 0,
  onlyDiscount: true, // Asosiy sahifada dastlab chegirmadagi mahsulotlar ko'rinadi
  inStockOnly: false,
  sortBy: "popular"
};

let currentPromo = null;
let appliedDiscount = 0;

function initTheme() {
  const savedTheme = localStorage.getItem('megastore_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('megastore_theme', nextTheme);
      updateThemeIcon(nextTheme);
      notify.info(`${nextTheme === 'dark' ? 'Tungi' : 'Kunduzgi'} rejim faollashtirildi`);
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
}

async function initApp() {
  await db.syncFromSupabase();
  renderCategories();
  renderBrandFilters();
  setupPriceFilter();
  renderProducts();
  setupSearchEvents();
  setupFilterEvents();
  setupCartDrawer();
  setupWishlistDrawer();
  setupModals();
  updateCartBadge();
  updateWishlistBadge();
}

/* ============================================================
   CATEGORIES & BRANDS RENDERERS
   ============================================================ */
function renderCategories() {
  const categories = db.getCategories();
  const container = document.getElementById('category-pills');
  const sidebarCategoryList = document.getElementById('sidebar-categories');
  const homeCategoriesGrid = document.getElementById('home-categories-grid');
  const products = db.getProducts();

  // 1. Asosiy Sahifadagi Kategoriyalar Bloki (Homepage Grid)
  if (homeCategoriesGrid) {
    const mainCats = categories.filter(c => c.id !== 'all');
    homeCategoriesGrid.innerHTML = mainCats.map(cat => {
      const count = products.filter(p => p.category === cat.id).length;
      const isActive = currentFilters.category === cat.id;

      return `
        <div class="home-category-card ${isActive ? 'active' : ''}" data-category="${cat.id}">
          <div class="home-category-icon-box">
            <i class="${cat.icon || 'fa-solid fa-boxes-stacked'}"></i>
          </div>
          <div class="home-category-name">${cat.name}</div>
          <div class="home-category-count">${count} ta mahsulot</div>
          <div class="home-category-btn">
            <span>Tovarlarni ko'rish</span>
            <i class="fa-solid fa-arrow-right"></i>
          </div>
        </div>
      `;
    }).join('');

    homeCategoriesGrid.querySelectorAll('.home-category-card').forEach(card => {
      card.addEventListener('click', () => {
        const catId = card.dataset.category;
        setCategoryFilter(catId);
        scrollToStore();
      });
    });
  }

  // 2. Yuqori gorizontal pills
  if (container) {
    container.innerHTML = categories.map(cat => `
      <button class="category-pill ${cat.id === currentFilters.category ? 'active' : ''}" data-category="${cat.id}">
        <i class="${cat.icon || 'fa-solid fa-tag'}"></i>
        <span>${cat.name}</span>
      </button>
    `).join('');

    container.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.dataset.category;
        setCategoryFilter(catId);
        scrollToStore();
      });
    });
  }

  // 3. Yon panel (Sidebar) kategoriyalar
  if (sidebarCategoryList) {
    sidebarCategoryList.innerHTML = categories.map(cat => {
      const count = cat.id === 'all' ? products.length : products.filter(p => p.category === cat.id).length;
      return `
        <label class="checkbox-label">
          <input type="radio" name="sidebar-cat" value="${cat.id}" ${cat.id === currentFilters.category ? 'checked' : ''}>
          <span>${cat.name}</span>
          <span class="checkbox-count">(${count})</span>
        </label>
      `;
    }).join('');

    sidebarCategoryList.querySelectorAll('input[name="sidebar-cat"]').forEach(input => {
      input.addEventListener('change', () => {
        setCategoryFilter(input.value);
      });
    });
  }
}

function setCategoryFilter(catId) {
  currentFilters.category = catId;
  document.querySelectorAll('.category-pill').forEach(b => {
    b.classList.toggle('active', b.dataset.category === catId);
  });
  document.querySelectorAll('.home-category-card').forEach(c => {
    c.classList.toggle('active', c.dataset.category === catId);
  });
  const radio = document.querySelector(`input[name="sidebar-cat"][value="${catId}"]`);
  if (radio) radio.checked = true;

  renderProducts();
}

function scrollToStore() {
  const storeSection = document.getElementById('store-content');
  if (storeSection) {
    storeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

window.setDiscountTab = function(isDiscountOnly) {
  currentFilters.onlyDiscount = isDiscountOnly;

  const tabDiscount = document.getElementById('tab-discount-only');
  const tabAll = document.getElementById('tab-all-products');
  const discountToggle = document.getElementById('filter-discount-toggle');
  const titleEl = document.getElementById('store-section-title');
  const subEl = document.getElementById('store-section-subtitle');

  if (tabDiscount) tabDiscount.classList.toggle('active', isDiscountOnly);
  if (tabAll) tabAll.classList.toggle('active', !isDiscountOnly);
  if (discountToggle) discountToggle.checked = isDiscountOnly;

  if (titleEl) {
    titleEl.textContent = isDiscountOnly ? "🔥 Skidkadagi Mahsulotlar" : "📦 Barcha Mahsulotlar";
  }
  if (subEl) {
    subEl.textContent = isDiscountOnly 
      ? "Eng yuqori chegirmalar va arzon narxlardagi tovarlar" 
      : "Katalogdagi barcha zamonaviy va sifatli mahsulotlar";
  }

  renderProducts();
};

function renderBrandFilters() {
  const brands = db.getDistinctBrands();
  const container = document.getElementById('sidebar-brands');
  if (!container) return;

  const products = db.getProducts();
  let html = `
    <label class="checkbox-label">
      <input type="radio" name="sidebar-brand" value="all" ${currentFilters.brand === 'all' ? 'checked' : ''}>
      <span>Barcha Brendlar</span>
      <span class="checkbox-count">(${products.length})</span>
    </label>
  `;

  brands.forEach(b => {
    const count = products.filter(p => p.brand === b).length;
    html += `
      <label class="checkbox-label">
        <input type="radio" name="sidebar-brand" value="${b}" ${currentFilters.brand === b ? 'checked' : ''}>
        <span>${b}</span>
        <span class="checkbox-count">(${count})</span>
      </label>
    `;
  });

  container.innerHTML = html;
  container.querySelectorAll('input[name="sidebar-brand"]').forEach(input => {
    input.addEventListener('change', () => {
      currentFilters.brand = input.value;
      renderProducts();
    });
  });
}

function setupPriceFilter() {
  const priceRange = db.getPriceRange();
  const slider = document.getElementById('price-slider');
  const minInput = document.getElementById('price-min-input');
  const maxInput = document.getElementById('price-max-input');
  const maxLabel = document.getElementById('price-max-label');

  if (slider) {
    slider.max = Math.max(20000000, priceRange.max);
    slider.value = slider.max;
    currentFilters.maxPrice = Number(slider.value);

    if (maxLabel) maxLabel.textContent = formatMoney(slider.value);
    if (maxInput) maxInput.value = slider.value;

    slider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      currentFilters.maxPrice = val;
      if (maxInput) maxInput.value = val;
      if (maxLabel) maxLabel.textContent = formatMoney(val);
      renderProducts();
    });
  }

  if (minInput) {
    minInput.addEventListener('change', (e) => {
      currentFilters.minPrice = Number(e.target.value) || 0;
      renderProducts();
    });
  }

  if (maxInput) {
    maxInput.addEventListener('change', (e) => {
      const val = Number(e.target.value) || 20000000;
      currentFilters.maxPrice = val;
      if (slider) slider.value = val;
      if (maxLabel) maxLabel.textContent = formatMoney(val);
      renderProducts();
    });
  }
}

/* ============================================================
   SEARCH & FILTER LOGIC
   ============================================================ */
function setupSearchEvents() {
  const searchInput = document.getElementById('global-search-input');
  const searchDropdown = document.getElementById('search-dropdown');
  const clearBtn = document.getElementById('search-clear-btn');
  const searchForm = document.getElementById('global-search-form');

  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

    if (q.length >= 1) {
      const matches = db.filterProducts({ query: q }).slice(0, 5);
      showLiveSearchResults(matches, q);
    } else {
      if (searchDropdown) searchDropdown.classList.remove('active');
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      if (searchDropdown) searchDropdown.classList.remove('active');
      currentFilters.query = '';
      renderProducts();
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      currentFilters.query = searchInput.value.trim();
      if (searchDropdown) searchDropdown.classList.remove('active');
      renderProducts();
    });
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      if (searchDropdown) searchDropdown.classList.remove('active');
    }
  });
}

function showLiveSearchResults(products, query) {
  const dropdown = document.getElementById('search-dropdown');
  if (!dropdown) return;

  if (products.length === 0) {
    dropdown.innerHTML = `
      <div class="search-no-results">
        <i class="fa-solid fa-magnifying-glass" style="font-size: 1.5rem; margin-bottom: 8px; opacity: 0.5;"></i>
        <p>"<strong>${escapeHtml(query)}</strong>" bo'yicha hech narsa topilmadi</p>
      </div>
    `;
  } else {
    dropdown.innerHTML = `
      <div class="search-dropdown-header">Qidiruv natijalari (${products.length})</div>
      ${products.map(p => `
        <div class="search-item" data-id="${p.id}">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" class="search-item-img" onerror="this.src='https://placehold.co/100x100?text=MegaStore'">
          <div class="search-item-info">
            <div class="search-item-title">${escapeHtml(p.name)}</div>
            <div class="search-item-price">${formatMoney(p.price)}</div>
          </div>
          <i class="fa-solid fa-arrow-right" style="color: var(--text-dim); font-size: 0.8rem;"></i>
        </div>
      `).join('')}
    `;

    dropdown.querySelectorAll('.search-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        openQuickViewModal(id);
        dropdown.classList.remove('active');
      });
    });
  }
  dropdown.classList.add('active');
}

function setupFilterEvents() {
  // Sort Dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentFilters.sortBy = e.target.value;
      renderProducts();
    });
  }

  // Only Discount Toggle
  const discountToggle = document.getElementById('filter-discount-toggle');
  if (discountToggle) {
    discountToggle.addEventListener('change', (e) => {
      window.setDiscountTab(e.target.checked);
    });
  }

  // In Stock Toggle
  const stockToggle = document.getElementById('filter-stock-toggle');
  if (stockToggle) {
    stockToggle.addEventListener('change', (e) => {
      currentFilters.inStockOnly = e.target.checked;
      renderProducts();
    });
  }

  // Rating filter buttons
  document.querySelectorAll('.rating-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = Number(btn.dataset.rating) || 0;
      currentFilters.rating = currentFilters.rating === r ? 0 : r;
      document.querySelectorAll('.rating-filter-btn').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.rating) === currentFilters.rating);
      });
      renderProducts();
    });
  });

  // Reset Filters Button
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }
}

function resetAllFilters() {
  currentFilters = {
    query: "",
    category: "all",
    brand: "all",
    minPrice: 0,
    maxPrice: 20000000,
    rating: 0,
    onlyDiscount: true,
    inStockOnly: false,
    sortBy: "popular"
  };

  const searchInput = document.getElementById('global-search-input');
  if (searchInput) searchInput.value = '';

  const discountToggle = document.getElementById('filter-discount-toggle');
  if (discountToggle) discountToggle.checked = true;

  const tabDiscount = document.getElementById('tab-discount-only');
  const tabAll = document.getElementById('tab-all-products');
  if (tabDiscount) tabDiscount.classList.add('active');
  if (tabAll) tabAll.classList.remove('active');

  const titleEl = document.getElementById('store-section-title');
  const subEl = document.getElementById('store-section-subtitle');
  if (titleEl) titleEl.textContent = "🔥 Skidkadagi Mahsulotlar";
  if (subEl) subEl.textContent = "Eng yuqori chegirmalar va arzon narxlardagi tovarlar";

  const stockToggle = document.getElementById('filter-stock-toggle');
  if (stockToggle) stockToggle.checked = false;

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'popular';

  document.querySelectorAll('.rating-filter-btn').forEach(b => b.classList.remove('active'));

  renderCategories();
  renderBrandFilters();
  setupPriceFilter();
  renderProducts();
  notify.info("Filtrlar tozalandi (Chegirmalar faol)");
}

/* ============================================================
   RENDER PRODUCTS GRID
   ============================================================ */
function renderProducts() {
  const container = document.getElementById('products-grid');
  const countLabel = document.getElementById('products-count-label');
  const activeChipsContainer = document.getElementById('active-filters-chips');

  if (!container) return;

  const filteredProducts = db.filterProducts(currentFilters);

  if (countLabel) {
    countLabel.innerHTML = `<strong>${filteredProducts.length}</strong> ta mahsulot topildi`;
  }

  // Render active chips
  renderActiveFilterChips(activeChipsContainer);

  // Check if store database is completely empty
  const allStoreProducts = db.getProducts();
  if (allStoreProducts.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 20px;">
        <div class="empty-icon" style="font-size: 3rem; color: var(--primary); margin-bottom: 12px;"><i class="fa-solid fa-store"></i></div>
        <div class="empty-title" style="font-size: 1.3rem;">Do'kon hozircha bo'sh</div>
        <div class="empty-desc" style="max-width: 480px; margin: 0 auto 20px auto;">Do'konga hali yangi mahsulotlar kiritilmagan. Administrator panelidan tovarlar qo'shishingiz yoki bir bosishda namunaviy tovarlar to'plamini yuklashingiz mumkin.</div>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a href="admin.html" class="btn-primary"><i class="fa-solid fa-shield-halved"></i> Admin panelga o'tish</a>
          <button class="btn-secondary" onclick="loadSampleProductsToStorefront()"><i class="fa-solid fa-cloud-arrow-down"></i> Demo tovarlarni yuklash</button>
        </div>
      </div>
    `;
    return;
  }

  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-box-open"></i></div>
        <div class="empty-title">Mahsulotlar topilmadi</div>
        <div class="empty-desc">Tanlangan parametrlar bo'yicha hech qanday mahsulot mavjud emas. Filtrlarni o'zgartirib qayta urinib ko'ring.</div>
        <button class="btn-primary" onclick="resetAllFilters()">
          <i class="fa-solid fa-rotate-left"></i> Filtrlarni tozalash
        </button>
      </div>
    `;
    return;
  }

  const wishlist = db.getWishlist();

  container.innerHTML = filteredProducts.map(p => {
    const isWishlisted = wishlist.includes(p.id);
    const discountBadge = p.discount ? `<span class="badge badge-discount">-${p.discount}%</span>` : '';
    const newBadge = p.isNew ? `<span class="badge badge-new">Yangi</span>` : '';
    const popularBadge = p.isPopular ? `<span class="badge badge-popular">Trend</span>` : '';

    return `
      <div class="product-card animate-fade-in" data-id="${p.id}">
        <div class="product-card-img-wrapper">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" class="product-card-img" loading="lazy" onerror="this.src='https://placehold.co/400x300?text=MegaStore'">
          
          <div class="product-badges">
            ${discountBadge}
            ${newBadge}
            ${popularBadge}
          </div>

          <div class="product-card-actions">
            <button class="card-action-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${p.id}')" title="Sevimlilarga qo'shish">
              <i class="fa-solid fa-heart"></i>
            </button>
            <button class="card-action-btn" onclick="openQuickViewModal('${p.id}')" title="Tezkor ko'rish">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </div>

        <div class="product-card-content">
          <div class="product-category-brand">
            <span class="product-brand">${escapeHtml(p.brand || 'Original')}</span>
            <span>${p.stock > 0 ? `<span style="color: var(--success);"><i class="fa-solid fa-check"></i> Omborda bor</span>` : `<span style="color: var(--danger);">Tugagan</span>`}</span>
          </div>

          <h3 class="product-title" onclick="openQuickViewModal('${p.id}')">${escapeHtml(p.name)}</h3>

          <div class="product-rating-row">
            <div class="rating-stars">${renderStars(p.rating || 5)}</div>
            <span class="rating-count">(${p.reviewsCount || 1})</span>
          </div>

          <div class="product-card-bottom">
            <div class="product-price-box">
              ${p.oldPrice && p.oldPrice > p.price ? `<span class="product-old-price">${formatMoney(p.oldPrice)}</span>` : ''}
              <span class="product-price">${formatMoney(p.price)}</span>
            </div>

            <button class="add-to-cart-btn" onclick="addToCart('${p.id}')">
              <i class="fa-solid fa-cart-shopping"></i>
              <span>Savatga</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderActiveFilterChips(container) {
  if (!container) return;

  const chips = [];

  if (currentFilters.query) {
    chips.push({ label: `Qidiruv: "${currentFilters.query}"`, key: 'query' });
  }
  if (currentFilters.category !== 'all') {
    const categories = db.getCategories();
    const c = categories.find(cat => cat.id === currentFilters.category);
    if (c) chips.push({ label: `Toifa: ${c.name}`, key: 'category' });
  }
  if (currentFilters.brand !== 'all') {
    chips.push({ label: `Brend: ${currentFilters.brand}`, key: 'brand' });
  }
  if (currentFilters.minPrice > 0 || currentFilters.maxPrice < 20000000) {
    chips.push({ label: `Narx: ${formatMoney(currentFilters.minPrice)} - ${formatMoney(currentFilters.maxPrice)}`, key: 'price' });
  }
  if (currentFilters.rating > 0) {
    chips.push({ label: `Reyting: ${currentFilters.rating}+ ⭐`, key: 'rating' });
  }
  if (currentFilters.onlyDiscount) {
    chips.push({ label: `Faqat chegirmalar`, key: 'discount' });
  }
  if (currentFilters.inStockOnly) {
    chips.push({ label: `Faqat mavjud tovarlar`, key: 'stock' });
  }

  if (chips.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = chips.map(chip => `
    <div class="filter-chip">
      <span>${chip.label}</span>
      <i class="fa-solid fa-xmark filter-chip-remove" onclick="removeFilterChip('${chip.key}')"></i>
    </div>
  `).join('');
}

window.removeFilterChip = function(key) {
  if (key === 'query') {
    currentFilters.query = '';
    const s = document.getElementById('global-search-input');
    if (s) s.value = '';
  } else if (key === 'category') {
    setCategoryFilter('all');
    return;
  } else if (key === 'brand') {
    currentFilters.brand = 'all';
    renderBrandFilters();
  } else if (key === 'price') {
    currentFilters.minPrice = 0;
    currentFilters.maxPrice = 20000000;
    setupPriceFilter();
  } else if (key === 'rating') {
    currentFilters.rating = 0;
    document.querySelectorAll('.rating-filter-btn').forEach(b => b.classList.remove('active'));
  } else if (key === 'discount') {
    currentFilters.onlyDiscount = false;
    const d = document.getElementById('filter-discount-toggle');
    if (d) d.checked = false;
  } else if (key === 'stock') {
    currentFilters.inStockOnly = false;
    const st = document.getElementById('filter-stock-toggle');
    if (st) st.checked = false;
  }
  renderProducts();
};

/* ============================================================
   CART & WISHLIST ENGINE
   ============================================================ */
window.addToCart = function(productId, quantity = 1) {
  const product = db.getProductById(productId);
  if (!product) return;

  const cart = db.getCart();
  const existingIndex = cart.findIndex(it => it.id === productId);

  if (existingIndex !== -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity
    });
  }

  db.saveCart(cart);
  updateCartBadge();
  renderCartDrawer();
  notify.playChime('cart');
  notify.success(`"${product.name}" savatga qo'shildi!`, "Savatga joylandi");
};

window.updateCartQty = function(productId, delta) {
  let cart = db.getCart();
  const item = cart.find(it => it.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(it => it.id !== productId);
  }

  db.saveCart(cart);
  updateCartBadge();
  renderCartDrawer();
};

window.removeFromCart = function(productId) {
  let cart = db.getCart();
  cart = cart.filter(it => it.id !== productId);
  db.saveCart(cart);
  updateCartBadge();
  renderCartDrawer();
  notify.info("Mahsulot savatdan olib tashlandi");
};

function updateCartBadge() {
  const cart = db.getCart();
  const totalCount = cart.reduce((sum, it) => sum + it.quantity, 0);
  const badge = document.getElementById('cart-badge-count');
  if (badge) {
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
    badge.classList.remove('animate-badge-pop');
    void badge.offsetWidth; // trigger reflow
    badge.classList.add('animate-badge-pop');
  }
}

function renderCartDrawer() {
  const container = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal');
  const discountEl = document.getElementById('cart-discount');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('cart-checkout-btn');

  if (!container) return;

  const cart = db.getCart();
  const settings = db.getSettings();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px 10px;">
        <div class="empty-icon"><i class="fa-solid fa-cart-shopping"></i></div>
        <div class="empty-title">Savatingiz bo'sh</div>
        <div class="empty-desc">Siz hali hech narsa tanlamadingiz. Xarid qilishni boshlang!</div>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = "0 so'm";
    if (discountEl) discountEl.textContent = "0 so'm";
    if (shippingEl) shippingEl.textContent = "0 so'm";
    if (totalEl) totalEl.textContent = "0 so'm";
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = false;

  const subtotal = cart.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  
  // Calculate discount if promo applied
  let discountAmount = 0;
  if (currentPromo) {
    const promoRes = db.validatePromo(currentPromo.code, subtotal);
    if (promoRes.valid) {
      discountAmount = promoRes.discountAmount;
    } else {
      currentPromo = null;
    }
  }

  const freeThreshold = settings.freeShippingThreshold || 500000;
  const shippingCost = subtotal >= freeThreshold ? 0 : (settings.standardShippingCost || 25000);
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  container.innerHTML = cart.map(it => `
    <div class="cart-item">
      <img src="${it.image}" alt="${escapeHtml(it.name)}" class="cart-item-img" onerror="this.src='https://placehold.co/80x80?text=MegaStore'">
      <div class="cart-item-info">
        <div class="cart-item-title">${escapeHtml(it.name)}</div>
        <div class="cart-item-price">${formatMoney(it.price)}</div>
        <div class="cart-qty-controls">
          <button class="qty-btn" onclick="updateCartQty('${it.id}', -1)">-</button>
          <span class="qty-number">${it.quantity}</span>
          <button class="qty-btn" onclick="updateCartQty('${it.id}', 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${it.id}')" title="O'chirish">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join('');

  if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
  if (discountEl) discountEl.textContent = discountAmount > 0 ? `-${formatMoney(discountAmount)}` : "0 so'm";
  if (shippingEl) shippingEl.textContent = shippingCost === 0 ? "Bepul 🎁" : formatMoney(shippingCost);
  if (totalEl) totalEl.textContent = formatMoney(total);
}

function setupCartDrawer() {
  const cartBtn = document.getElementById('header-cart-btn');
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const closeBtn = document.getElementById('cart-drawer-close');
  const promoInput = document.getElementById('cart-promo-input');
  const promoApplyBtn = document.getElementById('cart-promo-apply');
  const checkoutBtn = document.getElementById('cart-checkout-btn');

  if (cartBtn && drawer && overlay) {
    cartBtn.addEventListener('click', () => {
      renderCartDrawer();
      drawer.classList.add('active');
      overlay.classList.add('active');
    });

    const closeCart = () => {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);
  }

  if (promoApplyBtn && promoInput) {
    promoApplyBtn.addEventListener('click', () => {
      const code = promoInput.value.trim();
      const cart = db.getCart();
      const subtotal = cart.reduce((sum, it) => sum + (it.price * it.quantity), 0);
      const res = db.validatePromo(code, subtotal);

      if (res.valid) {
        currentPromo = res.promo;
        notify.success(res.message);
        renderCartDrawer();
      } else {
        notify.error(res.message);
      }
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const drawer = document.getElementById('cart-drawer');
      const overlay = document.getElementById('drawer-overlay');
      if (drawer) drawer.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      openCheckoutModal();
    });
  }
}

/* ============================================================
   WISHLIST ENGINE
   ============================================================ */
window.toggleWishlist = function(productId) {
  let wishlist = db.getWishlist();
  const index = wishlist.indexOf(productId);
  const product = db.getProductById(productId);

  if (index !== -1) {
    wishlist.splice(index, 1);
    notify.info(`"${product ? product.name : ''}" sevimlilardan olib tashlandi`);
  } else {
    wishlist.push(productId);
    notify.success(`"${product ? product.name : ''}" sevimlilar ro'yxatiga qo'shildi!`);
  }

  db.saveWishlist(wishlist);
  updateWishlistBadge();
  renderProducts();
  renderWishlistDrawer();
};

function updateWishlistBadge() {
  const wishlist = db.getWishlist();
  const badge = document.getElementById('wishlist-badge-count');
  if (badge) {
    badge.textContent = wishlist.length;
    badge.style.display = wishlist.length > 0 ? 'flex' : 'none';
  }
}

function renderWishlistDrawer() {
  const container = document.getElementById('wishlist-items-container');
  if (!container) return;

  const wishlist = db.getWishlist();
  if (wishlist.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px 10px;">
        <div class="empty-icon"><i class="fa-solid fa-heart-crack"></i></div>
        <div class="empty-title">Sevimlilar bo'sh</div>
        <div class="empty-desc">Sizga yoqqan mahsulotlarni keyinroq sotib olish uchun saqlab qo'ying.</div>
      </div>
    `;
    return;
  }

  const products = wishlist.map(id => db.getProductById(id)).filter(Boolean);

  container.innerHTML = products.map(p => `
    <div class="cart-item">
      <img src="${p.image}" alt="${escapeHtml(p.name)}" class="cart-item-img">
      <div class="cart-item-info">
        <div class="cart-item-title">${escapeHtml(p.name)}</div>
        <div class="cart-item-price">${formatMoney(p.price)}</div>
        <button class="btn-primary" style="padding: 6px 12px; font-size: 0.75rem; margin-top: 4px;" onclick="addToCart('${p.id}'); toggleWishlist('${p.id}');">
          <i class="fa-solid fa-cart-plus"></i> Savatga olish
        </button>
      </div>
      <button class="cart-item-remove" onclick="toggleWishlist('${p.id}')" title="O'chirish">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join('');
}

function setupWishlistDrawer() {
  const wishlistBtn = document.getElementById('header-wishlist-btn');
  const drawer = document.getElementById('wishlist-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const closeBtn = document.getElementById('wishlist-drawer-close');

  if (wishlistBtn && drawer && overlay) {
    wishlistBtn.addEventListener('click', () => {
      renderWishlistDrawer();
      drawer.classList.add('active');
      overlay.classList.add('active');
    });

    const closeWishlist = () => {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeWishlist);
    overlay.addEventListener('click', closeWishlist);
  }
}

window.loadSampleProductsToStorefront = function() {
  db.loadSampleProducts();
  notify.success("Namunaviy mahsulotlar yuklandi!", "Do'kon to'ldirildi 🎉");
  renderCategories();
  renderBrandFilters();
  setupPriceFilter();
  renderProducts();
};

/* ============================================================
   MODALS: QUICK VIEW, CHECKOUT, TRACKING, RECEIPT
   ============================================================ */
function setupModals() {
  // Global modal closer on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });

  // Track Order Button
  const trackOrderNavBtn = document.getElementById('nav-track-order-btn');
  if (trackOrderNavBtn) {
    trackOrderNavBtn.addEventListener('click', () => {
      openModal('order-tracking-modal');
    });
  }

  const trackForm = document.getElementById('order-tracking-form');
  if (trackForm) {
    trackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('tracking-order-input');
      if (input) {
        lookupOrderTracking(input.value.trim());
      }
    });
  }

  // Checkout Form Submission
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  // Seller Application Form Submission
  const sellerForm = document.getElementById('seller-application-form');
  if (sellerForm) {
    sellerForm.addEventListener('submit', handleSellerSubmit);
  }
}

window.openSellerModal = function() {
  openModal('seller-modal');
};

async function handleSellerSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('seller-name').value.trim();
  const phone = document.getElementById('seller-phone').value.trim();
  const shopName = document.getElementById('seller-shop').value.trim();
  const category = document.getElementById('seller-category').value;
  const city = document.getElementById('seller-city').value.trim();
  const comment = document.getElementById('seller-comment').value.trim();

  if (!name || !phone || !city) {
    notify.warning("Iltimos, barcha majburiy maydonlarni to'ldiring!");
    return;
  }

  const sellerData = { name, phone, shop: shopName, shopName, category, city, comment };
  db.saveSellerApplication(sellerData);
  const settings = db.getSettings();

  notify.info("Arizangiz Telegram botga yuborilmoqda...");

  const res = await notify.sendTelegramSellerApplication(sellerData, settings);

  closeModal('seller-modal');
  notify.playChime('order');

  if (res.success) {
    notify.success("Arizangiz Telegram botga yuborildi! Tez orada siz bilan bog'lanamiz.", "Arizangiz qabul qilindi! 🎉");
  } else {
    notify.success("Arizangiz qabul qilindi! Tez orada mutaxassislarimiz siz bilan bog'lanishadi.", "Rahmat!");
    if (res.reason === "Chat ID belgilanmagan") {
      notify.info("Telegram botga xabarlar kelishi uchun @universalmegastore_bot ga kirib /start bosing.", "Telegram Bot eslatmasi");
    }
  }

  const form = document.getElementById('seller-application-form');
  if (form) form.reset();
}

window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.closeAllModals = function() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  document.querySelectorAll('.drawer').forEach(d => d.classList.remove('active'));
  const drawerOverlay = document.getElementById('drawer-overlay');
  if (drawerOverlay) drawerOverlay.classList.remove('active');
  document.body.style.overflow = '';
};

/* Quick View Modal */
window.openQuickViewModal = function(productId) {
  const product = db.getProductById(productId);
  if (!product) return;

  const modalBody = document.getElementById('quickview-modal-body');
  if (!modalBody) return;

  const images = product.images && product.images.length ? product.images : [product.image];
  const specsRows = product.specs ? Object.entries(product.specs).map(([k, v]) => `
    <tr>
      <td>${escapeHtml(k)}</td>
      <td>${escapeHtml(v)}</td>
    </tr>
  `).join('') : '';

  modalBody.innerHTML = `
    <div class="quickview-grid">
      <div class="quickview-gallery">
        <img src="${images[0]}" alt="${escapeHtml(product.name)}" class="quickview-main-img" id="quickview-active-img">
        ${images.length > 1 ? `
          <div class="quickview-thumbs">
            ${images.map((img, idx) => `
              <img src="${img}" alt="thumbnail" class="quickview-thumb ${idx === 0 ? 'active' : ''}" onclick="changeQuickViewImg('${img}', this)">
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="quickview-details">
        <div class="product-category-brand" style="margin-bottom: 8px;">
          <span class="product-brand" style="font-size: 0.9rem;">${escapeHtml(product.brand || 'MegaStore')}</span>
          <span class="badge ${product.stock > 0 ? 'badge-new' : 'badge-discount'}">${product.stock > 0 ? `Omborda: ${product.stock} dona` : 'Mavjud emas'}</span>
        </div>

        <h2 class="quickview-title">${escapeHtml(product.name)}</h2>

        <div class="product-rating-row" style="margin-bottom: 16px;">
          <div class="rating-stars">${renderStars(product.rating || 5)}</div>
          <span class="rating-count">${product.rating || 5.0} (${product.reviewsCount || 1} ta sharh)</span>
        </div>

        <div class="product-price-box" style="margin-bottom: 16px;">
          ${product.oldPrice && product.oldPrice > product.price ? `<span class="product-old-price">${formatMoney(product.oldPrice)}</span>` : ''}
          <span class="product-price" style="font-size: 1.6rem; color: var(--primary);">${formatMoney(product.price)}</span>
        </div>

        <p class="quickview-desc">${escapeHtml(product.description || "Yuqori sifatli va kafolatlangan universal mahsulot.")}</p>

        ${specsRows ? `
          <h4 style="font-size: 0.9rem; margin-bottom: 8px;">Xususiyatlari:</h4>
          <table class="specs-table">
            <tbody>${specsRows}</tbody>
          </table>
        ` : ''}

        <div style="display: flex; gap: 12px; margin-top: auto;">
          <button class="btn-primary" style="flex: 1; padding: 14px; font-size: 0.95rem;" onclick="addToCart('${product.id}'); closeModal('quickview-modal');">
            <i class="fa-solid fa-cart-shopping"></i> Savatga qo'shish
          </button>
          <button class="btn-secondary" style="padding: 14px 18px;" onclick="toggleWishlist('${product.id}')" title="Sevimlilarga qo'shish">
            <i class="fa-solid fa-heart"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  openModal('quickview-modal');
};

window.changeQuickViewImg = function(imgSrc, thumbEl) {
  const activeImg = document.getElementById('quickview-active-img');
  if (activeImg) activeImg.src = imgSrc;
  document.querySelectorAll('.quickview-thumb').forEach(t => t.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
};

/* Checkout Flow */
function openCheckoutModal() {
  const cart = db.getCart();
  if (cart.length === 0) {
    notify.warning("Savat bo'sh! Iltimos, oldin mahsulot tanlang.");
    return;
  }

  const subtotal = cart.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const settings = db.getSettings();
  const freeThreshold = settings.freeShippingThreshold || 500000;
  const shippingCost = subtotal >= freeThreshold ? 0 : (settings.standardShippingCost || 25000);
  
  let discountAmount = 0;
  if (currentPromo) {
    const pRes = db.validatePromo(currentPromo.code, subtotal);
    if (pRes.valid) discountAmount = pRes.discountAmount;
  }

  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  const summaryEl = document.getElementById('checkout-summary-details');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div style="background: var(--bg-main); padding: 14px; border-radius: var(--radius-md); margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
          <span>Mahsulotlar (${cart.length} xil):</span>
          <strong>${formatMoney(subtotal)}</strong>
        </div>
        ${discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--success); margin-bottom: 6px;">
            <span>Chegirma (${currentPromo.code}):</span>
            <strong>-${formatMoney(discountAmount)}</strong>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
          <span>Yetkazib berish:</span>
          <strong>${shippingCost === 0 ? 'Bepul' : formatMoney(shippingCost)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 800; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
          <span>Jami to'lov:</span>
          <span style="color: var(--primary);">${formatMoney(total)}</span>
        </div>
      </div>
    `;
  }

  openModal('checkout-modal');
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('checkout-name').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const city = document.getElementById('checkout-city').value;
  const address = document.getElementById('checkout-address').value.trim();
  const notes = document.getElementById('checkout-notes').value.trim();
  const deliveryType = document.querySelector('input[name="checkout-delivery"]:checked')?.value || 'standard';
  const paymentMethod = document.querySelector('input[name="checkout-payment"]:checked')?.value || 'Naqd pul';

  if (!name || !phone || !address) {
    notify.warning("Iltimos, barcha majburiy maydonlarni to'ldiring!");
    return;
  }

  const cart = db.getCart();
  const settings = db.getSettings();
  const subtotal = cart.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  
  let discountAmount = 0;
  let promoCode = null;
  if (currentPromo) {
    const pRes = db.validatePromo(currentPromo.code, subtotal);
    if (pRes.valid) {
      discountAmount = pRes.discountAmount;
      promoCode = currentPromo.code;
    }
  }

  const freeThreshold = settings.freeShippingThreshold || 500000;
  let shippingCost = subtotal >= freeThreshold ? 0 : (settings.standardShippingCost || 25000);
  if (deliveryType === 'express') {
    shippingCost = (settings.expressShippingCost || 50000);
  }

  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost);

  const orderData = {
    customer: { name, phone, city, address, notes },
    items: cart,
    subtotal,
    discountAmount,
    promoCode,
    shippingCost,
    totalAmount,
    paymentMethod,
    deliveryType
  };

  const newOrder = db.createOrder(orderData);

  // Clear cart and promo
  db.saveCart([]);
  currentPromo = null;
  updateCartBadge();

  closeModal('checkout-modal');
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) checkoutForm.reset();
  notify.playChime('order');

  // Try telegram notification
  notify.sendTelegramOrderNotification(newOrder, settings);

  // Show receipt modal
  showOrderReceipt(newOrder);
}

function showOrderReceipt(order) {
  const modalBody = document.getElementById('order-receipt-body');
  if (!modalBody) return;

  const itemsHtml = order.items.map(it => `
    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 6px 0; border-bottom: 1px dashed var(--border-color);">
      <span>${escapeHtml(it.name)} x ${it.quantity}</span>
      <strong>${formatMoney(it.price * it.quantity)}</strong>
    </div>
  `).join('');

  modalBody.innerHTML = `
    <div class="receipt-container">
      <div class="receipt-success-icon"><i class="fa-solid fa-check"></i></div>
      <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 4px;">Buyurtmangiz qabul qilindi!</h2>
      <p style="color: var(--text-muted); font-size: 0.85rem;">Tez orada operatorlarimiz siz bilan bog'lanishadi.</p>
      
      <div class="receipt-order-id">BUYURTMA KODI: #${order.id}</div>

      <div class="receipt-box">
        <div style="margin-bottom: 12px; font-weight: 700; color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Xarid tafsilotlari:</div>
        ${itemsHtml}
        
        <div style="margin-top: 12px; display: flex; justify-content: space-between; font-size: 0.85rem;">
          <span>Yetkazib berish:</span>
          <span>${order.shippingCost === 0 ? 'Bepul' : formatMoney(order.shippingCost)}</span>
        </div>
        ${order.discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--success);">
            <span>Chegirma:</span>
            <span>-${formatMoney(order.discountAmount)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800; margin-top: 10px; padding-top: 8px; border-top: 2px solid var(--border-color);">
          <span>Jami:</span>
          <span style="color: var(--primary);">${formatMoney(order.totalAmount)}</span>
        </div>
        <div style="margin-top: 14px; font-size: 0.8rem; color: var(--text-muted);">
          <div>📍 Manzil: ${escapeHtml(order.customer.city)}, ${escapeHtml(order.customer.address)}</div>
          <div>💳 To'lov turi: ${escapeHtml(order.paymentMethod)}</div>
        </div>
      </div>

      <div style="display: flex; gap: 12px; justify-content: center;">
        <button class="btn-primary" onclick="closeModal('order-receipt-modal');"><i class="fa-solid fa-bag-shopping"></i> Xaridni davom ettirish</button>
        <button class="btn-secondary" onclick="printOrderReceipt('${order.id}');"><i class="fa-solid fa-print"></i> Chekni chop etish</button>
      </div>
    </div>
  `;

  openModal('order-receipt-modal');
}

/* Order Tracking */
function lookupOrderTracking(orderId) {
  const resultContainer = document.getElementById('tracking-result');
  if (!resultContainer) return;

  if (!orderId) {
    notify.warning("Iltimos, buyurtma kodini kiriting!");
    return;
  }

  const order = db.getOrderById(orderId);
  if (!order) {
    resultContainer.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <div class="empty-icon" style="font-size: 2rem;"><i class="fa-solid fa-circle-question"></i></div>
        <div class="empty-title" style="font-size: 1.1rem;">Buyurtma topilmadi</div>
        <div class="empty-desc">"#${escapeHtml(orderId)}" kodi bo'yicha hech qanday buyurtma topilmadi. Kodni to'g'ri kiritganingizni tekshiring.</div>
      </div>
    `;
    return;
  }

  const statuses = ['pending', 'processing', 'shipping', 'completed'];
  const statusLabels = {
    pending: 'Qabul qilindi',
    processing: 'Yig\'ilmoqda',
    shipping: 'Yetkazilmoqda',
    completed: 'Topshirildi'
  };

  const currentIndex = statuses.indexOf(order.status);

  const timelineHtml = `
    <div class="tracking-timeline">
      <div class="timeline-step ${currentIndex >= 0 ? 'active' : ''}">
        <div class="timeline-step-icon"><i class="fa-solid fa-file-lines"></i></div>
        <div class="timeline-step-label">Qabul qilindi</div>
      </div>
      <div class="timeline-step ${currentIndex >= 1 ? 'active' : ''}">
        <div class="timeline-step-icon"><i class="fa-solid fa-box-open"></i></div>
        <div class="timeline-step-label">Tayyorlanmoqda</div>
      </div>
      <div class="timeline-step ${currentIndex >= 2 ? 'active' : ''}">
        <div class="timeline-step-icon"><i class="fa-solid fa-truck-fast"></i></div>
        <div class="timeline-step-label">Yo'lda</div>
      </div>
      <div class="timeline-step ${currentIndex >= 3 ? 'active' : ''}">
        <div class="timeline-step-icon"><i class="fa-solid fa-house-circle-check"></i></div>
        <div class="timeline-step-label">Yetkazildi</div>
      </div>
    </div>
  `;

  const historyHtml = order.statusHistory ? order.statusHistory.map(h => `
    <div style="display: flex; gap: 12px; margin-bottom: 12px; font-size: 0.85rem;">
      <i class="fa-solid fa-circle-dot" style="color: var(--primary); margin-top: 4px;"></i>
      <div>
        <div style="font-weight: 700;">${escapeHtml(h.note || statusLabels[h.status] || h.status)}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim);">${new Date(h.time).toLocaleString('uz-UZ')}</div>
      </div>
    </div>
  `).join('') : '';

  resultContainer.innerHTML = `
    <div style="margin-top: 20px; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Buyurtma holati:</div>
          <h3 style="font-size: 1.15rem; font-weight: 800;">#${order.id}</h3>
        </div>
        <span class="status-pill status-${order.status}">${statusLabels[order.status] || order.status}</span>
      </div>

      ${timelineHtml}

      <div style="margin-top: 20px;">
        <h4 style="font-size: 0.9rem; margin-bottom: 10px;">Harakatlar tarixi:</h4>
        ${historyHtml}
      </div>

      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          Jami to'lov: <strong style="color: var(--text-main);">${formatMoney(order.totalAmount)}</strong>
        </div>
        <button class="btn-secondary" onclick="printOrderReceipt('${order.id}')" style="padding: 8px 16px; font-size: 0.85rem;">
          <i class="fa-solid fa-print"></i> Chekni chop etish
        </button>
      </div>
    </div>
  `;
}

/* ============================================================
   HELPERS
   ============================================================ */
function formatMoney(amount) {
  if (isNaN(amount)) return "0 so'm";
  return Number(amount).toLocaleString('uz-UZ') + " so'm";
}

function renderStars(rating) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fa-solid fa-star"></i>';
  }
  if (hasHalf) {
    stars += '<i class="fa-solid fa-star-half-stroke"></i>';
  }
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="fa-regular fa-star"></i>';
  }
  return stars;
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
