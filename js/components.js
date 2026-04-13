/**
 * Components Module
 * Reusable HTML generators - returns DOM elements or HTML strings
 */

const Components = {
    coinCard(coin) {
        const isPositive = coin.price_change_percentage_24h >= 0;
        const changeClass = isPositive ? 'positive' : 'negative';
        const changeSymbol = isPositive ? '▲' : '▼';
        
        const card = UI.createElement('div', ['coin-card'], { 'data-id': coin.id });
        
        const header = UI.createElement('div', ['coin-header']);
        const icon = UI.createElement('img', ['coin-icon'], { src: coin.image, alt: coin.name });
        const info = UI.createElement('div', ['coin-info']);
        const name = UI.createElement('h3', [], { textContent: coin.name });
        const symbol = UI.createElement('span', ['coin-symbol'], { textContent: coin.symbol.toUpperCase() });
        info.append(name, symbol);
        header.append(icon, info);
        
        const price = UI.createElement('div', ['coin-price'], { textContent: CONFIG.formatCurrency(coin.current_price) });
        const change = UI.createElement('div', ['coin-change', changeClass], {
            textContent: `${changeSymbol} ${Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%`
        });
        
        card.append(header, price, change);
        
        // Add sparkline if available
        if (coin.sparkline_in_7d?.price) {
            const prices = coin.sparkline_in_7d.price;
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            const range = max - min || 1;
            const points = prices.map((p, i) => `${(i / (prices.length - 1)) * 100},${100 - ((p - min) / range) * 100}`).join(' ');
            const color = isPositive ? '#10b981' : '#ef4444';
            
            const sparkline = UI.createElement('div', ['coin-sparkline']);
            sparkline.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline fill="none" stroke="${color}" stroke-width="2" points="${points}"/></svg>`;
            card.appendChild(sparkline);
        }
        
        return card;
    },
    
    skeletonCard() {
        const card = UI.createElement('div', ['skeleton-card']);
        const header = UI.createElement('div', ['skeleton-header']);
        const circle = UI.createElement('div', ['skeleton-circle']);
        const lines = UI.createElement('div', ['skeleton-lines']);
        lines.append(
            UI.createElement('div', ['skeleton-line']),
            UI.createElement('div', ['skeleton-line', 'short'])
        );
        header.append(circle, lines);
        const price = UI.createElement('div', ['skeleton-price']);
        card.append(header, price);
        return card;
    },
    
    holdingItem(coinId, amount, coinData) {
        const value = amount * (coinData?.current_price || 0);
        const item = UI.createElement('div', ['holding-item']);
        const info = UI.createElement('div', ['holding-info']);
        const name = UI.createElement('span', ['holding-name'], { textContent: coinData?.name || coinId });
        const amt = UI.createElement('span', ['holding-amount'], { textContent: `${amount} ${coinData?.symbol?.toUpperCase() || ''}` });
        info.append(name, amt);
        const val = UI.createElement('span', ['holding-value'], { textContent: CONFIG.formatCurrency(value) });
        item.append(info, val);
        return item;
    },
    
    transactionRow(tx) {
        const isBuy = tx.type === 'buy';
        const row = UI.createElement('div', ['transaction-row', isBuy ? 'buy' : 'sell']);
        const left = UI.createElement('div', ['transaction-left']);
        const type = UI.createElement('span', ['transaction-type'], { textContent: `${isBuy ? '▲ Bought' : '▼ Sold'} ${tx.coin}` });
        const date = UI.createElement('span', ['transaction-date'], { textContent: new Date(tx.date).toLocaleDateString() });
        left.append(type, date);
        const right = UI.createElement('div', ['transaction-right']);
        const amount = UI.createElement('span', ['transaction-amount'], { textContent: `${tx.amount.toFixed(6)} @ ${CONFIG.formatCurrency(tx.price)}` });
        const total = UI.createElement('span', ['transaction-total'], { textContent: CONFIG.formatCurrency(tx.total) });
        right.append(amount, total);
        row.append(left, right);
        return row;
    }
};