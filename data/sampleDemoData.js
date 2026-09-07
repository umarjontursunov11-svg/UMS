// Namuna / Demo sifatida foydalanish uchun tovarlar to'plami
const sampleDemoProducts = [
  {
    id: "prod-101",
    name: "Apple iPhone 15 Pro Max 256GB Natural Titanium",
    category: "smartphones",
    brand: "Apple",
    price: 14850000,
    oldPrice: 16200000,
    discount: 8,
    rating: 4.9,
    reviewsCount: 142,
    stock: 15,
    isPopular: true,
    isNew: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Eng so'nggi A17 Pro protsessori, titan korpus, 48MP asosiy kamera va 5x optik zum.",
    tags: ["apple", "iphone", "titanium", "smartfon"],
    specs: {
      "Xotira": "256 GB",
      "Ekran": "6.7 dyuym OLED",
      "Protsessor": "Apple A17 Pro"
    }
  },
  {
    id: "prod-102",
    name: "Samsung Galaxy S24 Ultra 12GB/512GB Titanium Gray",
    category: "smartphones",
    brand: "Samsung",
    price: 14200000,
    oldPrice: 15500000,
    discount: 8,
    rating: 4.8,
    reviewsCount: 98,
    stock: 12,
    isPopular: true,
    isNew: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Galaxy AI, 200MP kamera, S-Pen ruchkasi va 120Hz Dynamic AMOLED ekran.",
    tags: ["samsung", "galaxy", "s24", "smartfon"],
    specs: {
      "Xotira": "512 GB / 12 GB RAM",
      "Ekran": "6.8 dyuym QHD+ 120Hz"
    }
  },
  {
    id: "prod-103",
    name: "Apple MacBook Air 15 M3 16GB / 512GB Space Gray",
    category: "electronics",
    brand: "Apple",
    price: 17500000,
    oldPrice: 19000000,
    discount: 7,
    rating: 4.9,
    reviewsCount: 64,
    stock: 8,
    isPopular: true,
    isNew: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Apple M3 chipi, 15.3 dyuymli Liquid Retina displey va 18 soatlik batareya.",
    tags: ["apple", "macbook", "m3", "noutbuk"],
    specs: {
      "Protsessor": "Apple M3",
      "Operativ xotira": "16 GB"
    }
  },
  {
    id: "prod-104",
    name: "Sony WH-1000XM5 Simsiz Shovqinni So'ndiruvchi Quloqchin",
    category: "electronics",
    brand: "Sony",
    price: 3800000,
    oldPrice: 4300000,
    discount: 11,
    rating: 4.9,
    reviewsCount: 112,
    stock: 20,
    isPopular: true,
    isNew: false,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Active Noise Cancelling texnologiyasi va 30 soatlik musiqa tinglash.",
    tags: ["sony", "headphones", "quloqchin"],
    specs: {
      "Turi": "Simsiz Over-Ear",
      "Batareya": "30 soat"
    }
  },
  {
    id: "prod-105",
    name: "Xiaomi Robot Changyutgich Robot Vacuum X10+ O'zi Tozalanadigan",
    category: "home",
    brand: "Xiaomi",
    price: 6900000,
    oldPrice: 7900000,
    discount: 12,
    rating: 4.7,
    reviewsCount: 76,
    stock: 14,
    isPopular: true,
    isNew: true,
    isFeatured: false,
    image: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Avtomatik latta yuvish, quritish va chang yig'ish bazasiga ega 4000Pa robot.",
    tags: ["xiaomi", "robot", "changyutgich"],
    specs: {
      "So'rish quvvati": "4000 Pa",
      "Navigatsiya": "LDS Lidar"
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sampleDemoProducts };
}
