// In The Wild - Community JavaScript
// Using Leaflet + OpenStreetMap (free, no API key required)

// State Management
let memberToken = localStorage.getItem('memberToken');
let currentMember = null;
let allPosts = [];
let map = null;
let markers = [];

// API Base URL
const API_BASE = '/api';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setupMobileMenu();
});

// Initialize page based on current page
async function initializePage() {
    await checkAuth();
    updateNavigation();

    const path = window.location.pathname;

    if (path.includes('login.html')) {
        setupLoginForm();
    } else if (path.includes('register.html')) {
        setupRegisterForm();
    } else if (path.includes('new-post.html')) {
        if (!currentMember) {
            window.location.href = '/wild/login.html';
            return;
        }
        setupNewPostForm();
    } else if (path.includes('profile.html')) {
        loadProfile();
    } else {
        // Main feed page
        loadFeed();
    }
}

// Check authentication status
async function checkAuth() {
    if (!memberToken) {
        currentMember = null;
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/members/verify`, {
            headers: { 'Authorization': `Bearer ${memberToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            currentMember = data.member;
        } else {
            localStorage.removeItem('memberToken');
            memberToken = null;
            currentMember = null;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        currentMember = null;
    }
}

// Update navigation based on auth state
function updateNavigation() {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;

    if (currentMember) {
        const initial = currentMember.displayName.charAt(0).toUpperCase();
        authSection.innerHTML = `
            <div class="user-menu">
                <a href="/wild/new-post.html" class="nav-link"><i class="fas fa-plus"></i> New Post</a>
                <a href="/wild/profile.html" class="user-avatar" title="${currentMember.displayName}">
                    ${currentMember.avatarImage
                        ? `<img src="/${currentMember.avatarImage}" alt="${currentMember.displayName}">`
                        : initial
                    }
                </a>
                <a href="#" class="nav-link" onclick="logout(); return false;"><i class="fas fa-sign-out-alt"></i></a>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <a href="/wild/login.html" class="auth-btn"><i class="fas fa-user"></i> Sign In</a>
        `;
    }
}

// Mobile menu toggle
function setupMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');

    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
}

// Logout
function logout() {
    localStorage.removeItem('memberToken');
    memberToken = null;
    currentMember = null;
    window.location.href = '/wild/';
}

// ===================
// LOGIN PAGE
// ===================
function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE}/members/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('memberToken', data.token);
                window.location.href = '/wild/';
            } else {
                showError(data.error || 'Login failed');
            }
        } catch (error) {
            showError('Unable to connect to server');
        }
    });
}

// ===================
// REGISTER PAGE
// ===================
function setupRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();

        const displayName = document.getElementById('displayName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/members/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = '/wild/login.html';
                }, 2000);
            } else {
                showError(data.error || 'Registration failed');
            }
        } catch (error) {
            showError('Unable to connect to server');
        }
    });
}

// ===================
// FEED PAGE
// ===================
async function loadFeed() {
    const postsContainer = document.getElementById('posts-container');
    const mapContainer = document.getElementById('posts-map');

    if (postsContainer) {
        postsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    }

    try {
        const response = await fetch(`${API_BASE}/travels`);
        allPosts = await response.json();

        renderPosts(postsContainer);

        if (mapContainer && typeof L !== 'undefined') {
            initializeMap(mapContainer, allPosts);
        }
    } catch (error) {
        console.error('Load feed error:', error);
        if (postsContainer) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Unable to load posts</h3>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }
}

function renderPosts(container) {
    if (!container) return;

    if (allPosts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-compass"></i>
                <h3>No adventures yet</h3>
                <p>Be the first to share your travels!</p>
                ${currentMember ? '<a href="/wild/new-post.html" class="new-post-btn"><i class="fas fa-plus"></i> Share Your Adventure</a>' : '<a href="/wild/login.html" class="new-post-btn"><i class="fas fa-user"></i> Sign In to Post</a>'}
            </div>
        `;
        return;
    }

    container.innerHTML = allPosts.map(post => createPostCard(post)).join('');
}

function createPostCard(post) {
    const memberInitial = post.member?.displayName?.charAt(0).toUpperCase() || '?';
    const memberAvatar = post.member?.avatarImage
        ? `<img src="/${post.member.avatarImage}" alt="${post.member.displayName}">`
        : memberInitial;

    const photoCount = post.photos?.length || 0;
    const firstPhoto = post.photos?.[0] || '';
    const date = new Date(post.createdAt).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return `
        <div class="post-card">
            <div class="post-header">
                <a href="/wild/profile.html?id=${post.memberId}" class="post-avatar">${memberAvatar}</a>
                <div class="post-meta">
                    <a href="/wild/profile.html?id=${post.memberId}" class="post-author">${post.member?.displayName || 'Unknown'}</a>
                    <div class="post-date">${date}</div>
                </div>
            </div>
            ${firstPhoto ? `
                <div class="post-images">
                    <img src="/${firstPhoto}" alt="Travel photo" onclick="openImageModal('${firstPhoto}')">
                    ${photoCount > 1 ? `<span class="image-count"><i class="fas fa-images"></i> ${photoCount}</span>` : ''}
                </div>
            ` : ''}
            <div class="post-content">
                <p class="post-description">${escapeHtml(post.description)}</p>
                ${post.location?.placeName ? `
                    <div class="post-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${escapeHtml(post.location.placeName)}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ===================
// MAP FUNCTIONS (Leaflet)
// ===================
function initializeMap(container, posts) {
    // Default center: South Africa
    const defaultCenter = [-28.4793, 24.6727];

    // Create map
    map = L.map(container).setView(defaultCenter, 5);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const bounds = [];

    posts.forEach(post => {
        if (post.location?.lat && post.location?.lng) {
            const position = [post.location.lat, post.location.lng];
            bounds.push(position);

            // Create custom icon with photo
            let icon;
            if (post.photos?.[0]) {
                icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="width: 50px; height: 50px; border-radius: 50%; border: 3px solid #007749; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                        <img src="/${post.photos[0]}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>`,
                    iconSize: [50, 50],
                    iconAnchor: [25, 25]
                });
            } else {
                icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="width: 40px; height: 40px; border-radius: 50%; background: #007749; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });
            }

            const marker = L.marker(position, { icon }).addTo(map);

            // Create popup content
            const popupContent = `
                <div style="max-width: 200px;">
                    ${post.photos?.[0] ? `<img src="/${post.photos[0]}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">` : ''}
                    <strong style="color: #007749;">${post.member?.displayName || 'Unknown'}</strong>
                    <p style="font-size: 12px; color: #666; margin: 5px 0;">${post.description?.substring(0, 80)}${post.description?.length > 80 ? '...' : ''}</p>
                    <p style="font-size: 11px; color: #999;"><i class="fas fa-map-marker-alt"></i> ${post.location?.placeName || 'Location'}</p>
                </div>
            `;

            marker.bindPopup(popupContent);
            markers.push(marker);
        }
    });

    // Fit map to bounds if we have posts
    if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50] });
    } else if (bounds.length === 1) {
        map.setView(bounds[0], 10);
    }
}

// ===================
// NEW POST PAGE
// ===================
let selectedPhotos = [];
let selectedLocation = null;
let locationPicker = null;
let locationMarker = null;

function setupNewPostForm() {
    setupPhotoUpload();
    setupLocationPicker();

    const form = document.getElementById('new-post-form');
    if (form) {
        form.addEventListener('submit', handlePostSubmit);
    }
}

function setupPhotoUpload() {
    const uploadArea = document.getElementById('photo-upload-area');
    const fileInput = document.getElementById('photo-input');
    const previewsContainer = document.getElementById('photo-previews');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        const maxFiles = 5;
        const remaining = maxFiles - selectedPhotos.length;

        if (remaining <= 0) {
            showError('Maximum 5 photos allowed');
            return;
        }

        Array.from(files).slice(0, remaining).forEach(file => {
            if (!file.type.startsWith('image/')) {
                showError('Only image files are allowed');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                showError('File size must be under 5MB');
                return;
            }

            selectedPhotos.push(file);
            addPhotoPreview(file, selectedPhotos.length - 1);
        });

        updateUploadArea();
    }

    function addPhotoPreview(file, index) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.createElement('div');
            preview.className = 'photo-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-photo" onclick="removePhoto(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            previewsContainer.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }

    function updateUploadArea() {
        if (selectedPhotos.length >= 5) {
            uploadArea.style.display = 'none';
        } else {
            uploadArea.style.display = 'block';
        }
    }
}

function removePhoto(index) {
    selectedPhotos.splice(index, 1);
    refreshPhotoPreviews();
}

function refreshPhotoPreviews() {
    const previewsContainer = document.getElementById('photo-previews');
    const uploadArea = document.getElementById('photo-upload-area');

    previewsContainer.innerHTML = '';

    selectedPhotos.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.createElement('div');
            preview.className = 'photo-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-photo" onclick="removePhoto(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            previewsContainer.appendChild(preview);
        };
        reader.readAsDataURL(file);
    });

    uploadArea.style.display = selectedPhotos.length >= 5 ? 'none' : 'block';
}

function setupLocationPicker() {
    const mapContainer = document.getElementById('location-picker-map');
    const searchInput = document.getElementById('location-search-input');
    const searchBtn = document.getElementById('location-search-btn');
    const locationDisplay = document.getElementById('selected-location');

    if (!mapContainer || typeof L === 'undefined') {
        console.log('Leaflet not available');
        return;
    }

    // Initialize map centered on South Africa
    locationPicker = L.map(mapContainer).setView([-28.4793, 24.6727], 5);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(locationPicker);

    // Initialize marker (not visible initially)
    locationMarker = L.marker([0, 0], { draggable: true }).addTo(locationPicker);
    locationMarker.setOpacity(0);

    // Click on map to place marker
    locationPicker.on('click', (e) => {
        placeMarker(e.latlng);
    });

    // Drag marker
    locationMarker.on('dragend', () => {
        reverseGeocode(locationMarker.getLatLng());
    });

    // Search button
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            searchLocation(searchInput.value);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchLocation(searchInput.value);
            }
        });
    }

    function placeMarker(latlng) {
        locationMarker.setLatLng(latlng);
        locationMarker.setOpacity(1);
        reverseGeocode(latlng);
    }

    async function reverseGeocode(latlng) {
        try {
            // Using Nominatim (OpenStreetMap's free geocoding service)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
            const data = await response.json();

            if (data && data.display_name) {
                selectedLocation = {
                    lat: latlng.lat,
                    lng: latlng.lng,
                    placeName: data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.name || 'Selected Location',
                    formattedAddress: data.display_name
                };
                updateLocationDisplay();
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            // Still set the location even if geocoding fails
            selectedLocation = {
                lat: latlng.lat,
                lng: latlng.lng,
                placeName: 'Selected Location',
                formattedAddress: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`
            };
            updateLocationDisplay();
        }
    }

    async function searchLocation(query) {
        if (!query) return;

        try {
            // Using Nominatim for search
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const latlng = L.latLng(parseFloat(result.lat), parseFloat(result.lon));
                locationPicker.setView(latlng, 12);
                placeMarker(latlng);
            } else {
                showError('Location not found');
            }
        } catch (error) {
            console.error('Search error:', error);
            showError('Error searching for location');
        }
    }

    function updateLocationDisplay() {
        if (locationDisplay && selectedLocation) {
            locationDisplay.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <span>${selectedLocation.formattedAddress}</span>
            `;
            locationDisplay.style.display = 'flex';
        }
    }
}

async function handlePostSubmit(e) {
    e.preventDefault();
    hideMessages();

    const description = document.getElementById('description').value;

    if (selectedPhotos.length === 0) {
        showError('Please add at least one photo');
        return;
    }

    if (!selectedLocation) {
        showError('Please select a location on the map');
        return;
    }

    const formData = new FormData();
    formData.append('description', description);
    formData.append('lat', selectedLocation.lat);
    formData.append('lng', selectedLocation.lng);
    formData.append('placeName', selectedLocation.placeName);
    formData.append('formattedAddress', selectedLocation.formattedAddress);

    selectedPhotos.forEach(photo => {
        formData.append('photos', photo);
    });

    try {
        const submitBtn = document.querySelector('.btn-primary');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';

        const response = await fetch(`${API_BASE}/travels`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${memberToken}` },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Post created successfully!');
            setTimeout(() => {
                window.location.href = '/wild/';
            }, 1500);
        } else {
            showError(data.error || 'Failed to create post');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Share Adventure';
        }
    } catch (error) {
        showError('Unable to connect to server');
        const submitBtn = document.querySelector('.btn-primary');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Share Adventure';
    }
}

// ===================
// PROFILE PAGE
// ===================
async function loadProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const memberId = urlParams.get('id') || currentMember?.id;

    if (!memberId) {
        window.location.href = '/wild/login.html';
        return;
    }

    const isOwnProfile = currentMember?.id === memberId;

    try {
        // Load member info
        const memberResponse = await fetch(`${API_BASE}/members/${memberId}/public`);
        const member = await memberResponse.json();

        // Load member's posts
        const postsResponse = await fetch(`${API_BASE}/travels/member/${memberId}`);
        const postsData = await postsResponse.json();

        renderProfile(member, postsData.posts, isOwnProfile);

        // Initialize map with member's posts
        const mapContainer = document.getElementById('profile-map');
        if (mapContainer && typeof L !== 'undefined' && postsData.posts?.length > 0) {
            initializeMap(mapContainer, postsData.posts.map(p => ({ ...p, member })));
        }
    } catch (error) {
        console.error('Load profile error:', error);
        showError('Unable to load profile');
    }
}

function renderProfile(member, posts, isOwnProfile) {
    // Update profile header
    const avatarEl = document.getElementById('profile-avatar');
    const nameEl = document.getElementById('profile-name');
    const bioEl = document.getElementById('profile-bio');
    const postsCountEl = document.getElementById('posts-count');
    const actionsEl = document.getElementById('profile-actions');

    if (avatarEl) {
        const initial = member.displayName?.charAt(0).toUpperCase() || '?';
        avatarEl.innerHTML = member.avatarImage
            ? `<img src="/${member.avatarImage}" alt="${member.displayName}">`
            : initial;
    }

    if (nameEl) nameEl.textContent = member.displayName || 'Unknown';
    if (bioEl) bioEl.textContent = member.bio || 'No bio yet';
    if (postsCountEl) postsCountEl.textContent = posts?.length || 0;

    if (actionsEl) {
        actionsEl.innerHTML = isOwnProfile
            ? '<button class="edit-profile-btn" onclick="openEditProfile()"><i class="fas fa-edit"></i> Edit Profile</button>'
            : '';
    }

    // Render posts
    const postsContainer = document.getElementById('profile-posts');
    if (postsContainer) {
        if (posts && posts.length > 0) {
            postsContainer.innerHTML = posts.map(post => createPostCard({ ...post, member })).join('');
        } else {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-compass"></i>
                    <h3>No adventures yet</h3>
                    ${isOwnProfile ? '<a href="/wild/new-post.html" class="new-post-btn"><i class="fas fa-plus"></i> Share Your First Adventure</a>' : '<p>This member hasn\'t shared any travels yet</p>'}
                </div>
            `;
        }
    }
}

function openEditProfile() {
    alert('Edit profile feature coming soon!');
}

// ===================
// UTILITY FUNCTIONS
// ===================
function showError(message) {
    const errorEl = document.querySelector('.error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function showSuccess(message) {
    const successEl = document.querySelector('.success-message');
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
    }
}

function hideMessages() {
    const errorEl = document.querySelector('.error-message');
    const successEl = document.querySelector('.success-message');
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openImageModal(imagePath) {
    window.open('/' + imagePath, '_blank');
}

// Make functions globally available
window.logout = logout;
window.removePhoto = removePhoto;
window.openImageModal = openImageModal;
window.openEditProfile = openEditProfile;
