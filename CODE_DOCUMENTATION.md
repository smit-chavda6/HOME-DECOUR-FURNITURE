 # HOME DECOR FURNITURE - Complete Code Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [File Structure](#file-structure)
3. [HTML Pages](#html-pages)
4. [CSS Architecture](#css-architecture)
5. [JavaScript Functionality](#javascript-functionality)
6. [Features & Functionality](#features--functionality)
7. [Performance Optimizations](#performance-optimizations)
8. [SEO Implementation](#seo-implementation)
9. [Responsive Design](#responsive-design)
10. [Technical Specifications](#technical-specifications)

---

## Project Overview

**HOME DECOR FURNITURE** is a premium furniture e-commerce website built with vanilla HTML, CSS, and JavaScript. The project showcases modern web development practices with a focus on user experience, performance, and accessibility.

### Key Features:
- Responsive design for all devices
- Interactive product gallery with filtering
- Shopping cart functionality
- Contact forms with validation
- SEO optimized structure
- Performance optimizations
- Accessibility features

---

## File Structure

```
HOME DECOR FURNITURE/
├── index.html                 # Homepage
├── gallery.html              # Product gallery page
├── about.html                # About us page
├── contact.html              # Contact page
├── product-details.html      # Individual product page
├── blog.html                 # Blog page
├── faq.html                 # FAQ page
├── checkout.html             # Checkout page
├── CSS/
│   ├── style.css            # Main CSS file (imports all components)
│   ├── reset.css            # CSS reset and base styles
│   ├── navbar.css           # Navigation styles
│   ├── home.css             # Homepage styles
│   ├── gallery.css          # Gallery page styles
│   ├── product-details.css  # Product details styles
│   ├── about.css            # About page styles
│   ├── contact.css          # Contact page styles
│   ├── footer.css           # Footer styles
│   └── layout.css           # Layout and utility styles
├── js/
│   ├── app.js               # Main JavaScript file
│   ├── home.js              # Homepage functionality
│   ├── gallery.js           # Gallery functionality
│   ├── product-details.js   # Product details functionality
│   └── gallery-data.js      # Product data
├── image/                   # Image assets
├── manifest.json            # PWA manifest
├── sitemap.xml             # SEO sitemap
└── README.md               # Project readme
```

---

## HTML Pages

### 1. index.html (Homepage)
**Purpose**: Main landing page showcasing the brand and featured products

**Key Sections**:
- **Navigation**: Responsive navbar with cart functionality
- **Hero Section**: Auto-sliding banner with call-to-action buttons
- **Welcome Section**: Brand introduction with feature highlights
- **Categories**: Shop by room type (Living Room, Dining Room, Bedroom, Office)
- **Why Choose Us**: Value propositions with icons
- **Call to Action**: Final conversion section

**Features**:
- Auto-sliding hero carousel
- Animated content sections
- Category filtering
- Newsletter signup
- Social media integration

### 2. gallery.html (Product Gallery)
**Purpose**: Display all products with filtering and search capabilities

**Key Features**:
- **Filter System**: Filter by room type (All, Living Room, Dining Room, Bedroom, Office)
- **Product Grid**: Responsive grid layout with hover effects
- **Product Cards**: Each card shows image, name, and price
- **Lazy Loading**: Images load as user scrolls
- **Search Functionality**: Real-time product search

**JavaScript Integration**:
- Dynamic filtering without page reload
- Smooth animations and transitions
- Product counter display
- Masonry layout option

### 3. about.html (About Us)
**Purpose**: Company information, history, and team details

**Key Sections**:
- **Hero Section**: Brand story introduction
- **Company History**: Timeline of milestones
- **Mission & Values**: Core company principles
- **Sustainability**: Environmental commitment
- **Team Section**: Management team profiles
- **Testimonials**: Customer reviews
- **Achievements**: Company statistics

**Features**:
- Interactive timeline
- Animated statistics
- Team member profiles
- Customer testimonials carousel

### 4. contact.html (Contact Page)
**Purpose**: Customer support and inquiry handling

**Key Features**:
- **Contact Information**: Address, phone, email display
- **Interactive Map**: Google Maps integration
- **Contact Form**: Multi-field form with validation
- **Business Hours**: Operating schedule
- **Live Chat Widget**: Demo chat functionality

**Form Fields**:
- Full Name (required)
- Email Address (required)
- Phone Number (optional)
- Subject dropdown (required)
- Message textarea (required)

### 5. product-details.html (Product Details)
**Purpose**: Individual product information and purchase options

**Key Features**:
- **Product Images**: High-resolution images with zoom functionality
- **Product Information**: Detailed specifications
- **Quantity Selector**: Adjustable quantity controls
- **Add to Cart**: Shopping cart integration
- **Related Products**: Cross-selling suggestions

**Product Data Includes**:
- Name, price, description
- Material, dimensions, weight
- Color options, warranty information
- High-quality product images

### 6. blog.html (Blog Page)
**Purpose**: Content marketing and SEO enhancement

**Features**:
- Article listings with thumbnails
- Category filtering
- Search functionality
- Pagination system
- Social sharing options

### 7. faq.html (FAQ Page)
**Purpose**: Customer support and information

**Features**:
- Categorized FAQ sections
- Expandable/collapsible answers
- Search functionality
- Contact form integration

### 8. checkout.html (Checkout Page)
**Purpose**: Complete purchase process

**Features**:
- Cart summary
- Shipping information
- Payment options
- Order confirmation
- Email receipt

---

## CSS Architecture

### Modular CSS Structure
The CSS is organized into modular files for maintainability:

#### 1. style.css (Main File)
```css
/* Main CSS File - Imports all component styles */
@import url('reset.css');
@import url('navbar.css');
@import url('home.css');
@import url('gallery.css');
@import url('product-details.css');
@import url('about.css');
@import url('contact.css');
@import url('footer.css');
@import url('layout.css');
```

#### 2. reset.css
- CSS reset for consistent cross-browser styling
- Base typography settings
- Color variables and custom properties
- Global animations and transitions

#### 3. navbar.css
**Features**:
- Responsive navigation design
- Mobile hamburger menu
- Cart icon with item counter
- Smooth scroll effects
- Active page highlighting

**Key Classes**:
- `.navbar`: Main navigation container
- `.navbar-container`: Inner wrapper
- `.navbar-brand`: Logo and brand name
- `.navbar-menu`: Navigation links
- `.hamburger`: Mobile menu toggle
- `.cart-icon`: Shopping cart with counter

#### 4. home.css
**Hero Section**:
- Auto-sliding carousel
- Overlay content with animations
- Navigation buttons and dots
- Responsive image handling

**Welcome Section**:
- Animated content reveal
- Feature grid with icons
- Typography hierarchy
- Hover effects

**Categories Section**:
- Grid layout for room categories
- Image hover effects
- Call-to-action buttons
- Responsive breakpoints

#### 5. gallery.css
**Product Grid**:
- CSS Grid layout
- Staggered animations
- Hover effects and transitions
- Lazy loading support

**Filter System**:
- Button group styling
- Active state indicators
- Smooth transitions
- Mobile-friendly design

#### 6. product-details.css
**Product Layout**:
- Two-column layout (image + details)
- Image zoom functionality
- Quantity controls
- Add to cart styling

**Modal System**:
- Image modal overlay
- Close button functionality
- Keyboard navigation
- Focus management

#### 7. about.css
**Timeline Design**:
- Vertical timeline layout
- Alternating content alignment
- Year indicators
- Smooth animations

**Team Section**:
- Grid layout for team members
- Avatar placeholders
- Hover effects
- Responsive design

#### 8. contact.css
**Contact Form**:
- Multi-column layout
- Input styling and focus states
- Validation feedback
- Submit button animations

**Map Integration**:
- Responsive iframe container
- Border styling
- Loading states

#### 9. footer.css
**Footer Layout**:
- Four-column grid
- Social media icons
- Newsletter signup
- Contact information

**Responsive Design**:
- Mobile-first approach
- Breakpoint management
- Flexible layouts

#### 10. layout.css
**Utility Classes**:
- Container classes
- Spacing utilities
- Typography helpers
- Animation classes

**Global Styles**:
- Body and html styling
- Font loading optimization
- Color scheme
- Animation definitions

---

## JavaScript Functionality

### 1. app.js (Main JavaScript File)
**Core Functionality**:

#### Navigation Management
```javascript
// Hamburger menu functionality
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navbarMenu.classList.toggle('active');
});

// Scroll effect for navbar
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});
```

#### Shopping Cart System
```javascript
// Cart data structure
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Add to cart functionality
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}
```

#### Cart Modal System
- Dynamic modal creation
- Item removal functionality
- Quantity updates
- Checkout integration
- Local storage persistence

#### Notification System
```javascript
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    // Animation and positioning
    // Auto-removal after 3 seconds
}
```

### 2. home.js (Homepage Functionality)
**Hero Carousel**:
```javascript
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');

function showSlide(n) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[n].classList.add('active');
    dots[n].classList.add('active');
}

// Auto-advance slides
setInterval(nextSlide, 5000);
```

**Animation System**:
- Intersection Observer for scroll animations
- Fade-in effects for content sections
- Staggered animations for grid items
- Performance-optimized animations

### 3. gallery.js (Gallery Functionality)
**Filter System**:
```javascript
function filterItems(filter) {
    const items = document.querySelectorAll('.gallery-item');
    
    items.forEach(item => {
        const category = item.dataset.category;
        if (filter === 'all' || category === filter) {
            item.style.display = 'block';
            item.classList.add('animate-in');
        } else {
            item.style.display = 'none';
        }
    });
    
    updateItemCounter();
}
```

**Search Functionality**:
- Real-time search filtering
- Debounced input handling
- Highlighted search results
- No results feedback

**Lazy Loading**:
```javascript
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('loading');
            imageObserver.unobserve(img);
        }
    });
});
```

### 4. product-details.js (Product Details)
**Product Data Management**:
```javascript
const productData = {
    1: {
        name: 'Comfortable Sofa',
        price: 41500,
        image: 'image/toa-heftiba-FV3GConVSss-unsplash.webp',
        description: 'A luxurious and comfortable sofa...',
        material: 'Premium Fabric, Solid Wood Frame',
        dimensions: '200cm W x 90cm H x 100cm D',
        weight: '45 kg',
        color: 'Beige',
        warranty: '3 Years'
    }
    // ... more products
};
```

**Quantity Controls**:
```javascript
function initializeQuantityControls() {
    const quantityInput = document.getElementById('quantity');
    const decreaseBtn = document.getElementById('decrease-btn');
    const increaseBtn = document.getElementById('increase-btn');
    
    decreaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
        updateQuantityButtons();
    });
}
```

**Image Zoom Functionality**:
- Modal overlay for enlarged images
- Keyboard navigation support
- Focus management
- Accessibility features

---

## Features & Functionality

### 1. Responsive Design
**Breakpoints**:
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

**Mobile-First Approach**:
- Flexible grid systems
- Touch-friendly interactions
- Optimized navigation
- Readable typography

### 2. Shopping Cart System
**Features**:
- Local storage persistence
- Real-time quantity updates
- Item removal functionality
- Cart total calculation
- Checkout integration

**Cart Data Structure**:
```javascript
{
    id: 1,
    name: "Comfortable Sofa",
    price: 41500,
    image: "image/product.jpg",
    quantity: 2
}
```

### 3. Product Filtering
**Filter Categories**:
- All Items
- Living Room
- Dining Room
- Bedroom
- Office

**Search Functionality**:
- Real-time filtering
- Product name matching
- Category-based search
- No results handling

### 4. Image Optimization
**Lazy Loading**:
- Intersection Observer API
- Placeholder images
- Progressive loading
- Performance optimization

**Image Formats**:
- WebP for modern browsers
- Fallback to JPEG/PNG
- Responsive images
- Optimized file sizes

### 5. Form Validation
**Contact Form**:
- Required field validation
- Email format checking
- Phone number validation
- Success/error feedback

**Newsletter Signup**:
- Email validation
- Duplicate prevention
- Success confirmation
- Error handling

### 6. Accessibility Features
**ARIA Labels**:
- Navigation landmarks
- Form labels
- Button descriptions
- Modal roles

**Keyboard Navigation**:
- Tab order management
- Focus indicators
- Escape key functionality
- Screen reader support

---

## Performance Optimizations

### 1. Image Optimization
- WebP format for modern browsers
- Lazy loading implementation
- Responsive image sizing
- Compression optimization

### 2. CSS Optimization
- Modular CSS architecture
- Critical CSS inlining
- Unused CSS removal
- Minification ready

### 3. JavaScript Optimization
- Event delegation
- Debounced functions
- Efficient DOM queries
- Memory leak prevention

### 4. Loading Performance
- Font preloading
- Critical resource prioritization
- Async script loading
- Progressive enhancement

---

## SEO Implementation

### 1. Meta Tags
```html
<meta name="description" content="Premium furniture for your home">
<meta name="keywords" content="furniture, home decor, living room, bedroom">
<meta name="author" content="HOME DECOR FURNITURE">
```

### 2. Open Graph Tags
```html
<meta property="og:title" content="HOME DECOR FURNITURE">
<meta property="og:description" content="Premium furniture for your home">
<meta property="og:image" content="image/Logo maker project.webp">
<meta property="og:url" content="https://yourdomain.com">
```

### 3. Structured Data
- Product schema markup
- Organization schema
- Breadcrumb navigation
- Review ratings

### 4. Sitemap
- XML sitemap generation
- All pages included
- Priority and frequency settings
- Search engine submission

---

## Responsive Design

### 1. Mobile Design (320px - 768px)
**Features**:
- Single column layouts
- Touch-friendly buttons
- Simplified navigation
- Optimized typography

**Navigation**:
- Hamburger menu
- Collapsible sections
- Swipe gestures
- Large touch targets

### 2. Tablet Design (768px - 1024px)
**Features**:
- Two-column layouts
- Sidebar navigation
- Medium-sized buttons
- Balanced typography

### 3. Desktop Design (1024px+)
**Features**:
- Multi-column layouts
- Hover effects
- Detailed navigation
- Rich interactions

---

## Technical Specifications

### 1. Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 2. Performance Targets
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

### 3. Accessibility Standards
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios

### 4. Security Features
- Form validation
- XSS prevention
- CSRF protection
- Secure headers

---

## Development Guidelines

### 1. Code Organization
- Modular file structure
- Consistent naming conventions
- Comment documentation
- Version control best practices

### 2. Performance Best Practices
- Minimize HTTP requests
- Optimize images
- Use efficient selectors
- Implement caching strategies

### 3. Maintenance
- Regular dependency updates
- Performance monitoring
- Security audits
- User feedback integration

---

## Future Enhancements

### 1. Planned Features
- User authentication system
- Wishlist functionality
- Product reviews and ratings
- Advanced search filters
- Payment gateway integration

### 2. Technical Improvements
- PWA implementation
- Service worker caching
- Push notifications
- Offline functionality

### 3. Performance Optimizations
- CDN integration
- Image optimization pipeline
- Critical CSS extraction
- Bundle optimization

---

This documentation provides a comprehensive overview of the HOME DECOR FURNITURE website codebase, covering all aspects from file structure to implementation details. The project demonstrates modern web development practices with a focus on user experience, performance, and maintainability. 