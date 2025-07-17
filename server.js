const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));
app.use(cors({
    origin: 'http://localhost:3000',
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

    // Insert default admin user
    const defaultUser = {
        username: 'admin',
        email: 'admin@homedecor.com',
        password: 'admin123',
        full_name: 'Administrator'
    };

    bcrypt.hash(defaultUser.password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return;
        }

        const insertDefaultUser = `
            INSERT OR IGNORE INTO users (username, email, password, full_name)
            VALUES (?, ?, ?, ?)
        `;

        db.run(insertDefaultUser, [defaultUser.username, defaultUser.email, hash, defaultUser.full_name], (err) => {
            if (err) {
                console.error('Error inserting default user:', err.message);
            } else {
                console.log('Default admin user created (username: admin, password: admin123)');
            }
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

            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name
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
                full_name: req.session.fullName
            }
        });
    } else {
        res.json({ authenticated: false });
    }
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
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Default admin credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
});

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