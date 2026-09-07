const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), store: 'Universal MegaStore' });
});

// Serve frontend
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Universal E-Magazin Server muvaffaqiyatli ishga tushdi!`);
  console.log(`🌐 Do'kon (Storefront):  http://localhost:${PORT}`);
  console.log(`👑 Admin Panel:         http://localhost:${PORT}/admin.html`);
  console.log(`====================================================`);
});
