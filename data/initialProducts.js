// Boshlang'ich universal toifalar
const initialCategories = [
  { id: "all", name: "Barcha Mahsulotlar", icon: "fa-solid fa-border-all" },
  { id: "electronics", name: "Elektronika & Gadjetlar", icon: "fa-solid fa-laptop" },
  { id: "smartphones", name: "Smartfonlar & Aksessuarlar", icon: "fa-solid fa-mobile-screen-button" },
  { id: "clothing", name: "Kiyim-kechak & Moda", icon: "fa-solid fa-shirt" },
  { id: "home", name: "Uy & Oshxona Jihozlari", icon: "fa-solid fa-couch" },
  { id: "beauty", name: "Go'zallik & Salomatlik", icon: "fa-solid fa-wand-magic-sparkles" },
  { id: "books", name: "Kitoblar & Kantselyariya", icon: "fa-solid fa-book-open" },
  { id: "auto", name: "Avtotovarlar", icon: "fa-solid fa-car" },
  { id: "sport", name: "Sport & Sayohat", icon: "fa-solid fa-dumbbell" }
];

// Toza holat: Dastlabki tovarlar bo'sh (Admin panel orqali kiritiladi)
const initialProducts = [];

// Boshlang'ich promokodlar
const initialPromoCodes = [
  { code: "YANGI2026", discountPercent: 10, minAmount: 100000, description: "Yangi mijozlar uchun 10% chegirma" }
];

// Do'kon sozlamalari
const initialStoreSettings = {
  storeName: "Universal MegaStore",
  storeTagline: "O'zbekistondagi eng qulay va ishonchli internet do'kon",
  phone: "+998 (90) 123-45-67",
  email: "info@megastore.uz",
  address: "Toshkent shahri, Amir Temur shoh ko'chasi 45-uy",
  currency: "so'm",
  freeShippingThreshold: 500000,
  standardShippingCost: 25000,
  expressShippingCost: 50000,
  telegramBotToken: "8657815229:AAEV2N7L0-nQhEcmX5L49d5wyTBWaaKk1l4",
  telegramChatId: "",
  telegramNotificationsEnabled: true
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initialCategories,
    initialProducts,
    initialPromoCodes,
    initialStoreSettings
  };
}
