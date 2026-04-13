/**
 * Configuration Module
 * Centralizes all constants, API endpoints, and default values
 * Benefits: Easy to change API sources, consistent defaults, single source of truth
 */

const CONFIG = {
    // CoinGecko API settings
    API: {
        BASE_URL: 'https://api.coingecko.com/api/v3',
        ENDPOINTS: {
            MARKETS: '/coins/markets',
            COIN_DETAIL: (id) => `/coins/${id}`,
            MARKET_CHART: (id) => `/coins/${id}/market_chart`,
            SEARCH: '/search'
        },
        DEFAULT_PARAMS: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 20,
            page: 1,
            sparkline: true,
            price_change_percentage: '24h'
        },
        CACHE_DURATION: 60000, // 1 minute
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    },
    
    // Portfolio settings
    PORTFOLIO: {
        INITIAL_BALANCE: 10000,
        STORAGE_KEYS: {
            BALANCE: 'cryptopulse_balance',
            HOLDINGS: 'cryptopulse_holdings',
            TRANSACTIONS: 'cryptopulse_transactions',
            FAVORITES: 'cryptopulse_favorites'
        },
        TRANSACTION_FEE_RATE: 0.001, // 0.1%
        MIN_TRANSACTION_USD: 10
    },
    
    // UI settings
    UI: {
        ANIMATION_DURATION: 250,
        SEARCH_DEBOUNCE: 300,
        TOAST_DURATION: 3000,
        CHART_COLORS: {
            primary: '#3b82f6',
            success: '#10b981',
            danger: '#ef4444',
            grid: '#334155',
            text: '#94a3b8'
        }
    },
    
    // Formatting utilities
    formatCurrency: (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    },
    
    formatCompactNumber: (value) => {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 2
        }).format(value);
    },
    
    formatPercentage: (value) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    },
    
    formatLargeNumber: (value) => {
        if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
        if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
        return `$${value.toFixed(2)}`;
    }
};

// Prevent modifications
Object.freeze(CONFIG);
