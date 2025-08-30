const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));
app.use(cors({
    origin: true, // reflect request origin
    credentials: true
}));

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
        }
    });

    // Ensure role column exists for legacy DBs
    ensureRoleColumn(() => {
        // Insert/ensure default admin user
        seedDefaultAdmin();
    });
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
                    res.json({ stats });
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

// Public: get single product by id
app.get('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    db.get('SELECT id, name, price, image, description, category, brand, material, original_price, discount, badge, rating, rating_count, model_src, is_3d FROM products WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Product not found' });
        res.json({ product: row });
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
    db.run('DELETE FROM products WHERE id = ?', [id], function(err){
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true });
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