/**
 * UI Utilities Module
 * DOM manipulation helpers and toast notifications
 */

const UI = {
    elements: {},

    init() {
        this.elements.searchInput    = document.getElementById('search-input');
        this.elements.clearSearch    = document.getElementById('clear-search');
        this.elements.coinGrid       = document.getElementById('coin-grid');
        this.elements.loadingState   = document.getElementById('loading-state');
        this.elements.emptyState     = document.getElementById('empty-state');
        this.elements.resetSearch    = document.getElementById('reset-search');
    },

    show(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) element.classList.remove('hidden');
    },

    hide(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) element.classList.add('hidden');
    },

    showLoading() {
        this.hide('coin-grid');
        this.hide('empty-state');
        this.show('loading-state');

        const container = this.elements.loadingState;
        container.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            container.appendChild(Components.skeletonCard());
        }
    },

    hideLoading() {
        this.hide('loading-state');
    },

    showEmpty() {
        this.hide('coin-grid');
        this.hide('loading-state');
        this.show('empty-state');
    },

    hideEmpty() {
        this.hide('empty-state');
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, CONFIG.UI.TOAST_DURATION);
    },

    createElement(tag, classes = [], attributes = {}) {
        const element = document.createElement(tag);
        if (classes.length) element.classList.add(...classes);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'textContent') element.textContent = value;
            else if (key === 'innerHTML') element.innerHTML = value;
            else element.setAttribute(key, value);
        });
        return element;
    }
};
