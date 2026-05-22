// server.js
require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const path        = require('path');
const rateLimit   = require('express-rate-limit');
const { initDatabase } = require('./db/init');
const patchesRouter    = require('./routes/patches');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Database ──────────────────────────────────────────────────────────────────
const db = initDatabase();

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors({
  origin:          process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods:         ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders:  ['Content-Type', 'X-Admin-Token'],
}));
app.use(express.json());

// ── Static file serving for frontend and uploads ─────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

// ── Rate limiting: 30 POSTs per IP per 15 min ────────────────────────────────
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      30,
  message:  { error: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});
app.use('/api/patches', (req, res, next) => {
  if (req.method === 'POST') return postLimiter(req, res, next);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/patches', patchesRouter(db));

app.get('/api/health', (req, res) => {
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM patches').get();
  res.json({ status: 'ok', patches: total, timestamp: new Date().toISOString() });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === 'LIMIT_FILE_SIZE')      return res.status(413).json({ error: 'File too large. Maximum 100 MB.' });
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: 'Unexpected file field name.' });
  if (err.code === 'UNSUPPORTED_TYPE')     return res.status(415).json({ error: err.message });

  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎨  Palisades Stories API  →  http://localhost:${PORT}`);
  console.log(`📁  Uploads               →  http://localhost:${PORT}/uploads`);
  console.log(`❤️   Health check          →  http://localhost:${PORT}/api/health`);
});

module.exports = app;
