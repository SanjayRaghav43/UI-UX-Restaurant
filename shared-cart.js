// shared-cart.js
// Shared cart + order history for index.html & admin-login.html

const SharedCart = (function () {
    const CART_KEY = 'gourmetverse_cart';
    const ORDER_HISTORY_KEY = 'gourmetverse_orders';

    const cartListeners = [];

    // ---------- CART HELPERS ----------
    function getCart() {
        try {
            const raw = localStorage.getItem(CART_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.warn('Error reading cart from localStorage', e);
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        // notify listeners
        cartListeners.forEach(cb => {
            try { cb([...cart]); } catch (_) {}
        });
    }

    function addItem(item) {
        const cart = getCart();
        cart.push(item);
        saveCart(cart);
        return cart;
    }

    function removeItem(index) {
        const cart = getCart();
        if (index >= 0 && index < cart.length) {
            cart.splice(index, 1);
            saveCart(cart);
        }
        return cart;
    }

    function clearCart() {
        const cart = [];
        saveCart(cart);
        return cart;
    }

    function onCartChange(cb) {
        if (typeof cb === 'function') cartListeners.push(cb);
    }

    // Sync across tabs / windows
    window.addEventListener('storage', (e) => {
        if (e.key === CART_KEY) {
            const cart = getCart();
            cartListeners.forEach(cb => {
                try { cb([...cart]); } catch (_) {}
            });
        }
    });

    // ---------- ORDER HISTORY HELPERS ----------
    function getOrderHistory() {
        try {
            const raw = localStorage.getItem(ORDER_HISTORY_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.warn('Error reading orders from localStorage', e);
            return [];
        }
    }

    function saveOrderHistory(list) {
        localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(list));
    }

    function nextOrderId(list) {
        if (!list.length) return 1;
        return Math.max(...list.map(o => o.orderId || 0)) + 1;
    }

    function addToOrderHistory(order) {
        const list = getOrderHistory();
        const now = new Date().toISOString();
        const orderId = nextOrderId(list);

        const data = {
            orderId,
            orderDate: now,
            ...order
        };

        list.push(data);
        saveOrderHistory(list);

        return {
            orderId,
            orderDate: now
        };
    }

    function updateOrder(orderId, patch) {
        const list = getOrderHistory();
        const idx = list.findIndex(o => o.orderId === orderId);
        if (idx !== -1) {
            list[idx] = { ...list[idx], ...patch };
            saveOrderHistory(list);
            return list[idx];
        }
        return null;
    }

    function clearOrderHistory() {
        saveOrderHistory([]);
    }

    function deleteFromHistory(orderId) {
        const list = getOrderHistory().filter(o => o.orderId !== orderId);
        saveOrderHistory(list);
    }

    function searchOrders(query) {
        const q = String(query || '').toLowerCase();
        const list = getOrderHistory();
        if (!q) return list;

        return list.filter(o => {
            return (
                (o.customerName && o.customerName.toLowerCase().includes(q)) ||
                (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
                (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
                (String(o.orderId).includes(q)) ||
                (o.paymentMethod && o.paymentMethod.toLowerCase().includes(q)) ||
                (o.transactionId && o.transactionId.toLowerCase().includes(q)) ||
                (o.orderToken && String(o.orderToken).includes(q))
            );
        });
    }

    function filterOrdersByDate(from, to) {
        const list = getOrderHistory();
        if (!from && !to) return list;

        const fromDate = from ? new Date(from + 'T00:00:00') : null;
        const toDate = to ? new Date(to + 'T23:59:59') : null;

        return list.filter(o => {
            if (!o.orderDate) return false;
            const d = new Date(o.orderDate);
            if (fromDate && d < fromDate) return false;
            if (toDate && d > toDate) return false;
            return true;
        });
    }

    function getOrderStats() {
        const list = getOrderHistory();
        const totalOrders = list.length;
        const totalRevenue = list.reduce(
            (sum, o) => sum + (parseFloat(o.totalAmount) || 0),
            0
        );
        const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
        const avgRatingRaw =
            totalOrders
                ? list.reduce((s, o) => s + (o.rating || 0), 0) / totalOrders
                : 0;
        const avgRating = isNaN(avgRatingRaw) ? 0 : avgRatingRaw;

        // today's orders
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayOrders = list.filter(o =>
            o.orderDate && o.orderDate.slice(0, 10) === todayStr
        ).length;

        return {
            totalOrders,
            totalRevenue,
            avgOrderValue,
            avgRating,
            todayOrders
        };
    }

    return {
        CART_KEY,
        ORDER_HISTORY_KEY,

        // cart
        init(cb) {
            if (cb) onCartChange(cb);
            return getCart();
        },
        getCart,
        addItem,
        removeItem,
        clearCart,
        onCartChange,

        // orders
        getOrderHistory,
        addToOrderHistory,
        updateOrder,
        clearOrderHistory,
        deleteFromHistory,
        searchOrders,
        filterOrdersByDate,
        getOrderStats
    };
})();
