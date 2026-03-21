/**
 * Embed Page Extractor
 * Copyright (c) 2025 Basirul Akhlak Borno - https://github.com/basirulakhlakborno
 * ⚠️ Educational use only. Respect copyright laws.
 */

const { BaseExtractor } = require('./base.extractor');
const { WatchAnimeWorldBase } = require('../base/base');

class EmbedExtractor extends BaseExtractor {
  constructor() {
    super();
    this.base = new WatchAnimeWorldBase();
  }

  getSourceName() {
    return 'watchanimeworld.net';
  }

  async extract(html, url) {
    const $ = this.loadCheerio(html);

    const servers = [];

    // Extract server information from options divs
    $('div[id^="options-"]').each((_, el) => {
      const $option = $(el);
      const optionId = $option.attr('id');
      const optionMatch = optionId.match(/options-(\d+)/);
      
      if (!optionMatch) return;

      const serverNumber = parseInt(optionMatch[1], 10);
      
      // Get iframe src (prefer src, fallback to data-src)
      const iframe = $option.find('iframe').first();
      const iframeSrc = this.extractAttribute(iframe, 'src') || this.extractAttribute(iframe, 'data-src') || '';

      // Get server name from the corresponding tab link
      const serverName = this.extractText($(`a[href="#${optionId}"] .server`).first()).trim();

      if (iframeSrc) {
        servers.push({
          server: serverNumber,
          name: serverName || `Server ${serverNumber}`,
          url: iframeSrc,
        });
      }
    });

    // Filter out servers named "play" (case insensitive) or with problematic domains
    const filteredServers = servers.filter(server => 
      !server.name.toLowerCase().includes('play') &&
      !server.url.includes('play.zephyrflick.top')
    );

    // Sort by server number
    filteredServers.sort((a, b) => a.server - b.server);

    return servers;
  }

  async extractAnimeSalt(html) {
    const $ = this.loadCheerio(html);
    const servers = [];
    
    // Extract iframes (normal or multi-lang)
    $('iframe').each((_, el) => {
      const src = this.extractAttribute($(el), 'src') || '';
      const dataSrc = this.extractAttribute($(el), 'data-src') || '';
      
      if (dataSrc.includes('multi-lang-plyr/player.php?data=')) {
        const base64Data = dataSrc.split('data=')[1];
        if (base64Data) {
          try {
            const decodedStr = Buffer.from(base64Data, 'base64').toString('utf-8');
            const parsed = JSON.parse(decodedStr);
            parsed.forEach((item) => {
              servers.push({
                server: servers.length + 1,
                name: `AnimeSalt Multi (${item.language || 'Unknown'})`,
                url: item.link || ''
              });
            });
          } catch (e) {
            // Ignore parse errors
          }
        }
      } else if (src.includes('as-cdn') || dataSrc.includes('as-cdn') || src.includes('animesalt')) {
        const finalSrc = dataSrc || src;
        servers.push({
          server: servers.length + 1,
          name: 'AnimeSalt Stream',
          url: finalSrc
        });
      }
    });

    const downloads = [];
    $('a[href*="trdownload=1"]').each((_, el) => {
      const href = this.extractAttribute($(el), 'href');
      const trRow = $(el).closest('tr');
      let serverName = 'Download', lang = '', quality = '';
      
      if (trRow.length) {
        const tds = trRow.find('td');
        if (tds.length >= 3) {
          serverName = this.extractText($(tds[0])).trim();
          lang = this.extractText($(tds[1])).trim();
          quality = this.extractText($(tds[2])).trim();
        }
      }
      downloads.push({
        server: serverName,
        lang,
        quality,
        url: href
      });
    });

    return { servers, downloads };
  }

  async getSeriesIdFromEpisodeId(episodeId) {
    // Extract series ID from episode ID (e.g., "spy-x-family-3x1" -> "spy-x-family")
    // Remove season/episode pattern like "-3x1", "-2x12", etc.
    const seriesIdMatch = episodeId.match(/^(.+?)(?:-\d+x\d+)$/);
    if (seriesIdMatch) {
      return seriesIdMatch[1];
    }
    return episodeId;
  }

  async extractFromUrl(id) {
    const { httpClient } = require('../utils/http');
    const { getRandomUserAgent } = require('../config/user-agents');
    const { logger } = require('../utils/logger');

    const fetchExtract = async (baseUrl, id, isAnimeSalt = false) => {
      const episodeUrl = `${baseUrl}/episode/${id}/`;
      
      try {
        const html = await httpClient.get(episodeUrl, {
          headers: { 'User-Agent': getRandomUserAgent() },
        });

        if (isAnimeSalt) {
          return await this.extractAnimeSalt(html);
        } else {
          const servers = await this.extract(html, episodeUrl);
          return { servers, downloads: [] };
        }
      } catch (error) {
        const is404 = error.response?.status === 404 || 
                      error.status === 404 || 
                      error.message?.includes('404') ||
                      error.code === 'ENOTFOUND';
        
        if (is404) {
          const seriesId = await this.getSeriesIdFromEpisodeId(id);
          const detailUrls = [
            `${baseUrl}/series/${seriesId}/`,
            `${baseUrl}/movies/${seriesId}/`,
          ];

          let lastDetailError;
          for (const detailUrl of detailUrls) {
            try {
              const detailHtml = await httpClient.get(detailUrl, {
                headers: { 'User-Agent': getRandomUserAgent() },
              });

              if (isAnimeSalt) {
                return await this.extractAnimeSalt(detailHtml);
              } else {
                const servers = await this.extract(detailHtml, detailUrl);
                return { servers, downloads: [] };
              }
            } catch (detailError) {
              lastDetailError = detailError;
              continue;
            }
          }
          if (lastDetailError) throw lastDetailError;
        }
        throw error;
      }
    };

    // Fetch from both sites concurrently
    const animeSaltBaseUrl = 'https://animesalt.ac';
    const [wawData, asData] = await Promise.allSettled([
      fetchExtract(this.base.baseUrl, id, false),
      fetchExtract(animeSaltBaseUrl, id, true)
    ]);

    let finalServers = [];
    let finalDownloads = [];

    if (wawData.status === 'fulfilled') {
      finalServers = finalServers.concat(wawData.value.servers);
    } else {
      logger.error('Error extracting from WatchAnimeWorld', wawData.reason);
    }

    if (asData.status === 'fulfilled') {
      // Re-number the animesalt servers to follow watchanimeworld
      const offset = finalServers.length;
      const asServers = asData.value.servers.map((s, idx) => ({
        ...s,
        server: offset + idx + 1
      }));
      finalServers = finalServers.concat(asServers);
      finalDownloads = asData.value.downloads;
    } else {
      logger.error('Error extracting from AnimeSalt', asData.reason);
    }

    if (wawData.status === 'rejected' && asData.status === 'rejected') {
      throw new Error(`Failed to extract embed data from both sources for: ${id}`);
    }

    return {
      id,
      servers: finalServers,
      downloads: finalDownloads
    };
  }
}

module.exports = { EmbedExtractor };
