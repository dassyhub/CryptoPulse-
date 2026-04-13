/**
 * Main Application Module
 * Entry point - initializes all modules and sets up event listeners
 * Orchestrates interaction between:
 * - API (data fetching)
 * - Store (state management)
 * - UI (view updates)
 * - Components (HTML generation)
 * - Charts (visualizations)
 * - Portfolio (trading logic)
 */

const App = {
    state: {
        coins: [],
        filteredCoins: [],
        selectedCoin: null,
        isLoading: false,
        searchQuery: '',
        chartTimeframe: 7
    },

    init() {
        console.log('🚀 CryptoPulse initializing...');

        Store.init();
        UI.init();

        this.setupEventListeners();
        this.loadDashboard();

        console.log('✅ CryptoPulse ready');
    },

    setupEventListeners() {
        // Search input with debounce
        let searchTimeout;
        UI.elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query) {
                UI.show('clear-search');
            } else {
                UI.hide('clear-search');
            }

            searchTimeout = setTimeout(() => {
                this.handleSearch(query);
            }, CONFIG.UI.SEARCH_DEBOUNCE);
        });

        // Clear search button
        UI.elements.clearSearch.addEventListener('click', () => {
            UI.elements.searchInput.value = '';
            UI.hide('clear-search');
            this.handleSearch('');
        });

        // Reset search button (empty state)
        UI.elements.resetSearch.addEventListener('click', () => {
            UI.elements.searchInput.value = '';
            UI.hide('clear-search');
            this.handleSearch('');
        });

        // Coin cards
        UI.elements.coinGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.coin-card');
            if (card) {
                const coinId = card.dataset.id;
                this.openCoinDetail(coinId);
            }
        });

        // Modal close
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    UI.closeModal(modal.id);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    UI.closeModal(modal.id);
                });
            }
        });

        // Chart timeframe buttons
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const days = parseInt(e.target.dataset.days);
                this.state.chartTimeframe = days;

                if (this.state.selectedCoin) {
                    this.loadPriceChart(this.state.selectedCoin.id, days);
                }
            });
        });

        // Buy/Sell buttons
        document.getElementById('btn-buy').addEventListener('click', () => {
            this.openTradeModal('buy');
        });

        document.getElementById('btn-sell').addEventListener('click', () => {
            this.openTradeModal('sell');
        });

        // Favorite button
        document.getElementById('btn-favorite').addEventListener('click', () => {
            if (this.state.selectedCoin) {
                const isFav = Store.toggleFavorite(this.state.selectedCoin.id);
                this.updateFavoriteButton(isFav);
                UI.showToast(isFav ? 'Added to favorites' : 'Removed from favorites', 'success');
            }
        });

        // Trade confirmation
        document.getElementById('confirm-trade').addEventListener('click', () => {
            this.executeTrade();
        });

        // Trade amount input (live preview)
        document.getElementById('trade-amount').addEventListener('input', (e) => {
            this.updateTradePreview(e.target.value);
        });

        // Toggle balance visibility
        const toggleBtn = document.getElementById('toggle-balance');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = toggleBtn.classList.toggle('hidden-active');
                toggleBtn.textContent = isHidden ? '👁‍🗨' : '👁';
                
                ['total-balance', 'cash-balance-tag', 'total-change'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.toggle('obscured', isHidden);
                });
            });
        }
    },

    async loadDashboard() {
        UI.showLoading();

        try {
            const coins = await API.getTopCoins();
            this.state.coins = coins;
            this.state.filteredCoins = coins;

            this.renderCoinGrid();
            this.renderFavorites();
            this.renderPortfolioSidebar();

            UI.hideLoading();
            UI.show('coin-grid');

        } catch (error) {
            console.error('Failed to load coins:', error);
            UI.hideLoading();
            UI.showToast('Failed to load coins. Please try again.', 'error');
        }
    },

    renderCoinGrid() {
        const grid = UI.elements.coinGrid;
        grid.innerHTML = '';

        if (this.state.filteredCoins.length === 0) {
            UI.showEmpty();
            return;
        }

        UI.hideEmpty();

        this.state.filteredCoins.forEach((coin, index) => {
            const card = Components.coinCard(coin);
            card.style.animationDelay = `${index * 0.04}s`;
            card.classList.add('animate-fade-in');
            grid.appendChild(card);
        });
    },

    /**
     * Render favorites strip below search
     */
    renderFavorites() {
        const favorites = Store.getFavorites();
        let favoritesSection = document.getElementById('favorites-section');

        if (favorites.length === 0) {
            favoritesSection.innerHTML = '';
            favoritesSection.classList.add('hidden');
            return;
        }

        favoritesSection.classList.remove('hidden');

        let html = '<h3 style="margin-bottom: 0.75rem; color: var(--color-text-secondary); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.06em; font-weight: var(--font-semibold);">⭐ Favorites</h3>';
        html += '<div class="favorites-grid">';

        favorites.forEach(favId => {
            const coin = this.state.coins.find(c => c.id === favId);
            if (coin) {
                const isPositive = coin.price_change_percentage_24h >= 0;
                const changeClass = isPositive ? 'positive' : 'negative';
                html += `
                    <div class="favorite-chip" data-id="${coin.id}">
                        <img src="${coin.image}" alt="${coin.name}" class="favorite-icon">
                        <div class="favorite-info">
                            <span class="favorite-symbol">${coin.symbol.toUpperCase()}</span>
                            <span class="favorite-price ${changeClass}">
                                ${CONFIG.formatCurrency(coin.current_price)}
                            </span>
                        </div>
                        <button class="remove-favorite" data-id="${coin.id}" title="Remove from favorites">×</button>
                    </div>
                `;
            }
        });

        html += '</div>';
        favoritesSection.innerHTML = html;

        // Chip click → open detail
        favoritesSection.querySelectorAll('.favorite-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                if (!e.target.classList.contains('remove-favorite')) {
                    this.openCoinDetail(chip.dataset.id);
                }
            });
        });

        // Remove from favorites
        favoritesSection.querySelectorAll('.remove-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                Store.removeFavorite(btn.dataset.id);
                this.renderFavorites();
                UI.showToast('Removed from favorites', 'info');
            });
        });
    },

    /**
     * Render the full portfolio sidebar (balance + chart + holdings + transactions)
     */
    renderPortfolioSidebar() {
        const balance = Store.getBalance();
        const holdings = Store.getHoldings();
        const transactions = Store.getTransactions();

        // --- Balance card ---
        const balanceEl = document.getElementById('total-balance');
        const changeEl = document.getElementById('total-change');
        const cashTagEl = document.getElementById('cash-balance-tag');

        if (cashTagEl) {
            cashTagEl.textContent = `Cash: ${CONFIG.formatCurrency(balance)}`;
        }

        let holdingsValue = 0;
        Object.entries(holdings).forEach(([coinId, amount]) => {
            const coin = this.state.coins.find(c => c.id === coinId);
            if (coin) holdingsValue += amount * coin.current_price;
        });

        const totalValue = balance + holdingsValue;
        const initialBalance = CONFIG.PORTFOLIO.INITIAL_BALANCE;
        const totalChange = ((totalValue - initialBalance) / initialBalance) * 100;

        balanceEl.textContent = CONFIG.formatCurrency(totalValue);
        changeEl.textContent = `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%`;
        changeEl.className = `sidebar-balance-change${totalChange < 0 ? ' negative' : ''}`;

        // --- Allocation chart ---
        const chartEmpty = document.getElementById('portfolio-chart-empty');
        const hasHoldings = Object.keys(holdings).length > 0;

        if (hasHoldings) {
            chartEmpty.classList.add('hidden');
            Charts.initPortfolioChart('portfolio-chart', holdings, this.state.coins);
        } else {
            chartEmpty.classList.remove('hidden');
        }

        // --- Holdings list ---
        const holdingsList = document.getElementById('holdings-list');
        holdingsList.innerHTML = '';

        if (!hasHoldings) {
            holdingsList.innerHTML = '<p class="sidebar-empty-msg">No holdings yet.<br>Click a coin to start trading!</p>';
        } else {
            Object.entries(holdings).forEach(([coinId, amount]) => {
                const coinData = this.state.coins.find(c => c.id === coinId);
                if (coinData) {
                    const item = Components.holdingItem(coinId, amount, coinData);
                    holdingsList.appendChild(item);
                }
            });
        }

        // --- Transactions list ---
        const txList = document.getElementById('transaction-list');
        txList.innerHTML = '';

        if (transactions.length === 0) {
            txList.innerHTML = '<p class="sidebar-empty-msg">No transactions yet.</p>';
        } else {
            transactions.slice(0, 8).forEach(tx => {
                const row = Components.transactionRow(tx);
                txList.appendChild(row);
            });
        }
    },

    handleSearch(query) {
        this.state.searchQuery = query.toLowerCase();

        if (!query) {
            this.state.filteredCoins = this.state.coins;
        } else {
            this.state.filteredCoins = this.state.coins.filter(coin =>
                coin.name.toLowerCase().includes(this.state.searchQuery) ||
                coin.symbol.toLowerCase().includes(this.state.searchQuery)
            );
        }

        this.renderCoinGrid();
    },

    async openCoinDetail(coinId) {
        const coin = this.state.coins.find(c => c.id === coinId);
        if (!coin) return;

        this.state.selectedCoin = coin;

        // Populate modal
        document.getElementById('modal-icon').src = coin.image;
        document.getElementById('modal-name').textContent = coin.name;
        document.getElementById('modal-symbol').textContent = coin.symbol.toUpperCase();
        document.getElementById('modal-price').textContent = CONFIG.formatCurrency(coin.current_price);

        const changeEl = document.getElementById('modal-change');
        const isPositive = coin.price_change_percentage_24h >= 0;
        changeEl.textContent = `${isPositive ? '+' : ''}${(coin.price_change_percentage_24h || 0).toFixed(2)}%`;
        changeEl.className = `change-badge ${isPositive ? 'positive' : 'negative'}`;

        document.getElementById('modal-marketcap').textContent = CONFIG.formatLargeNumber(coin.market_cap);
        document.getElementById('modal-volume').textContent = CONFIG.formatLargeNumber(coin.total_volume);
        document.getElementById('modal-supply').textContent = `${CONFIG.formatCompactNumber(coin.circulating_supply)} ${coin.symbol.toUpperCase()}`;
        document.getElementById('modal-ath').textContent = CONFIG.formatCurrency(coin.ath);

        // Reset timeframe buttons to 7D
        document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.timeframe-btn[data-days="7"]').classList.add('active');
        this.state.chartTimeframe = 7;

        this.updateFavoriteButton(Store.isFavorite(coinId));
        UI.openModal('coin-modal');
        this.loadPriceChart(coinId, this.state.chartTimeframe);
    },

    async loadPriceChart(coinId, days) {
        try {
            const data = await API.getMarketChart(coinId, days);

            if (data && data.prices && data.prices.length > 0) {
                Charts.initPriceChart('price-chart', data, days);
            } else {
                const canvas = document.getElementById('price-chart');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.font = '14px Inter';
                    ctx.fillStyle = '#94a3b8';
                    ctx.textAlign = 'center';
                    ctx.fillText('Chart data unavailable', canvas.width / 2, canvas.height / 2);
                }
            }
        } catch (error) {
            console.error('Failed to load chart:', error);
            UI.showToast('Failed to load chart data', 'error');
        }
    },

    updateFavoriteButton(isFavorite) {
        const btn = document.getElementById('btn-favorite');
        btn.innerHTML = isFavorite ? '★' : '☆';
        btn.style.color = isFavorite ? '#f59e0b' : 'inherit';
    },

    openTradeModal(type) {
        const coin = this.state.selectedCoin;
        if (!coin) return;

        this.tradeType = type;

        const title = document.getElementById('trade-title');
        const confirmBtn = document.getElementById('confirm-trade');
        const amountInput = document.getElementById('trade-amount');
        const amountLabel = amountInput.previousElementSibling;

        title.textContent = `${type === 'buy' ? 'Buy' : 'Sell'} ${coin.name}`;
        confirmBtn.textContent = type === 'buy' ? 'Buy' : 'Sell';
        confirmBtn.className = `btn btn-${type === 'buy' ? 'success' : 'danger'}`;

        // Update label and placeholder (Always USD now)
        amountLabel.textContent = 'Amount (USD)';
        amountInput.placeholder = '0.00';

        if (type === 'buy') {
            document.getElementById('trade-available-balance').textContent = `Available: ${CONFIG.formatCurrency(Store.getBalance())}`;
            document.getElementById('trade-receive').textContent = `+0.00000 ${coin.symbol.toUpperCase()}`;
        } else {
            const holding = Store.getHolding(coin.id);
            const holdingUsd = holding * coin.current_price;
            // Show available balance in USD and native crypto
            document.getElementById('trade-available-balance').textContent = `Available: ${CONFIG.formatCurrency(holdingUsd)} (${holding.toFixed(4)} ${coin.symbol.toUpperCase()})`;
            document.getElementById('trade-receive').textContent = `-0.00000 ${coin.symbol.toUpperCase()}`;
        }

        amountInput.value = '';

        UI.openModal('trade-modal');
    },

    updateTradePreview(amount) {
        const coin = this.state.selectedCoin;
        if (!coin || !amount) return;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        if (this.tradeType === 'buy') {
            // Input is USD → show coins added
            const coinsToReceive = numAmount / coin.current_price;
            document.getElementById('trade-receive').textContent =
                `+${coinsToReceive.toFixed(6)} ${coin.symbol.toUpperCase()}`;
        } else {
            // Input is USD → show coins subtracted
            const coinsToSell = numAmount / coin.current_price;
            const usdToReceive = numAmount * (1 - CONFIG.PORTFOLIO.TRANSACTION_FEE_RATE);
            document.getElementById('trade-receive').textContent =
                `-${coinsToSell.toFixed(6)} ${coin.symbol.toUpperCase()} (Net: ${CONFIG.formatCurrency(usdToReceive)})`;
        }
    },

    executeTrade() {
        const amount = parseFloat(document.getElementById('trade-amount').value);
        const coin = this.state.selectedCoin;

        if (!amount || amount <= 0) {
            UI.showToast('Please enter a valid amount', 'error');
            return;
        }

        let result;
        if (this.tradeType === 'buy') {
            // Buy expects USD amount
            result = Portfolio.buy(coin.id, coin.current_price, amount);
        } else {
            // Sell expects coin amount, so we convert the USD input to coin quantity
            const coinAmount = amount / coin.current_price;
            result = Portfolio.sell(coin.id, coin.current_price, coinAmount);
        }

        if (result.success) {
            UI.showToast(result.message, 'success');
            UI.closeModal('trade-modal');
            UI.closeModal('coin-modal');

            // Refresh the portfolio sidebar immediately
            this.renderPortfolioSidebar();
        } else {
            UI.showToast(result.message, 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});