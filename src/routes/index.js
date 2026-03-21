const { Hono } = require('hono');
const { ScraperController, HomeController, TypeController, DetailsController, EpisodesController, EmbedController, SearchController } = require('../controllers');
const { validateQuery } = require('../middleware');
const { z } = require('zod');

const apiRouter = new Hono();

const scraperController = new ScraperController();
const homeController = new HomeController();
const typeController = new TypeController();
const detailsController = new DetailsController();
const episodesController = new EpisodesController();
const embedController = new EmbedController();
const searchController = new SearchController();

// Home route
apiRouter.get('/home', (c) => homeController.home(c));

// Details route
apiRouter.get('/info/:id', (c) => detailsController.getDetails(c));

// Episodes route
apiRouter.get('/episodes/:id/:season', (c) => episodesController.getEpisodes(c));

// Embed route
apiRouter.get('/embed/:id', (c) => embedController.getEmbed(c));

// Search route
const searchSchema = z.object({
  suggestion: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
}).refine((data) => data.suggestion || data.q, {
  message: 'Either "suggestion" or "q" parameter is required',
});

apiRouter.get(
  '/search',
  validateQuery(searchSchema),
  (c) => searchController.search(c)
);

const pageSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1'),
});

apiRouter.get(
  '/category/*',
  validateQuery(pageSchema),
  (c) => {
    // Extract type from wildcard path (everything after /category/)
    const pathValue = c.req.path; // e.g., /api/category/language/english/
    const type = pathValue.split('/category/')[1] || '';
    
    // Inject the wildcard path into the req.param structure manually for backward consistency
    c.req.param = function(key) {
      if (key === 'type') return type;
      if (key === 'pathType') return 'category';
      return null;
    };
    return typeController.getType(c);
  }
);

apiRouter.get(
  '/letter/*',
  validateQuery(pageSchema),
  (c) => {
    // Extract letter from wildcard path (everything after /letter/)
    const pathValue = c.req.path;
    const type = pathValue.split('/letter/')[1] || '';
    
    // Inject the wildcard path into the req.param structure manually for backward consistency
    c.req.param = function(key) {
      if (key === 'type') return type;
      if (key === 'pathType') return 'letter';
      return null;
    };
    return typeController.getType(c);
  }
);

// Health check route
apiRouter.get('/health', (c) => scraperController.health(c));

// Scraper routes - GET only
const scrapeSchema = z.object({
  url: z.string().url('Invalid URL format'),
  extractor: z.string().optional(),
});

apiRouter.get(
  '/scrape',
  validateQuery(scrapeSchema),
  (c) => scraperController.scrape(c)
);

module.exports = apiRouter;
