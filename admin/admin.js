// Admin Dashboard JavaScript
const API_BASE = '/api';
let authToken = localStorage.getItem('adminToken');

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const navItems = document.querySelectorAll('.nav-item[data-section]');
const sections = document.querySelectorAll('.section');
const pageTitle = document.getElementById('page-title');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.querySelector('.sidebar');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Check authentication
async function checkAuth() {
    if (!authToken) {
        showLogin();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            showDashboard(data.user);
        } else {
            localStorage.removeItem('adminToken');
            showLogin();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showLogin();
    }
}

function showLogin() {
    loginScreen.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
}

function showDashboard(user) {
    loginScreen.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    document.getElementById('user-name').textContent = user.username;
    loadDashboardData();
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            navigateTo(section);
        });
    });

    // Mobile menu
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Product modal
    document.getElementById('add-product-btn').addEventListener('click', () => openProductModal());
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);

    // Gallery modal
    document.getElementById('add-gallery-btn').addEventListener('click', () => openGalleryModal());
    document.getElementById('gallery-form').addEventListener('submit', handleGallerySubmit);

    // Order filter
    document.getElementById('order-status-filter').addEventListener('change', loadOrders);

    // Change password form
    document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);

    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Image preview
    document.getElementById('product-image').addEventListener('change', (e) => previewImage(e, 'product-image-preview'));
    document.getElementById('gallery-image').addEventListener('change', (e) => previewImage(e, 'gallery-image-preview'));

    // Close modal on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAllModals();
        });
    });
}

// Login handler
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            showDashboard(data.user);
            loginForm.reset();
            loginError.textContent = '';
        } else {
            loginError.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Server error. Please try again.';
    }
}

// Logout handler
function handleLogout() {
    authToken = null;
    localStorage.removeItem('adminToken');
    showLogin();
}

// Navigation
function navigateTo(section) {
    // Update nav items
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });

    // Update sections
    sections.forEach(sec => {
        sec.classList.toggle('active', sec.id === `${section}-section`);
    });

    // Update title
    const titles = {
        dashboard: 'Dashboard',
        products: 'Products',
        gallery: 'Gallery',
        orders: 'Orders',
        settings: 'Settings'
    };
    pageTitle.textContent = titles[section] || 'Dashboard';

    // Load section data
    if (section === 'products') loadProducts();
    if (section === 'gallery') loadGallery();
    if (section === 'orders') loadOrders();

    // Close mobile menu
    sidebar.classList.remove('active');
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const [products, gallery, orders] = await Promise.all([
            fetch(`${API_BASE}/products`).then(r => r.json()),
            fetch(`${API_BASE}/gallery`).then(r => r.json()),
            fetch(`${API_BASE}/orders`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }).then(r => r.json())
        ]);

        document.getElementById('total-products').textContent = products.length;
        document.getElementById('total-gallery').textContent = gallery.length;
        document.getElementById('total-orders').textContent = orders.length;

        const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        document.getElementById('total-revenue').textContent = `R ${revenue.toLocaleString()}`;

        // Recent orders
        const recentOrdersContainer = document.getElementById('recent-orders');
        if (orders.length === 0) {
            recentOrdersContainer.innerHTML = '<p class="empty-state">No orders yet</p>';
        } else {
            recentOrdersContainer.innerHTML = orders.slice(0, 5).map(order => `
                <div class="recent-item">
                    <div>
                        <strong>${order.orderNumber}</strong>
                        <p style="font-size: 0.85rem; color: var(--gray-600);">
                            ${order.customerName} - ${new Date(order.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <strong>R ${order.total}</strong>
                        <p><span class="status-badge ${order.status}">${order.status}</span></p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load dashboard error:', error);
    }
}

// Products
async function loadProducts() {
    try {
        const products = await fetch(`${API_BASE}/products`).then(r => r.json());
        const container = document.getElementById('products-list');

        if (products.length === 0) {
            container.innerHTML = '<p class="empty-state">No products yet. Add your first product!</p>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="item-card">
                <img src="/${product.image}" alt="${product.name}" class="item-card-image"
                     onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="item-card-body">
                    <h4 class="item-card-title">${product.name}</h4>
                    <p class="item-card-price">R ${product.price}</p>
                    <span class="item-card-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}">
                        ${product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    <p style="font-size: 0.85rem; color: var(--gray-600);">${product.description.substring(0, 80)}...</p>
                    <div class="item-card-actions">
                        <button class="edit-btn" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="stock-btn" onclick="toggleStock('${product.id}')">
                            <i class="fas fa-boxes"></i> Stock
                        </button>
                        <button class="delete-btn" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load products error:', error);
        showToast('Failed to load products', 'error');
    }
}

function openProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');

    if (product) {
        title.textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-tag').value = product.tag || '';
        document.getElementById('product-tag-icon').value = product.tagIcon || 'fas fa-star';
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-specs').value = (product.specs || []).join('\n');
        document.getElementById('product-badge').value = product.badge || '';
        document.getElementById('product-badge-type').value = product.badgeType || 'bestseller';
        document.getElementById('product-in-stock').checked = product.inStock;

        if (product.image) {
            document.getElementById('product-image-preview').innerHTML =
                `<img src="/${product.image}" alt="Current image">`;
        }
    } else {
        title.textContent = 'Add Product';
        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-image-preview').innerHTML = '';
        document.getElementById('product-in-stock').checked = true;
    }

    modal.classList.add('active');
}

async function editProduct(id) {
    try {
        const product = await fetch(`${API_BASE}/products/${id}`).then(r => r.json());
        openProductModal(product);
    } catch (error) {
        console.error('Edit product error:', error);
        showToast('Failed to load product', 'error');
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('product-id').value;
    const formData = new FormData();

    formData.append('name', document.getElementById('product-name').value);
    formData.append('price', document.getElementById('product-price').value);
    formData.append('tag', document.getElementById('product-tag').value);
    formData.append('tagIcon', document.getElementById('product-tag-icon').value);
    formData.append('description', document.getElementById('product-description').value);
    formData.append('specs', JSON.stringify(
        document.getElementById('product-specs').value.split('\n').filter(s => s.trim())
    ));
    formData.append('badge', document.getElementById('product-badge').value);
    formData.append('badgeType', document.getElementById('product-badge-type').value);
    formData.append('inStock', document.getElementById('product-in-stock').checked);

    const imageFile = document.getElementById('product-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });

        if (response.ok) {
            showToast(id ? 'Product updated!' : 'Product created!', 'success');
            closeAllModals();
            loadProducts();
            loadDashboardData();
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to save product', 'error');
        }
    } catch (error) {
        console.error('Save product error:', error);
        showToast('Failed to save product', 'error');
    }
}

async function toggleStock(id) {
    try {
        const response = await fetch(`${API_BASE}/products/${id}/stock`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showToast('Stock status updated!', 'success');
            loadProducts();
        } else {
            showToast('Failed to update stock', 'error');
        }
    } catch (error) {
        console.error('Toggle stock error:', error);
        showToast('Failed to update stock', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showToast('Product deleted!', 'success');
            loadProducts();
            loadDashboardData();
        } else {
            showToast('Failed to delete product', 'error');
        }
    } catch (error) {
        console.error('Delete product error:', error);
        showToast('Failed to delete product', 'error');
    }
}

// Gallery
async function loadGallery() {
    try {
        const gallery = await fetch(`${API_BASE}/gallery`).then(r => r.json());
        const container = document.getElementById('gallery-list');

        if (gallery.length === 0) {
            container.innerHTML = '<p class="empty-state">No gallery images yet. Add your first image!</p>';
            return;
        }

        container.innerHTML = gallery.map(image => `
            <div class="gallery-card">
                <img src="/${image.image}" alt="${image.alt}"
                     onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'">
                <div class="gallery-card-overlay">
                    <button class="delete-btn" onclick="deleteGalleryImage('${image.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load gallery error:', error);
        showToast('Failed to load gallery', 'error');
    }
}

function openGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    document.getElementById('gallery-form').reset();
    document.getElementById('gallery-image-preview').innerHTML = '';
    modal.classList.add('active');
}

async function handleGallerySubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    const imageFile = document.getElementById('gallery-image').files[0];

    if (!imageFile) {
        showToast('Please select an image', 'error');
        return;
    }

    formData.append('image', imageFile);
    formData.append('alt', document.getElementById('gallery-alt').value || 'Gallery image');

    try {
        const response = await fetch(`${API_BASE}/gallery`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });

        if (response.ok) {
            showToast('Image uploaded!', 'success');
            closeAllModals();
            loadGallery();
            loadDashboardData();
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to upload image', 'error');
        }
    } catch (error) {
        console.error('Upload gallery error:', error);
        showToast('Failed to upload image', 'error');
    }
}

async function deleteGalleryImage(id) {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
        const response = await fetch(`${API_BASE}/gallery/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showToast('Image deleted!', 'success');
            loadGallery();
            loadDashboardData();
        } else {
            showToast('Failed to delete image', 'error');
        }
    } catch (error) {
        console.error('Delete gallery error:', error);
        showToast('Failed to delete image', 'error');
    }
}

// Orders
async function loadOrders() {
    try {
        const statusFilter = document.getElementById('order-status-filter').value;
        let orders = await fetch(`${API_BASE}/orders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        }).then(r => r.json());

        if (statusFilter) {
            orders = orders.filter(o => o.status === statusFilter);
        }

        const container = document.getElementById('orders-list');

        if (orders.length === 0) {
            container.innerHTML = '<p class="empty-state">No orders found</p>';
            return;
        }

        container.innerHTML = `
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td><strong>${order.orderNumber}</strong></td>
                            <td>${order.customerName}</td>
                            <td>${order.items.length} item(s)</td>
                            <td>R ${order.total}</td>
                            <td><span class="status-badge ${order.status}">${order.status}</span></td>
                            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="primary-btn" style="padding: 6px 12px; font-size: 0.8rem;"
                                        onclick="viewOrder('${order.id}')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Load orders error:', error);
        showToast('Failed to load orders', 'error');
    }
}

async function viewOrder(id) {
    try {
        const order = await fetch(`${API_BASE}/orders/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        }).then(r => r.json());

        const modal = document.getElementById('order-modal');
        const content = document.getElementById('order-detail-content');

        content.innerHTML = `
            <div class="order-info">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Email:</strong> ${order.customerEmail || 'N/A'}</p>
                <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Notes:</strong> ${order.notes || 'None'}</p>
            </div>

            <h4>Items</h4>
            <div class="order-items-list">
                ${order.items.map(item => `
                    <div class="order-item">
                        <span>${item.name}</span>
                        <span>R ${item.price}</span>
                    </div>
                `).join('')}
                <div class="order-item" style="font-weight: bold; border-top: 2px solid var(--gray-300); margin-top: 10px; padding-top: 15px;">
                    <span>Total</span>
                    <span>R ${order.total}</span>
                </div>
            </div>

            <div class="order-status-update">
                <select id="order-status-select">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button class="primary-btn" onclick="updateOrderStatus('${order.id}')">
                    Update Status
                </button>
                <button class="danger-btn" onclick="deleteOrder('${order.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;

        modal.classList.add('active');
    } catch (error) {
        console.error('View order error:', error);
        showToast('Failed to load order details', 'error');
    }
}

async function updateOrderStatus(id) {
    const status = document.getElementById('order-status-select').value;

    try {
        const response = await fetch(`${API_BASE}/orders/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            showToast('Order status updated!', 'success');
            closeAllModals();
            loadOrders();
            loadDashboardData();
        } else {
            showToast('Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Update order status error:', error);
        showToast('Failed to update status', 'error');
    }
}

async function deleteOrder(id) {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
        const response = await fetch(`${API_BASE}/orders/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showToast('Order deleted!', 'success');
            closeAllModals();
            loadOrders();
            loadDashboardData();
        } else {
            showToast('Failed to delete order', 'error');
        }
    } catch (error) {
        console.error('Delete order error:', error);
        showToast('Failed to delete order', 'error');
    }
}

// Change password
async function handleChangePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Password changed successfully!', 'success');
            document.getElementById('change-password-form').reset();
        } else {
            showToast(data.error || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Change password error:', error);
        showToast('Failed to change password', 'error');
    }
}

// Utility functions
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function previewImage(e, previewId) {
    const file = e.target.files[0];
    const preview = document.getElementById(previewId);

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Make functions globally available
window.editProduct = editProduct;
window.toggleStock = toggleStock;
window.deleteProduct = deleteProduct;
window.deleteGalleryImage = deleteGalleryImage;
window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrder = deleteOrder;
