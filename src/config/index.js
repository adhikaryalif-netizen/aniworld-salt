
const env = typeof process !== 'undefined' && process.env ? process.env : {};

const config = {
  port: parseInt(env.PORT || '3000', 10),
  nodeEnv: env.NODE_ENV || 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV !== 'development',
  cors: {
    origin: env.CORS_ORIGIN || '*',
    credentials: false,
  },
  api: {
    baseUrl: env.API_BASE_URL || 'http://localhost:3000',
    timeout: 30000,
  },
};

module.exports = { config };
