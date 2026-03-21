/**
 * Details Controller
 * Copyright (c) 2025 Basirul Akhlak Borno - https://github.com/basirulakhlakborno
 * ⚠️ Educational use only. Respect copyright laws.
 */

const { BaseController } = require('./base.controller');
const { logger } = require('../utils/logger');
const { BadRequestError } = require('../utils/errors');
const { DetailsExtractor } = require('../extractors/details.extractor');

class DetailsController extends BaseController {
  async getDetails(c) {
    return await this.execute(c, async () => {
      try {
        const { id } = c.req.param();

        if (!id) {
          throw new BadRequestError('ID parameter is required');
        }

        const detailsExtractor = new DetailsExtractor();
        const detailsData = await detailsExtractor.extractFromUrl(id);

        return c.json(detailsData);
      } catch (error) {
        logger.error('Error extracting details data', error);
        throw new BadRequestError(`Failed to extract details data: ${error.message}`);
      }
    });
  }
}

module.exports = { DetailsController };
