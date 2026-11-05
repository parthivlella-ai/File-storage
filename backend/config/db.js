const mongoose = require('mongoose');

// Cache connection in global scope for serverless and warm instance reuse
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Attach event listeners once
let listenersAttached = false;
const attachListeners = () => {
  if (listenersAttached) return;

  mongoose.connection.on('connected', () => {
    console.log(`[MongoDB Event]: Connected to ${mongoose.connection.host}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[MongoDB Event Error]: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB Event Disconnected]: Connection lost. Waiting for automatic reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB Event Reconnected]: Database connection restored successfully.');
  });

  listenersAttached = true;
};

/**
 * Connect to MongoDB with timeout handling and connection caching
 */
const connectDB = async () => {
  attachListeners();

  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection attempt is currently in progress, await that promise
  if (cached.promise) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const mongoUri = process.env.MONGODB_URI;

  // Strict requirement: in production, MONGODB_URI must be provided
  if (!mongoUri) {
    if (isProduction) {
      const fatalMsg = 'FATAL CONFIGURATION ERROR: MONGODB_URI environment variable is required in production mode.';
      console.error(`[Database Error]: ${fatalMsg}`);
      throw new Error(fatalMsg);
    }
    console.warn('[MongoDB Notice]: MONGODB_URI not set. Falling back to local MongoDB at mongodb://127.0.0.1:27017/secure_file_hub');
  }

  const uri = mongoUri || 'mongodb://127.0.0.1:27017/secure_file_hub';

  const timeoutMs = parseInt(process.env.MONGODB_TIMEOUT_MS, 10) || 5000;

  const options = {
    serverSelectionTimeoutMS: timeoutMs,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    autoIndex: !isProduction, // Disable automatic index builds in high-scale production
  };

  cached.promise = mongoose.connect(uri, options).then((m) => {
    console.log(`[MongoDB Connected]: ${m.connection.host} (readyState: ${m.connection.readyState})`);
    return m.connection;
  });

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`[MongoDB Fatal Error]: Could not establish initial connection: ${error.message}`);
    throw error;
  }
};

/**
 * Check if database connection is currently open and ready
 */
const isDBConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;
