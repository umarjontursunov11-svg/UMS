/**
 * Toast Notifications, Web Audio Chimes & Telegram Bot Dispatcher
 */

class NotificationManager {
  constructor() {
    this.container = null;
    this.audioCtx = null;
    this.initContainer();
  }

  initContainer() {
    if (typeof document === 'undefined') return;
    let existing = document.getElementById('toast-container');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'toast-container';
      existing.className = 'toast-container';
      document.body.appendChild(existing);
    }
    this.container = existing;
  }

  playChime(type = 'success') {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
        }
      }
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'success') {
        // High pleasant ding-dong
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'order') {
        // Royal fanfare chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }

  show({ title, message, type = 'info', duration = 3500, icon = null }) {
    this.initContainer();
    if (!this.container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-in-right`;

    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';
    if (type === 'error') iconClass = 'fa-solid fa-circle-xmark';
    if (icon) iconClass = icon;

    toast.innerHTML = `
      <div class="toast-icon">
        <i class="${iconClass}"></i>
      </div>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Yopish">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="toast-progress">
        <div class="toast-progress-bar" style="animation-duration: ${duration}ms"></div>
      </div>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.removeToast(toast);
    });

    this.container.appendChild(toast);
    this.playChime(type);

    const timer = setTimeout(() => {
      this.removeToast(toast);
    }, duration);

    toast._timer = timer;
  }

  removeToast(toast) {
    if (!toast) return;
    clearTimeout(toast._timer);
    toast.classList.remove('animate-slide-in-right');
    toast.classList.add('animate-slide-out-right');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  success(message, title = "Muvaffaqiyatli!") {
    this.show({ title, message, type: 'success' });
  }

  error(message, title = "Xatolik!") {
    this.show({ title, message, type: 'error' });
  }

  warning(message, title = "Diqqat!") {
    this.show({ title, message, type: 'warning' });
  }

  info(message, title = "Ma'lumot") {
    this.show({ title, message, type: 'info' });
  }

  /**
   * Telegram Chat ID ni bot getUpdates orqali avtomatik aniqlash
   */
  async autoDetectChatId(token = "8657815229:AAEV2N7L0-nQhEcmX5L49d5wyTBWaaKk1l4") {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
        const lastUpdate = data.result[data.result.length - 1];
        const msg = lastUpdate.message || lastUpdate.callback_query?.message;
        if (msg && msg.chat && msg.chat.id) {
          const chatId = msg.chat.id;
          const user = msg.from || msg.chat;
          const name = (user.first_name || '') + ' ' + (user.last_name || '');
          return { success: true, chatId: String(chatId), name: name.trim() || user.username || 'Admin' };
        }
      }
      return { success: false, reason: "Botingizga hali hech kim /start bosmagan." };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Telegram Bot orqali buyurtma xabarnomasini yuborish
   */
  async sendTelegramOrderNotification(order, settings = {}) {
    const token = settings.telegramBotToken || "8657815229:AAEV2N7L0-nQhEcmX5L49d5wyTBWaaKk1l4";
    let chatId = settings.telegramChatId;

    // Agar chat ID bo'lmasa, avtomatik getUpdates dan izlab ko'ramiz
    if (!chatId) {
      const detect = await this.autoDetectChatId(token);
      if (detect.success) {
        chatId = detect.chatId;
        if (typeof db !== 'undefined') {
          db.saveSettings({ telegramChatId: String(chatId) });
        }
      }
    }

    if (!chatId) {
      console.warn("Telegram Chat ID belgilanmagan. Telegramga xabar yuborilmadi.");
      return { success: false, reason: "Chat ID belgilanmagan" };
    }

    try {
      const itemsList = order.items
        .map((it, idx) => `${idx + 1}. <b>${it.name}</b> x ${it.quantity} dona = ${(it.price * it.quantity).toLocaleString('uz-UZ')} so'm`)
        .join('\n');

      const text = `
🛒 <b>YANGI BUYURTMA #${order.id}</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Mijoz:</b> ${order.customer.name}
📞 <b>Telefon:</b> <code>${order.customer.phone}</code>
📍 <b>Manzil:</b> ${order.customer.city}, ${order.customer.address}
${order.customer.notes ? `📝 <b>Izoh:</b> ${order.customer.notes}\n` : ''}
📦 <b>Mahsulotlar:</b>
${itemsList}

━━━━━━━━━━━━━━━━━━
💳 <b>To'lov turi:</b> ${order.paymentMethod}
🚚 <b>Yetkazib berish:</b> ${order.deliveryType === 'express' ? 'Tezkor (Express)' : 'Standart'} (${order.shippingCost.toLocaleString('uz-UZ')} so'm)
${order.promoCode ? `🎟 <b>Promokod:</b> ${order.promoCode} (-${order.discountAmount.toLocaleString('uz-UZ')} so'm)\n` : ''}
💰 <b>JAMI SUMMA:</b> <b>${order.totalAmount.toLocaleString('uz-UZ')} so'm</b>
🕒 <b>Vaqt:</b> ${new Date(order.date).toLocaleString('uz-UZ')}
      `.trim();

      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });

      const data = await response.json();
      return { success: data.ok, data };
    } catch (err) {
      console.error("Telegram notification error:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Telegram Bot orqali "Sotuvchi bo'lish" arizasini yuborish
   */
  async sendTelegramSellerApplication(sellerData, settings = {}) {
    const token = settings.telegramBotToken || "8657815229:AAEV2N7L0-nQhEcmX5L49d5wyTBWaaKk1l4";
    let chatId = settings.telegramChatId;

    if (!chatId) {
      const detect = await this.autoDetectChatId(token);
      if (detect.success) {
        chatId = detect.chatId;
        if (typeof db !== 'undefined') {
          db.saveSettings({ telegramChatId: String(chatId) });
        }
      }
    }

    if (!chatId) {
      console.warn("Telegram Chat ID belgilanmagan.");
      return { success: false, reason: "Chat ID belgilanmagan" };
    }

    try {
      const text = `
🏪 <b>YANGI SOTUVCHI / HAMKORLIK ARIZASI!</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Ariza beruvchi:</b> ${sellerData.name}
📞 <b>Telefon raqami:</b> <code>${sellerData.phone}</code>
🏬 <b>Do'kon / Brend nomi:</b> ${sellerData.shopName || "Ko'rsatilmagan"}
📦 <b>Mahsulotlar toifasi:</b> ${sellerData.category}
📍 <b>Hudud / Shahar:</b> ${sellerData.city}
${sellerData.comment ? `📝 <b>Taklif / Izoh:</b> ${sellerData.comment}\n` : ''}
━━━━━━━━━━━━━━━━━━
🕒 <b>Qabul qilingan vaqt:</b> ${new Date().toLocaleString('uz-UZ')}
      `.trim();

      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });

      const data = await response.json();
      return { success: data.ok, data };
    } catch (err) {
      console.error("Telegram seller error:", err);
      return { success: false, error: err.message };
    }
  }
}

const notify = new NotificationManager();

/**
 * Universal Professional Chek / Kvitansiya Chop Etish Funksiyasi
 */
function printOrderReceipt(orderOrId) {
  let order = orderOrId;
  if ((typeof orderOrId === 'string' || typeof orderOrId === 'number') && typeof db !== 'undefined') {
    const rawId = String(orderOrId).trim();
    const cleanId = rawId.replace(/^#/, '');
    order = db.getOrderById(cleanId) || db.getOrderById(rawId);
    if (!order) {
      const orders = db.getOrders();
      order = orders.find(o => String(o.id).toLowerCase() === cleanId.toLowerCase() || String(o.id).toLowerCase() === rawId.toLowerCase());
    }
  }
  if (!order) {
    if (typeof notify !== 'undefined') {
      notify.warning("Chop etish uchun buyurtma topilmadi!");
    } else {
      alert("Chop etish uchun buyurtma topilmadi!");
    }
    return;
  }

  const settings = typeof db !== 'undefined' ? db.getSettings() : {};
  const storeName = settings.storeName || "Universal MegaStore";
  const storePhone = settings.phone || "+998 (90) 123-45-67";
  const storeAddress = settings.address || "Toshkent shahri, Amir Temur shoh ko'chasi 45-uy";

  const itemsHtml = (order.items || []).map((item, idx) => `
    <tr>
      <td style="padding: 7px 4px; border-bottom: 1px dashed #ccc; font-size: 13px;">${idx + 1}</td>
      <td style="padding: 7px 4px; border-bottom: 1px dashed #ccc; font-size: 13px;">
        <strong style="color: #111;">${escapeHtml(item.name)}</strong>
      </td>
      <td style="padding: 7px 4px; border-bottom: 1px dashed #ccc; font-size: 13px; text-align: center;">${item.quantity}</td>
      <td style="padding: 7px 4px; border-bottom: 1px dashed #ccc; font-size: 13px; text-align: right;">${Number(item.price).toLocaleString('uz-UZ')}</td>
      <td style="padding: 7px 4px; border-bottom: 1px dashed #ccc; font-size: 13px; text-align: right; font-weight: bold;">${(item.price * item.quantity).toLocaleString('uz-UZ')}</td>
    </tr>
  `).join('');

  const receiptCardHtml = `
    <div class="receipt-card" style="max-width: 440px; margin: 0 auto; border: 1px dashed #444; padding: 20px; background: #fff; color: #111; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.4;">
      <div class="header" style="text-align: center; border-bottom: 2px dashed #222; padding-bottom: 14px; margin-bottom: 14px;">
        <div class="store-title" style="font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">${escapeHtml(storeName)}</div>
        <div class="store-sub" style="font-size: 11px; color: #444; margin-bottom: 2px;">${escapeHtml(storeAddress)}</div>
        <div class="store-sub" style="font-size: 11px; color: #444; margin-bottom: 6px;">📞 ${escapeHtml(storePhone)}</div>
        <div class="order-badge" style="display: inline-block; font-size: 14px; font-weight: 800; background: #f4f4f5; padding: 5px 14px; border-radius: 4px; margin-top: 4px; border: 1px solid #ddd; letter-spacing: 0.5px;">RASMIY XARID CHEKI: #${order.id}</div>
      </div>

      <div class="info-grid" style="margin-bottom: 14px; font-size: 12px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #555;">Sana / Vaqt:</span>
          <span style="font-weight: 700; text-align: right;">${new Date(order.date || Date.now()).toLocaleString('uz-UZ')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #555;">Buyurtmachi:</span>
          <span style="font-weight: 700; text-align: right;">${escapeHtml(order.customer ? order.customer.name : 'Mijoz')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #555;">Telefon:</span>
          <span style="font-weight: 700; text-align: right;">${escapeHtml(order.customer ? order.customer.phone : '-')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #555;">Manzil:</span>
          <span style="font-weight: 700; text-align: right;">${escapeHtml(order.customer ? (order.customer.city + ', ' + order.customer.address) : '-')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #555;">Yetkazish usuli:</span>
          <span style="font-weight: 700; text-align: right;">${order.deliveryType === 'express' ? 'Tezkor (Express)' : 'Standart (24 soat)'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #555;">To'lov holati / Turi:</span>
          <span style="font-weight: 700; text-align: right;">To'langan (${escapeHtml(order.paymentMethod || 'Naqd')})</span>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
        <thead>
          <tr>
            <th style="font-size: 11px; text-transform: uppercase; color: #444; border-bottom: 2px solid #222; padding: 6px 4px; text-align: left; width: 20px;">#</th>
            <th style="font-size: 11px; text-transform: uppercase; color: #444; border-bottom: 2px solid #222; padding: 6px 4px; text-align: left;">Mahsulot</th>
            <th style="font-size: 11px; text-transform: uppercase; color: #444; border-bottom: 2px solid #222; padding: 6px 4px; text-align: center; width: 35px;">Soni</th>
            <th style="font-size: 11px; text-transform: uppercase; color: #444; border-bottom: 2px solid #222; padding: 6px 4px; text-align: right; width: 75px;">Narxi</th>
            <th style="font-size: 11px; text-transform: uppercase; color: #444; border-bottom: 2px solid #222; padding: 6px 4px; text-align: right; width: 85px;">Jami</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="border-top: 2px dashed #222; padding-top: 10px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
          <span>Oraliq summa:</span>
          <span>${Number(order.subtotal || 0).toLocaleString('uz-UZ')} so'm</span>
        </div>
        ${order.discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; color: #059669; font-weight: 700;">
            <span>Chegirma ${order.promoCode ? '(' + order.promoCode + ')' : ''}:</span>
            <span>-${Number(order.discountAmount).toLocaleString('uz-UZ')} so'm</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
          <span>Yetkazib berish:</span>
          <span>${order.shippingCost === 0 ? 'Bepul 🎁' : Number(order.shippingCost).toLocaleString('uz-UZ') + " so'm"}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; border-top: 2px solid #222; padding-top: 8px; margin-top: 8px;">
          <span>JAMI TO'LOV:</span>
          <span>${Number(order.totalAmount || 0).toLocaleString('uz-UZ')} SO'M</span>
        </div>
      </div>

      <div style="text-align: center; margin: 14px 0 8px 0; font-family: 'Courier New', monospace; font-weight: bold; font-size: 15px;">
        <div style="height: 32px; width: 65%; margin: 0 auto 5px auto; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 6px, #fff 6px, #fff 8px);"></div>
        *${order.id}*
      </div>

      <div style="text-align: center; font-size: 11px; color: #555; border-top: 1px dashed #ccc; padding-top: 10px;">
        <div>Xaridingiz uchun minnatdormiz!</div>
        <div style="margin-top: 3px;">14 kunlik rasmiy kafolat va xizmat ko'rsatish chek taqdim etilganda amal qiladi.</div>
      </div>
    </div>
  `;

  const fullPrintHtml = `
    <!DOCTYPE html>
    <html lang="uz">
    <head>
      <meta charset="UTF-8">
      <title>Buyurtma Cheki #${order.id} - ${escapeHtml(storeName)}</title>
      <style>
        @page {
          size: auto;
          margin: 4mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #111;
          background: #fff;
          padding: 10px;
          line-height: 1.4;
          font-size: 13px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          body { padding: 0; background: #fff !important; }
          .receipt-card { border: none !important; padding: 0 !important; max-width: 100% !important; box-shadow: none !important; }
        }
      </style>
    </head>
    <body>
      ${receiptCardHtml}
    </body>
    </html>
  `;

  // Provide DOM printable container for direct page print
  let printContainer = document.getElementById('print-receipt-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'print-receipt-container';
    document.body.appendChild(printContainer);
  }
  printContainer.innerHTML = receiptCardHtml;

  if (typeof notify !== 'undefined') {
    notify.info(`Chek #${order.id} chop etishga tayyorlanmoqda...`, "Chek chop etish");
  }

  // Create or refresh hidden iframe
  try {
    let printFrame = document.getElementById('receipt-print-frame');
    if (printFrame) {
      printFrame.remove();
    }
    printFrame = document.createElement('iframe');
    printFrame.id = 'receipt-print-frame';
    printFrame.name = 'receipt-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '1px';
    printFrame.style.height = '1px';
    printFrame.style.border = 'none';
    printFrame.style.opacity = '0.01';
    printFrame.style.pointerEvents = 'none';
    printFrame.style.zIndex = '-9999';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(fullPrintHtml);
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (iframeErr) {
        console.warn("Iframe orqali chop etishda xatolik, window.print ishlatiladi:", iframeErr);
        window.print();
      }
    }, 350);
  } catch (err) {
    console.warn("Iframe yaratish cheklandi, to'g'ridan-to'g'ri chop etish chaqiriladi:", err);
    window.print();
  }
}


// Global expose
window.printOrderReceipt = printOrderReceipt;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationManager, notify, printOrderReceipt };
}
