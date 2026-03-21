const { sendError } = require('../utils/response');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');
const { z } = require('zod');

function errorMiddleware(error, c) {
  if (error instanceof z.ZodError) {
    const errors = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    return sendError(c, 'Validation failed', 400, JSON.stringify(errors));
  }

  if (error instanceof AppError) {
    return sendError(c, error, error.statusCode);
  }

  if (error instanceof Error) {
    logger.error('Unhandled error', error);
    return sendError(c, error, 500);
  }

  logger.error('Unknown error', error);
  return sendError(c, 'An unexpected error occurred', 500);
}

module.exports = { errorMiddleware };
