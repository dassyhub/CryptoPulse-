/**
 * Charts Module
 * Chart.js initialization and updates
 * Handles:
 * - Price charts in modal (7D/30D/1Y)
 * - Portfolio allocation pie chart
 * - Chart configuration and styling
 */

const Charts = {
    // Store chart instances so we can destroy/update them
    instances: {},
    
    /**
     * Initialize price chart in modal
     * @param {string} canvasId - The canvas element ID
     * @param {Object} chartData - Full response from CoinGecko API
     * @param {number} days - Number of days (for labeling)
     */
    initPriceChart(canvasId, chartData, days = 7) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Chart canvas not found:', canvasId);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if there is one
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
            delete this.instances[canvasId];
        }
        
        // Check if we have valid data
        if (!chartData || !chartData.prices || !Array.isArray(chartData.prices)) {
            console.error('Invalid chart data:', chartData);
            this.showError(canvas, 'Chart data unavailable');
            return null;
        }
        
        const prices = chartData.prices;
        console.log('Creating chart with', prices.length, 'data points');
        
        // Extract timestamps and prices from the array format: [[timestamp, price], ...]
        const labels = prices.map(p => {
            const timestamp = p[0];
            const date = new Date(timestamp);
            
            // Format based on timeframe
            if (days === 1) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (days <= 7) {
                return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
            } else {
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
        });
        
        const values = prices.map(p => p[1]);
        
        // Determine color based on price trend (first vs last)
        const startPrice = values[0];
        const endPrice = values[values.length - 1];
        const isPositive = endPrice >= startPrice;
        const color = isPositive ? CONFIG.UI.CHART_COLORS.success : CONFIG.UI.CHART_COLORS.danger;
        
        // Create gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        // Create the chart
        this.instances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price',
                    data: values,
                    borderColor: color,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: color,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: { 
                        display: false 
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#94a3b8',
                        bodyColor: '#f8fafc',
                        borderColor: '#334155',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            title: (context) => {
                                return context[0].label;
                            },
                            label: (context) => {
                                return 'Price: ' + CONFIG.formatCurrency(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: false, // Hide x-axis labels for cleaner look
                        grid: { display: false }
                    },
                    y: {
                        display: true,
                        position: 'right',
                        grid: {
                            color: '#334155',
                            drawBorder: false,
                            tickLength: 0
                        },
                        ticks: {
                            color: '#64748b',
                            callback: (value) => {
                                if (value >= 1000) {
                                    return '$' + (value / 1000).toFixed(1) + 'k';
                                }
                                return '$' + value.toFixed(2);
                            },
                            maxTicksLimit: 6
                        }
                    }
                }
            }
        });
        
        console.log('✅ Chart created successfully');
        return this.instances[canvasId];
    },
    
    /**
     * Show error message on canvas when chart fails to load
     */
    showError(canvas, message) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    },
    
    /**
     * Initialize portfolio allocation pie chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} holdings - User's holdings { coinId: amount }
     * @param {Array} coinData - Current coin data with prices
     */
    initPortfolioChart(canvasId, holdings, coinData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        const labels = [];
        const data = [];
        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
        ];
        
        let colorIndex = 0;
        
        // Add holdings
        Object.entries(holdings).forEach(([coinId, amount]) => {
            const coin = coinData.find(c => c.id === coinId);
            if (coin && amount > 0) {
                labels.push(coin.symbol.toUpperCase());
                data.push(amount * coin.current_price);
                colorIndex++;
            }
        });
        
        // Add USD cash balance
        const balance = Store.getBalance();
        if (balance > 0) {
            labels.push('USD');
            data.push(balance);
        }
        
        // If no data, don't create chart
        if (data.length === 0) {
            return null;
        }
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        bodyColor: '#f8fafc',
                        borderColor: '#334155',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${CONFIG.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
        
        return this.instances[canvasId];
    },
    
    /**
     * Destroy a chart instance
     * @param {string} chartId - Canvas ID
     */
    destroy(chartId) {
        if (this.instances[chartId]) {
            this.instances[chartId].destroy();
            delete this.instances[chartId];
        }
    }
};