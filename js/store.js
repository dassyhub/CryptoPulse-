/**
 * State Management Module (Store)
 * Handles all LocalStorage operations and in-memory state
 * 
 * Data Structure:
 * - Favorites: Array of coin IDs ['bitcoin', 'ethereum']
 * - Balance: Number (USD)
 * - Holdings: Object { 'bitcoin': 0.15, 'ethereum': 2.5 }
 * - Transactions: Array of transaction objects
 */

const Store = {
    _cache: {},
    
    init() {
        // Set defaults if empty
        if (this.getBalance() === null) {
            this.setBalance(CONFIG.PORTFOLIO.INITIAL_BALANCE);
        }
        if (this.getHoldings() === null) {
            this.setHoldings({});
        }
        if (this.getTransactions() === null) {
            this.setTransactions([]);
        }
        if (this.getFavorites() === null) {
            this.setFavorites([]);
        }
    },
    
    // Favorites
    getFavorites() {
        const data = localStorage.getItem(CONFIG.PORTFOLIO.STORAGE_KEYS.FAVORITES);
        return data ? JSON.parse(data) : [];
    },
    
    setFavorites(favorites) {
        localStorage.setItem(CONFIG.PORTFOLIO.STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    },
    
    addFavorite(id) {
        const favorites = this.getFavorites();
        if (!favorites.includes(id)) {
            favorites.push(id);
            this.setFavorites(favorites);
            return true;
        }
        return false;
    },
    
    removeFavorite(id) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(id);
        if (index > -1) {
            favorites.splice(index, 1);
            this.setFavorites(favorites);
            return true;
        }
        return false;
    },
    
    isFavorite(id) {
        return this.getFavorites().includes(id);
    },
    
    toggleFavorite(id) {
        if (this.isFavorite(id)) {
            this.removeFavorite(id);
            return false;
        } else {
            this.addFavorite(id);
            return true;
        }
    },
    
    // Balance
    getBalance() {
        const data = localStorage.getItem(CONFIG.PORTFOLIO.STORAGE_KEYS.BALANCE);
        return data ? parseFloat(data) : CONFIG.PORTFOLIO.INITIAL_BALANCE;
    },
    
    setBalance(amount) {
        localStorage.setItem(CONFIG.PORTFOLIO.STORAGE_KEYS.BALANCE, amount.toString());
    },
    
    updateBalance(amount) {
        this.setBalance(this.getBalance() + amount);
    },
    
    // Holdings
    getHoldings() {
        const data = localStorage.getItem(CONFIG.PORTFOLIO.STORAGE_KEYS.HOLDINGS);
        return data ? JSON.parse(data) : {};
    },
    
    setHoldings(holdings) {
        localStorage.setItem(CONFIG.PORTFOLIO.STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));
    },
    
    updateHoldings(coinId, amount) {
        const holdings = this.getHoldings();
        const current = holdings[coinId] || 0;
        const updated = current + amount;
        
        if (updated <= 0) {
            delete holdings[coinId];
        } else {
            holdings[coinId] = updated;
        }
        
        this.setHoldings(holdings);
    },
    
    getHolding(coinId) {
        return this.getHoldings()[coinId] || 0;
    },
    
    // Transactions
    getTransactions() {
        const data = localStorage.getItem(CONFIG.PORTFOLIO.STORAGE_KEYS.TRANSACTIONS);
        return data ? JSON.parse(data) : [];
    },
    
    setTransactions(transactions) {
        localStorage.setItem(CONFIG.PORTFOLIO.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    },
    
    addTransaction(transaction) {
        const transactions = this.getTransactions();
        transactions.unshift(transaction);
        this.setTransactions(transactions);
    },
    
    // Reset
    reset() {
        Object.values(CONFIG.PORTFOLIO.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.init();
    }
};
