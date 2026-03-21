/**
 * Search Controller
 * Copyright (c) 2025 Basirul Akhlak Borno - https://github.com/basirulakhlakborno
 * ⚠️ Educational use only. Respect copyright laws.
 */

const { BaseController } = require('./base.controller');
const { logger } = require('../utils/logger');
const { BadRequestError } = require('../utils/errors');
const { SearchExtractor } = require('../extractors/search.extractor');

class SearchController extends BaseController {
  async search(c) {
    return await this.execute(c, async () => {
      try {
        const { suggestion, q } = c.req.query();

        if (!suggestion && !q) {
          throw new BadRequestError('Either "suggestion" or "q" parameter is required');
        }

        const searchExtractor = new SearchExtractor();
        let results;

        if (q) {
          // Full page search
          results = await searchExtractor.searchFullPage(q.trim());
        } else {
          // AJAX suggestion search
          results = await searchExtractor.search(suggestion.trim());
        }

        res.status(200).json(results);
      } catch (error) {
        logger.error('Error performing search', error);
        throw new BadRequestError('Failed to perform search');
      }
    });
  }
}

module.exports = { SearchController };
