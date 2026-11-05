const multer = require('multer');

// 404 Not Found Middleware
const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Multer specific errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = process.env.MAX_FILE_SIZE_MB || '50';
      message = `File is too large. Maximum allowed file size is ${maxMb}MB.`;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded at once (maximum 20 files per batch).';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected form field: ${err.field}`;
    }
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Requested resource not found (invalid identifier).';
  }

  // Handle CORS Origin Errors
  if (err.message && err.message.startsWith('CORS Error:')) {
    statusCode = 403;
    message = err.message;
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    message = `An entry with that ${field} already exists.`;
  }

  // Handle Validation Errors safely (Mongoose, express-rate-limit, or custom)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    if (err.errors && typeof err.errors === 'object') {
      message = Object.values(err.errors)
        .map((val) => val.message || String(val))
        .join(', ');
    } else {
      message = err.message || 'Validation error';
    }
  }

  // Handle Mongoose connection / server selection timeout errors
  if (err.name === 'MongooseServerSelectionError' || (err.message && err.message.includes('buffering timed out'))) {
    statusCode = 503;
    message = 'Database service is temporarily unavailable. Please try again shortly.';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // Diagnostic logging on server
  console.error(`[Error] [${req.method} ${req.originalUrl || req.url}] (${statusCode}):`, err.message);

  // In production, sanitize 500 error messages to avoid leaking internals
  let clientMessage = message;
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    clientMessage = 'An internal server error occurred. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
