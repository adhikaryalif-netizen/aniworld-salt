/**
 * Embed Controller
 * Copyright (c) 2025 Basirul Akhlak Borno - https://github.com/basirulakhlakborno
 * ⚠️ Educational use only. Respect copyright laws.
 */

const { BaseController } = require('./base.controller');
const { logger } = require('../utils/logger');
const { BadRequestError } = require('../utils/errors');
const { EmbedExtractor } = require('../extractors/embed.extractor');

class EmbedController extends BaseController {
  async getEmbed(c) {
    return await this.execute(c, async () => {
      try {
        const { id } = c.req.param();

        if (!id) {
          throw new BadRequestError('ID parameter is required');
        }

        const embedExtractor = new EmbedExtractor();
        const embedData = await embedExtractor.extractFromUrl(id);

        return c.json(embedData);
      } catch (error) {
        logger.error('Error extracting embed data', error);
        throw new BadRequestError(`Failed to extract embed data: ${error.message}`);
      }
    });
  }
}

module.exports = { EmbedController };
