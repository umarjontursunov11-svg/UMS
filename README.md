# 🛒 Universal MegaStore — Zamonaviy Internet Magazin & Admin Panel

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

O'zbekistondagi har qanday biznes uchun to'liq moslashtirilgan, zamonaviy **Glassmorphism dizayn**, kuchli **aqlli qidiruv (Smart Search)**, to'liq **buyurtma berish (Checkout)** tizimi hamda keng qamrovli **Administrator Paneli**ga ega universal internet do'kon platformasi.

---

## 🌟 Asosiy Imkoniyatlar

### 🛍️ 1. Mijozlar Qismi (Storefront - `index.html`)
- **Zamonaviy Premium Dizayn**:
  - Dark / Light mavzu almashtirgich (sozlamalarni xotirada saqlash bilan).
  - Silliq shaffoflik va xiralashish effektlari (*Glassmorphism*).
  - Web Audio tovush effektlari (savatga solganda va buyurtma berilganda yoqimli chimes).
  - To'liq responsive (mobil, planshet, kompyuter).
- **Kengaytirilgan Aqlli Qidiruv**:
  - Harf yozilgandayoq **jonli takliflar va rasmli tovarlar** (*Live search dropdown*).
  - Nomi, tavsifi, brendi va toifalari bo'yicha tezkor qidirish.
- **Ko'p Bosqichli Filtrlash**:
  - Asosiy sahifada **Kategoriyalar Bloki** va yuqori menyu.
  - Narx oralig'i (interaktiv slayder va raqamli kiritish).
  - Brendlar, mijozlar reytingi (4.8+, 4.5+), faqat chegirmalar va faqat omborda bor tovarlar.
  - Bir bosishda filtrlarni tozalash (Faol filtr chipslari).
- **Xarid Jarayoni & Savat**:
  - Tovar ustiga bosganda **Tezkor Ko'rish (Quick View Modal)** — rasm galereyasi va xarakteristikalar jadvali.
  - Savatchada sonini boshqarish va **Promokodlar tizimi** (`YANGI2026`).
  - 500,000 so'mdan oshganda bepul yetkazib berish kalkulyatori.
  - Sevimlilar ro'yxati (*Wishlist*).
- **Buyurtmani Rasmiylashtirish (Checkout)**:
  - Mijoz ma'lumotlari, aniq manzil va kuryer uchun izoh.
  - Yetkazib berish turi: Standart (24 soat) yoki Tezkor Ekspress (2 soat).
  - To'lov tizimlari: **Click**, **Payme**, **Uzum Pay**, **Naqd pul**.
  - Avtomatik **Chek & Kvitansiya** generatsiyasi va unikal Buyurtma ID kodi (`#ORD-XXXXX`).
  - Har bir yangi buyurtma avtomatik Telegram Botga to'liq kvitansiyasi bilan yuboriladi!
- **Sotuvchi Bo'lish (Hamkorlik Arizasi)**:
  - Bosh sahifa va menyudagi **"Sotuvchi bo'lish"** tugmasi orqali ariza formasi.
  - Foydalanuvchi ismi, telefoni, do'kon/brend nomi, mahsulot toifasi, shahar va taklifini kiritib yuborganda, ma'lumotlar zudlik bilan Telegram botga kelib tushadi.
- **Buyurtmani Real Vaqtda Kuzatish (Order Tracking)**:
  - Buyurtma ID kodi orqali uning holatini (*Qabul qilindi ➔ Yig'ilmoqda ➔ Kuryerda ➔ Yetkazildi*) kuzatish.

---

### 👑 2. Administrator Paneli (`admin.html`)
- **Sotuvlar Statistikasi (Dashboard)**:
  - Jami tushum (so'mda), Buyurtmalar soni, Yangi buyurtmalar, Ombordagi mahsulotlar soni.
  - **7 Kunlik Sotuvlar Grafigi** (interaktiv ustunlar va tooltip).
  - **Eng Xaridorgir Tovarlar Reytingi**.
- **Buyurtmalar Boshqaruvi**:
  - Holat bo'yicha saralash (*Yangi, Tayyorlanmoqda, Yetkazilmoqda, Bajarildi, Bekor qilindi*).
  - Buyurtmachi ismi, telefoni yoki ID bo'yicha qidiruv.
  - Buyurtma tafsilotlarini ko'rish, holatini yangilash, chekni chop etish yoki o'chirish.
- **Mahsulotlar Boshqaruvi (CRUD)**:
  - Yangi tovar qo'shish modal oynasi (rasm preview, narx, eski narx, chegirma foizi avto-hisoblash, qoldiq soni).
  - Tahrirlash, o'chirish va omborda kam qolgan tovarlar ogohlantirish indikatorlari.
  - Sinov uchun: **"Demo yuklash"** va **"Tozalash"** tugmalari.
- **Kategoriyalar va Promokodlar**:
  - Yangi toifalar ochish va o'chirish.
  - Chegirma kuponlarini yaratish (foiz va minimal xarid summasi bilan).
- **Telegram Bot Integratsiyasi**:
  - Birlamchi bot: `@universalmegastore_bot` (Token: `8657815229:AAEV2N7L0-nQhEcmX5L49d5wyTBWaaKk1l4`).
  - Admin panelda **"Chat ID ni avtomatik aniqlash"** va **"Sinov Xabarini Yuborish"** funksiyalari.

---

## 🤖 Telegram Botini Ishga Tushirish (2 daqiqada)

Saytga ulangan Telegram boti: **[@universalmegastore_bot](https://t.me/universalmegastore_bot)**

Xabarlarni o'z profilingizga qabul qilish uchun:
1. Telegramda **[@universalmegastore_bot](https://t.me/universalmegastore_bot)** ga kiring va **`/start`** tugmasini bosing.
2. Saytning **[Admin Panel](admin.html)**iga kiring ➔ Chapdan **"Sozlamalar & Bot"** bo'limini oching.
3. **"Chat ID ni avtomatik aniqlash"** tugmasini bosing (u sizning Chat ID raqamingizni o'zi topib kiritadi).
4. **"Sinov Xabarini Yuborish"** tugmasini bosib tekshirib ko'ring!
5. Endi mijoz buyurtma berganda yoki "Sotuvchi bo'lish" arizasini to'ldirganda barcha ma'lumotlar avtomatik botingizga tushadi!

---

## 📦 GitHub ga Yuklash Ko'rsatmasi

Agar loyihani GitHub hisobingizga yuklamoqchi bo'lsangiz:

```bash
# 1. Git omborini yaratish:
git init

# 2. Fayllarni qo'shish:
git add .

# 3. Birinchi commitni amalga oshirish:
git commit -m "feat: Universal Zamonaviy Internet Magazin va Admin Panel"

# 4. Asosiy tarmoqni belgilash:
git branch -M main

# 5. GitHub dagi repository silkasini ulash (o'zingizning havolangizni qo'ying):
git remote add origin https://github.com/USERNAME/universal-e-magazin.git

# 6. Kodni GitHub ga yuborish:
git push -u origin main
```

---

## 📄 Litsenziya
Ushbu loyiha [MIT](LICENSE) litsenziyasi asosida tarqatiladi.
