const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { isDBConnected } = require('./config/db');
const validateEnv = require('./config/validateEnv');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const folderRoutes = require('./routes/folderRoutes');
const trashRoutes = require('./routes/trashRoutes');
const statsRoutes = require('./routes/statsRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Trust reverse proxy (Vercel, Render, AWS ALB, Nginx) so rate limiters and secure cookies work accurately
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows cross-origin file streaming / preview
  })
);

// CORS configuration: Allow explicitly configured frontend origins
const configuredClientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const developmentOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction
  ? configuredClientUrls
  : [...new Set([...developmentOrigins, ...configuredClientUrls])];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server) where origin is undefined
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // In local development, also permit localhost on any port
    if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
      return callback(null, true);
    }

    const corsError = new Error(
      `CORS Error: Origin '${origin}' is not authorized. Allowed origins: ${
        allowedOrigins.join(', ') || 'None (CLIENT_URL not configured)'
      }`
    );
    corsError.status = 403;
    return callback(corsError, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Disposition'],
  optionsSuccessStatus: 204, // Responds to preflight with 204 No Content
};

app.use(cors(corsOptions));
// Support OPTIONS preflight requests across all routes
app.options('*', cors(corsOptions));

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Global API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', apiLimiter);

// Auth specific stricter rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 attempts per 15 min
  validate: { trustProxy: false },
  message: {
    success: false,
    message: 'Too many login/register attempts. Please wait 15 minutes before trying again.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check endpoint (Liveness probe)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'Secure File Hub API',
    environment: process.env.NODE_ENV || 'development',
    database: isDBConnected() ? 'connected' : 'disconnected',
  });
});

// Database readiness endpoint (Readiness probe)
app.get('/api/ready', (req, res) => {
  if (isDBConnected()) {
    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }

  res.status(503).json({
    status: 'not_ready',
    database: 'disconnected',
    message: 'Database is not yet connected or has lost connection',
    timestamp: new Date().toISOString(),
  });
});

// Middleware to ensure DB connection is ready before handling API business logic
app.use('/api', async (req, res, next) => {
  // Allow health/ready checks to pass through without blocking
  if (req.path === '/health' || req.path === '/ready') {
    return next();
  }

  try {
    if (!isDBConnected()) {
      await connectDB();
    }
    next();
  } catch (err) {
    next(err);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT, 10) || 5000;
let server = null;

// Graceful shutdown helper
const handleGracefulShutdown = async (signal) => {
  console.log(`\n[Shutdown]: Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[Shutdown]: HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        console.log('[Shutdown]: MongoDB connection closed cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('[Shutdown Error]: Failed closing MongoDB connection:', err.message);
        process.exit(1);
      }
    });

    // Force terminate if graceful shutdown hangs
    setTimeout(() => {
      console.error('[Shutdown]: Forced termination after 10-second timeout.');
      process.exit(1);
    }, 10000).unref();
  } else {
    try {
      await mongoose.connection.close(false);
    } catch {
      // ignore
    }
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

// Start server function: validates env, awaits DB connection, then starts HTTP server
const startServer = async () => {
  try {
    // 1. Validate environment variables
    validateEnv();

    // 2. Await database connection before listening to requests
    await connectDB();

    // 3. Start listening
    server = app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`🚀 SECURE FILE HUB BACKEND API`);
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`========================================`);
    });

    return server;
  } catch (err) {
    console.error(`[Startup Fatal Error]: ${err.message}`);
    process.exit(1);
  }
};

// Automatically start server when executed directly (node server.js)
if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
