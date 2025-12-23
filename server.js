const express = require('express');
// Load environment variables early
try { require('dotenv').config(); } catch {}
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/home-decor-furniture';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Helpers
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id || ''));
const escapeRegExp = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sanitizeCategory = (c) => {
    const val = String(c || '').toLowerCase();
    const allowed = new Set(['living', 'dining', 'bedroom', 'office', '3d']);
    return allowed.has(val) ? val : undefined;
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
    origin: true,
    credentials: true
}));

// Basic rate limiters
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
const strictWriteLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

// File uploads setup
const uploadDir = path.join(__dirname, 'public', 'uploads');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const base = path.basename(file.originalname || 'image', ext).replace(/[^a-z0-9_-]/gi, '_');
        cb(null, `${Date.now()}_${base}${ext}`);
    }
});

const allowedMime = new Set(['image/jpeg','image/png','image/webp','image/gif']);
const fileFilter = (req, file, cb) => {
    if (allowedMime.has(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Session configuration
app.use(session({
    secret: 'home-decor-furniture-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ============= MONGODB SCHEMAS =============

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    full_name: String,
    phone: String,
    address: String,
    role: { type: String, default: 'user', enum: ['user', 'admin'] },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: String,
    description: String,
    category: String,
    brand: String,
    material: String,
    original_price: Number,
    discount: Number,
    badge: String,
    rating: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },
    model_src: String,
    is_3d: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    full_name: String,
    email: String,
    phone: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    country: String,
    postal: String,
    payment_method: String,
    upi_id: String,
    card_last4: String,
    subtotal: Number,
    shipping: Number,
    tax: Number,
    total: Number,
    status: { type: String, default: 'placed' },
    created_at: { type: Date, default: Date.now }
});

// Order Items Schema
const orderItemSchema = new mongoose.Schema({
    order_id: mongoose.Schema.Types.ObjectId,
    product_id: String,
    name: String,
    price: Number,
    quantity: Number
});

// Review Schema
const reviewSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    username: { type: String, required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    order_id: mongoose.Schema.Types.ObjectId,
    rating: { type: Number, required: true, min: 0.5, max: 5 },
    comment: String,
    helpful_count: { type: Number, default: 0 },
    verified_purchase: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Index for efficient queries
reviewSchema.index({ product_id: 1, created_at: -1 });
reviewSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

// Contact Message Schema
const contactMessageSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    subject: String,
    message: String,
    created_at: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const OrderItem = mongoose.model('OrderItem', orderItemSchema);
const Review = mongoose.model('Review', reviewSchema);
const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

// ============= MONGODB CONNECTION =============

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB');
    initializeData();
})
.catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
});

async function initializeData() {
    try {
        // Fix review indexes (drop old index with order_id, create new one without)
        await fixReviewIndexes();
        // Ensure default admin exists
        await seedDefaultAdmin();
        // Seed default products
        await seedDefaultProducts();
        // Seed initial product reviews (DISABLED - clearing all customer data)
        // await seedInitialReviews();
        // Mark all existing orders as delivered
        await deliverAllExistingOrders();
    } catch (err) {
        console.warn('Initialization error:', err.message);
    }
}

async function fixReviewIndexes() {
    try {
        const indexes = await Review.collection.getIndexes();
        // Drop old index if it exists
        if (indexes['user_id_1_product_id_1_order_id_1']) {
            await Review.collection.dropIndex('user_id_1_product_id_1_order_id_1');
            console.log('Dropped old review index');
        }
    } catch (err) {
        console.warn('Review index migration:', err.message);
    }
}

async function seedInitialReviews() {
    try {
        const reviewCount = await Review.countDocuments();
        if (reviewCount > 0) {
            console.log('Reviews already exist, skipping seed');
            return;
        }

        const products = await Product.find();
        if (!products.length) return;

        // Create a demo user for initial reviews if doesn't exist
        let demoUser = await User.findOne({ username: 'demo_reviewer_' + Date.now() });
        if (!demoUser) {
            const hash = await bcrypt.hash('demo123', 10);
            demoUser = await User.create({
                username: 'demo_reviewer_' + Date.now(),
                email: 'demo' + Date.now() + '@homedecor.com',
                password: hash,
                full_name: 'Demo Reviewer'
            });
        }

        const reviewTemplates = [
            { rating: 5, comment: 'Absolutely love this product! Excellent quality and looks amazing in my home.', username: 'Sarah Miller' },
            { rating: 5, comment: 'Perfect addition to our living room. Highly recommend!', username: 'John Anderson' },
            { rating: 4.5, comment: 'Great product, very satisfied with the purchase. Minor assembly required.', username: 'Emily Davis' },
            { rating: 4, comment: 'Good quality for the price. Would buy again.', username: 'Michael Brown' },
            { rating: 4.5, comment: 'Beautiful design and sturdy construction. Very happy!', username: 'Jessica Wilson' },
            { rating: 5, comment: 'Exceeded my expectations. Delivery was fast too!', username: 'David Martinez' },
            { rating: 4, comment: 'Nice piece of furniture. Comfortable and stylish.', username: 'Amanda Taylor' },
            { rating: 3.5, comment: 'Decent product. A bit smaller than expected but still nice.', username: 'Christopher Lee' },
            { rating: 5, comment: 'Best purchase this year! Perfect fit for our space.', username: 'Jennifer White' },
            { rating: 4.5, comment: 'High quality materials and great craftsmanship.', username: 'Robert Harris' },
            { rating: 4, comment: 'Looks exactly like the picture. Happy with it.', username: 'Lisa Thompson' },
            { rating: 5, comment: 'Amazing quality! Worth every penny.', username: 'Daniel Garcia' },
            { rating: 4.5, comment: 'Very comfortable and well-made. Love it!', username: 'Michelle Robinson' },
            { rating: 3.5, comment: 'Good product overall. Delivery took a bit longer.', username: 'James Clark' },
            { rating: 5, comment: 'Exactly what I was looking for. Highly satisfied!', username: 'Karen Rodriguez' }
        ];

        const allReviews = [];
        for (const product of products) {
            // Random number of reviews per product (2-8 reviews)
            const numReviews = Math.floor(Math.random() * 7) + 2;
            const selectedTemplates = [];
            
            // Randomly select review templates
            const shuffled = [...reviewTemplates].sort(() => 0.5 - Math.random());
            for (let i = 0; i < Math.min(numReviews, shuffled.length); i++) {
                selectedTemplates.push(shuffled[i]);
            }

            // Create reviews with random dates in the past 90 days
            for (const template of selectedTemplates) {
                const daysAgo = Math.floor(Math.random() * 90);
                const createdDate = new Date();
                createdDate.setDate(createdDate.getDate() - daysAgo);

                allReviews.push({
                    user_id: demoUser._id,
                    username: template.username,
                    product_id: product._id,
                    rating: template.rating,
                    comment: template.comment,
                    helpful_count: Math.floor(Math.random() * 20),
                    verified_purchase: Math.random() > 0.3,
                    created_at: createdDate,
                    updated_at: createdDate
                });
            }
        }

        // Insert all reviews
        if (allReviews.length > 0) {
            await Review.insertMany(allReviews);
            console.log(`Seeded ${allReviews.length} initial reviews for ${products.length} products`);
            
            // Update product ratings
            for (const product of products) {
                await recalcProductRating(product._id);
            }
        }
    } catch (err) {
        console.warn('Error seeding reviews:', err.message);
    }
}

async function deliverAllExistingOrders() {
    try {
        const result = await Order.updateMany(
            { $or: [{ status: null }, { status: { $ne: 'delivered' } }] },
            { status: 'delivered' }
        );
        console.log(`Marked ${result.modifiedCount} existing orders as delivered`);
    } catch (err) {
        console.warn('Failed to mark existing orders delivered:', err.message);
    }
}

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

async function seedDefaultAdmin() {
    try {
        const existing = await User.findOne({ username: 'admin' });
        if (existing) {
            if (existing.role !== 'admin') {
                existing.role = 'admin';
                await existing.save();
            }
            return;
        }

        const hash = await bcrypt.hash('admin123', 10);
        await User.create({
            username: 'admin',
            email: 'admin@homedecor.com',
            password: hash,
            full_name: 'Administrator',
            role: 'admin'
        });
        console.log('Default admin user created (username: admin, password: admin123)');
    } catch (err) {
        console.error('Error seeding admin:', err.message);
    }
}

async function seedDefaultProducts() {
    try {
        const count = await Product.countDocuments();
        if (count > 0) return;

        const defaults = [
            { name:'Comfortable Sofa',      price:41500, image:'image/toa-heftiba-FV3GConVSss-unsplash.webp', description:'', category:'living',  brand:'NovaHome',  material:'Fabric', original_price:49900, discount:17, badge:'New',  rating:5, rating_count:24, model_src:null, is_3d:0 },
            { name:'Modern Armchair',       price:20750, image:'image/becca-tapert-dO3qTKxwik0-unsplash.webp', description:'', category:'living',  brand:'ComfyCo',   material:'Leather', original_price:25000, discount:17, badge:'Sale', rating:4, rating_count:18, model_src:null, is_3d:0 },
            { name:'Wooden Coffee Table',   price:12450, image:'image/christopher-jolly-GqbU78bdJFM-unsplash.webp', description:'', category:'living',  brand:'UrbanWood', material:'Wood',    original_price:null, discount:null, badge:null, rating:5, rating_count:31, model_src:null, is_3d:0 },
            { name:'Dining Table',          price:33200, image:'image/davide-cantelli-ajisKc2uuFk-unsplash.webp', description:'', category:'dining',  brand:'UrbanWood', material:'Wood',    original_price:39800, discount:17, badge:'Hot', rating:4, rating_count:27, model_src:null, is_3d:0 },
            { name:'Bookshelf',             price:16600, image:'image/denys-striyeshyn-wJ7yGwz2-00-unsplash.webp', description:'', category:'living',  brand:'UrbanWood', material:'Wood',    original_price:null, discount:null, badge:null, rating:4, rating_count:15, model_src:null, is_3d:0 },
            { name:'Queen Size Bed',        price:49800, image:'image/hutomo-abrianto-X5BWooeO4Cw-unsplash.webp', description:'', category:'bedroom', brand:'NovaHome',  material:'Wood',    original_price:59900, discount:17, badge:'New',  rating:5, rating_count:42, model_src:null, is_3d:0 },
            { name:'Office Chair',          price:10790, image:'image/inside-weather-Uxqlfigh6oE-unsplash.webp', description:'', category:'office',  brand:'ComfyCo',   material:'Fabric',  original_price:12900, discount:16, badge:null, rating:4, rating_count:19, model_src:null, is_3d:0 },
            { name:'Side Table',            price: 7470, image:'image/kari-shea-AMyjxxLEHU4-unsplash.webp', description:'', category:'living',  brand:'UrbanWood', material:'Wood',    original_price:null, discount:null, badge:null, rating:4, rating_count:12, model_src:null, is_3d:0 },
            { name:'Dresser',               price:29050, image:'image/kari-shea-ItMggD0EguY-unsplash.webp', description:'', category:'bedroom', brand:'UrbanWood', material:'Wood',    original_price:34800, discount:17, badge:'Sale', rating:5, rating_count:23, model_src:null, is_3d:0 },
            { name:'Bar Stool',             price: 6640, image:'image/kari-shea-tOVmshavtoo-unsplash.webp', description:'', category:'dining',  brand:'SteelCraft',material:'Metal',   original_price:null, discount:null, badge:null, rating:4, rating_count:8,  model_src:null, is_3d:0 },
            { name:'L-shaped Sofa',         price:74700, image:'image/kirill-9uH-hM0VwPg-unsplash.webp', description:'', category:'living',  brand:'NovaHome',  material:'Fabric',  original_price:89900, discount:17, badge:'Hot', rating:5, rating_count:38, model_src:null, is_3d:0 },
            { name:'Accent Chair',          price:16600, image:'image/olena-bohovyk-gxKL334bUK4-unsplash.webp', description:'', category:'living',  brand:'ComfyCo',   material:'Fabric',  original_price:null, discount:null, badge:null, rating:4, rating_count:16, model_src:null, is_3d:0 },
            { name:'Modern Office Chair',  price:10790, image:'', description:'', category:'3d', brand:'', material:'', original_price:12900, discount:16, badge:'3D',  rating:5, rating_count:15, model_src:'3d models/no_43.glb',                              is_3d:1 },
            { name:'Sofa Chair',           price:15000, image:'', description:'', category:'3d', brand:'', material:'', original_price:18000, discount:17, badge:'Hot', rating:4, rating_count:22, model_src:'3d models/sofa_chair.glb',                        is_3d:1 },
            { name:'Low Poly Modern Sofa', price: 6000, image:'', description:'', category:'3d', brand:'', material:'', original_price: 7200, discount:17, badge:'Sale',rating:4, rating_count: 8, model_src:'3d models/low_poly_modern_sofa_free_model.glb',    is_3d:1 },
            { name:'Vintage Sofa',         price:12000, image:'', description:'', category:'3d', brand:'', material:'', original_price: null, discount:null, badge:null, rating:4, rating_count:11, model_src:'3d models/old_sofa_free.glb',                    is_3d:1 },
            { name:'Leather Sofa Stool',   price: 3200, image:'', description:'', category:'3d', brand:'', material:'', original_price: 3800, discount:16, badge:'New', rating:5, rating_count: 6, model_src:'3d models/free_leather_sofa_stool.glb',          is_3d:1 },
            { name:'White Chair',          price: 4500, image:'', description:'', category:'3d', brand:'', material:'', original_price: null, discount:null, badge:null, rating:4, rating_count: 9, model_src:'3d models/white_chair.glb',                      is_3d:1 },
            { name:'Simple Modern Chair',  price: 2800, image:'', description:'', category:'3d', brand:'', material:'', original_price: null, discount:null, badge:null, rating:4, rating_count: 7, model_src:'3d models/simple_modern_chair_free_model.glb', is_3d:1 },
            { name:'Modern Table',         price: 5200, image:'', description:'', category:'3d', brand:'', material:'', original_price: 6200, discount:16, badge:'Hot', rating:5, rating_count:13, model_src:'3d models/table_mr_ft.glb',                     is_3d:1 },
        ];

        await Product.insertMany(defaults);
        console.log(`Seeded ${defaults.length} default products`);
    } catch (err) {
        console.warn('Error seeding products:', err.message);
    }
}

// ============= AUTHENTICATION MIDDLEWARE =============

function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

function requireAdmin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.session.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Admin access required' });
}

// ============= ROUTES =============

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Register endpoint
app.post('/api/register', authLimiter, async (req, res) => {
    try {
        const { username, email, password, full_name, phone, address } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hash,
            full_name,
            phone,
            address
        });

        res.json({
            success: true,
            message: 'Registration successful',
            userId: user._id
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ error: 'Error creating user' });
    }
});

// Login endpoint
app.post('/api/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findOne({ $or: [{ username }, { email: username }] });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        req.session.userId = user._id.toString();
        req.session.username = user.username;
        req.session.fullName = user.full_name;
        req.session.email = user.email;
        req.session.role = user.role;

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error logging out' });
        }
        res.json({ success: true, message: 'Logout successful' });
    });
});

// Check authentication status
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username,
                full_name: req.session.fullName,
                email: req.session.email,
                role: req.session.role || 'user'
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Admin check endpoint
app.get('/api/admin/check', requireAdmin, (req, res) => {
    res.json({ isAdmin: true });
});

// Admin: upload product image
app.post('/api/admin/upload-image', requireAdmin, upload.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
        const rel = path.relative(path.join(__dirname), req.file.path).replace(/\\/g,'/');
        const url = `/${rel}`;
        res.json({ success: true, url, filename: path.basename(req.file.path) });
    } catch (e) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Admin: list users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '_id username email full_name phone address role created_at updated_at').sort({ created_at: -1 }).lean();
        // Map _id to id for frontend compatibility
        const formattedUsers = users.map(u => ({ ...u, id: u._id.toString() }));
        res.json({ users: formattedUsers });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: update user role
app.put('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidObjectId(userId)) return res.status(400).json({ error: 'Invalid user id' });
        const { role } = req.body || {};

        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        if (userId === req.session.userId) {
            return res.status(400).json({ error: 'You cannot change your own role' });
        }

        const result = await User.findByIdAndUpdate(userId, { role, updated_at: new Date() });
        if (!result) return res.status(404).json({ error: 'User not found' });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: delete user
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidObjectId(userId)) return res.status(400).json({ error: 'Invalid user id' });
        if (userId === req.session.userId) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const result = await User.findByIdAndDelete(userId);
        if (!result) return res.status(404).json({ error: 'User not found' });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: basic stats
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const stats = {};
        stats.totalUsers = await User.countDocuments();
        stats.admins = await User.countDocuments({ role: 'admin' });
        stats.standardUsers = await User.countDocuments({ role: 'user' });
        stats.messages = await ContactMessage.countDocuments();
        stats.orders = await Order.countDocuments();
        stats.notifications = (stats.messages || 0) + (stats.orders || 0);
        res.json({ stats });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Public: receive contact form submissions
app.post('/api/contact', strictWriteLimiter, async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body || {};

        let finalName = name && String(name).trim();
        let finalEmail = email && String(email).trim();
        const finalPhone = (phone || '').toString().trim();

        const isAuthed = !!(req.session && req.session.userId);
        if (isAuthed) {
            finalName = finalName || req.session.fullName || req.session.username || 'User';
            finalEmail = finalEmail || req.session.email || '';
        }

        if (!subject || !String(subject).trim() || !message || !String(message).trim()) {
            return res.status(400).json({ error: 'Subject and message are required' });
        }
        if (!finalName || !finalEmail) {
            return res.status(400).json({ error: 'Name and email are required for guests' });
        }

        const msg = await ContactMessage.create({
            name: String(finalName).trim(),
            email: String(finalEmail).trim(),
            phone: finalPhone,
            subject: String(subject).trim(),
            message: String(message).trim()
        });

        res.json({ success: true, id: msg._id });
    } catch (err) {
        console.error('Contact error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: list contact messages
app.get('/api/admin/messages', requireAdmin, async (req, res) => {
    try {
        const messages = await ContactMessage.find({}).sort({ created_at: -1 });
        res.json({ messages });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: delete a message
app.delete('/api/admin/messages/:id', requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid message id' });
        const result = await ContactMessage.findByIdAndDelete(id);
        if (!result) return res.status(404).json({ error: 'Message not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ============= PRODUCTS API =============

// Public: list products
app.get('/api/products', async (req, res) => {
    try {
        const { category, q } = req.query || {};
        const filter = {};

        const cat = sanitizeCategory(category);
        if (cat) filter.category = cat;
        if (q) {
            const qStr = String(q).slice(0, 50);
            const safe = escapeRegExp(qStr);
            filter.$or = [
                { name: { $regex: safe, $options: 'i' } },
                { description: { $regex: safe, $options: 'i' } }
            ];
        }

        const products = await Product.find(filter).sort({ created_at: -1 }).lean();
        // Map _id to id for frontend compatibility
        const formattedProducts = products.map(p => ({ ...p, id: p._id.toString() }));
        res.json({ products: formattedProducts });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Public: get single product by id
app.get('/api/products/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Validate if id is a valid MongoDB ObjectId (24 hex characters)
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            console.log('Invalid ObjectId format:', id);
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const product = await Product.findById(id).lean();

        if (!product) return res.status(404).json({ error: 'Product not found' });
        
        // Map _id to id for frontend compatibility
        const productData = {
            ...product,
            id: product._id.toString()
        };
        
        res.json({ product: productData });
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: create product
app.post('/api/admin/products', requireAdmin, async (req, res) => {
    try {
        const { name, price, image, description, category, brand, material, original_price, discount, badge, model_src, is_3d } = req.body || {};

        if (!name || typeof price === 'undefined' || price === null) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        const product = await Product.create({
            name: String(name),
            price: parseInt(price, 10),
            image: image || '',
            description: description || '',
            category: category || '',
            brand: brand || '',
            material: material || '',
            original_price: original_price ? parseInt(original_price, 10) : null,
            discount: discount ? parseInt(discount, 10) : null,
            badge: badge || null,
            model_src: model_src || null,
            is_3d: is_3d ? true : false
        });

        res.json({ success: true, id: product._id });
    } catch (err) {
        console.error('Create product error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: update product
app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid product id' });
        const { name, price, image, description, category, brand, material, original_price, discount, badge, model_src, is_3d } = req.body || {};

        const update = {};
        if (name !== undefined) update.name = String(name);
        if (price !== undefined && price !== null) update.price = parseInt(price, 10);
        if (image !== undefined) update.image = image;
        if (description !== undefined) update.description = description;
        if (category !== undefined) update.category = category;
        if (brand !== undefined) update.brand = brand;
        if (material !== undefined) update.material = material;
        if (original_price !== undefined && original_price !== null) update.original_price = parseInt(original_price, 10);
        if (discount !== undefined && discount !== null) update.discount = parseInt(discount, 10);
        if (badge !== undefined) update.badge = badge;
        if (model_src !== undefined) update.model_src = model_src;
        if (is_3d !== undefined) update.is_3d = is_3d ? true : false;
        update.updated_at = new Date();

        const result = await Product.findByIdAndUpdate(req.params.id, update);
        if (!result) return res.status(404).json({ error: 'Product not found' });

        res.json({ success: true });
    } catch (err) {
        console.error('Update product error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: delete product
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid product id' });
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const imageUrl = (product.image || '').toString();
        await Product.findByIdAndDelete(req.params.id);

        try {
            const rel = imageUrl.replace(/^[\\\/]+/, '');
            if (/^uploads[\\\/]/i.test(rel)) {
                const absPath = path.resolve(__dirname, rel);
                const uploadDirPath = path.join(__dirname, 'uploads');
                if (absPath.startsWith(uploadDirPath)) {
                    fs.unlink(absPath, (e) => {
                        if (e && e.code !== 'ENOENT') {
                            console.warn('Failed to delete image:', absPath, e.message);
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('Image cleanup error:', e.message);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ============= ORDERS API =============

app.post('/api/orders', writeLimiter, async (req, res) => {
    try {
        const body = req.body || {};
        const items = Array.isArray(body.items) ? body.items : [];
        const shipping = body.shipping || {};
        const payment = body.payment || {};
        const amounts = body.amounts || {};

        if (!items.length) return res.status(400).json({ error: 'Cart is empty' });
        if (!shipping.fullName || !shipping.email || !shipping.address1 || !shipping.city || !shipping.state || !shipping.postal) {
            return res.status(400).json({ error: 'Missing shipping fields' });
        }

        const order = await Order.create({
            user_id: req.session && req.session.userId ? req.session.userId : null,
            full_name: String(shipping.fullName),
            email: String(shipping.email),
            phone: String(shipping.phone || ''),
            address1: String(shipping.address1),
            address2: String(shipping.address2 || ''),
            city: String(shipping.city),
            state: String(shipping.state),
            country: String(shipping.country || ''),
            postal: String(shipping.postal),
            payment_method: String(payment.method || 'cod'),
            upi_id: payment.upiId ? String(payment.upiId) : null,
            card_last4: payment.cardLast4 ? String(payment.cardLast4) : null,
            subtotal: parseInt(amounts.subtotal||0,10),
            shipping: parseInt(amounts.shipping||0,10),
            tax: parseInt(amounts.tax||0,10),
            total: parseInt(amounts.total||0,10)
        });

        if (!items.length) return res.json({ success: true, orderId: order._id });

        const orderItems = items.map(it => ({
            order_id: order._id,
            product_id: String(it.id||''),
            name: String(it.name||''),
            price: parseInt(it.price||0,10),
            quantity: parseInt(it.quantity||1,10)
        }));

        await OrderItem.insertMany(orderItems);
        autoDeliverOrder(order._id, 10000);
        res.json({ success: true, orderId: order._id });
    } catch (err) {
        console.error('Create order error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Authenticated: get my orders with items
app.get('/api/my/orders', requireAuth, async (req, res) => {
    try {
        // Use string comparison since IDs in collections are stored as strings
        const userId = req.session.userId;
        
        await Order.updateMany({ user_id: userId }, { status: 'delivered' });

        const orders = await Order.find({ user_id: userId }).sort({ created_at: -1 });
        const orderIds = orders.map(o => o._id.toString());

        const orderItems = await OrderItem.find({ order_id: { $in: orderIds } });
        const byOrder = {};
        orderItems.forEach(it => {
            (byOrder[it.order_id] = byOrder[it.order_id] || []).push(it);
        });

        const productIds = Array.from(new Set(
            orderItems
                .map(it => {
                    try { return new mongoose.Types.ObjectId(it.product_id); } catch { return null; }
                })
                .filter(Boolean)
        ));

        let imgMap = {};
        if (productIds.length > 0) {
            const products = await Product.find({ _id: { $in: productIds } });
            products.forEach(p => { imgMap[p._id] = p.image || ''; });
        }

        Object.values(byOrder).forEach(arr => {
            arr.forEach(it => {
                try {
                    const pid = new mongoose.Types.ObjectId(it.product_id);
                    if (imgMap[pid]) it.product_image = imgMap[pid];
                } catch {}
            });
        });

        const result = orders.map(o => ({ 
            ...o.toObject(), 
            items: byOrder[o._id.toString()] || [] 
        }));
        res.json({ orders: result });
    } catch (err) {
        console.error('Get my orders error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: list orders
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ created_at: -1 }).lean();
        // Map _id to id for frontend compatibility
        const formattedOrders = orders.map(o => ({ ...o, id: o._id.toString() }));
        res.json({ orders: formattedOrders });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: get order items
app.get('/api/admin/orders/:id/items', requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid order id' });
        const items = await OrderItem.find({ order_id: id });
        res.json({ items: items || [] });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ============= REVIEWS API =============

// Authenticated: list my reviews
app.get('/api/my/reviews', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const reviews = await Review.find({ user_id: userId })
            .sort({ updated_at: -1 })
            .lean();

        const productIds = Array.from(new Set(reviews.map(r => r.product_id)));
        const products = await Product.find({ _id: { $in: productIds } });
        const orderIds = reviews.filter(r => r.order_id).map(r => r.order_id);
        const orders = await Order.find({ _id: { $in: orderIds } });

        const pMap = {};
        products.forEach(p => { pMap[p._id] = p; });
        const oMap = {};
        orders.forEach(o => { oMap[o._id] = o; });

        const enriched = reviews.map(r => ({
            ...r,
            product_name: pMap[r.product_id]?.name,
            product_image: pMap[r.product_id]?.image,
            order_created_at: oMap[r.order_id]?.created_at
        }));

        res.json({ reviews: enriched });
    } catch (err) {
        console.error('Get my reviews error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Helper to recalc product rating
async function recalcProductRating(productId) {
    try {
        const agg = await Review.aggregate([
            { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
            { $group: { _id: null, avg: { $avg: '$rating' }, cnt: { $sum: 1 } } }
        ]);

        const avg = agg.length > 0 && agg[0].avg ? Math.round(agg[0].avg * 10) / 10 : 0;
        const cnt = agg.length > 0 ? agg[0].cnt : 0;

        await Product.findByIdAndUpdate(productId, { rating: avg, rating_count: cnt });
    } catch (err) {
        console.warn('Error recalc product rating:', err.message);
    }
}

// Helper: ensure user has a delivered order containing product
async function userHasDeliveredOrderForProduct(userId, productId) {
    try {
        const order = await Order.findOne({
            user_id: userId,
            status: 'delivered'
        });

        if (!order) return false;

        const item = await OrderItem.findOne({
            order_id: order._id,
            product_id: String(productId)
        });

        return !!item;
    } catch (err) {
        return false;
    }
}

// Authenticated: create or update review
app.post('/api/my/reviews', requireAuth, writeLimiter, async (req, res) => {
    try {
        const { product_id, rating, comment, order_id } = req.body || {};
        const userId = req.session.userId;
        const pid = product_id;
        const oid = order_id;
        let r = parseFloat(rating);

        if (Number.isFinite(r)) r = Math.round(r * 2) / 2;
        const validHalf = pid && r >= 0.5 && r <= 5 && Math.abs(r * 2 - Math.round(r * 2)) < 1e-8;
        if (!validHalf) return res.status(400).json({ error: 'Invalid product or rating (must be 0.5-5 in 0.5 steps)' });

        // Check if product exists
        const product = await Product.findById(pid);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Get user info
        const user = await User.findById(userId);
        const username = user?.full_name || user?.username || 'Anonymous';

        // Check if user bought this product (optional - for verified purchase badge)
        let verifiedPurchase = false;
        if (oid) {
            const orderItem = await OrderItem.findOne({ order_id: oid, product_id: String(pid) });
            const order = await Order.findById(oid);
            verifiedPurchase = !!(orderItem && order && order.status === 'delivered');
        } else {
            const deliveredOrder = await Order.findOne({ user_id: userId, status: 'delivered' });
            if (deliveredOrder) {
                const item = await OrderItem.findOne({ order_id: deliveredOrder._id.toString(), product_id: String(pid) });
                verifiedPurchase = !!item;
            }
        }

        // Check for existing review (one review per user per product)
        const existing = await Review.findOne({ 
            user_id: userId, 
            product_id: pid
        });

        if (existing) {
            existing.rating = r;
            existing.comment = comment || '';
            existing.username = username;
            existing.verified_purchase = verifiedPurchase;
            existing.updated_at = new Date();
            await existing.save();
            await recalcProductRating(pid);
            return res.json({ success: true, updated: true });
        }

        const review = await Review.create({
            user_id: userId,
            username: username,
            product_id: pid,
            order_id: oid,
            rating: r,
            comment: comment || '',
            verified_purchase: verifiedPurchase
        });

        await recalcProductRating(pid);
        res.json({ success: true, created: true, id: review._id });
    } catch (err) {
        console.error('Create review error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Authenticated: delete review
app.delete('/api/my/reviews/:productId', requireAuth, writeLimiter, async (req, res) => {
    try {
        const userId = req.session.userId;
        const pid = req.params.productId;
        if (!isValidObjectId(pid)) return res.status(400).json({ error: 'Invalid product id' });
        const result = await Review.deleteOne({
            user_id: userId,
            product_id: pid
        });

        await recalcProductRating(pid);
        res.json({ success: true, deleted: result.deletedCount > 0 });
    } catch (err) {
        console.error('Delete review error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Public: list reviews for a product
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const pid = req.params.id;
        
        // Validate if id is a valid MongoDB ObjectId (24 hex characters)
        if (!/^[0-9a-fA-F]{24}$/.test(pid)) {
            console.log('Invalid ObjectId format for reviews:', pid);
            return res.json({ reviews: [], averageRating: 0, totalReviews: 0 });
        }
        
        const reviews = await Review.find({ product_id: pid })
            .sort({ created_at: -1 })
            .lean();

        const enriched = reviews.map(r => ({
            id: r._id,
            user_id: r.user_id,
            username: r.username || 'Anonymous',
            product_id: r.product_id,
            rating: r.rating,
            comment: r.comment,
            helpful_count: r.helpful_count || 0,
            verified_purchase: r.verified_purchase || false,
            created_at: r.created_at,
            updated_at: r.updated_at
        }));

        // Calculate rating stats
        const totalReviews = enriched.length;
        const averageRating = totalReviews > 0 
            ? enriched.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
            : 0;

        const ratingDistribution = [0, 0, 0, 0, 0]; // Index 0-4 for 1-5 stars
        enriched.forEach(r => {
            const starIndex = Math.ceil(r.rating) - 1;
            if (starIndex >= 0 && starIndex < 5) {
                ratingDistribution[starIndex]++;
            }
        });

        res.json({ 
            reviews: enriched, 
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews,
            ratingDistribution
        });
    } catch (err) {
        console.error('Get reviews error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// ============= PROFILE API =============

// Get user profile
app.get('/api/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Update user profile
app.put('/api/profile', requireAuth, async (req, res) => {
    try {
        const { full_name, phone, address } = req.body;
        const result = await User.findByIdAndUpdate(req.session.userId, {
            full_name,
            phone,
            address,
            updated_at: new Date()
        });

        if (!result) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Error updating profile' });
    }
});

// Change password
app.put('/api/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        user.password = hash;
        user.updated_at = new Date();
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Error updating password' });
    }
});

// ============= SERVER STARTUP =============

function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log('Default admin credentials:');
        console.log('Username: admin');
        console.log('Password: admin123');
    });

    server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE' && port < DEFAULT_PORT + 10) {
            console.warn(`Port ${port} in use, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Failed to start server:', err);
            process.exit(1);
        }
    });
}

startServer(DEFAULT_PORT);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
});

// ================= CHATBOT (Gemini) BACKEND =================

app.post('/api/chat', chatLimiter, async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Server not configured with Gemini API key' });
        }

        const { message, context } = req.body || {};
        const userMessage = (message || '').toString().trim();
        const productContext = (context || '').toString();
        if (!userMessage) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const systemPrompt = `You are a friendly, knowledgeable, and professional customer support chatbot for Home Decor Furniture. Your name is 'DecorBot'.\n\nKeep responses concise and helpful (max 150 words). Maintain a warm, inviting tone.\n\n${productContext ? ('Live catalog context (use for accurate names/prices):\n' + productContext) : ''}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${GEMINI_API_KEY}`;
        const payload = {
            contents: [{
                role: 'user',
                parts: [{ text: systemPrompt + "\n\nUser question: " + userMessage }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 200,
                topP: 0.8,
                topK: 40
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            return res.status(502).json({ error: 'Gemini API error', details: text.slice(0, 500) });
        }

        const result = await response.json();
        const candidate = result && result.candidates && result.candidates[0];
        const partText = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text;
        const reply = partText || "I'm sorry, I couldn't generate a response right now.";
        return res.json({ reply });
    } catch (err) {
        console.error('Chat API error:', err?.message || err);
        return res.status(500).json({ error: 'Server error' });
    }
});
