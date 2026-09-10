const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_file_hub', {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.warn('[MongoDB Warning]: Make sure your local MongoDB instance or MongoDB Atlas URI is active.');
    // Don't kill process immediately in development so server can start and deliver meaningful error message if needed
  }
};

module.exports = connectDB;
