# Braai Grids SA UI/UX Specification

**Version:** 1.0  
**Date:** October 10, 2025  
**Author:** Sally (UX Expert)

---

## Introduction

This document defines the user experience goals, information architecture, user flows, and visual design specifications for **Braai Grids SA**'s user interface. It serves as the foundation for visual design and frontend development, ensuring a cohesive and user-centered experience.

**Project Context:**  
Braai Grids SA is an e-commerce website selling premium stainless steel braai (BBQ) grids. The site targets South African consumers who embrace outdoor lifestyle, rugby culture, hunting, nature, and bush experiences. Products include dishwasher-safe grids with sliding handles in various sizes.

---

## Overall UX Goals & Principles

### Target User Personas

1. **The Braai Master (Primary)**
   - Age: 30-55
   - Weekend warriors who take pride in hosting braais for family and friends
   - Value quality tools, rugby culture, and the South African outdoor lifestyle
   - Tech-savvy enough to shop online but prefer straightforward experiences

2. **The Outdoor Enthusiast**
   - Age: 25-50
   - Hunters, campers, and nature lovers who braai in remote locations (bush, game reserves, camping trips)
   - Need durable, portable equipment
   - Appreciate products that fit their rugged lifestyle

3. **The Rugby Fan**
   - Age: 25-60
   - Sports enthusiasts who host game-day braais
   - Connect rugby culture with outdoor cooking traditions
   - Respond to Springbok-themed marketing and rugby language

4. **The Gift Buyer**
   - Age: 25-65
   - Looking for unique, practical gifts for Father's Day, birthdays, or housewarmings
   - Need clear product information and quick checkout

### Usability Goals

1. **Ease of Discovery:** Users can identify the right braai grid for their needs within 30 seconds
2. **Confidence in Purchase:** Product specs, dimensions, and use cases are clear enough that users feel confident ordering online
3. **Emotional Connection:** The design resonates with South African identity, outdoor culture, and rugby passion
4. **Frictionless Checkout:** From adding to cart to completing order via WhatsApp takes less than 2 minutes
5. **Mobile-First:** 70% of SA e-commerce traffic is mobile - experience must be excellent on smartphones

### Design Principles

1. **Authentically South African** - Embrace SA culture without clichés. Use Springbok colors, rugby language, and outdoor imagery
2. **Rugged Elegance** - Balance tough outdoor aesthetic with clean, modern design
3. **Show, Don't Just Tell** - Use lifestyle imagery showing grids in action
4. **Trust Through Transparency** - Clear dimensions, honest product info, real photos
5. **Effortless Navigation** - Users should never feel lost

---

## Information Architecture

### Site Map

```
Home
├── Hero Section (With CTA)
├── Features Overview
├── Products
│   ├── The Braai Broodjie (R470)
│   ├── The Try Scorer (R160)
│   └── The Big One (R860)
├── Use Cases / Lifestyle Gallery
│   ├── Game Day Braais
│   ├── Bush/Camping Braais
│   ├── Home Entertainment
│   └── Hunting Lodge
├── About Us / Story
├── Gallery (Products in Action)
├── Testimonials
├── Contact
└── Cart/Checkout (WhatsApp)
```

### Navigation Structure

**Primary Navigation:** Sticky header with logo, Products, Gallery, About, Contact, Cart icon
**Mobile Navigation:** Hamburger menu with same structure
**Footer Navigation:** Quick links, contact info, social media, shipping info

---

## Branding & Style Guide

### Visual Identity

**Brand Essence:** Rugged South African outdoor heritage meets modern quality craftsmanship

### Color Palette

| Color Type | Hex Code | Usage |
|------------|----------|-------|
| Springbok Green (Primary) | #007749 | Primary buttons, headings, brand elements |
| Springbok Gold (Accent) | #FFB81C | CTAs, highlights, badges, active states |
| Dark Green | #005234 | Hero backgrounds, footer, dark sections |
| Bush Brown | #8B6F47 | Secondary accents, natural elements |
| Sunset Orange | #D2691E | Hunt/adventure theme accents |
| Khaki | #C3B091 | Neutral backgrounds, bush theme |
| Charcoal | #2C2C2C | Text, borders |
| Off-White | #F5F5DC | Light backgrounds, contrast |
| Success Green | #00A859 | Confirmations, success messages |
| Error Red | #DC3545 | Errors, warnings |

### Typography

**Font Families:**
- **Primary Headings:** 'Bebas Neue' - Bold, impactful, rugby-style
- **Body Text:** 'Roboto' - Clean, readable, modern
- **Accent/Special:** 'Oswald' - For special callouts and highlights

**Type Scale:**

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| H1 | 3.5-5rem | 700 | 1.1 | Hero titles |
| H2 | 2.5-3rem | 700 | 1.2 | Section titles |
| H3 | 1.5-2rem | 600 | 1.3 | Product names, subsections |
| H4 | 1.25rem | 600 | 1.4 | Card titles |
| Body | 1rem | 400 | 1.6 | Main content |
| Small | 0.875rem | 400 | 1.5 | Captions, labels |
| Button | 1rem | 700 | 1.2 | CTAs |

### Iconography

**Icon Library:** Font Awesome 6 + Custom SA-themed icons
- Rugby ball, Springbok logo, Mountains, Campfire, Braai grid icons
- Minimal, line-style icons for UI elements
- Bold, filled icons for features and categories

### Imagery Style

**Photography Guidelines:**
1. **Lifestyle over Product:** Show grids being used in real contexts
2. **Golden Hour Lighting:** Warm, sunset lighting for outdoor scenes
3. **Authentic South African Settings:** Bushveld, game lodges, home patios, rugby gatherings
4. **Action Shots:** Food cooking, people enjoying, flames and smoke
5. **Natural Color Grading:** Earthy tones, warm highlights, avoid oversaturation

**Image Treatments:**
- Subtle texture overlays (canvas, paper) for bush/heritage feel
- Vignette effects on lifestyle photos
- High contrast for product shots against neutral backgrounds

---

## Key Screen Layouts

### 1. Hero Section (Enhanced)

**Purpose:** Capture attention, establish brand identity, drive action

**Key Elements:**
- Full-screen hero with lifestyle background image (braai around campfire, sunset)
- Textured overlay with rugby field lines pattern
- Bold headline: "FORGED FOR THE FIELD. BUILT FOR THE BRAAI."
- Subheadline emphasizing SA heritage
- Dual CTAs: "Shop Now" (primary) + "Watch Story" (video/secondary)
- Animated scroll indicator with Springbok icon

**Atmosphere:**
- Warm, golden lighting
- Smoke/steam effects
- Subtle particle animations (embers floating)

### 2. Features Section (Enhanced)

**Purpose:** Build trust and highlight product benefits

**Enhanced Layout:**
- Four-column grid (responsive to 2-col, 1-col)
- Each feature card has:
  - Large custom icon (rugby trophy, campfire, shield, etc.)
  - Bold title
  - Descriptive copy
  - "Learn More" link
- Background: Subtle bush/nature texture or camouflage pattern
- Cards have slight elevation on hover with gentle shadow

**New Feature Cards:**
1. **Springbok Strong** - Championship-quality stainless steel
2. **Bush-Ready** - Portable, durable for outdoor adventures
3. **Dishwasher Safe** - Easy cleanup after the game
4. **Sliding Handles** - Flip with confidence, control every turn

### 3. Products Section (Enhanced)

**Purpose:** Showcase products with clear differentiation and CTAs

**Enhanced Layout:**
- Three-column product grid with larger cards
- Each product card includes:
  - High-quality product image with lifestyle context
  - Badge/label (Bestseller, Best Value, Premium)
  - Product name with rugby/hunting theme
  - Descriptive tagline
  - Key specs with icons
  - Size comparison visual
  - Price (large, prominent)
  - Add to Cart button (animated on hover)
  - Quick view icon for specifications

**Product Naming Enhancement:**
- **The Braai Broodjie** → **The Broodjie Grid** (Halftime Special)
- **The Try Scorer** → **The Hunter's Choice** (Multi-Purpose Master)
- **The Big One** → **The Boma King** (Full Team Feast)

**Visual Enhancements:**
- Product cards have subtle border in Springbok gold
- Hover state: slight scale, shadow depth increase
- "New" or "Popular" animated badges
- Size visualization: overlay with common food items

### 4. Use Cases / Lifestyle Section (NEW)

**Purpose:** Show products in real-world scenarios, build emotional connection

**Layout:**
- Full-width alternating image/content sections
- Four scenarios with large lifestyle photography:

1. **Game Day Glory** - Rugby match viewing party, friends around braai
2. **Bush Braai** - Camping/hunting lodge setting, outdoor cooking
3. **Home Hero** - Weekend family braai on patio
4. **Trophy Kitchen** - Indoor use, dishwasher showcase

Each section includes:
- Large hero image (60% width)
- Content area (40% width) with:
  - Icon
  - Headline
  - Descriptive paragraph
  - Recommended product
  - CTA button

### 5. Gallery Section (Enhanced)

**Purpose:** Social proof, user-generated content feel, inspire purchases

**Enhanced Layout:**
- Masonry-style grid (Pinterest-like)
- Mix of product photos, lifestyle shots, customer submissions
- Each image has:
  - Hover overlay with description
  - "Shop This Grid" quick link if product visible
  - Share/save icons
- Filter tabs: All | Product Shots | Game Day | Bush & Camp | Customer Photos

**Interactive Features:**
- Lightbox with swipe navigation
- Image zoom on hover
- Related products suggested in lightbox

### 6. Testimonials Section (NEW)

**Purpose:** Build trust through social proof

**Layout:**
- Carousel with customer reviews
- Each testimonial card includes:
  - Customer name and location (e.g., "Johan from Pretoria")
  - Star rating
  - Quote with emphasis on use case
  - Photo of grid in use (if available)
  - Product they purchased
- Background: Subtle wood texture or bush pattern

### 7. Contact/Footer Section (Enhanced)

**Enhanced Footer:**
- Three-column layout:
  - **About:** Brand story, mission, SA pride
  - **Quick Links:** Products, Shipping, Returns, FAQ
  - **Contact:** WhatsApp, Email, Social media
- Newsletter signup with incentive
- Trust badges: Secure payment, SA-made, Quality guaranteed
- Social proof: "Join 2000+ Happy Braai Masters"
- Instagram feed integration

---

## Component Library

### Core Components

#### 1. Button Component

**Variants:**
- Primary (Springbok Gold, bold)
- Secondary (Outlined, Green)
- Tertiary (Text only)
- Icon Button (Cart, Menu, etc.)

**States:** Default, Hover, Active, Disabled, Loading

**Usage:** Primary for main CTAs, Secondary for supporting actions

#### 2. Product Card

**Purpose:** Display product with all key information

**Variants:**
- Standard (with image, specs, price)
- Featured (larger, more details)
- Compact (for related products)

**States:** Default, Hover (elevated), Selected

#### 3. Navigation Bar

**Purpose:** Primary site navigation

**Variants:**
- Desktop (full menu)
- Mobile (hamburger)
- Sticky (collapsed on scroll)

**States:** Default, Scrolled (background added), Menu Open

#### 4. Badge/Label

**Purpose:** Highlight special attributes

**Variants:**
- Bestseller (Gold)
- Best Value (Orange)
- Premium (Green)
- New (Red)

#### 5. Icon Components

**Purpose:** Visual indicators and enhancements

**Types:**
- Feature icons (shield, trophy, fire, etc.)
- UI icons (cart, menu, search, etc.)
- Social icons (Instagram, Facebook, WhatsApp)
- Custom SA icons (Springbok, rugby ball, protea)

---

## User Flows

### Flow 1: Browse and Purchase

**User Goal:** Find and purchase the right braai grid

**Entry Points:** Homepage hero CTA, Products nav link, Social media ads

**Steps:**
1. User lands on homepage
2. Scrolls through features to build confidence
3. Clicks "Shop Now" or scrolls to products
4. Reviews product cards (compares sizes and prices)
5. Clicks product for more details (optional)
6. Clicks "Add to Cart"
7. Continues shopping or clicks cart icon
8. Reviews cart contents
9. Clicks "Checkout via WhatsApp"
10. WhatsApp opens with pre-filled message
11. User sends message to complete order

**Success Criteria:** User completes WhatsApp message and sends

**Edge Cases:**
- User wants multiple products (cart accommodates)
- User uncertain about size (size comparison tool)
- User has questions (WhatsApp link in nav)
- Cart abandoned (future: email follow-up)

### Flow 2: Mobile Product Discovery

**User Goal:** Quickly find product on mobile while at hardware store or braai

**Entry Points:** Mobile browser, saved link, Google search

**Steps:**
1. User lands on mobile site
2. Hero immediately visible with clear CTA
3. Quick scroll to products (sticky nav for cart)
4. Tap product card for details
5. Review specs and size
6. Add to cart (fixed bottom bar on mobile)
7. Quick cart review (slide-up drawer)
8. Checkout via WhatsApp

**Success Criteria:** Complete purchase in under 2 minutes

**Mobile Optimizations:**
- Larger touch targets (min 44px)
- Bottom-fixed add to cart on product view
- Simplified cart drawer
- One-tap WhatsApp checkout

---

## Responsive Strategy

### Breakpoints

| Breakpoint | Min Width | Max Width | Target Devices |
|------------|-----------|-----------|----------------|
| Mobile | 0px | 767px | Smartphones |
| Tablet | 768px | 1023px | iPad, tablets |
| Desktop | 1024px | 1439px | Laptops, desktops |
| Wide | 1440px+ | - | Large displays |

### Adaptation Patterns

**Layout Changes:**
- Mobile: Single column, stacked sections
- Tablet: Two-column products, side-by-side content
- Desktop: Three-column products, full navigation
- Wide: Max-width container (1440px) centered

**Navigation Changes:**
- Mobile: Hamburger menu, bottom fixed cart
- Tablet: Collapsed menu, visible logo and cart
- Desktop+: Full horizontal navigation

**Content Priority:**
- Mobile: Hero → Products → Contact (features below fold)
- Desktop: All sections visible with scroll

**Image Optimization:**
- Mobile: 480px wide images
- Tablet: 768px wide images  
- Desktop: Full resolution with lazy loading

---

## Animation & Micro-interactions

### Motion Principles

1. **Purposeful, Not Decorative** - Every animation serves a function
2. **Natural Physics** - Use easing that mimics real-world movement
3. **Respectful of User Preferences** - Honor prefers-reduced-motion
4. **Performance First** - Use transform and opacity for smooth 60fps

### Key Animations

1. **Page Load:** Staggered fade-in of sections (150ms delay each)
2. **Hero CTA:** Subtle pulse on button (2s loop, gentle scale)
3. **Product Cards:** Scale up 1.05x on hover (300ms ease-out)
4. **Add to Cart:** Success animation - checkmark bounce, cart icon shake
5. **Cart Badge:** Bounce animation when count increases
6. **Image Gallery:** Smooth fade crossfade (400ms)
7. **Scroll Indicator:** Floating bounce (1.5s loop)
8. **Navigation:** Smooth slide-in on mobile (250ms ease)
9. **Background Elements:** Subtle parallax on hero (slower scroll rate)
10. **Form Focus:** Border color transition (200ms ease)

---

## Accessibility Requirements

### Compliance Target

**Standard:** WCAG 2.1 Level AA

### Key Requirements

**Visual:**
- Color contrast ratios: Minimum 4.5:1 for text, 3:1 for UI components
- Focus indicators: 2px solid outline, high contrast
- Text sizing: Minimum 16px body text, scalable to 200%

**Interaction:**
- Keyboard navigation: All interactive elements accessible via Tab/Enter/Space
- Screen reader support: Proper ARIA labels, semantic HTML, alt text for all images
- Touch targets: Minimum 44x44px for mobile buttons and links

**Content:**
- Alternative text: Descriptive alt text for all product and lifestyle images
- Heading structure: Proper H1-H6 hierarchy, no skipped levels
- Form labels: Associated labels for all inputs, clear error messages

### Testing Strategy

- Automated: Lighthouse, axe DevTools for initial scan
- Manual: Keyboard-only navigation test, screen reader test (NVDA/JAWS)
- Color: Contrast checker for all text/background combinations
- Real users: Testing with users who use assistive technologies

---

## Performance Considerations

### Performance Goals

- **Initial Page Load:** Under 2 seconds on 3G
- **Largest Contentful Paint (LCP):** Under 2.5 seconds
- **First Input Delay (FID):** Under 100ms
- **Cumulative Layout Shift (CLS):** Under 0.1
- **Animation FPS:** Consistent 60fps

### Design Strategies

1. **Image Optimization:**
   - WebP format with JPEG fallback
   - Responsive images with srcset
   - Lazy loading for below-fold images
   - Blur-up placeholder technique

2. **Font Loading:**
   - Preload critical fonts (Bebas Neue, Roboto)
   - Use font-display: swap
   - Subset fonts for only needed characters

3. **Critical CSS:**
   - Inline above-the-fold styles
   - Defer non-critical CSS
   - Remove unused styles

4. **JavaScript:**
   - Defer non-essential scripts
   - Minimize main thread work
   - Use Intersection Observer for scroll effects

5. **Third-Party Scripts:**
   - Lazy load WhatsApp widget
   - Defer analytics and tracking
   - Use facade for heavy embeds

---

## Theme Implementation Details

### South African / Rugby Elements

1. **Springbok Color Palette:** Authentic green (#007749) and gold (#FFB81C)
2. **Rugby Field Lines:** Subtle background pattern in hero
3. **Language:** "Try Scorer", "Boma", "Game Day", "Built Springbok Strong"
4. **Icons:** Custom springbok, rugby ball, SA flag subtle references
5. **Typography:** Bold, strong fonts reminiscent of sports jerseys

### Hunting / Nature / Bush Elements

1. **Earthy Color Accents:** Browns, khaki, burnt orange
2. **Textures:** Canvas, leather, wood grain subtle backgrounds
3. **Imagery:** Bush landscapes, campfire scenes, game lodge settings
4. **Icons:** Mountains, wildlife silhouettes, campfire, stars
5. **Patterns:** Camouflage-inspired (subtle, not overt), animal prints (minimal)
6. **Typography:** Rugged but refined, outdoor brand aesthetic

### Balance Strategy

**Avoid:** Cliché overload, tacky hunting graphics, aggressive military aesthetic

**Achieve:** Sophisticated outdoor brand that appeals to modern SA consumers while honoring heritage and outdoor traditions

---

## Next Steps

### Immediate Actions

1. **Review and Approval:** Stakeholder review of this specification
2. **Visual Design Phase:** Create high-fidelity mockups in Figma/Adobe XD
3. **Asset Collection:** Gather lifestyle photography (commission or license)
4. **Icon Design:** Create custom SA-themed icon set
5. **Content Writing:** Write compelling product descriptions and brand story

### Design Handoff Checklist

- [x] All user flows documented
- [x] Component inventory complete
- [x] Accessibility requirements defined
- [x] Responsive strategy clear
- [x] Brand guidelines incorporated
- [x] Performance goals established
- [ ] High-fidelity mockups created
- [ ] Component specifications detailed
- [ ] Interactive prototype built
- [ ] Developer handoff documentation prepared

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-10 | 1.0 | Initial specification created | Sally (UX Expert) |

---

*This specification was created using BMAD™ Core framework.*


