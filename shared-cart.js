// ========== SHARED CART MODULE ==========
// This module handles cart synchronization between index.html and c3.html using localStorage

const SharedCart = {
    STORAGE_KEY: 'gourmetverse_cart',
    ORDER_KEY: 'gourmetverse_active_order',
    listeners: [],

    // Initialize cart from localStorage
    init: function(onChange) {
        if (onChange) this.listeners.push(onChange);
        
        // Listen for storage changes from other tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY) {
                const newCart = this.getCart();
                this.listeners.forEach(fn => fn(newCart));
            }
        });
        
        return this.getCart();
    },

    // Get cart from localStorage
    getCart: function() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error reading cart:', e);
            return [];
        }
    },

    // Save cart to localStorage
    saveCart: function(cart) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
            // Notify listeners
            this.listeners.forEach(fn => fn(cart));
        } catch (e) {
            console.error('Error saving cart:', e);
        }
    },

    // Add item to cart
    addItem: function(item) {
        const cart = this.getCart();
        cart.push({
            ...item,
            id: item.id || Date.now(),
            qty: item.qty || 1
        });
        this.saveCart(cart);
        return cart;
    },

    // Remove item from cart by index
    removeItem: function(index) {
        const cart = this.getCart();
        if (index >= 0 && index < cart.length) {
            cart.splice(index, 1);
            this.saveCart(cart);
        }
        return cart;
    },

    // Remove item by ID
    removeById: function(id) {
        const cart = this.getCart();
        const filtered = cart.filter(item => item.id !== id);
        this.saveCart(filtered);
        return filtered;
    },

    // Clear entire cart
    clearCart: function() {
        this.saveCart([]);
        return [];
    },

    // Get cart total
    getTotal: function() {
        const cart = this.getCart();
        return cart.reduce((sum, item) => sum + (parseFloat(item.price) * (item.qty || 1)), 0);
    },

    // Get cart count
    getCount: function() {
        const cart = this.getCart();
        return cart.reduce((count, item) => count + (item.qty || 1), 0);
    },

    // Listen for cart changes
    onCartChange: function(callback) {
        this.listeners.push(callback);
    },

    // ========== ORDER MANAGEMENT ==========
    
    // Save active order
    saveOrder: function(order) {
        try {
            localStorage.setItem(this.ORDER_KEY, JSON.stringify(order));
        } catch (e) {
            console.error('Error saving order:', e);
        }
    },

    // Get active order
    getOrder: function() {
        try {
            const stored = localStorage.getItem(this.ORDER_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error('Error reading order:', e);
            return null;
        }
    },

    // Clear active order
    clearOrder: function() {
        localStorage.removeItem(this.ORDER_KEY);
    },

    // Check if there's an active order
    hasActiveOrder: function() {
        const order = this.getOrder();
        return order !== null && order.status !== 'ready' && order.status !== 'completed';
    }
};

// Make it globally available
if (typeof window !== 'undefined') {
    window.SharedCart = SharedCart;
}
