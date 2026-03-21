const { Hono } = require('hono');
const { setupRouter } = require('./router');
const { logger } = require('./utils/logger');

const app = new Hono();

// Setup routing and middleware
setupRouter(app);

// Export for Cloudflare Workers
export default app;
