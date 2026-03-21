/**
 * Home Page Extractor
 * Copyright (c) 2025 Basirul Akhlak Borno - https://github.com/basirulakhlakborno
 * ⚠️ Educational use only. Respect copyright laws.
 */

const { BaseExtractor } = require('./base.extractor');
const { WatchAnimeWorldBase } = require('../base/base');

class HomeExtractor extends BaseExtractor {
  constructor() {
    super();
    this.base = new WatchAnimeWorldBase();
  }

  getSourceName() {
    return 'watchanimeworld.net';
  }

  extractAnimeItem($, item, includeSeasonEpisodes = false) {
    const title = this.extractText($(item).find('.entry-title').first());
    
    // Support lazy-loaded images
    const imgEl = $(item).find('img').first();
    const image = this.extractAttribute(imgEl, 'data-src') || 
                  this.extractAttribute(imgEl, 'data-lazy-src') || 
                  this.extractAttribute(imgEl, 'src');
                  
    const link = this.extractAttribute($(item).find('a.lnk-blk').first(), 'href');
    const season = this.extractText($(item).find('.post-ql').first());
    const episodes = this.extractText($(item).find('.year').first());

    // Extract ID and type from URL
    let id = '';
    let type = '';
    if (link) {
      const fullUrl = this.base.buildUrl(link);
      // Remove trailing slash and split
      const cleanUrl = fullUrl.replace(/\/$/, '');
      const urlParts = cleanUrl.split('/').filter(part => part);
      id = urlParts[urlParts.length - 1] || '';
      
      // Determine type from URL
      if (fullUrl.includes('/series/')) {
        type = 'series';
      } else if (fullUrl.includes('/movies/') || fullUrl.includes('/movie/')) {
        type = 'movie';
      } else {
        type = 'unknown';
      }
    }

    const result = {
      id: id || '',
      type: type || '',
      title: title || '',
      image: this.normalizeImageUrl(image),
    };

    // Only include season and episodes if they exist and includeSeasonEpisodes is true
    if (includeSeasonEpisodes) {
      if (season) result.season = season;
      if (episodes) result.episodes = episodes;
    }

    return result;
  }


  extractMostWatchedItem($, item, index) {
    const link = this.extractAttribute($(item).find('a.item__card').first(), 'href');
    
    // Support lazy-loaded images
    const imgEl = $(item).find('img').first();
    const image = this.extractAttribute(imgEl, 'data-src') || 
                  this.extractAttribute(imgEl, 'data-lazy-src') || 
                  this.extractAttribute(imgEl, 'src');
                  
    const alt = this.extractAttribute(imgEl, 'alt');
    
    // Extract title from alt attribute (remove "Image " prefix if present)
    let title = alt || '';
    if (title.startsWith('Image ')) {
      title = title.replace(/^Image\s+/, '');
    }
    
    // Extract ID and type from URL
    let id = '';
    let type = '';
    if (link) {
      const fullUrl = this.base.buildUrl(link);
      const urlParts = fullUrl.split('/').filter(part => part);
      id = urlParts[urlParts.length - 1] || '';
      
      // Determine type from URL
      if (fullUrl.includes('/series/')) {
        type = 'series';
      } else if (fullUrl.includes('/movies/') || fullUrl.includes('/movie/')) {
        type = 'movie';
      } else {
        type = 'unknown';
      }
    }

    return {
      id: id || '',
      type: type || '',
      title: title || '',
      image: this.normalizeImageUrl(image),
      rank: index + 1, // 1-based ranking
    };
  }

  async extract(html, url) {
    const $ = this.loadCheerio(html);

    const data = {
      newestDrops: [],
      newAnimeArrivals: [],
      cartoonSeries: [],
      animeMovies: [],
      cartoonFilms: [],
      mostWatchedShows: [],
      mostWatchedFilms: [],
    };

    // Helper to extract items based on section title text to avoid dependency on hardcoded dynamic IDs
    const extractSectionItems = (titleText, targetArray, isFilm = false) => {
      $('.section-title').each((_, el) => {
        if ($(el).text().trim().toLowerCase().includes(titleText.toLowerCase())) {
          const widget = $(el).closest('.widget');
          if (widget.length) {
            // Find both standard items and swiper slide items
            widget.find('.swiper-slide .post, .post, .swiper-slide li article.post, article.post').each((_, postEl) => {
              const item = this.extractAnimeItem($, $(postEl), false);
              if (item.title && (isFilm || item.id)) {
                // Avoid duplicates (by ID if available, else by title)
                const isDuplicate = targetArray.some(existing => {
                  if (item.id && existing.id) return existing.id === item.id;
                  return existing.title === item.title;
                });
                if (!isDuplicate) {
                  targetArray.push(item);
                }
              }
            });
          }
        }
      });
    };

    // Extract Newest Drops first (includes season/episodes)
    $('.section-title').each((_, el) => {
      // Newest drops might be named "Newest Drops" or similar
      if ($(el).text().trim().toLowerCase().includes('newest drops')) {
        const widget = $(el).closest('.widget');
        if (widget.length) {
          widget.find('.swiper-slide, article.post').each((_, postEl) => {
            const item = this.extractAnimeItem($, $(postEl), true);
            if (item.title) {
              const isDuplicate = data.newestDrops.some(existing => existing.title === item.title);
              if (!isDuplicate) data.newestDrops.push(item);
            }
          });
        }
      }
    });

    // Fallback if title check fails (using original selector for Newest Drops)
    if (data.newestDrops.length === 0) {
      $('#widget_list_episodes-5 .swiper-slide, .widget_list_episodes .swiper-slide').each((_, el) => {
        const item = this.extractAnimeItem($, $(el), true);
        if (item.title) {
          data.newestDrops.push(item);
        }
      });
    }

    // Extract New Anime Arrivals
    extractSectionItems('new anime arrivals', data.newAnimeArrivals);

    // Extract Cartoon Series
    extractSectionItems('cartoon series', data.cartoonSeries);

    // Extract Anime Movies
    extractSectionItems('latest anime movies', data.animeMovies);

    // Extract Cartoon Films
    extractSectionItems('fresh cartoon films', data.cartoonFilms, true);

    // Extract Most-Watched Shows (from trendingCustom section)
    // Limit to 10 items
    let showIndex = 0;
    $('#torofilm_wdgt_popular-3 .top-picks__item').each((index, el) => {
      if (showIndex >= 10) return false; // Stop iteration at 10 items
      const item = this.extractMostWatchedItem($, $(el), showIndex);
      if (item.title && item.id) {
        data.mostWatchedShows.push(item);
        showIndex++;
      }
    });

    // Extract Most-Watched Films (if exists, similar structure)
    // Look for similar widget but for movies/films
    // Reset index to 0 for films so ranking starts at 1
    // Limit to 10 items
    let filmIndex = 0;
    $('#torofilm_wdgt_popular-4 .top-picks__item, [id*="popular"][id*="movie"] .top-picks__item, [id*="popular"][id*="film"] .top-picks__item').each((index, el) => {
      if (filmIndex >= 10) return false; // Stop iteration at 10 items
      const item = this.extractMostWatchedItem($, $(el), filmIndex);
      if (item.title && item.id && item.type === 'movie') {
        // Update rank to start from 1 for films
        item.rank = filmIndex + 1;
        data.mostWatchedFilms.push(item);
        filmIndex++;
      }
    });

    return data;
  }

  async extractFromFile(filePath) {
    // Scrape the live website
    const { httpClient } = require('../utils/http');
    const { getRandomUserAgent } = require('../config/user-agents');
    const url = `${this.base.baseUrl}/`;
    
    const html = await httpClient.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
      },
    });
    
    return this.extract(html, url);
  }
}

module.exports = { HomeExtractor };
