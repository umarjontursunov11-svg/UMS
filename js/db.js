/**
 * Universal E-Magazin Database Manager
 * Ma'lumotlarni boshqarish, saqlash, qidirish va filtrlash tizimi.
 */

const STORAGE_KEYS = {
  PRODUCTS: 'megastore_products_v1',
  CATEGORIES: 'megastore_categories_v1',
  ORDERS: 'megastore_orders_v1',
  PROMOS: 'megastore_promos_v1',
  SETTINGS: 'megastore_settings_v1',
  CART: 'megastore_cart_v1',
  WISHLIST: 'megastore_wishlist_v1',
  THEME: 'megastore_theme_v1'
};

class StoreDB {
  constructor() {
    this.initDatabase();
  }

  initDatabase() {
    // Initial data seeding
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      if (typeof initialProducts !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
      } else {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      if (typeof initialCategories !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
      } else {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([]));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.PROMOS)) {
      if (typeof initialPromoCodes !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PROMOS, JSON.stringify(initialPromoCodes));
      } else {
        localStorage.setItem(STORAGE_KEYS.PROMOS, JSON.stringify([]));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      if (typeof initialStoreSettings !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialStoreSettings));
      } else {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({}));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
  }

  loadSampleProducts() {
    if (typeof sampleDemoProducts !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(sampleDemoProducts));
      return sampleDemoProducts;
    }
    return [];
  }

  clearAllProducts() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
  }

  clearAllOrders() {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  }

  /* ====================== PRODUCTS CRUD & SEARCH ====================== */
  getProducts() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  saveProduct(productData) {
    const products = this.getProducts();
    if (productData.id) {
      // Update existing
      const index = products.findIndex(p => p.id === productData.id);
      if (index !== -1) {
        products[index] = { ...products[index], ...productData };
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        return products[index];
      }
    }
    // Create new
    const newProduct = {
      id: "prod-" + Date.now().toString(36),
      name: productData.name,
      category: productData.category || "electronics",
      brand: productData.brand || "Boshqa",
      price: Number(productData.price) || 0,
      oldPrice: Number(productData.oldPrice) || (Number(productData.price) * 1.15),
      discount: productData.discount ? Number(productData.discount) : (productData.oldPrice ? Math.round(((productData.oldPrice - productData.price) / productData.oldPrice) * 100) : 0),
      rating: Number(productData.rating) || 5.0,
      reviewsCount: Number(productData.reviewsCount) || 1,
      stock: Number(productData.stock) || 10,
      isPopular: !!productData.isPopular,
      isNew: productData.isNew !== undefined ? !!productData.isNew : true,
      isFeatured: !!productData.isFeatured,
      image: productData.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
      images: productData.images || [productData.image],
      description: productData.description || "",
      tags: productData.tags || [productData.name.toLowerCase(), productData.category],
      specs: productData.specs || {}
    };
    products.unshift(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return newProduct;
  }

  deleteProduct(id) {
    let products = this.getProducts();
    products = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return true;
  }

  /**
   * Universal Smart Search & Multi-filter Engine
   */
  filterProducts({
    query = "",
    category = "all",
    brand = "all",
    minPrice = 0,
    maxPrice = Infinity,
    rating = 0,
    onlyDiscount = false,
    inStockOnly = false,
    sortBy = "popular" // popular, price-asc, price-desc, new, rating
  }) {
    let products = this.getProducts();

    // 1. Search Query Filter (Checks name, description, brand, category, tags)
    if (query && query.trim() !== "") {
      const q = query.trim().toLowerCase();
      products = products.filter(p => {
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
        const matchBrand = p.brand ? p.brand.toLowerCase().includes(q) : false;
        const matchCategory = p.category ? p.category.toLowerCase().includes(q) : false;
        const matchTags = p.tags && Array.isArray(p.tags) ? p.tags.some(t => t.toLowerCase().includes(q)) : false;
        return matchName || matchDesc || matchBrand || matchCategory || matchTags;
      });
    }

    // 2. Category Filter
    if (category && category !== "all") {
      products = products.filter(p => p.category === category);
    }

    // 3. Brand Filter
    if (brand && brand !== "all") {
      products = products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
    }

    // 4. Price Range Filter
    products = products.filter(p => p.price >= minPrice && p.price <= maxPrice);

    // 5. Rating Filter
    if (rating > 0) {
      products = products.filter(p => (p.rating || 0) >= rating);
    }

    // 6. Only Discount Filter
    if (onlyDiscount) {
      products = products.filter(p => p.discount > 0 || (p.oldPrice && p.oldPrice > p.price));
    }

    // 7. In Stock Filter
    if (inStockOnly) {
      products = products.filter(p => (p.stock || 0) > 0);
    }

    // 8. Sorting
    switch (sortBy) {
      case "price-asc":
        products.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        products.sort((a, b) => b.price - a.price);
        break;
      case "new":
        products.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "rating":
        products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "discount":
        products.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      case "popular":
      default:
        products.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0) || (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
    }

    return products;
  }

  getDistinctBrands() {
    const products = this.getProducts();
    const brands = new Set();
    products.forEach(p => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }

  getPriceRange() {
    const products = this.getProducts();
    if (!products.length) return { min: 0, max: 20000000 };
    const prices = products.map(p => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }

  /* ====================== CATEGORIES ====================== */
  getCategories() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    } catch (e) {
      return [];
    }
  }

  saveCategory(category) {
    const categories = this.getCategories();
    if (categories.find(c => c.id === category.id)) {
      const idx = categories.findIndex(c => c.id === category.id);
      categories[idx] = category;
    } else {
      categories.push(category);
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return category;
  }

  deleteCategory(id) {
    let categories = this.getCategories();
    categories = categories.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return true;
  }

  /* ====================== ORDERS CRUD & STATUS ====================== */
  getOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    } catch (e) {
      return [];
    }
  }

  getOrderById(id) {
    const orders = this.getOrders();
    const cleanId = id.trim().toUpperCase().replace('#', '');
    return orders.find(o => o.id.toUpperCase().replace('#', '') === cleanId) || null;
  }

  createOrder(orderData) {
    const orders = this.getOrders();
    const orderId = "ORD-" + Math.floor(10000 + Math.random() * 90000);
    const now = new Date().toISOString();

    const newOrder = {
      id: orderId,
      date: now,
      customer: {
        name: orderData.customer.name,
        phone: orderData.customer.phone,
        address: orderData.customer.address,
        city: orderData.customer.city || "Toshkent",
        notes: orderData.customer.notes || ""
      },
      items: orderData.items || [],
      subtotal: Number(orderData.subtotal) || 0,
      discountAmount: Number(orderData.discountAmount) || 0,
      promoCode: orderData.promoCode || null,
      shippingCost: Number(orderData.shippingCost) || 0,
      totalAmount: Number(orderData.totalAmount) || 0,
      paymentMethod: orderData.paymentMethod || "Naqd pul",
      deliveryType: orderData.deliveryType || "standard",
      status: "pending",
      statusHistory: [
        { status: "pending", time: now, note: "Buyurtma tizimga muvaffaqiyatli qabul qilindi" }
      ]
    };

    // Update stock of purchased items
    const products = this.getProducts();
    newOrder.items.forEach(item => {
      const pIndex = products.findIndex(p => p.id === item.id);
      if (pIndex !== -1 && products[pIndex].stock) {
        products[pIndex].stock = Math.max(0, products[pIndex].stock - item.quantity);
      }
    });
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
  }

  updateOrderStatus(orderId, newStatus, note = "") {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    orders[index].status = newStatus;
    if (!orders[index].statusHistory) orders[index].statusHistory = [];
    
    let statusNote = note;
    if (!statusNote) {
      switch (newStatus) {
        case "pending": statusNote = "Buyurtma qabul qilindi"; break;
        case "processing": statusNote = "Buyurtma omborda tayyorlanmoqda"; break;
        case "shipping": statusNote = "Buyurtma kuryerga berildi va yo'lda"; break;
        case "completed": statusNote = "Buyurtma mijozga yetkazib topshirildi"; break;
        case "cancelled": statusNote = "Buyurtma bekor qilindi"; break;
      }
    }

    orders[index].statusHistory.push({
      status: newStatus,
      time: new Date().toISOString(),
      note: statusNote
    });

    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return orders[index];
  }

  deleteOrder(orderId) {
    let orders = this.getOrders();
    orders = orders.filter(o => o.id !== orderId);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return true;
  }

  /* ====================== PROMO CODES ====================== */
  getPromoCodes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMOS) || '[]');
    } catch (e) {
      return [];
    }
  }

  validatePromo(code, currentSubtotal) {
    if (!code) return { valid: false, message: "Promokod kiritilmadi" };
    const promos = this.getPromoCodes();
    const promo = promos.find(p => p.code.toUpperCase() === code.trim().toUpperCase());
    if (!promo) {
      return { valid: false, message: "Bunday promokod mavjud emas yoki muddati tugagan" };
    }
    if (promo.minAmount && currentSubtotal < promo.minAmount) {
      return {
        valid: false,
        message: `Ushbu promokod minimal ${promo.minAmount.toLocaleString('uz-UZ')} so'mlik xaridlar uchun amal qiladi`
      };
    }
    const discountAmount = Math.round((currentSubtotal * promo.discountPercent) / 100);
    return {
      valid: true,
      promo,
      discountPercent: promo.discountPercent,
      discountAmount,
      message: `${promo.discountPercent}% chegirma muvaffaqiyatli qo'llandi!`
    };
  }

  savePromoCode(promo) {
    const promos = this.getPromoCodes();
    const index = promos.findIndex(p => p.code.toUpperCase() === promo.code.toUpperCase());
    if (index !== -1) {
      promos[index] = promo;
    } else {
      promos.push(promo);
    }
    localStorage.setItem(STORAGE_KEYS.PROMOS, JSON.stringify(promos));
    return promo;
  }

  deletePromoCode(code) {
    let promos = this.getPromoCodes();
    promos = promos.filter(p => p.code.toUpperCase() !== code.toUpperCase());
    localStorage.setItem(STORAGE_KEYS.PROMOS, JSON.stringify(promos));
    return true;
  }

  /* ====================== STORE SETTINGS ====================== */
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
    } catch (e) {
      return {};
    }
  }

  saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  /* ====================== CART & WISHLIST ====================== */
  getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || '[]');
    } catch (e) {
      return [];
    }
  }

  saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }

  getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST) || '[]');
    } catch (e) {
      return [];
    }
  }

  saveWishlist(wishlist) {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
  }

  /* ====================== ADMIN STATS ENGINE ====================== */
  getStatistics() {
    const orders = this.getOrders();
    const products = this.getProducts();

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed');
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');

    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / (totalOrders - cancelledOrders.length || 1)) : 0;

    const outOfStockCount = products.filter(p => (p.stock || 0) <= 0).length;
    const lowStockCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;

    // Top selling products aggregation
    const productSalesMap = {};
    orders.forEach(order => {
      if (order.status !== 'cancelled' && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (!productSalesMap[item.id]) {
            productSalesMap[item.id] = {
              id: item.id,
              name: item.name,
              image: item.image,
              price: item.price,
              soldCount: 0,
              totalRevenue: 0
            };
          }
          productSalesMap[item.id].soldCount += item.quantity || 1;
          productSalesMap[item.id].totalRevenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    const topSelling = Object.values(productSalesMap)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5);

    // Sales by day (Last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric', month: 'short' });
      
      const dayOrders = orders.filter(o => o.date && o.date.startsWith(dateStr) && o.status !== 'cancelled');
      const dayRevenue = dayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

      last7Days.push({
        date: dateStr,
        label: dayLabel,
        count: dayOrders.length,
        revenue: dayRevenue
      });
    }

    return {
      totalRevenue,
      totalOrders,
      pendingOrdersCount: pendingOrders.length,
      completedOrdersCount: completedOrders.length,
      cancelledOrdersCount: cancelledOrders.length,
      averageOrderValue,
      totalProductsCount: products.length,
      outOfStockCount,
      lowStockCount,
      topSelling,
      salesChart: last7Days
    };
  }

  /* Reset database to default */
  resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.PROMOS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.initDatabase();
  }
}

// Global instance
const db = new StoreDB();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StoreDB, db };
}
