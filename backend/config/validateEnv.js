/**
 * Environment Variable Validation for Secure File Hub Backend
 */
const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];

  // 1. Validate MONGODB_URI
  if (!process.env.MONGODB_URI) {
    if (isProduction) {
      errors.push('MONGODB_URI is required in production.');
    }
  } else if (isProduction && (process.env.MONGODB_URI.includes('127.0.0.1') || process.env.MONGODB_URI.includes('localhost'))) {
    console.warn('[Config Warning]: MONGODB_URI in production appears to point to localhost/127.0.0.1. Ensure MongoDB Atlas or remote URI is provided.');
  }

  // 2. Validate JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  const insecureDefaults = [
    'super_secret_jwt_key_secure_file_hub_2026_x89f',
    'your_jwt_strong_secret_key_here',
    'secret',
    'jwt_secret',
  ];

  if (!jwtSecret) {
    if (isProduction) {
      errors.push('JWT_SECRET is required in production and must be at least 32 characters long.');
    } else {
      console.warn('[Config Notice]: JWT_SECRET is not set in development. Using development fallback key.');
    }
  } else if (isProduction) {
    if (insecureDefaults.includes(jwtSecret)) {
      errors.push('JWT_SECRET in production is using a known default placeholder. Please provide a unique cryptographically secure secret.');
    } else if (jwtSecret.length < 32) {
      errors.push(`JWT_SECRET in production is too short (${jwtSecret.length} chars). Minimum recommended length is 32 characters.`);
    }
  }

  // 3. Validate CLIENT_URL in production (for CORS origin security)
  if (isProduction && !process.env.CLIENT_URL) {
    console.warn('[Config Warning]: CLIENT_URL is not set in production. Browser requests from your Vercel frontend will be blocked by CORS until CLIENT_URL (e.g., https://your-app.vercel.app) is configured.');
  }

  // 4. Validate Cloud Storage credentials if STORAGE_PROVIDER is enabled
  const storageProvider = (process.env.STORAGE_PROVIDER || '').toLowerCase();
  if (storageProvider === 'r2') {
    if (!process.env.R2_BUCKET_NAME || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ACCOUNT_ID) {
      if (isProduction) {
        errors.push('STORAGE_PROVIDER is set to "r2", but one or more required Cloudflare R2 variables are missing: R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID.');
      } else {
        console.warn('[Storage Notice]: Incomplete R2 configuration in development. Storage manager will fall back to local disk storage.');
      }
    }
  } else if (storageProvider === 's3') {
    if (!process.env.S3_BUCKET_NAME || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
      if (isProduction) {
        errors.push('STORAGE_PROVIDER is set to "s3", but one or more required AWS S3 variables are missing: S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.');
      } else {
        console.warn('[Storage Notice]: Incomplete S3 configuration in development. Storage manager will fall back to local disk storage.');
      }
    }
  } else if (isProduction && storageProvider === 'local') {
    console.warn('[Storage Notice]: Using local disk storage in production. Ensure persistent disk volume is mounted if using container hosting.');
  }

  if (errors.length > 0) {
    console.error('=================================================================');
    console.error('🚨 FATAL CONFIGURATION ERROR - CANNOT START SERVER IN PRODUCTION:');
    errors.forEach((err) => console.error(`   ✖ ${err}`));
    console.error('=================================================================');
    const error = new Error(`Environment validation failed:\n${errors.join('\n')}`);
    error.validationErrors = errors;
    throw error;
  }

  return true;
};

module.exports = validateEnv;

