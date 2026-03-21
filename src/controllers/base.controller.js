const { sendError } = require('../utils/response');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');

class BaseController {
  handleError(error, c) {
    if (error instanceof AppError) {
      return sendError(c, error, error.statusCode);
    }

    if (error instanceof Error) {
      logger.error('Unhandled error in controller', error);
      return sendError(c, error, 500);
    }

    logger.error('Unknown error in controller', error);
    return sendError(c, 'An unexpected error occurred', 500);
  }

  async execute(c, handler) {
    try {
      return await handler();
    } catch (error) {
      return this.handleError(error, c);
    }
  }
}

module.exports = { BaseController };
