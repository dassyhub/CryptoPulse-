/**
 * Portfolio Module (Paper Trading)
 * Business logic for virtual trading
 * Handles:
 * - Buy/Sell calculations
 * - Balance validation
 * - Profit/loss tracking
 * - Transaction recording
 */
const Portfolio = {
    init() {
        console.log('💼 Portfolio initialized');
    },

    buy(coinId, coinPrice, usdAmount) {
        if (usdAmount < CONFIG.PORTFOLIO.MIN_TRANSACTION_USD) {
            return {
                success: false,
                message: `Minimum transaction is ${CONFIG.formatCurrency(CONFIG.PORTFOLIO.MIN_TRANSACTION_USD)}`
            };
        }

        const balance = Store.getBalance();
        const fee = usdAmount * CONFIG.PORTFOLIO.TRANSACTION_FEE_RATE;
        const totalCost = usdAmount + fee;

        if (totalCost > balance) {
            return { success: false, message: 'Insufficient balance (includes 0.1% fee)' };
        }

        const coinAmount = usdAmount / coinPrice;

        Store.updateBalance(-totalCost);
        Store.updateHoldings(coinId, coinAmount);
        Store.addTransaction({
            type: 'buy',
            coin: coinId,
            amount: coinAmount,
            price: coinPrice,
            total: totalCost,
            fee: fee,
            date: new Date().toISOString()
        });

        return {
            success: true,
            message: `Bought ${coinAmount.toFixed(6)} ${coinId} for ${CONFIG.formatCurrency(usdAmount)}`
        };
    },

    sell(coinId, coinPrice, coinAmount) {
        const holding = Store.getHolding(coinId);

        if (coinAmount > holding) {
            return {
                success: false,
                message: `You only have ${holding.toFixed(6)} ${coinId}`
            };
        }

        const usdValue = coinAmount * coinPrice;
        const fee = usdValue * CONFIG.PORTFOLIO.TRANSACTION_FEE_RATE;
        const totalReceived = usdValue - fee;

        Store.updateBalance(totalReceived);
        Store.updateHoldings(coinId, -coinAmount);
        Store.addTransaction({
            type: 'sell',
            coin: coinId,
            amount: coinAmount,
            price: coinPrice,
            total: totalReceived,
            fee: fee,
            date: new Date().toISOString()
        });

        return {
            success: true,
            message: `Sold ${coinAmount.toFixed(6)} ${coinId} for ${CONFIG.formatCurrency(totalReceived)}`
        };
    },

    getBalance() {
        return Store.getBalance();
    },

    getHolding(coinId) {
        return Store.getHolding(coinId);
    },

    getAllHoldings() {
        return Store.getHoldings();
    },

    getHistory() {
        return Store.getTransactions();
    }
};