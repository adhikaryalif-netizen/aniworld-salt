/**
 * Home Controller
 * Copyright (c) 2025 Basirul Akhlak Borno - https://github.com/basirulakhlakborno
 * ⚠️ Educational use only. Respect copyright laws.
 */

const { BaseController } = require('./base.controller');
const { sendSuccess } = require('../utils/response');
const { logger } = require('../utils/logger');
const { BadRequestError } = require('../utils/errors');
const { HomeExtractor } = require('../extractors/home.extractor');

class HomeController extends BaseController {
  async home(c) {
    return await this.execute(c, async () => {
      try {
        const homeExtractor = new HomeExtractor();
        const homeData = await homeExtractor.extractFromFile(null);

        return sendSuccess(c, homeData);
      } catch (error) {
        logger.error('Error extracting home page data', error);
        throw new BadRequestError('Failed to extract home page data');
      }
    });
  }
}

module.exports = { HomeController };
