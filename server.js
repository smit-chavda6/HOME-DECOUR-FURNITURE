const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));
app.use(cors({
    origin: true, // reflect request origin
    credentials: true
}));

// File uploads setup (store in ./uploads)
const uploadDir = path.join(__dirname, 'uploads');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
// Simple disk storage with safe filename
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
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Session configuration
app.use(session({
    secret: 'home-decor-furniture-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Database setup
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        createTables();
    }
});

// Create tables
function createTables() {
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT,
            phone TEXT,
            address TEXT,
            role TEXT NOT NULL DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createSessionsTable = `
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            session_id TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `;

    const createContactMessagesTable = `
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // New: products table for admin-managed catalog
    const createProductsTable = `
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            image TEXT,
            description TEXT,
            category TEXT,
            brand TEXT,
            material TEXT,
            original_price INTEGER,
            discount INTEGER,
            badge TEXT,
            rating REAL DEFAULT 0,
            rating_count INTEGER DEFAULT 0,
            model_src TEXT,
            is_3d INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Orders tables (simple)
    const createOrdersTable = `
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            full_name TEXT,
            email TEXT,
            phone TEXT,
            address1 TEXT,
            address2 TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            postal TEXT,
            payment_method TEXT,
            upi_id TEXT,
            card_last4 TEXT,
            subtotal INTEGER,
            shipping INTEGER,
            tax INTEGER,
            total INTEGER,
            status TEXT DEFAULT 'placed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
    const createOrderItemsTable = `
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id TEXT,
            name TEXT,
            price INTEGER,
            quantity INTEGER,
            FOREIGN KEY (order_id) REFERENCES orders (id)
        )`;

    // Reviews table: allow one review per user per product per order (so same product in different orders can be reviewed separately)
    const createReviewsTable = `
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            order_id INTEGER DEFAULT 0,
            rating REAL NOT NULL CHECK (rating >= 1 AND rating <= 5), -- now supports half-star increments (stored as REAL)
            comment TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, product_id, order_id)
        )`;

    db.run(createUsersTable, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table created successfully');
        }
    });

    db.run(createSessionsTable, (err) => {
        if (err) {
            console.error('Error creating sessions table:', err.message);
        } else {
            console.log('Sessions table created successfully');
        }
    });

    db.run(createContactMessagesTable, (err) => {
        if (err) {
            console.error('Error creating contact_messages table:', err.message);
        } else {
            console.log('Contact messages table created successfully');
        }
    });

    db.run(createProductsTable, (err) => {
        if (err) {
            console.error('Error creating products table:', err.message);
        } else {
            console.log('Products table created successfully');
            // Ensure product IDs start high to avoid clashing with static demo IDs in the gallery (1..8)
            ensureProductIdOffset(1000);
            // Seed default products (static gallery items) so they are editable in Admin
            seedDefaultProducts();
        }
    });

    db.run(createOrdersTable, (err) => {
        if (err) console.error('Error creating orders table:', err.message);
        else console.log('Orders table ready');
    });
    db.run(createOrderItemsTable, (err) => {
        if (err) console.error('Error creating order_items table:', err.message);
        else console.log('Order items table ready');
    });

    db.run(createReviewsTable, (err) => {
        if (err) console.error('Error creating reviews table:', err.message);
        else {
            console.log('Reviews table ready');
            // Attempt to add order_id column if upgrading from old schema
            db.get("PRAGMA table_info(reviews)", (e)=>{
                if (e) return;
                db.all("PRAGMA table_info(reviews)", (ce, cols)=>{
                    if (ce) return;
                    const hasOrderId = cols.some(c=>c.name==='order_id');
                                        const ratingCol = cols.find(c=>c.name==='rating');
                    if (!hasOrderId) {
                        db.run("ALTER TABLE reviews ADD COLUMN order_id INTEGER DEFAULT 0", [], (ae)=>{
                            if (ae) console.warn('Could not add order_id to reviews:', ae.message);
                            else console.log('Added order_id column to reviews');
                        });
                    }
                                        // If rating column is INTEGER, migrate to REAL to support half-star ratings
                                        if (ratingCol && /INT/i.test(ratingCol.type||'')) {
                                                console.log('Migrating reviews.rating to REAL for half-star support...');
                                                const migrationSql = [
                                                    'ALTER TABLE reviews RENAME TO reviews_old',
                                                    `CREATE TABLE reviews (\n            id INTEGER PRIMARY KEY AUTOINCREMENT,\n            user_id INTEGER NOT NULL,\n            product_id INTEGER NOT NULL,\n            order_id INTEGER DEFAULT 0,\n            rating REAL NOT NULL CHECK (rating >= 1 AND rating <= 5),\n            comment TEXT,\n            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n            UNIQUE(user_id, product_id, order_id)\n        )`,
                                                    'INSERT INTO reviews (id,user_id,product_id,order_id,rating,comment,created_at,updated_at) SELECT id,user_id,product_id,COALESCE(order_id,0),CAST(rating AS REAL),comment,created_at,updated_at FROM reviews_old',
                                                    'DROP TABLE reviews_old'
                                                ];
                                                (function runSteps(i){
                                                    if (i>=migrationSql.length) { console.log('reviews.rating migration complete'); return; }
                                                    db.run(migrationSql[i], (mErr)=>{
                                                        if (mErr) { console.warn('Migration step failed:', mErr.message); return; }
                                                        runSteps(i+1);
                                                    });
                                                })(0);
                                        }
                });
            });
        }
    });

    // Ensure role column exists for legacy DBs
    ensureRoleColumn(() => {
        // Insert/ensure default admin user
        seedDefaultAdmin();
    });

    // On startup: mark all existing orders as delivered (demo site convenience)
    try { deliverAllExistingOrders(); } catch(e) { console.warn('deliverAllExistingOrders error:', e.message); }
}

// Mark all existing orders as delivered (useful for demo so users can review immediately)
function deliverAllExistingOrders(){
    const sql = "UPDATE orders SET status = 'delivered' WHERE status IS NULL OR status <> 'delivered'";
    db.run(sql, [], function(err){
        if (err) return console.warn('Failed to mark existing orders delivered:', err.message);
        console.log(`Marked ${this.changes || 0} existing orders as delivered`);
    });
}

// After creating an order, auto-deliver it after a short delay (demo simulation)
function autoDeliverOrder(orderId, delayMs = 10000){
    setTimeout(() => {
        db.run("UPDATE orders SET status = 'delivered' WHERE id = ?", [orderId], function(err){
            if (err) return console.warn('Auto-deliver failed for order', orderId, err.message);
            if (this.changes) console.log('Order auto-delivered:', orderId);
        });
    }, delayMs);
}

// Bump the AUTOINCREMENT starting value for products so new items use ids >= minId
function ensureProductIdOffset(minId = 1000) {
    try {
        db.get("SELECT name, seq FROM sqlite_sequence WHERE name='products'", (err, row) => {
            if (err) {
                // sqlite_sequence might not exist yet; ignore silently
                console.warn('Could not read sqlite_sequence for products:', err.message);
                return;
            }
            if (!row) {
                db.run("INSERT INTO sqlite_sequence (name, seq) VALUES ('products', ?)", [minId], (insErr) => {
                    if (insErr) {
                        console.warn('Failed to initialize products id offset:', insErr.message);
                    } else {
                        console.log(`Initialized products id offset to ${minId}`);
                    }
                });
            } else if (row.seq < minId) {
                db.run("UPDATE sqlite_sequence SET seq = ? WHERE name='products'", [minId], (upErr) => {
                    if (upErr) {
                        console.warn('Failed to bump products id offset:', upErr.message);
                    } else {
                        console.log(`Bumped products id offset to ${minId}`);
                    }
                });
            }
        });
    } catch (e) {
        console.warn('ensureProductIdOffset error:', e.message);
    }
}

// Ensure 'role' column exists if DB created before role support
function ensureRoleColumn(callback) {
    const pragmaQuery = "PRAGMA table_info(users)";
    db.all(pragmaQuery, (err, columns) => {
        if (err) {
            console.error('Error reading table info:', err.message);
            return callback && callback();
        }
        const hasRole = columns.some((col) => col.name === 'role');
        if (hasRole) return callback && callback();

        db.run("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'", (alterErr) => {
            if (alterErr) {
                console.error('Error adding role column:', alterErr.message);
            } else {
                console.log("Added 'role' column to users table");
            }
            callback && callback();
        });
    });
}

// Seed initial products that match the static gallery items so they can be managed in Admin.
// Uses INSERT OR IGNORE to avoid duplicating if already present.
function seedDefaultProducts() {
    const defaults = [
        // Non-3D items (IDs 1..12)
        { id:1,  name:'Comfortable Sofa',      price:41500, image:'image/toa-heftiba-FV3GConVSss-unsplash.webp', description:'', category:'living',  brand:'NovaHome',  material:'Fabric', original_price:49900, discount:17, badge:'New',  rating:5, rating_count:24, model_src:null, is_3d:0 },
        { id:2,  name:'Modern Armchair',       price:20750, image:'image/becca-tapert-dO3qTKxwik0-unsplash.webp', description:'', category:'living',  brand:'ComfyCo',   material:'Leather', original_price:25000, discount:17, badge:'Sale', rating:4, rating_count:18, model_src:null, is_3d:0 },
        { id:3,  name:'Wooden Coffee Table',   price:12450, image:'image/christopher-jolly-GqbU78bdJFM-unsplash.webp', description:'', category:'living',  brand:'UrbanWood', material:'Wood',    original_price:null, discount:null, badge:null, rating:5, rating_count:31, model_src:null, is_3d:0 },
        { id:4,  name:'Dining Table',          price:33200, image:'image/davide-cantelli-ajisKc2uuFk-unsplash.webp', description:'', category:'dining',  brand:'UrbanWood', material:'Wood',    original_price:39800, discount:17, badge:'Hot', rating:4, rating_count:27, model_src:null, is_3d:0 },
        { id:5,  name:'Bookshelf',             price:16600, image:'image/denys-striyeshyn-wJ7yGwz2-00-unsplash.webp', description:'', category:'living',  brand:'UrbanWood', material:'Wood',    original_price:null, discount:null, badge:null, rating:4, rating_count:15, model_src:null, is_3d:0 },
        { id:6,  name:'Queen Size Bed',        price:49800, image:'image/hutomo-abrianto-X5BWooeO4Cw-unsplash.webp', description:'', category:'bedroom', brand:'NovaHome',  material:'Wood',    original_price:59900, discount:17, badge:'New',  rating:5, rating_count:42, model_src:null, is_3d:0 },
        { id:7,  name:'Office Chair',          price:10790, image:'image/inside-weather-Uxqlfigh6oE-unsplash.webp', description:'', category:'office',  brand:'ComfyCo',   material:'Fabric',  original_price:12900, discount:16, badge:null, rating:4, rating_count:19, model_src:null, is_3d:0 },
        { id:8,  name:'Side Table',            price: 7470, image:'image/kari-shea-AMyjxxLEHU4-unsplash.webp', description:'', category:'living',  brand:'UrbanWood', material:'Wood',    original_price:null, discount:null, badge:null, rating:4, rating_count:12, model_src:null, is_3d:0 },
        { id:9,  name:'Dresser',               price:29050, image:'image/kari-shea-ItMggD0EguY-unsplash.webp', description:'', category:'bedroom', brand:'UrbanWood', material:'Wood',    original_price:34800, discount:17, badge:'Sale', rating:5, rating_count:23, model_src:null, is_3d:0 },
        { id:10, name:'Bar Stool',             price: 6640, image:'image/kari-shea-tOVmshavtoo-unsplash.webp', description:'', category:'dining',  brand:'SteelCraft',material:'Metal',   original_price:null, discount:null, badge:null, rating:4, rating_count:8,  model_src:null, is_3d:0 },
        { id:11, name:'L-shaped Sofa',         price:74700, image:'image/kirill-9uH-hM0VwPg-unsplash.webp', description:'', category:'living',  brand:'NovaHome',  material:'Fabric',  original_price:89900, discount:17, badge:'Hot', rating:5, rating_count:38, model_src:null, is_3d:0 },
        { id:12, name:'Accent Chair',          price:16600, image:'image/olena-bohovyk-gxKL334bUK4-unsplash.webp', description:'', category:'living',  brand:'ComfyCo',   material:'Fabric',  original_price:null, discount:null, badge:null, rating:4, rating_count:16, model_src:null, is_3d:0 },

        // 3D items (IDs 101..108)
        { id:101, name:'Modern Office Chair',  price:10790, image:'', description:'', category:'3d', brand:'', material:'', original_price:12900, discount:16, badge:'3D',  rating:5, rating_count:15, model_src:'3d models/no_43.glb',                              is_3d:1 },
        { id:102, name:'Sofa Chair',           price:15000, image:'', description:'', category:'3d', brand:'', material:'', original_price:18000, discount:17, badge:'Hot', rating:4, rating_count:22, model_src:'3d models/sofa_chair.glb',                        is_3d:1 },
        { id:103, name:'Low Poly Modern Sofa', price: 6000, image:'', description:'', category:'3d', brand:'', material:'', original_price: 7200, discount:17, badge:'Sale',rating:4, rating_count: 8, model_src:'3d models/low_poly_modern_sofa_free_model.glb',    is_3d:1 },
        { id:104, name:'Vintage Sofa',         price:12000, image:'', description:'', category:'3d', brand:'', material:'', original_price: null, discount:null, badge:null, rating:4, rating_count:11, model_src:'3d models/old_sofa_free.glb',                    is_3d:1 },
        { id:105, name:'Leather Sofa Stool',   price: 3200, image:'', description:'', category:'3d', brand:'', material:'', original_price: 3800, discount:16, badge:'New', rating:5, rating_count: 6, model_src:'3d models/free_leather_sofa_stool.glb',          is_3d:1 },
        { id:106, name:'White Chair',          price: 4500, image:'', description:'', category:'3d', brand:'', material:'', original_price: null, discount:null, badge:null, rating:4, rating_count: 9, model_src:'3d models/white_chair.glb',                      is_3d:1 },
        { id:107, name:'Simple Modern Chair',  price: 2800, image:'', description:'', category:'3d', brand:'', material:'', original_price: null, discount:null, badge:null, rating:4, rating_count: 7, model_src:'3d models/simple_modern_chair_free_model.glb', is_3d:1 },
        { id:108, name:'Modern Table',         price: 5200, image:'', description:'', category:'3d', brand:'', material:'', original_price: 6200, discount:16, badge:'Hot', rating:5, rating_count:13, model_src:'3d models/table_mr_ft.glb',                     is_3d:1 },
    ];

    const sql = `INSERT OR IGNORE INTO products
        (id, name, price, image, description, category, brand, material, original_price, discount, badge, rating, rating_count, model_src, is_3d)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const stmt = db.prepare(sql);
    defaults.forEach(p => {
        try {
            stmt.run([
                p.id, p.name, p.price, p.image, p.description, p.category, p.brand, p.material,
                p.original_price, p.discount, p.badge, p.rating, p.rating_count, p.model_src, p.is_3d ? 1 : 0
            ]);
        } catch (e) {
            console.warn('Seed product failed (id=' + p.id + '):', e.message);
        }
    });
    try { stmt.finalize(()=>{}); } catch {}
}

function seedDefaultAdmin() {
    const defaultUser = {
        username: 'admin',
        email: 'admin@homedecor.com',
        password: 'admin123',
        full_name: 'Administrator'
    };

    // Check if admin exists
    db.get('SELECT id, role FROM users WHERE username = ?', [defaultUser.username], (err, row) => {
        if (err) {
            console.error('Error checking default admin:', err.message);
            return;
        }
        if (row) {
            if (row.role !== 'admin') {
                db.run('UPDATE users SET role = \"admin\" WHERE id = ?', [row.id], (e) => {
                    if (e) console.error('Error elevating default admin:', e.message);
                });
            }
            return;
        }

        bcrypt.hash(defaultUser.password, 10, (hashErr, hash) => {
            if (hashErr) {
                console.error('Error hashing password:', hashErr);
                return;
            }

            const insertDefaultUser = `
                INSERT OR IGNORE INTO users (username, email, password, full_name, role)
                VALUES (?, ?, ?, ?, 'admin')
            `;

            db.run(insertDefaultUser, [defaultUser.username, defaultUser.email, hash, defaultUser.full_name], (insErr) => {
                if (insErr) {
                    console.error('Error inserting default admin user:', insErr.message);
                } else {
                    console.log('Default admin user ensured (username: admin, password: admin123)');
                }
            });
        });
    });
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Admin-only middleware
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    // Ensure role in session or fetch from DB if missing
    if (req.session.role) {
        if (req.session.role === 'admin') return next();
        return res.status(403).json({ error: 'Admin access required' });
    }
    db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(401).json({ error: 'Invalid session' });
        req.session.role = row.role;
        if (row.role === 'admin') return next();
        return res.status(403).json({ error: 'Admin access required' });
    });
}

// Routes

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Register endpoint
app.post('/api/register', (req, res) => {
    const { username, email, password, full_name, phone, address } = req.body;

    // Validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const checkUser = 'SELECT id FROM users WHERE username = ? OR email = ?';
    db.get(checkUser, [username, email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (row) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password and create user
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                return res.status(500).json({ error: 'Error hashing password' });
            }

            const insertUser = `
                INSERT INTO users (username, email, password, full_name, phone, address)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.run(insertUser, [username, email, hash, full_name, phone, address], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Error creating user' });
                }

                res.json({ 
                    success: true, 
                    message: 'Registration successful',
                    userId: this.lastID 
                });
            });
        });
    });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const getUser = 'SELECT * FROM users WHERE username = ? OR email = ?';
    db.get(getUser, [username, username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'Error comparing passwords' });
            }

            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Set session
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.fullName = user.full_name;
            req.session.email = user.email;
            req.session.role = user.role;

            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role
                }
            });
        });
    });
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
        // Build a public URL relative to server static root (normalize to forward slashes)
        const rel = path.relative(path.join(__dirname), req.file.path).replace(/\\/g,'/');
        const url = `/${rel}`; // served by express.static('.')
        res.json({ success: true, url, filename: path.basename(req.file.path) });
    } catch (e) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Admin: list users
app.get('/api/admin/users', requireAdmin, (req, res) => {
    const q = 'SELECT id, username, email, full_name, phone, address, role, created_at, updated_at FROM users ORDER BY created_at DESC';
    db.all(q, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ users: rows });
    });
});

// Admin: update user role
app.put('/api/admin/users/:id/role', requireAdmin, (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body || {};
    if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    if (userId === req.session.userId) {
        return res.status(400).json({ error: 'You cannot change your own role' });
    }
    db.run('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, userId], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true });
    });
});

// Admin: delete user
app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (userId === req.session.userId) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true });
    });
});

// Admin: basic stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
    const stats = {};
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row1) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        stats.totalUsers = row1.count;
        db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", [], (err2, row2) => {
            if (err2) return res.status(500).json({ error: 'Database error' });
            stats.admins = row2.count;
            db.get("SELECT COUNT(*) as count FROM users WHERE role = 'user'", [], (err3, row3) => {
                if (err3) return res.status(500).json({ error: 'Database error' });
                stats.standardUsers = row3.count;
                db.get('SELECT COUNT(*) as count FROM contact_messages', [], (err4, row4) => {
                    if (err4) return res.status(500).json({ error: 'Database error' });
                    stats.messages = row4.count;
                    db.get('SELECT COUNT(*) as count FROM orders', [], (err5, row5) => {
                        // orders table may not exist yet on very first run; treat missing as 0
                        stats.orders = row5 ? row5.count : 0;
                        // notifications: basic proxy = messages + orders for now
                        stats.notifications = (stats.messages || 0) + (stats.orders || 0);
                        res.json({ stats });
                    });
                });
            });
        });
    });
});

// Public: receive contact form submissions
app.post('/api/contact', (req, res) => {
    const { name, email, phone, subject, message } = req.body || {};

    // If user is authenticated, prefer session details for name/email
    let finalName = name && String(name).trim();
    let finalEmail = email && String(email).trim();
    const finalPhone = (phone || '').toString().trim();

    const isAuthed = !!(req.session && req.session.userId);
    if (isAuthed) {
        // Use session values when available
        finalName = finalName || req.session.fullName || req.session.username || 'User';
        finalEmail = finalEmail || req.session.email || '';
    }

    // Validate required fields
    if (!subject || !String(subject).trim() || !message || !String(message).trim()) {
        return res.status(400).json({ error: 'Subject and message are required' });
    }
    if (!finalName || !finalEmail) {
        return res.status(400).json({ error: 'Name and email are required for guests' });
    }

    const q = `INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?,?,?,?,?)`;
    db.run(q, [String(finalName).trim(), String(finalEmail).trim(), finalPhone, String(subject).trim(), String(message).trim()], function(err){
        if (err) return res.status(500).json({ error: 'Database error' });
        return res.json({ success: true, id: this.lastID });
    });
});

// Admin: list contact messages
app.get('/api/admin/messages', requireAdmin, (req, res) => {
    const q = 'SELECT id, name, email, phone, subject, message, created_at FROM contact_messages ORDER BY created_at DESC';
    db.all(q, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ messages: rows });
    });
});

// Admin: delete a message (optional helper)
app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    db.run('DELETE FROM contact_messages WHERE id = ?', [id], function(err){
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'Message not found' });
        res.json({ success: true });
    });
});

// -------------------------------
// Products API
// -------------------------------

// Public: list products (with basic filtering)
app.get('/api/products', (req, res) => {
    const { category, q } = req.query || {};
    const params = [];
    let qStr = 'SELECT id, name, price, image, description, category, brand, material, original_price, discount, badge, rating, rating_count, model_src, is_3d FROM products';
    const where = [];
    if (category) { where.push('category = ?'); params.push(String(category)); }
    if (q) { where.push('(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)'); params.push(`%${String(q).toLowerCase()}%`, `%${String(q).toLowerCase()}%`); }
    if (where.length) qStr += ' WHERE ' + where.join(' AND ');
    qStr += ' ORDER BY created_at DESC';
    db.all(qStr, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ products: rows });
    });
});

// -------------------------------
// Orders API (minimal simulation)
// -------------------------------
app.post('/api/orders', (req, res) => {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const shipping = body.shipping || {};
    const payment = body.payment || {};
    const amounts = body.amounts || {};

    if (!items.length) return res.status(400).json({ error: 'Cart is empty' });
    if (!shipping.fullName || !shipping.email || !shipping.address1 || !shipping.city || !shipping.state || !shipping.postal) {
        return res.status(400).json({ error: 'Missing shipping fields' });
    }

    const insertOrderSql = `INSERT INTO orders (user_id, full_name, email, phone, address1, address2, city, state, country, postal, payment_method, upi_id, card_last4, subtotal, shipping, tax, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        req.session && req.session.userId ? req.session.userId : null,
        String(shipping.fullName), String(shipping.email), String(shipping.phone || ''),
        String(shipping.address1), String(shipping.address2 || ''), String(shipping.city), String(shipping.state), String(shipping.country || ''), String(shipping.postal),
        String(payment.method || 'cod'), payment.upiId ? String(payment.upiId) : null, payment.cardLast4 ? String(payment.cardLast4) : null,
        parseInt(amounts.subtotal||0,10), parseInt(amounts.shipping||0,10), parseInt(amounts.tax||0,10), parseInt(amounts.total||0,10)
    ];

    db.run(insertOrderSql, params, function(err){
        if (err) return res.status(500).json({ error: 'Database error' });
        const orderId = this.lastID;
        if (!orderId) return res.status(500).json({ error: 'Failed to create order' });
        if (!items.length) return res.json({ success:true, orderId });
        const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?,?,?,?,?)');
        try {
            items.forEach(it => {
                stmt.run([orderId, String(it.id||''), String(it.name||''), parseInt(it.price||0,10), parseInt(it.quantity||1,10)]);
            });
            stmt.finalize((e)=>{
                if (e) return res.status(500).json({ error: 'Failed to save items' });
                // Simulate delivery after a short delay for demo purposes
                autoDeliverOrder(orderId, 10000);
                res.json({ success:true, orderId });
            });
        } catch (e) {
            try { stmt.finalize(()=>{}); } catch {}
            res.status(500).json({ error: 'Failed to save items' });
        }
    });
});

// Authenticated: get my orders with items
app.get('/api/my/orders', requireAuth, (req, res) => {
    // For demo: ensure all of this user's orders are marked delivered before returning
    const deliverMine = "UPDATE orders SET status = 'delivered' WHERE user_id = ? AND (status IS NULL OR status <> 'delivered')";
    db.run(deliverMine, [req.session.userId], () => {
        const q = `SELECT id, user_id, full_name, email, phone, address1, address2, city, state, country, postal, payment_method, subtotal, shipping, tax, total, status, created_at
               FROM orders WHERE user_id = ? ORDER BY created_at DESC`;
        db.all(q, [req.session.userId], (err, orders) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (!orders || orders.length === 0) return res.json({ orders: [] });
            const ids = orders.map(o => o.id);
            const placeholders = ids.map(()=>'?').join(',');
            const qItems = `SELECT id, order_id, product_id, name, price, quantity FROM order_items WHERE order_id IN (${placeholders})`;
            db.all(qItems, ids, (err2, items) => {
                if (err2) return res.status(500).json({ error: 'Database error' });
                const byOrder = {};
                (items||[]).forEach(it => { (byOrder[it.order_id] = byOrder[it.order_id] || []).push(it); });

                // Enrich items with product image when possible
                const productIds = Array.from(new Set((items||[])
                    .map(it => parseInt(it.product_id, 10))
                    .filter(n => Number.isInteger(n))));
                if (productIds.length === 0) {
                    const result = orders.map(o => ({ ...o, items: byOrder[o.id] || [] }));
                    return res.json({ orders: result });
                }
                const ph = productIds.map(()=>'?').join(',');
                db.all(`SELECT id, image FROM products WHERE id IN (${ph})`, productIds, (e3, prows) => {
                    if (e3) {
                        const result = orders.map(o => ({ ...o, items: byOrder[o.id] || [] }));
                        return res.json({ orders: result });
                    }
                    const imgMap = {};
                    (prows || []).forEach(p => { imgMap[p.id] = (p.image || '').toString(); });
                    Object.values(byOrder).forEach(arr => arr.forEach(it => {
                        const pid = parseInt(it.product_id, 10);
                        if (Number.isInteger(pid) && imgMap[pid]) it.product_image = imgMap[pid];
                    }));
                    const result = orders.map(o => ({ ...o, items: byOrder[o.id] || [] }));
                    res.json({ orders: result });
                });
            });
        });
    });
});

// Admin: list orders
app.get('/api/admin/orders', requireAdmin, (req, res) => {
    const q = `SELECT id, user_id, full_name, email, phone, city, state, country, postal, payment_method, subtotal, shipping, tax, total, status, created_at
               FROM orders ORDER BY created_at DESC`;
    db.all(q, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ orders: rows || [] });
    });
});

// Admin: get order items
app.get('/api/admin/orders/:id/items', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const q = `SELECT id, order_id, product_id, name, price, quantity FROM order_items WHERE order_id = ?`;
    db.all(q, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ items: rows || [] });
    });
});

// Public: get single product by id
app.get('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    db.get('SELECT id, name, price, image, description, category, brand, material, original_price, discount, badge, rating, rating_count, model_src, is_3d FROM products WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Product not found' });
        res.json({ product: row });
    });
});

// Authenticated: list my reviews
app.get('/api/my/reviews', requireAuth, (req, res) => {
    const q = `SELECT r.id, r.product_id, r.order_id, r.rating, r.comment, r.created_at, r.updated_at,
                      p.name AS product_name, p.image AS product_image,
                      o.created_at AS order_created_at
               FROM reviews r
               JOIN products p ON p.id = r.product_id
               LEFT JOIN orders o ON o.id = r.order_id
               WHERE r.user_id = ?
               ORDER BY r.updated_at DESC`;
    db.all(q, [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ reviews: rows || [] });
    });
});

// Helper to recalc product rating from all reviews
function recalcProductRating(productId, cb) {
    const q = 'SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE product_id = ?';
    db.get(q, [productId], (err, row) => {
        if (err) return cb && cb(err);
        const avg = row && row.avg ? Math.round(row.avg * 10) / 10 : 0;
        const cnt = row && row.cnt ? row.cnt : 0;
        db.run('UPDATE products SET rating = ?, rating_count = ? WHERE id = ?', [avg, cnt, productId], (e)=>{
            if (cb) cb(e);
        });
    });
}

// Helper: ensure user has a delivered order containing product
function userHasDeliveredOrderForProduct(userId, productId, cb) {
    const q = `SELECT o.id FROM orders o
               JOIN order_items oi ON oi.order_id = o.id
               WHERE o.user_id = ? AND o.status = 'delivered' AND CAST(oi.product_id AS INTEGER) = ?
               LIMIT 1`;
    db.get(q, [userId, productId], (err, row) => {
        if (err) return cb(err);
        cb(null, !!row);
    });
}

// Authenticated: create or update my review for a product
app.post('/api/my/reviews', requireAuth, (req, res) => {
    const { product_id, rating, comment, order_id } = req.body || {};
    const pid = parseInt(product_id, 10);
    const oid = parseInt(order_id, 10) || 0; // 0 = legacy / not linked
    let r = parseFloat(rating);
    // Normalize to one decimal and ensure .0 or .5 increments
    if (Number.isFinite(r)) r = Math.round(r * 2) / 2; // snap to nearest 0.5
    const validHalf = pid && r >= 1 && r <= 5 && Math.abs(r * 2 - Math.round(r * 2)) < 1e-8;
    if (!validHalf) return res.status(400).json({ error: 'Invalid product or rating (must be 1-5 in 0.5 steps)' });

    // Runtime safety: ensure rating column is REAL (some deployments might not have restarted after migration code added)
    db.all('PRAGMA table_info(reviews)', (tiErr, cols)=>{
        if (!tiErr && cols) {
            const ratingCol = cols.find(c=>c.name==='rating');
            if (ratingCol && /INT/i.test(ratingCol.type||'')) {
                console.log('Runtime migration: converting reviews.rating to REAL');
                const steps = [
                  'ALTER TABLE reviews RENAME TO reviews_old_runtime',
                  `CREATE TABLE reviews (\n            id INTEGER PRIMARY KEY AUTOINCREMENT,\n            user_id INTEGER NOT NULL,\n            product_id INTEGER NOT NULL,\n            order_id INTEGER DEFAULT 0,\n            rating REAL NOT NULL CHECK (rating >= 1 AND rating <= 5),\n            comment TEXT,\n            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n            UNIQUE(user_id, product_id, order_id)\n        )`,
                  'INSERT INTO reviews (id,user_id,product_id,order_id,rating,comment,created_at,updated_at) SELECT id,user_id,product_id,COALESCE(order_id,0),CAST(rating AS REAL),comment,created_at,updated_at FROM reviews_old_runtime',
                  'DROP TABLE reviews_old_runtime'
                ];
                (function run(i){ if (i>=steps.length) return; db.run(steps[i], ()=> run(i+1)); })(0);
            }
        }
        // proceed after (potentially asynchronous) migration steps fire; not waiting strictly since writes queue
        continueHandler();
    });

    function continueHandler(){

    // Validate order if provided (>0): must belong to user, be delivered, and contain the product
    function validateContext(cb){
        if (!oid) {
            // fallback: ensure at least one delivered order with product (legacy behavior)
            return userHasDeliveredOrderForProduct(req.session.userId, pid, (e, ok)=>{
                if (e) return cb(e);
                if (!ok) return cb(new Error('NOT_DELIVERED'));
                cb();
            });
        }
        const q = `SELECT o.id
                   FROM orders o
                   JOIN order_items oi ON oi.order_id = o.id
                   WHERE o.id = ? AND o.user_id = ? AND o.status = 'delivered' AND CAST(oi.product_id AS INTEGER) = ?
                   LIMIT 1`;
        db.get(q, [oid, req.session.userId, pid], (err,row)=>{
            if (err) return cb(err);
            if (!row) return cb(new Error('NOT_DELIVERED'));
            cb();
        });
    }

    validateContext((vErr)=>{
        if (vErr) {
            if (vErr.message === 'NOT_DELIVERED') return res.status(403).json({ error:'You can only review delivered items from your orders' });
            return res.status(500).json({ error:'Database error' });
        }

        // Upsert: try update existing review row matching user/product/order
        const update = `UPDATE reviews SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ? AND order_id = ?`;
    db.run(update, [r, comment || '', req.session.userId, pid, oid], function(err){
            if (err) return res.status(500).json({ error: 'Database error' });
            if (this.changes > 0) {
                return recalcProductRating(pid, (e)=>{
                    if (e) return res.status(500).json({ error: 'Failed to update product rating' });
                    res.json({ success: true, updated: true });
                });
            }
            // Insert new
            const insert = `INSERT INTO reviews (user_id, product_id, order_id, rating, comment) VALUES (?,?,?,?,?)`;
            db.run(insert, [req.session.userId, pid, oid, r, comment || ''], function(insErr){
                if (insErr) return res.status(500).json({ error: 'Database error' });
                recalcProductRating(pid, (e)=>{
                    if (e) return res.status(500).json({ error: 'Failed to update product rating' });
                    res.json({ success: true, created: true, id: this.lastID });
                });
            });
        });
    });
    }
});

// Authenticated: delete my review for a product
app.delete('/api/my/reviews/:productId', requireAuth, (req, res) => {
    const pid = parseInt(req.params.productId, 10);
    if (!pid) return res.status(400).json({ error: 'Invalid product' });
    db.run('DELETE FROM reviews WHERE user_id = ? AND product_id = ?', [req.session.userId, pid], function(err){
        if (err) return res.status(500).json({ error: 'Database error' });
        recalcProductRating(pid, (e)=>{
            if (e) return res.status(500).json({ error: 'Failed to update product rating' });
            res.json({ success: true, deleted: this.changes > 0 });
        });
    });
});

// Public: list reviews for a product
app.get('/api/products/:id/reviews', (req, res) => {
    const pid = parseInt(req.params.id, 10);
    if (!pid) return res.status(400).json({ error: 'Invalid product' });
    const q = `SELECT r.id, r.user_id, r.product_id, r.rating, r.comment, r.created_at, r.updated_at,
                      u.username, u.full_name
               FROM reviews r
               LEFT JOIN users u ON u.id = r.user_id
               WHERE r.product_id = ?
               ORDER BY r.updated_at DESC`;
    db.all(q, [pid], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ reviews: rows || [] });
    });
});

// Admin: create product
app.post('/api/admin/products', requireAdmin, (req, res) => {
    const { name, price, image, description, category, brand, material, original_price, discount, badge, model_src, is_3d } = req.body || {};
    if (!name || typeof price === 'undefined' || price === null) {
        return res.status(400).json({ error: 'Name and price are required' });
    }
    const q = `INSERT INTO products (name, price, image, description, category, brand, material, original_price, discount, badge, model_src, is_3d)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [String(name), parseInt(price, 10), image || '', description || '', category || '', brand || '', material || '', original_price ? parseInt(original_price, 10) : null, discount ? parseInt(discount, 10) : null, badge || null, model_src || null, is_3d ? 1 : 0];
    db.run(q, params, function(err){
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true, id: this.lastID });
    });
});

// Admin: update product
app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { name, price, image, description, category, brand, material, original_price, discount, badge, model_src, is_3d } = req.body || {};
    const q = `UPDATE products SET 
        name = COALESCE(?, name),
        price = COALESCE(?, price),
        image = COALESCE(?, image),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        brand = COALESCE(?, brand),
        material = COALESCE(?, material),
        original_price = COALESCE(?, original_price),
        discount = COALESCE(?, discount),
        badge = COALESCE(?, badge),
        model_src = COALESCE(?, model_src),
        is_3d = COALESCE(?, is_3d),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;
    const params = [name ?? null, (price !== undefined && price !== null) ? parseInt(price,10) : null, image ?? null, description ?? null, category ?? null, brand ?? null, material ?? null, (original_price !== undefined && original_price !== null) ? parseInt(original_price,10) : null, (discount !== undefined && discount !== null) ? parseInt(discount,10) : null, badge ?? null, model_src ?? null, (is_3d !== undefined && is_3d !== null) ? (is_3d ? 1 : 0) : null, id];
    db.run(q, params, function(err){
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true });
    });
});

// Admin: delete product
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    // First, fetch the product to determine if its image is an uploaded file
    db.get('SELECT image FROM products WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Product not found' });

        const imageUrl = (row.image || '').toString();
        // Delete the DB row
        db.run('DELETE FROM products WHERE id = ?', [id], function(delErr){
            if (delErr) return res.status(500).json({ error: 'Database error' });
            if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });

            // Attempt file deletion only for files within /uploads
            try {
                const rel = imageUrl.replace(/^[\\\/]+/, '');
                if (/^uploads[\\\/]/i.test(rel)) {
                    const absPath = path.resolve(__dirname, rel);
                    // Safeguard: ensure file path is inside the uploads directory
                    if (absPath.startsWith(uploadDir)) {
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
        });
    });
});

// Get user profile
app.get('/api/profile', requireAuth, (req, res) => {
    const getUser = 'SELECT id, username, email, full_name, phone, address, created_at FROM users WHERE id = ?';
    db.get(getUser, [req.session.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    });
});

// Update user profile
app.put('/api/profile', requireAuth, (req, res) => {
    const { full_name, phone, address } = req.body;

    const updateUser = 'UPDATE users SET full_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(updateUser, [full_name, phone, address, req.session.userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error updating profile' });
        }

        res.json({ success: true, message: 'Profile updated successfully' });
    });
});

// Change password
app.put('/api/change-password', requireAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current password
    const getUser = 'SELECT password FROM users WHERE id = ?';
    db.get(getUser, [req.session.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        // Verify current password
        bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'Error comparing passwords' });
            }

            if (!isMatch) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Hash new password and update
            bcrypt.hash(newPassword, 10, (err, hash) => {
                if (err) {
                    return res.status(500).json({ error: 'Error hashing password' });
                }

                const updatePassword = 'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
                db.run(updatePassword, [hash, req.session.userId], function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error updating password' });
                    }

                    res.json({ success: true, message: 'Password changed successfully' });
                });
            });
        });
    });
});

// Start server
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
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
}); 