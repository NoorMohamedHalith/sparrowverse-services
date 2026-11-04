/**
 * SparrowVerse Services – Express Backend Server
 * Author : Noor Mohamed Halith
 * Stack  : Node.js · Express · MongoDB (Mongoose) · Twilio · Nodemailer
 */

'use strict';

require('dotenv').config();

const express     = require('express');
const mongoose    = require('mongoose');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const inquiryRoutes = require('./routes/inquiry.routes');

// ─── App setup ───────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Utility Middleware ───────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));  // HTTP security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Trust proxy (for rate limiting behind Nginx/Vercel) ─────
app.set('trust proxy', 1);

// ─── Global Rate Limiter ──────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs : 15 * 60 * 1000, // 15 minutes
  max      : 100,
  standardHeaders: true,
  legacyHeaders  : false,
  message  : { success: false, message: 'Too many requests. Please try again later.' },
});
app.use(globalLimiter);

// ─── Static Frontend (serves index.html + assets) ────────────
app.use(express.static(path.join(__dirname, '..')));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/inquiry', inquiryRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status    : 'OK',
    service   : 'SparrowVerse Services API',
    timestamp : new Date().toISOString(),
    db        : mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── 404 for unknown API routes ───────────────────────────────
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// ─── Serve SPA (all other routes → index.html) ────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ─── Global Error Handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(`\n❌  Unhandled Error: ${err.message}`);
  res.status(err.statusCode || 500).json({
    success : false,
    message : err.message || 'Internal Server Error',
  });
});

// ─── Database Connect & Server Boot Function ──────────────────
async function startServer() {
  let mongoUri = process.env.MONGO_URI;

  try {
    console.log('🔄 Attempting MongoDB connection...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log('✅ Connected to MongoDB via provided MONGO_URI.');
  } catch (err) {
    console.warn('⚠️ Local or specified MongoDB not reachable:', err.message);
    console.log('💡 Starting local In-Memory MongoDB Server so you can test immediately with zero install...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      await mongoose.connect(mongoUri);
      console.log('✅ In-Memory MongoDB Server started & connected!');
      console.log('   (Data will persist in memory while the server runs)');
    } catch (memErr) {
      console.error('❌ Failed to start In-Memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log('\n======================================================');
    console.log(`🚀 SparrowVerse Full-Stack Server is LIVE!`);
    console.log(`🌐 Website URL    : http://localhost:${PORT}`);
    console.log(`📡 API Base URL   : http://localhost:${PORT}/api/inquiry`);
    console.log(`💚 Health Check   : http://localhost:${PORT}/api/health`);
    console.log('======================================================\n');
  });
}

startServer();

// ─── Graceful Shutdown ────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('\n⚠️   SIGTERM received – shutting down gracefully…');
  await mongoose.connection.close();
  process.exit(0);
});
