# Home Decor Furniture Platform - Core Code Snippets & Documentation 
This document provides all the essential code snippets, folder structures, and architectural details required for creating your academic project documentation.

## Snippet Index Table

| Section No. | Section Title | Focus Area |
|---|---|---|
| 1 | Project Overview & File Structure | Architecture and folder layout |
| 2 | Backend Environment & Entry Point | Express setup, middleware, MongoDB |
| 3 | Database Schemas | User, Product, Order models |
| 4 | Basic API Controllers | Register/Login API patterns |
| 5 | Frontend Implementation | Auth-aware navbar and dynamic rendering |
| 6 | Advanced Authentication, Session and Authorization | Session security and route guards |
| 7 | Admin Panel and Product Management | Admin checks, uploads, CRUD behavior |
| 8 | Payment Flow (UPI/Card/NetBanking/Crypto Style) | Payment validation logic |
| 9 | Automation Integration (n8n Webhook) | Invoice/notification workflow trigger |
| 10 | Review System with Verified Purchase Logic | One-review rule and rating recalculation |
| 11 | Complex/Unique Implementations to Highlight in Viva | High-impact project strengths |
| 12 | Additional Important Snippets (Previously Missing) | Product hook, filters, order lifecycle |
| 13 | Chatbot and AI Flow Snippets | Intent handling and Gemini fallback |
| 14 | AR Analyzer and Recommendation Engine | Heuristic AR recommendation flow |
| 15 | Checkout Intelligence and Location Automation | India-specific address and PIN logic |
| 16 | Navbar and Wishlist Cross-Page Sync | Shared UI state and localStorage sync |

## 1. Project Overview & File Structure
The project is built on a full-stack architecture utilizing **Node.js, Express.js, MongoDB** for the backend, and **Vanilla HTML, CSS, JavaScript** for the front end.

```text
HOME DECOUR FURNITURE/
├── server.js               # Main backend server and API routing
├── package.json            # Project dependencies and details
├── PROJECT_DETAILS.txt     # Complete project overview (Read this for your report)
├── public/                 # Frontend assets
│   ├── index.html          # Main landing page
│   ├── login.html          # User authentication page
│   ├── gallery.html        # Main E-Commerce store page
│   ├── admin.html          # Admin dashboard
│   ├── js/                 # Vanilla JS logic
│   │   ├── app.js          # Core app frontend flow and auth
│   │   ├── cart-popup.js   # Shopping cart localstorage logic
│   │   └── ...
│   └── CSS/                # Modular cascading stylesheets
│       ├── style.css       # Core styling variables
│       ├── dark-mode.css   # Dynamic theme switching
│       └── ...
└── ...                     
```

---

## 2. Backend Environment & Entry Point (`server.js`)
This snippet shows the foundation of the Express.js server, standard middleware, CORS implementation, and database handling setup.

```javascript
const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');

const app = express();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/home-decor-furniture';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true
}));

// Session configuration
app.use(session({
    secret: 'home-decor-furniture-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }
}));

// MongoDB Connection
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err.message));
```

---

## 3. Database Schemas (Mongoose)
Include these schema definitions in the Database Design section of your project report.

### User Schema (Authentication & Roles)
```javascript
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Stored as BCrypt Hash
    full_name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: String,
    role: { type: String, default: 'user', enum: ['user', 'admin'] },
    created_at: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);
```

### Product Schema (E-Commerce Catalog)
```javascript
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    sku: { type: String, unique: true, sparse: true },
    category: { type: String, default: '' },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    gallery: [{ type: String }], // Array of image URLs
    model_3d: {
        file_url: { type: String, default: '' },
        enabled: { type: Boolean, default: false }
    },
    rating: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);
```

### Order Schema (Checkout & Sales Tracking)
```javascript
const orderSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    full_name: String,
    email: String,
    status: { type: String, default: 'placed' }, // placed, delivered, etc.
    total: Number,
    subtotal: Number,
    shipping: Number,
    created_at: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);
```

---

## 4. Basic API Controllers
These snippets illustrate the backend routing and security configurations used in the application.

### Secure User Authentication Flow
```javascript
// Register endpoint with automatic hashing via bcryptjs
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, full_name, phone } = req.body;
        const hash = await hashPassword(password, 10);
        
        const user = await User.create({
            username, email, password: hash, full_name, phone
        });
        
        res.json({ success: true, message: 'Registration successful' });
    } catch (err) {
        res.status(500).json({ error: 'Error creating user' });
    }
});

// Login endpoint with Session Storage
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    
    if (user && await comparePassword(password, user.password)) {
        req.session.userId = user._id; // Init session
        res.json({ success: true, user: { username: user.username, role: user.role } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});
```

---

## 5. Frontend Implementation (`public/`)
This is the core frontend implementation for the Single Page Application (SPA)-style interactivity.

### Frontend App Intitialization & View Control (`app.js`)
```javascript
// Check Session & Update Views
async function checkAuthAndUpdateNavbar() {
    try {
        const response = await fetch('/api/check-auth', { credentials: 'include' });
        const data = await response.json();
        
        if (data.authenticated) {
            updateNavbarForLoggedInUser(data.user);
        } else {
            updateNavbarForLoggedOutUser();
        }
    } catch (error) {
        console.log('Auth check failed:', error);
    }
}

// Rendering Review Stars Dynamically
function renderHalfStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if (hasHalf) stars += '⯪';
    return stars;
}
```

### Fetching Dashboard Data (Example)
```javascript
async function loadOrdersForModal(modal) {
    const response = await fetch('/api/my/orders', { credentials: 'include' });
    const data = await response.json();
    const orders = data.orders || [];
    
    // Populating DOM elements dynamically mapped from API response
    ordersList.innerHTML = orders.map(order => `
        <div class="order-item">
            ID: #${order._id.toString().slice(-6)} - Total: $${order.total}
            Status: ${order.status}
        </div>
    `).join('');
}
```

## Useful Pointers for your documentation:
1. **Frontend System**: Pure vanilla JavaScript utilizing Document Object Model (DOM) injection. CSS operates via standard modules (not tailwind) and incorporates dark-mode switching. 
2. **Backend Architecture**: REST API architecture using `Node.js` and `Express`. The backend contains its own rate limiters, security logic, multer functionality (for gallery uploads), and user session management (`express-session`).
3. **Database Architecture**: Leveraging `MongoDB Mongoose` Schema compilation. The queries make use of indexed fields (e.g. `productSchema.index({ slug: 1 })`) for search capability optimization.

---

## 6. Advanced Authentication, Session and Authorization

### Session Cookie Configuration (Secure in Production)
```javascript
app.use(session({
    secret: 'home-decor-furniture-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: IS_PROD,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));
```

**Explanation:**
- Stores login state with server-side sessions.
- Uses `secure` cookies in production and `SameSite=Lax` to reduce CSRF risk.

### Auth + Admin Route Guards
```javascript
function requireAuth(req, res, next) {
    if (req.session.userId) return next();
    res.status(401).json({ error: 'Authentication required' });
}

function requireAdmin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.session.role === 'admin') return next();
    res.status(403).json({ error: 'Admin access required' });
}
```

**Explanation:**
- `requireAuth` protects user-only APIs.
- `requireAdmin` protects admin-only APIs such as user management and product uploads.

---

## 7. Admin Panel and Product Management

### Admin Upload APIs (Image, Gallery, 3D Model)
```javascript
app.post('/api/admin/upload-image', requireAdmin, upload.single('image'), (req, res) => {
    const rel = path.relative(path.join(__dirname, 'public'), req.file.path).replace(/\\/g, '/');
    res.json({ success: true, url: `/${rel}` });
});

app.post('/api/admin/upload-gallery', requireAdmin, uploadGallery.array('images', 10), (req, res) => {
    const urls = req.files.map(f => `/${path.relative(path.join(__dirname, 'public'), f.path).replace(/\\/g, '/')}`);
    res.json({ success: true, urls });
});

app.post('/api/admin/upload-model', requireAdmin, uploadModel.single('model'), (req, res) => {
    const rel = path.relative(path.join(__dirname, 'public'), req.file.path).replace(/\\/g, '/');
    const ext = path.extname(req.file.originalname || '').toLowerCase().replace('.', '');
    res.json({ success: true, url: `/${rel}`, format: ext });
});
```

**Explanation:**
- Provides dedicated media endpoints for admin operations.
- Returns normalized URLs directly usable in frontend product forms.

### Admin Frontend Guard
```javascript
async function checkAdmin() {
    const res = await fetch('/api/admin/check', { credentials: 'same-origin' });
    if (!res.ok) {
        window.location.href = '/login.html?redirect=admin-products.html';
        return false;
    }
    return true;
}
```

**Explanation:**
- Prevents unauthorized users from opening the admin products page.
- Redirects to login with return URL.

---

## 8. Payment Flow (UPI/Card/NetBanking/Crypto Style)

### Server-Side Payment Validation
```javascript
const allowedPaymentMethods = new Set(['cod', 'upi', 'card', 'netbanking', 'crypto']);

if (paymentMethod === 'upi') {
    const upiId = String(payment.upiId || '').trim();
    if (!/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
        return res.status(400).json({ error: 'Invalid UPI ID' });
    }
}

if (paymentMethod === 'crypto') {
    const txHash = String(payment.txHash || '').trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return res.status(400).json({ error: 'Crypto payment is not completed' });
    }
}
```

**Explanation:**
- Validates payment method and method-specific fields before creating orders.
- Crypto section checks Ethereum-style transaction hash format.

**Important Note for Report:**
- Current implementation is a **blockchain-style validation flow**, not full on-chain verification.
- There is no wallet RPC verification in this codebase yet.

### Frontend Payment Validation (Card + UPI)
```javascript
function luhnCheck(num) {
    const digits = String(num).replace(/\s+/g, '');
    if (!/^\d{14,19}$/.test(digits)) return false;
    let sum = 0, alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = parseInt(digits[i], 10);
        if (alt) { n *= 2; if (n > 9) n -= 9; }
        sum += n; alt = !alt;
    }
    return (sum % 10) === 0;
}
```

**Explanation:**
- Implements Luhn algorithm for card number validity.
- Improves UX by catching invalid values before API request.

---

## 9. Automation Integration (n8n Webhook)

### Post-Order Invoice/Event Push
```javascript
fetch('http://localhost:5678/webhook/fcc3c895-f089-4bb6-a23e-3621110f11f7', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookPayload)
})
.then(response => response.text())
.catch(err => console.warn('n8n webhook error:', err));
```

**Explanation:**
- After order creation, checkout pushes structured data to n8n.
- Used for automation such as invoice generation or notification flow.

---

## 10. Review System with Verified Purchase Logic

### One Review per User per Product + Recalculation
```javascript
const existing = await Review.findOne({ user_id: userId, product_id: pid });

if (existing) {
    existing.rating = r;
    existing.comment = comment || '';
    existing.verified_purchase = verifiedPurchase;
    await existing.save();
} else {
    await Review.create({
        user_id: userId,
        product_id: pid,
        rating: r,
        comment: comment || '',
        verified_purchase: verifiedPurchase
    });
}

await recalcProductRating(pid);
```

**Explanation:**
- Prevents duplicate reviews from same user for the same product.
- Supports edit/update behavior for existing review.
- Recomputes product rating and rating count after every change.

---

## 11. Complex/Unique Implementations to Highlight in Viva

1. **Backward Compatibility in Product Model**
The code keeps old fields (`image`, `model_src`, `is_3d`) synchronized with the new nested `model_3d` object.

2. **Hybrid Chatbot Strategy**
Chat endpoint first performs deterministic business logic (order/product lookup), then uses Gemini with fallback models.

3. **AR Recommendation Engine (Heuristic AI)**
AR analyzer scores products by detected room type + rating + controlled randomness for better suggestions.

4. **India-Centric Checkout Intelligence**
State-city-postal mapping with reverse PIN lookup and manual fallback improves local UX quality.

5. **Automation-Ready Architecture**
Checkout emits webhook payloads to external workflow system (n8n), enabling extensible post-order processes.

---

## 12. Additional Important Snippets (Previously Missing)

### Product Pre-Save Hook (Slug/SKU + Legacy Sync)
```javascript
productSchema.pre('save', function (next) {
    if (!this.slug && this.name) {
        this.slug = generateSlug(this.name) + '-' + Date.now().toString(36);
    }
    if (!this.sku) {
        this.sku = generateSKU(this.category);
    }
    if (this.thumbnail && !this.image) this.image = this.thumbnail;
    if (this.model_3d && this.model_3d.file_url) {
        this.model_src = this.model_3d.file_url;
        this.is_3d = this.model_3d.enabled;
    }
    this.updated_at = new Date();
    next();
});
```

**Explanation:**
- Auto-generates SEO-friendly slug and inventory SKU.
- Keeps old and new 3D/image fields synchronized for compatibility.

### Product Listing API with Search + Filters + Pagination
```javascript
app.get('/api/products', async (req, res) => {
    const { category, q, sort, order, page, limit, featured, trending, new_arrival, min_price, max_price, brand, material, has_3d } = req.query || {};
    const filter = { is_active: { $ne: false } };

    if (category) filter.category = String(category).toLowerCase();
    if (featured === 'true') filter.is_featured = true;
    if (trending === 'true') filter.is_trending = true;
    if (new_arrival === 'true') filter.is_new_arrival = true;
    if (has_3d === 'true') filter['model_3d.enabled'] = true;

    if (q) {
        const safe = escapeRegExp(String(q).slice(0, 50));
        filter.$or = [
            { name: { $regex: safe, $options: 'i' } },
            { description: { $regex: safe, $options: 'i' } },
            { short_description: { $regex: safe, $options: 'i' } },
            { brand: { $regex: safe, $options: 'i' } }
        ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;
    const products = await Product.find(filter).skip(skip).limit(limitNum).lean();
    res.json({ products });
});
```

**Explanation:**
- One endpoint powers category browsing, keyword search, 3D-only view, and pagination.
- Optimized for frontend catalog pages and filters.

### Order Lifecycle Automation (Auto-Deliver)
```javascript
function autoDeliverOrder(orderId, delayMs = 10000) {
    setTimeout(async () => {
        try {
            const result = await Order.findByIdAndUpdate(orderId, { status: 'delivered' });
            if (result) console.log('Order auto-delivered:', orderId);
        } catch (err) {
            console.warn('Auto-deliver failed for order', orderId, err.message);
        }
    }, delayMs);
}
```

**Explanation:**
- Simulates order movement from placed to delivered state.
- Useful for demo/testing where real logistics integration is absent.

---

## 13. Chatbot and AI Flow Snippets

### Smart Chat Endpoint (Order Tracking + Product Discovery)
```javascript
app.post('/api/chat', chatLimiter, async (req, res) => {
    const { message, history } = req.body || {};
    const userMessage = (message || '').toString().trim();

    const orderId = chatExtractOrderId(userMessage);
    // 1) Try order lookup if order id exists
    // 2) Else perform dynamic product query and budget/category parsing
    // 3) Build prompt and call Gemini with context
    // 4) Return conversational text + optional product cards
});
```

**Explanation:**
- Handles multiple intents in one endpoint.
- Combines deterministic data lookups with LLM-generated responses.

### Gemini Fallback Strategy
```javascript
const modelsToTry = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS.filter(m => m !== GEMINI_MODEL)];
for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${GEMINI_API_KEY}`;
    // If 429/rate-limit, continue to next model
}
```

**Explanation:**
- Improves chatbot availability under model rate limits.
- Keeps user experience stable during external API constraints.

---

## 14. AR Analyzer and Recommendation Engine

### Scan Steps + Product Matching
```javascript
startScan() {
    if (this.isScanning) return;
    this.isScanning = true;
    this.container.classList.add('scanning', 'analysis-running');
    // phase 1 layout -> phase 2 style -> phase 3 product match
}

performAIAnalysis() {
    const roomTypes = ['living room', 'bedroom', 'office', 'dining room'];
    const detected = roomTypes[Math.floor(Math.random() * roomTypes.length)];
    const categoryMap = {
        'living room': ['sofa', 'decor', 'table'],
        'bedroom': ['bed', 'decor', 'chair'],
        'office': ['chair', 'table', 'decor'],
        'dining room': ['table', 'chair', 'decor']
    };
    // score products by relevance + rating + slight randomness
}
```

**Explanation:**
- Gives immersive AR UX with progressive scan feedback.
- Uses heuristic scoring for realistic recommendation behavior.

---

## 15. Checkout Intelligence and Location Automation

### India State/City/PIN Smart Selectors
```javascript
const populateCities = (state, preservePostal = false) => {
    const list = LOCATION_DATA[state] || [];
    cityEl.innerHTML = '<option value="">Select City</option>' +
        list.map(c => `<option value="${c.city}" data-postal="${c.postal}">${c.city}</option>`).join('') +
        '<option value="__OTHER__">Other (Enter manually)</option>';
    if (!preservePostal && postalEl) postalEl.value = '';
};

postalEl.addEventListener('input', () => {
    const pin = String(postalEl.value || '').trim();
    if (!/^\d{6}$/.test(pin)) return;
    // reverse lookup pin -> state/city auto-selection
});
```

**Explanation:**
- Improves delivery-form speed and reduces user errors.
- Supports both guided selection and manual city fallback.

---

## 16. Navbar and Wishlist Cross-Page Sync

### Global Wishlist Badge + Mobile Menu State
```javascript
function initializeGlobalWishlist() {
    function updateGlobalWishlistButton() {
        const raw = localStorage.getItem('hd_wishlist');
        const wishlist = raw ? JSON.parse(raw) : {};
        const count = Object.keys(wishlist).length;
        // update badge visibility/count in navbar
    }
    updateGlobalWishlistButton();
    window.addEventListener('storage', (e) => {
        if (e.key === 'hd_wishlist') updateGlobalWishlistButton();
    });
}

function setMenuOpen(open) {
    hamburger.classList.toggle('active', !!open);
    navbarMenu.classList.toggle('active', !!open);
    document.body.classList.toggle('no-scroll', !!open);
}
```

**Explanation:**
- Synchronizes wishlist count across tabs/pages using storage events.
- Enhances mobile UX with consistent hamburger and backdrop behavior.
