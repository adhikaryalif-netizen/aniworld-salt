const { logger } = require('./logger');

class HttpClient {
  constructor() {
    this.defaultHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
    };
  }

  async fetchWithRetry(url, options = {}, retries = 0, retryDelay = 1000) {
    let lastError;
    const fetchOptions = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      signal: options.timeout ? AbortSignal.timeout(options.timeout || 30000) : undefined,
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        logger.debug(`HTTP Request: ${fetchOptions.method || 'GET'} ${url}`);
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        logger.debug(`HTTP Response: ${response.status} ${url}`);
        return response;
      } catch (error) {
        lastError = error;
        logger.error(`HTTP Request Error on attempt ${attempt + 1}: ${error.message}`);
        
        if (attempt < retries) {
          logger.warn(`Request failed, retrying... (${attempt + 1}/${retries})`);
          await this.delay(retryDelay * (attempt + 1));
        }
      }
    }

    throw lastError;
  }

  async get(url, options = {}) {
    const fetchOptions = {
      method: 'GET',
      headers: options.headers,
      timeout: options.timeout
    };
    
    const response = await this.fetchWithRetry(url, fetchOptions, options.retries ?? 0, options.retryDelay ?? 1000);
    return await response.text();
  }

  async getBuffer(url, options = {}) {
    const fetchOptions = {
      method: 'GET',
      headers: options.headers,
      timeout: options.timeout
    };
    
    const response = await this.fetchWithRetry(url, fetchOptions, options.retries ?? 0, options.retryDelay ?? 1000);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async post(url, data, options = {}) {
    const fetchOptions = {
      method: 'POST',
      body: typeof data === 'string' ? data : JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: options.timeout
    };
    
    const response = await this.fetchWithRetry(url, fetchOptions, options.retries ?? 0, options.retryDelay ?? 1000);
    return await response.text(); // or json() if intended, keeping it compatible
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

const httpClient = new HttpClient();

module.exports = { httpClient };
