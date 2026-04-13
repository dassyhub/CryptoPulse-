/**
 * API Module
 * All CoinGecko API calls centralized here
 * Features:
 * - Fetch with retry logic
 * - In-memory caching (60 seconds)
 * - Error handling with fallback messages
 * - Request/response logging for debugging
 */

const API = {
    cache: new Map(),
    
    async getTopCoins() {
        const url = this.buildUrl(CONFIG.API.ENDPOINTS.MARKETS, CONFIG.API.DEFAULT_PARAMS);
        return this.fetchWithCache(url);
    },
    
    async searchCoins(query) {
        if (!query || query.length < 2) return [];
        const url = this.buildUrl(CONFIG.API.ENDPOINTS.SEARCH, { query });
        const data = await this.fetchWithCache(url);
        return data.coins || [];
    },
    
    async getCoinDetail(id) {
        const url = this.buildUrl(CONFIG.API.ENDPOINTS.COIN_DETAIL(id), {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false
        });
        return this.fetchWithCache(url);
    },
    
    async getMarketChart(id, days = 7) {
        const url = this.buildUrl(CONFIG.API.ENDPOINTS.MARKET_CHART(id), {
            vs_currency: 'usd',
            days: days,
            interval: days <= 7 ? 'hourly' : 'daily'
        });
        console.log('Fetching chart:', url);
        return this.fetchWithCache(url);
    },
    
    buildUrl(endpoint, params) {
        const url = new URL(CONFIG.API.BASE_URL + endpoint);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        });
        return url.toString();
    },
    
    async fetchWithCache(url) {
        const cached = this.cache.get(url);
        if (cached && (Date.now() - cached.timestamp) < CONFIG.API.CACHE_DURATION) {
            return cached.data;
        }
        
        const data = await this.fetchWithRetry(url);
        this.cache.set(url, { data, timestamp: Date.now() });
        return data;
    },
    
    async fetchWithRetry(url, attempt = 1) {
        try {
            const response = await fetch(url);
            
            if (response.status === 429) {
                if (attempt >= CONFIG.API.RETRY_ATTEMPTS) throw new Error('Rate limited');
                await this.delay(CONFIG.API.RETRY_DELAY * 2);
                return this.fetchWithRetry(url, attempt + 1);
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            if (attempt < CONFIG.API.RETRY_ATTEMPTS) {
                await this.delay(CONFIG.API.RETRY_DELAY);
                return this.fetchWithRetry(url, attempt + 1);
            }
            throw error;
        }
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
