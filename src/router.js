const { Hono } = require('hono');
const { cors } = require('hono/cors');
const { secureHeaders } = require('hono/secure-headers');
const { compress } = require('hono/compress');
const { config } = require('./config');
const { errorMiddleware } = require('./middleware/error.middleware');
const apiRoutes = require('./routes');

function setupRouter(app) {
  // Security headers
  app.use('*', secureHeaders());

  // CORS configuration
  app.use('*', cors({
    origin: config.cors.origin === '*' ? '*' : config.cors.origin,
    credentials: config.cors.credentials,
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }));

  // Compression middleware
  app.use('*', compress());

  // Mount API routes
  app.route('/api', apiRoutes);

  // 404 handler
  app.notFound((c) => {
    return c.text('Not Found', 404);
  });

  // Global Error handler
  app.onError(errorMiddleware);
}

module.exports = { setupRouter };
