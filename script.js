// API Base URL
const API_BASE = '/api';

// Hero Background Image Slider
let currentSlide = 0;
const slides = document.querySelectorAll('.hero-slide');
const slideInterval = 5000; // Change image every 5 seconds

function rotateBackgroundImages() {
    // Remove active class from current slide
    slides[currentSlide].classList.remove('active');

    // Move to next slide
    currentSlide = (currentSlide + 1) % slides.length;

    // Add active class to new slide
    slides[currentSlide].classList.add('active');
}

// Start rotation when page loads
if (slides.length > 0) {
    setInterval(rotateBackgroundImages, slideInterval);
}

// Sticky Navbar on Scroll
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add scrolled class when user scrolls down
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const navLinks = document.getElementById('nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
            mobileMenuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

// Shopping Cart
let cart = [];

// Add to Cart
function addToCart(name, price, image) {
    cart.push({ name, price, image });
    updateCartCount();
    showNotification(`${name} added to cart!`);
    saveCart();
}

// Update Cart Count
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    cartCount.textContent = cart.length;
    cartCount.style.animation = 'none';
    setTimeout(() => {
        cartCount.style.animation = 'pulse 0.3s';
    }, 10);
}

// Show Notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #00A859;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s, slideOutRight 0.3s 2.7s;
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
    }

    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .loading-placeholder {
        text-align: center;
        padding: 40px;
        color: #666;
        grid-column: 1 / -1;
    }

    .out-of-stock-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
    }

    .product-card.out-of-stock .add-to-cart-btn {
        background: #ccc;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

// Show Cart
function showCart() {
    const modal = document.getElementById('cart-modal');
    const cartItems = document.getElementById('cart-items');

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <p>Your cart is empty</p>
                <p>🏉 Time to stock up on some braai essentials!</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image.startsWith('uploads/') ? '/' + item.image : item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">R ${item.price}</div>
                </div>
                <button class="remove-item" onclick="removeFromCart(${index})">Remove</button>
            </div>
        `).join('');
    }

    updateCartTotal();
    modal.style.display = 'block';
}

// Update Cart Total
function updateCartTotal() {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cart-total-amount').textContent = `R ${total}`;
}

// Remove from Cart
function removeFromCart(index) {
    const removedItem = cart[index];
    cart.splice(index, 1);
    updateCartCount();
    showCart();
    saveCart();
    showNotification(`${removedItem.name} removed from cart`);
}

// Close Cart
function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

// Checkout via WhatsApp
async function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);

    // Save order to database
    try {
        await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart,
                total: total,
                customerName: 'WhatsApp Customer'
            })
        });
    } catch (error) {
        console.error('Failed to save order:', error);
        // Continue with WhatsApp even if order save fails
    }

    let message = "Hi! I'd like to order the following braai grids:\n\n";

    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - R${item.price}\n`;
    });

    message += `\nTotal: R${total}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Save Cart to LocalStorage
function saveCart() {
    localStorage.setItem('braaiCart', JSON.stringify(cart));
}

// Load Cart from LocalStorage
function loadCart() {
    const savedCart = localStorage.getItem('braaiCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Gallery Functions
let currentImageIndex = 0;
let galleryImages = [];

function openGallery(index) {
    currentImageIndex = index;
    const modal = document.getElementById('gallery-modal');
    const img = document.getElementById('gallery-modal-img');
    const imageSrc = galleryImages[index].image;
    img.src = imageSrc.startsWith('uploads/') ? '/' + imageSrc : imageSrc;
    modal.style.display = 'block';
}

function closeGallery() {
    document.getElementById('gallery-modal').style.display = 'none';
}

function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    const imageSrc = galleryImages[currentImageIndex].image;
    document.getElementById('gallery-modal-img').src = imageSrc.startsWith('uploads/') ? '/' + imageSrc : imageSrc;
}

function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    const imageSrc = galleryImages[currentImageIndex].image;
    document.getElementById('gallery-modal-img').src = imageSrc.startsWith('uploads/') ? '/' + imageSrc : imageSrc;
}

// Load Products from API
async function loadProducts() {
    const container = document.getElementById('products-container');

    try {
        const response = await fetch(`${API_BASE}/products`);
        const products = await response.json();

        if (products.length === 0) {
            container.innerHTML = '<div class="loading-placeholder">No products available at this time.</div>';
            return;
        }

        container.innerHTML = products.map(product => {
            const imageSrc = product.image.startsWith('uploads/') ? '/' + product.image : '/' + product.image;
            const badgeClass = product.badgeType === 'best-value' ? 'best-value' :
                              product.badgeType === 'premium' ? 'premium' : '';
            const escapedName = product.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const escapedImage = product.image.replace(/'/g, "\\'").replace(/"/g, '&quot;');

            return `
                <div class="product-card ${!product.inStock ? 'out-of-stock' : ''}" data-product="${product.id}">
                    ${product.badge ? `<div class="product-badge ${badgeClass}">${product.badge}</div>` : ''}
                    <div class="product-image">
                        <img src="${encodeURI(imageSrc)}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                        ${!product.inStock ? '<div class="out-of-stock-overlay">OUT OF STOCK</div>' : ''}
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        ${product.tag ? `<p class="product-tag"><i class="${product.tagIcon || 'fas fa-star'}"></i> ${product.tag}</p>` : ''}
                        <p class="product-description">${product.description}</p>
                        <div class="product-specs">
                            ${(product.specs || []).map(spec => `<span>✓ ${spec}</span>`).join('')}
                        </div>
                        <div class="product-footer">
                            <span class="product-price">R ${product.price}</span>
                            <button class="add-to-cart-btn"
                                    onclick="addToCart('${escapedName}', ${product.price}, '${escapedImage}')"
                                    ${!product.inStock ? 'disabled' : ''}>
                                ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Re-add scroll animation observer for new products
        setupScrollAnimation();

    } catch (error) {
        console.error('Failed to load products:', error);
        container.innerHTML = '<div class="loading-placeholder">Failed to load products. Please refresh the page.</div>';
    }
}

// Load Gallery from API
async function loadGallery() {
    const container = document.getElementById('gallery-container');

    try {
        const response = await fetch(`${API_BASE}/gallery`);
        galleryImages = await response.json();

        if (galleryImages.length === 0) {
            container.innerHTML = '<div class="loading-placeholder" style="color: rgba(255,255,255,0.6);">No gallery images available.</div>';
            return;
        }

        container.innerHTML = galleryImages.map((image, index) => {
            const imageSrc = image.image.startsWith('uploads/') ? '/' + image.image : '/' + image.image;
            return `
                <div class="gallery-item" onclick="openGallery(${index})">
                    <img src="${encodeURI(imageSrc)}" alt="${image.alt || 'Gallery image'}" onerror="this.src='https://via.placeholder.com/250x250?text=No+Image'">
                </div>
            `;
        }).join('');

        // Re-add scroll animation observer for new gallery items
        setupScrollAnimation();

    } catch (error) {
        console.error('Failed to load gallery:', error);
        container.innerHTML = '<div class="loading-placeholder" style="color: rgba(255,255,255,0.6);">Failed to load gallery. Please refresh the page.</div>';
    }
}

// Setup scroll animation for dynamically loaded elements
function setupScrollAnimation() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.product-card, .feature-card, .gallery-item').forEach(el => {
        if (!el.dataset.observed) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
            el.dataset.observed = 'true';
        }
    });
}

// Contact Form
function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    showNotification('Message sent! We\'ll be in touch soon! 🏉');
    form.reset();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    loadProducts();
    loadGallery();

    // Cart button click
    document.querySelector('.cart-btn').addEventListener('click', function(e) {
        e.preventDefault();
        showCart();
    });

    // Close modals when clicking outside
    window.onclick = function(event) {
        const cartModal = document.getElementById('cart-modal');
        const galleryModal = document.getElementById('gallery-modal');

        if (event.target === cartModal) {
            closeCart();
        }
        if (event.target === galleryModal) {
            closeGallery();
        }
    }

    // Keyboard navigation for gallery
    document.addEventListener('keydown', function(e) {
        const galleryModal = document.getElementById('gallery-modal');
        if (galleryModal.style.display === 'block') {
            if (e.key === 'ArrowRight') {
                nextImage();
            } else if (e.key === 'ArrowLeft') {
                prevImage();
            } else if (e.key === 'Escape') {
                closeGallery();
            }
        }

        const cartModal = document.getElementById('cart-modal');
        if (cartModal.style.display === 'block' && e.key === 'Escape') {
            closeCart();
        }
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#cart') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Initial scroll animation setup for static elements
    setupScrollAnimation();
});

// Parallax effect for hero section
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-content');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        hero.style.opacity = 1 - (scrolled / 500);
    }
});
