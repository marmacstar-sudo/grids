// API Base URL
const API_BASE = '/api';

// Hero Background Image Slider
let currentSlide = 0;
let heroSlides = [];
const slideInterval = 5000; // Change image every 5 seconds
let heroRotationInterval = null;

function rotateBackgroundImages() {
    if (heroSlides.length === 0) return;

    // Remove active class from current slide
    heroSlides[currentSlide].classList.remove('active');

    // Move to next slide
    currentSlide = (currentSlide + 1) % heroSlides.length;

    // Add active class to new slide
    heroSlides[currentSlide].classList.add('active');
}

// Load hero images from gallery API
async function loadHeroImages() {
    const slider = document.getElementById('hero-slider');

    try {
        const response = await fetch(`${API_BASE}/gallery`);
        const images = await response.json();

        if (images.length === 0) {
            // Fallback to a placeholder if no gallery images
            slider.innerHTML = '<div class="hero-slide active" style="background-color: #333;"></div>';
            return;
        }

        // Create slides from gallery images
        slider.innerHTML = images.map((image, index) => {
            const imageSrc = image.image.startsWith('uploads/') ? '/' + image.image : '/' + image.image;
            return `<div class="hero-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${encodeURI(imageSrc)}');"></div>`;
        }).join('');

        // Update heroSlides reference
        heroSlides = document.querySelectorAll('.hero-slide');

        // Start rotation if more than one image
        if (heroSlides.length > 1 && !heroRotationInterval) {
            heroRotationInterval = setInterval(rotateBackgroundImages, slideInterval);
        }

    } catch (error) {
        console.error('Failed to load hero images:', error);
        // Fallback on error
        slider.innerHTML = '<div class="hero-slide active" style="background-image: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);"></div>';
    }
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
let selectedShipping = null;
let shippingRates = [];
let shippingAddress = null;
let shippingContact = null;

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

    // Reset to step 1
    showCartStep(1);
    selectedShipping = null;
    
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

// Show specific cart step
function showCartStep(step) {
    document.getElementById('cart-step-1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('cart-step-2').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('cart-step-3').style.display = step === 3 ? 'block' : 'none';
}

// Continue to shipping step
function showShippingStep() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    showCartStep(2);
}

// Get shipping quote from The Courier Guy
async function getShippingQuote() {
    const form = document.getElementById('shipping-form');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Collect form data
    shippingContact = {
        name: document.getElementById('ship-name').value,
        email: document.getElementById('ship-email').value,
        phone: document.getElementById('ship-phone').value
    };
    
    shippingAddress = {
        streetAddress: document.getElementById('ship-street').value,
        suburb: document.getElementById('ship-suburb').value,
        city: document.getElementById('ship-city').value,
        postalCode: document.getElementById('ship-postal').value,
        province: document.getElementById('ship-province').value
    };

    // Show loading state
    showCartStep(3);
    const optionsContainer = document.getElementById('shipping-options');
    optionsContainer.innerHTML = `
        <div class="shipping-loading">
            <i class="fas fa-spinner"></i>
            <p>Getting shipping quotes...</p>
        </div>
    `;
    
    // Update summary with subtotal
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('summary-subtotal').textContent = `R ${subtotal}`;
    document.getElementById('summary-shipping').textContent = 'Calculating...';
    document.getElementById('summary-total').textContent = `R ${subtotal}`;

    try {
        const response = await fetch(`${API_BASE}/shipping/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...shippingAddress,
                itemCount: cart.length
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get shipping quote');
        }

        const data = await response.json();
        shippingRates = data.rates || [];

        if (shippingRates.length === 0) {
            optionsContainer.innerHTML = `
                <div class="shipping-loading">
                    <p>😔 Sorry, we couldn't find shipping options for your area.</p>
                    <p>Please contact us at <a href="tel:+27674077001">+27 67 407 7001</a></p>
                </div>
            `;
            return;
        }

        // Render shipping options
        optionsContainer.innerHTML = shippingRates.map((rate, index) => `
            <label class="shipping-option" onclick="selectShipping(${index})">
                <input type="radio" name="shipping" value="${index}" ${index === 0 ? 'checked' : ''}>
                <div class="shipping-option-info">
                    <div class="shipping-option-name">${rate.serviceName}</div>
                    <div class="shipping-option-desc">${rate.description || `Est. delivery: ${rate.estimatedDelivery}`}</div>
                </div>
                <div class="shipping-option-price">R ${rate.price.toFixed(2)}</div>
            </label>
        `).join('');

        // Auto-select first option
        selectShipping(0);

    } catch (error) {
        console.error('Shipping quote error:', error);
        optionsContainer.innerHTML = `
            <div class="shipping-loading">
                <p>😔 Couldn't get shipping quotes. Please try again.</p>
                <button class="checkout-btn" onclick="getShippingQuote()" style="margin-top: 15px;">Retry</button>
            </div>
        `;
    }
}

// Select shipping option
function selectShipping(index) {
    selectedShipping = shippingRates[index];
    
    // Update UI
    document.querySelectorAll('.shipping-option').forEach((el, i) => {
        el.classList.toggle('selected', i === index);
        el.querySelector('input').checked = i === index;
    });

    // Update summary
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const shippingCost = selectedShipping.price;
    const total = subtotal + shippingCost;

    document.getElementById('summary-shipping').textContent = `R ${shippingCost.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `R ${total.toFixed(2)}`;

    // Enable pay button
    const payBtn = document.getElementById('pay-btn');
    payBtn.disabled = false;
    payBtn.textContent = `Pay R ${total.toFixed(2)}`;
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

// Checkout via Yoco Payment
async function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    if (!selectedShipping || !shippingAddress || !shippingContact) {
        alert('Please complete shipping details first');
        showCartStep(2);
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const shippingCost = selectedShipping.price;
    const total = subtotal + shippingCost;
    
    const checkoutBtn = document.getElementById('pay-btn');

    // Update button to show loading state
    const originalText = checkoutBtn.textContent;
    checkoutBtn.textContent = 'Processing...';
    checkoutBtn.disabled = true;

    try {
        // 1. Create order with shipping details
        const orderResponse = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart,
                subtotal: subtotal,
                shippingCost: shippingCost,
                total: total,
                customerName: shippingContact.name,
                customerEmail: shippingContact.email,
                customerPhone: shippingContact.phone,
                shippingAddress: shippingAddress,
                shippingService: {
                    code: selectedShipping.serviceCode,
                    name: selectedShipping.serviceName,
                    price: selectedShipping.price,
                    estimatedDelivery: selectedShipping.estimatedDelivery
                }
            })
        });

        if (!orderResponse.ok) {
            throw new Error('Failed to create order');
        }

        const order = await orderResponse.json();

        // 2. Get payment link
        const paymentResponse = await fetch(`${API_BASE}/orders/${order.id}/payment-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!paymentResponse.ok) {
            const error = await paymentResponse.json();
            throw new Error(error.error || 'Failed to create payment link');
        }

        const { paymentUrl } = await paymentResponse.json();

        // 3. Redirect to Yoco payment page
        window.location.href = paymentUrl;

    } catch (error) {
        console.error('Checkout error:', error);
        alert('Failed to process checkout. Please try again.');
        checkoutBtn.textContent = originalText;
        checkoutBtn.disabled = false;
    }
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
                        <img src="${encodeURI(imageSrc)}" alt="${product.name}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22300%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 x=%22150%22 y=%22100%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
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
                    <img src="${encodeURI(imageSrc)}" alt="${image.alt || 'Gallery image'}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22250%22%3E%3Crect fill=%22%23ddd%22 width=%22250%22 height=%22250%22/%3E%3Ctext fill=%22%23999%22 x=%22125%22 y=%22125%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
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
    loadHeroImages();

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
