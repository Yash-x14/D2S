import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import {
    createServer
} from 'http';
import {
    Server
} from 'socket.io';
import {
    fileURLToPath
} from 'url';

import {
    Customer
} from './src/models/Customer.js';
import {
    Dealer
} from './src/models/Dealer.js';
import {
    Product
} from './src/models/Product.js';
import {
    Order
} from './src/models/Order.js';
import {
    Cart
} from './src/models/Cart.js';
import {
    Bill
} from './src/models/Bill.js';
import {
    TestSubmission
} from './src/models/TestSubmission.js';
import {
    Contact
} from './src/models/Contact.js';
import {
    verifyJwt,
    optionalJwt
} from './src/middleware/auth.js';

dotenv.config();

// ES modules equivalent of __dirname
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'file://', '*'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// CORS configuration to allow both frontends
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'file://'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files from customer directory (accessible at root)
app.use(express.static(path.join(__dirname, '../customer')));

// Serve static files from Dealer directory at /dealer path
app.use('/dealer', express.static(path.join(__dirname, '../Dealer')));

// Serve main-site (customer frontend) at /main-site
app.use('/main-site', express.static(path.join(__dirname, '../customer')));

// Serve dealer-site (dealer frontend) at /dealer-site
app.use('/dealer-site', express.static(path.join(__dirname, '../Dealer')));

// Serve dealer2-site (dealer2 frontend) at /dealer2-site
app.use('/dealer2-site', express.static(path.join(__dirname, '../Dealer2')));

// Serve main customer homepage at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../customer/index.html'));
});

// Serve dealer dashboard at /dealer route
app.get('/dealer', (req, res) => {
    res.sendFile(path.join(__dirname, '../Dealer/index1.html'));
});

// Serve dealer2 dashboard at /dealer2 route
app.get('/dealer2', (req, res) => {
    res.sendFile(path.join(__dirname, '../Dealer2/index.html'));
});

// Serve main-site home page
app.get('/main-site/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../customer/index.html'));
});

// Serve dealer-site dashboard
app.get('/dealer-site/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../Dealer/index1.html'));
});

// Serve dealer login page (old)
app.get('/dealer/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../Dealer/login.html'));
});

// Serve dealer auth page (redirects to unified auth)
app.get('/dealer/auth', (req, res) => {
    res.sendFile(path.join(__dirname, '../Dealer/auth.html'));
});

// Serve customer login page (old)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../customer/login.html'));
});

// Serve unified auth page (Sign Up / Sign In)
app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, '../customer/auth.html'));
});

// Serve test submission page
app.get('/test-submission', (req, res) => {
    res.sendFile(path.join(__dirname, '../customer/test-submission.html'));
});

// API routes should come after static file serving
// (This ensures HTML files are served before API routes are checked)

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/d2s0001';
mongoose
    .connect(mongoUri, {
        dbName: process.env.MONGODB_DB || undefined
    })
    .then(() => {
        // eslint-disable-next-line no-console
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok'
    });
});

// Unified Login Route
app.post('/api/login', async (req, res) => {
    try {
        const {
            email,
            password,
            role
        } = req.body || {};

        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'email, password and role are required'
            });
        }

        const normalizedRole = String(role).toLowerCase();
        if (!['customer', 'dealer'].includes(normalizedRole)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Use customer or dealer.'
            });
        }

        const Model = normalizedRole === 'customer' ? Customer : Dealer;
        const collectionName = normalizedRole === 'customer' ? 'customers' : 'dealers';

        console.log('=== Login Request ===');
        console.log(`Looking up user in MongoDB Atlas collection: ${collectionName}`);
        console.log(`Email: ${email}`);
        console.log(`Role: ${normalizedRole}`);

        // Find user in MongoDB Atlas
        const user = await Model.findOne({
            email: String(email).toLowerCase().trim()
        }).lean();

        if (!user || !user.passwordHash) {
            console.log('❌ User not found in MongoDB Atlas');
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        console.log(`✅ User found in MongoDB Atlas`);
        console.log(`   User ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Verifying password...`);

        // Verify password against stored hash
        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            console.log('❌ Password verification failed');
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        console.log('✅ Password verified successfully');

        // Generate JWT token
        const token = jwt.sign({
            sub: String(user._id),
            role: normalizedRole
        }, JWT_SECRET, {
            expiresIn: '7d',
        });

        // Determine redirect URL based on role
        const redirectUrl = normalizedRole === 'customer' ?
            '/index.html' :
            '/dealer2';

        console.log(`✅ Login successful as: ${normalizedRole.toUpperCase()}`);
        console.log(`   Redirect URL: ${redirectUrl}`);
        console.log('=== Login Complete ===\n');

        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                userId: String(user._id),
                role: normalizedRole,
                redirectUrl,
                user: {
                    _id: user._id,
                    email: user.email,
                    name: user.name || user.companyName || '',
                    phone: user.phone || '',
                    address: user.address || '',
                    city: user.city || '',
                    state: user.state || '',
                    zipCode: user.zipCode || '',
                    country: user.country || '',
                    dateOfBirth: user.dateOfBirth || null,
                    gender: user.gender || '',
                    language: user.language || 'en',
                    currency: user.currency || 'INR',
                    newsletter: user.newsletter || false,
                    smsNotifications: user.smsNotifications || false,
                    emailNotifications: user.emailNotifications !== false,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Login error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Middleware to verify dealer role
const verifyDealer = (req, res, next) => {
    if (req.auth.role !== 'dealer') {
        return res.status(403).json({
            error: 'Access denied. Dealer role required.'
        });
    }
    next();
};

// Middleware to verify customer role
const verifyCustomer = (req, res, next) => {
    if (req.auth.role !== 'customer') {
        return res.status(403).json({
            error: 'Access denied. Customer role required.'
        });
    }
    next();
};

// Signup Route (alias for /api/register - uses same handler)
app.post('/api/signup', async (req, res) => {
    // This will use the same handler as /api/register below
    // The handler is defined inline below
    try {
        const {
            email,
            password,
            role,
            name,
            companyName
        } = req.body || {};

        console.log('=== Account Signup Request ===');
        console.log('Received role:', role);
        console.log('Email:', email);
        console.log('Has name:', !!name);
        console.log('Has companyName:', !!companyName);

        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'email, password and role are required'
            });
        }

        const normalizedRole = String(role).toLowerCase();
        if (!['customer', 'dealer'].includes(normalizedRole)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Use customer or dealer.'
            });
        }

        // Select the correct MongoDB model based on role
        const Model = normalizedRole === 'customer' ? Customer : Dealer;
        const collectionName = normalizedRole === 'customer' ? 'customers' : 'dealers';

        console.log(`Creating account as: ${normalizedRole.toUpperCase()}`);
        console.log(`Will save to MongoDB collection: ${collectionName}`);

        // Check if user already exists
        const existingUser = await Model.findOne({
            email: String(email).toLowerCase().trim()
        });
        if (existingUser) {
            console.log('User already exists with email:', email);
            return res.status(400).json({
                success: false,
                error: 'User already exists with this email'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Prepare user data
        const userData = {
            email: String(email).toLowerCase().trim(),
            passwordHash
        };

        // Add name or companyName based on role
        if (normalizedRole === 'customer' && name) {
            userData.name = name;
            console.log('Customer name:', name);
        } else if (normalizedRole === 'dealer' && companyName) {
            userData.companyName = companyName;
            console.log('Dealer company name:', companyName);
        }

        // Create user in MongoDB Atlas
        console.log('💾 Saving to MongoDB Atlas...');
        const user = await Model.create(userData);
        console.log(`✅ Account saved successfully in MongoDB Atlas!`);
        console.log(`   Database: MongoDB Atlas`);
        console.log(`   Collection: ${collectionName}`);
        console.log(`   User ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: Hashed and stored securely`);
        if (user.name) console.log(`   Name: ${user.name}`);
        if (user.companyName) console.log(`   Company Name: ${user.companyName}`);
        console.log(`   ✅ User can now login with this email and password`);

        // Generate JWT token
        const token = jwt.sign({
            sub: String(user._id),
            role: normalizedRole
        }, JWT_SECRET, {
            expiresIn: '7d',
        });

        // Determine redirect URL based on role
        // Customer → Customer homepage (/index.html)
        // Dealer → Dealer dashboard (/dealer)
        const redirectUrl = normalizedRole === 'customer' ?
            '/index.html' :
            '/dealer';

        console.log(`✅ Account created as: ${normalizedRole.toUpperCase()}`);
        console.log(`   Redirect URL: ${redirectUrl}`);
        console.log('=== Signup Complete ===\n');

        return res.status(201).json({
            success: true,
            message: `Account created successfully as ${normalizedRole}`,
            data: {
                token,
                role: normalizedRole,
                userId: user._id,
                redirectUrl
            }
        });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Register Route
app.post('/api/register', async (req, res) => {
    try {
        const {
            email,
            password,
            role,
            name,
            companyName
        } = req.body || {};

        if (!email || !password || !role) {
            return res.status(400).json({
                error: 'email, password and role are required'
            });
        }

        const normalizedRole = String(role).toLowerCase();
        if (!['customer', 'dealer'].includes(normalizedRole)) {
            return res.status(400).json({
                error: 'Invalid role. Use customer or dealer.'
            });
        }

        const Model = normalizedRole === 'customer' ? Customer : Dealer;
        const existingUser = await Model.findOne({
            email: String(email).toLowerCase().trim()
        });
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists with this email'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userData = {
            email: String(email).toLowerCase().trim(),
            passwordHash
        };

        if (normalizedRole === 'customer' && name) {
            userData.name = name;
        } else if (normalizedRole === 'dealer' && companyName) {
            userData.companyName = companyName;
        }

        const user = await Model.create(userData);
        const token = jwt.sign({
            sub: String(user._id),
            role: normalizedRole
        }, JWT_SECRET, {
            expiresIn: '7d',
        });

        // Determine redirect URL based on role
        const redirectUrl = normalizedRole === 'customer' ?
            '/main-site/home' :
            '/dealer-site/dashboard';

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                role: normalizedRole,
                userId: user._id,
                redirectUrl
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Protected route - get current user
// GET /api/verify-token - Verify token and return user info
app.get('/api/verify-token', verifyJwt, async (req, res) => {
    try {
        return res.json({
            valid: true,
            role: req.auth.role,
            userId: req.auth.userId
        });
    } catch (err) {
        return res.status(401).json({
            valid: false,
            error: 'Invalid token'
        });
    }
});

app.get('/api/me', verifyJwt, async (req, res) => {
    const {
        userId,
        role
    } = req.auth;
    return res.json({
        userId,
        role
    });
});

// Products Routes
// GET /api/products - Get all products
app.get('/api/products', async (req, res) => {
    try {
        const {
            category,
            featured,
            active
        } = req.query;
        const query = {};

        if (category) query.category = category;
        if (featured !== undefined) query.isFeatured = featured === 'true';

        // Default to showing only active products if active parameter is not explicitly false
        if (active === 'false') {
            // If explicitly false, show all (including inactive)
        } else {
            // Default: show only active products
            query.isActive = true;
        }

        console.log('📥 Fetching products with query:', query);
        const products = await Product.find(query).sort({
            createdAt: -1
        });
        console.log(`✅ Found ${products.length} products`);

        return res.json({
            data: {
                products
            },
            success: true
        });
    } catch (err) {
        console.error('❌ Get products error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET /api/products/:id - Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                error: 'Product not found'
            });
        }
        return res.json({
            data: {
                product
            },
            success: true
        });
    } catch (err) {
        console.error('Get product error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// POST /api/products - Create product (Dealer only)
app.post('/api/products', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const productData = req.body;

        // Validate required fields
        const requiredFields = ['name', 'description', 'price', 'category', 'stock'];
        const missingFields = requiredFields.filter(field => {
            if (field === 'stock') {
                return !productData.stock || productData.stock.quantity === undefined;
            }
            return !productData[field];
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate image URL (at least one image field required)
        if (!productData.image && !productData.primaryImage && !productData.imageURL) {
            return res.status(400).json({
                success: false,
                error: 'At least one image URL is required (image, primaryImage, or imageURL)'
            });
        }

        // Set dealerId from authenticated dealer
        productData.dealerId = req.auth.userId;

        // Set imageURL from image or primaryImage if not provided
        if (!productData.imageURL) {
            productData.imageURL = productData.image || productData.primaryImage;
        }

        // Ensure stock is an object with quantity
        if (typeof productData.stock === 'number') {
            productData.stock = {
                quantity: productData.stock
            };
        }

        const product = await Product.create(productData);

        // Convert Mongoose document to plain object for Socket.IO
        const productObj = product.toObject ? product.toObject() : product;

        // Emit Socket.IO event for real-time update
        io.emit('productAdded', productObj);

        return res.status(201).json({
            data: {
                product
            },
            success: true,
            message: 'Product created successfully'
        });
    } catch (err) {
        console.error('Create product error:', err);

        // Handle validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message).join(', ');
            return res.status(400).json({
                success: false,
                error: `Validation error: ${errors}`
            });
        }

        return res.status(500).json({
            success: false,
            error: err.message || 'Internal server error'
        });
    }
});

// POST /api/dealer/products - Alias for POST /api/products (Dealer only)
app.post('/api/dealer/products', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const productData = req.body;
        console.log('📦 Creating product:', {
            name: productData.name,
            price: productData.price,
            category: productData.category
        });

        // Validate required fields
        const requiredFields = ['name', 'description', 'price', 'category', 'stock'];
        const missingFields = requiredFields.filter(field => {
            if (field === 'stock') {
                return !productData.stock || productData.stock.quantity === undefined;
            }
            return !productData[field];
        });

        if (missingFields.length > 0) {
            console.error('❌ Missing required fields:', missingFields);
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate image URL (at least one image field required)
        if (!productData.image && !productData.primaryImage && !productData.imageURL) {
            console.error('❌ Missing image URL');
            return res.status(400).json({
                success: false,
                error: 'At least one image URL is required (image, primaryImage, or imageURL)'
            });
        }

        // Set dealerId from authenticated dealer
        productData.dealerId = req.auth.userId;
        console.log('👤 Setting dealerId:', productData.dealerId);

        // Set imageURL from image or primaryImage if not provided
        if (!productData.imageURL) {
            productData.imageURL = productData.image || productData.primaryImage;
        }

        // Ensure stock is an object with quantity
        if (typeof productData.stock === 'number') {
            productData.stock = {
                quantity: productData.stock
            };
        }

        const product = await Product.create(productData);
        console.log('✅ Product created successfully:', product._id);

        // Convert Mongoose document to plain object for Socket.IO
        const productObj = product.toObject ? product.toObject() : product;

        // Emit Socket.IO event for real-time update to ALL connected clients
        io.emit('productAdded', productObj);
        console.log('📡 Socket.IO event BROADCASTED: productAdded');
        console.log('   → All connected customer pages will receive this product automatically');
        console.log('   → Product details:', {
            id: productObj._id,
            name: productObj.name,
            price: productObj.price,
            category: productObj.category,
            isActive: productObj.isActive
        });

        return res.status(201).json({
            data: {
                product
            },
            success: true,
            message: 'Product created successfully'
        });
    } catch (err) {
        console.error('❌ Create product error:', err);

        // Handle validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message).join(', ');
            return res.status(400).json({
                success: false,
                error: `Validation error: ${errors}`
            });
        }

        return res.status(500).json({
            success: false,
            error: err.message || 'Internal server error'
        });
    }
});

// PUT /api/products/:id - Update product (Dealer only)
app.put('/api/products/:id', verifyJwt, verifyDealer, async (req, res) => {
    try {
        // Check if product exists and belongs to the dealer
        const existingProduct = await Product.findById(req.params.id);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Verify dealer owns this product
        if (String(existingProduct.dealerId) !== req.auth.userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only update your own products.'
            });
        }

        const updateData = req.body;

        // Set imageURL from image or primaryImage if not provided
        if (!updateData.imageURL && (updateData.image || updateData.primaryImage)) {
            updateData.imageURL = updateData.image || updateData.primaryImage;
        }

        // Ensure stock is an object with quantity if it's a number
        if (typeof updateData.stock === 'number') {
            updateData.stock = {
                quantity: updateData.stock
            };
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData, {
                new: true,
                runValidators: true
            }
        );

        // Convert Mongoose document to plain object for Socket.IO
        const productObj = product.toObject ? product.toObject() : product;

        // Emit Socket.IO event for real-time update
        io.emit('productUpdated', productObj);

        return res.json({
            data: {
                product
            },
            success: true,
            message: 'Product updated successfully'
        });
    } catch (err) {
        console.error('Update product error:', err);

        // Handle validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message).join(', ');
            return res.status(400).json({
                success: false,
                error: `Validation error: ${errors}`
            });
        }

        return res.status(500).json({
            success: false,
            error: err.message || 'Internal server error'
        });
    }
});

// PUT /api/dealer/products/:id - Alias for PUT /api/products/:id (Dealer only)
app.put('/api/dealer/products/:id', verifyJwt, verifyDealer, async (req, res) => {
    try {
        // Check if product exists and belongs to the dealer
        const existingProduct = await Product.findById(req.params.id);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Verify dealer owns this product
        if (String(existingProduct.dealerId) !== req.auth.userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only update your own products.'
            });
        }

        const updateData = req.body;

        // Set imageURL from image or primaryImage if not provided
        if (!updateData.imageURL && (updateData.image || updateData.primaryImage)) {
            updateData.imageURL = updateData.image || updateData.primaryImage;
        }

        // Ensure stock is an object with quantity if it's a number
        if (typeof updateData.stock === 'number') {
            updateData.stock = {
                quantity: updateData.stock
            };
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData, {
                new: true,
                runValidators: true
            }
        );

        // Convert Mongoose document to plain object for Socket.IO
        const productObj = product.toObject ? product.toObject() : product;

        // Emit Socket.IO event for real-time update
        io.emit('productUpdated', productObj);

        return res.json({
            data: {
                product
            },
            success: true,
            message: 'Product updated successfully'
        });
    } catch (err) {
        console.error('Update product error:', err);

        // Handle validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message).join(', ');
            return res.status(400).json({
                success: false,
                error: `Validation error: ${errors}`
            });
        }

        return res.status(500).json({
            success: false,
            error: err.message || 'Internal server error'
        });
    }
});

// DELETE /api/products/:id - Delete product (Dealer only)
app.delete('/api/products/:id', verifyJwt, verifyDealer, async (req, res) => {
    try {
        // Check if product exists and belongs to the dealer
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Verify dealer owns this product
        if (String(product.dealerId) !== req.auth.userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only delete your own products.'
            });
        }

        await Product.findByIdAndDelete(req.params.id);

        // Emit Socket.IO event for real-time update
        io.emit('productDeleted', {
            id: product._id
        });

        return res.json({
            message: 'Product deleted successfully',
            success: true
        });
    } catch (err) {
        console.error('Delete product error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Internal server error'
        });
    }
});

// DELETE /api/dealer/products/:id - Alias for DELETE /api/products/:id (Dealer only)
app.delete('/api/dealer/products/:id', verifyJwt, verifyDealer, async (req, res) => {
    try {
        // Check if product exists and belongs to the dealer
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Verify dealer owns this product
        if (String(product.dealerId) !== req.auth.userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only delete your own products.'
            });
        }

        await Product.findByIdAndDelete(req.params.id);

        // Emit Socket.IO event for real-time update
        io.emit('productDeleted', {
            id: product._id
        });

        return res.json({
            message: 'Product deleted successfully',
            success: true
        });
    } catch (err) {
        console.error('Delete product error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Internal server error'
        });
    }
});

// Orders Routes
// GET /api/orders - Get customer's orders
app.get('/api/orders', verifyJwt, verifyCustomer, async (req, res) => {
    try {
        const orders = await Order.find({
                customerId: req.auth.userId
            })
            .populate('items.productId')
            .sort({
                createdAt: -1
            });
        return res.json({
            data: {
                orders
            },
            success: true
        });
    } catch (err) {
        console.error('Get orders error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET /api/orders/:id - Get single order
app.get('/api/orders/:id', verifyJwt, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.productId');
        if (!order) {
            return res.status(404).json({
                error: 'Order not found'
            });
        }

        // Check if user has access to this order
        if (req.auth.role === 'customer' && String(order.customerId) !== req.auth.userId) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        return res.json({
            data: {
                order
            },
            success: true
        });
    } catch (err) {
        console.error('Get order error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// POST /api/orders - Create order (with optional authentication for guest orders)
app.post('/api/orders', optionalJwt, async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            paymentMethod,
            notes
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Items are required'
            });
        }

        if (!shippingAddress) {
            return res.status(400).json({
                error: 'Shipping address is required'
            });
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 599 ? 0 : 50;
        const tax = subtotal * 0.05;
        const total = subtotal + shipping + tax;

        // Get customerId if authenticated, otherwise null for guest orders
        const customerId = req.auth && req.auth.role === 'customer' ? req.auth.userId : null;

        // Check if there's an existing pending order for this customer
        let order;
        if (customerId) {
            const existingPendingOrder = await Order.findOne({
                customerId: customerId,
                status: 'pending'
            });

            if (existingPendingOrder) {
                // Update existing pending order with checkout details
                existingPendingOrder.items = items;
                existingPendingOrder.subtotal = subtotal;
                existingPendingOrder.shipping = shipping;
                existingPendingOrder.tax = tax;
                existingPendingOrder.total = total;
                existingPendingOrder.shippingAddress = shippingAddress;
                existingPendingOrder.paymentMethod = paymentMethod || 'COD';
                existingPendingOrder.notes = notes || 'Order confirmed from checkout';
                // Keep status as 'pending' for dealer to process
                await existingPendingOrder.save();
                order = existingPendingOrder;
                console.log(`✅ Updated existing pending order ${order._id} with checkout details`);
            } else {
                // Create new order if no pending order exists
                order = await Order.create({
                    customerId: customerId,
                    items,
                    subtotal,
                    shipping,
                    tax,
                    total,
                    shippingAddress,
                    paymentMethod: paymentMethod || 'COD',
                    notes,
                    status: 'pending'
                });
                console.log(`🆕 Created new order ${order._id} from checkout`);
            }
        } else {
            // Guest order - always create new
            order = await Order.create({
                customerId: customerId,
                items,
                subtotal,
                shipping,
                tax,
                total,
                shippingAddress,
                paymentMethod: paymentMethod || 'COD',
                notes,
                status: 'pending'
            });
            console.log(`🆕 Created guest order ${order._id} from checkout`);
        }

        // Log order creation for dealer notifications
        console.log(`[NEW ORDER] Order ${order._id} created - Status: ${order.status}, Total: ₹${total}, Items: ${items.length}`);

        // Emit Socket.IO event for real-time order update to dealers
        if (io) {
            const orderObj = order.toObject ? order.toObject() : order;
            io.emit('orderUpdated', orderObj);
            io.emit('newOrder', orderObj);
            console.log('📡 Socket.IO events BROADCASTED: orderUpdated, newOrder');
        }

        // Clear cart if customer is authenticated
        if (customerId) {
            try {
                await Cart.findOneAndUpdate({
                    userId: customerId
                }, {
                    items: []
                }, {
                    new: true,
                    upsert: false
                });
            } catch (cartErr) {
                console.warn('Could not clear cart:', cartErr);
            }
        }

        return res.status(201).json({
            data: {
                order
            },
            success: true,
            message: 'Order placed successfully!'
        });
    } catch (err) {
        console.error('Create order error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Dealer Order Management Routes
// GET /api/admin/dealer/orders - Get all orders for dealer (with filters)
// Only returns orders containing products created by the authenticated dealer
app.get('/api/admin/dealer/orders', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const dealerId = req.auth.userId;
        const {
            status,
            limit = 50,
            skip = 0
        } = req.query;

        // First, get all product IDs created by this dealer
        const dealerProducts = await Product.find({
            dealerId: dealerId
        }).select('_id');
        const dealerProductIds = dealerProducts.map(p => p._id);

        if (dealerProductIds.length === 0) {
            // Dealer has no products, return empty result
            return res.json({
                data: {
                    orders: [],
                    total: 0,
                    limit: parseInt(limit),
                    skip: parseInt(skip)
                },
                success: true
            });
        }

        // Build query to find orders containing dealer's products
        const query = {
            'items.productId': {
                $in: dealerProductIds
            }
        };

        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('customerId', 'name email')
            .populate('items.productId', 'name image dealerId')
            .sort({
                createdAt: -1
            })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        // Filter orders to only include items from this dealer's products
        const filteredOrders = orders.map(order => {
            const filteredItems = order.items.filter(item => {
                const productId = item.productId && item.productId._id ? item.productId._id : item.productId;
                return dealerProductIds.some(id => String(id) === String(productId));
            });
            return {
                ...order.toObject(),
                items: filteredItems
            };
        });

        const total = await Order.countDocuments(query);

        console.log(`📦 Dealer ${dealerId} viewing ${filteredOrders.length} orders (out of ${total} total)`);

        return res.json({
            data: {
                orders: filteredOrders,
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            },
            success: true
        });
    } catch (err) {
        console.error('Get dealer orders error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET /api/dealer/products - Get all products for authenticated dealer only
app.get('/api/dealer/products', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const dealerId = req.auth.userId;
        const {
            category,
            featured,
            active
        } = req.query;
        const query = {
            dealerId: dealerId
        }; // Only this dealer's products

        if (category) query.category = category;
        if (featured !== undefined) query.isFeatured = featured === 'true';

        // Default to showing only active products if active parameter is not explicitly false
        if (active === 'false') {
            // If explicitly false, show all (including inactive)
        } else {
            // Default: show only active products
            query.isActive = true;
        }

        console.log(`📥 Dealer ${dealerId} fetching their products with query:`, query);
        const products = await Product.find(query).sort({
            createdAt: -1
        });
        console.log(`✅ Found ${products.length} products for dealer ${dealerId}`);

        return res.json({
            data: {
                products
            },
            success: true
        });
    } catch (err) {
        console.error('❌ Get dealer products error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// PUT /api/orders/:id - Update order (for dealer)
// Only allows updating orders that contain products from the authenticated dealer
app.put('/api/orders/:id', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const dealerId = req.auth.userId;
        const orderId = req.params.id;

        // Get the order first
        const order = await Order.findById(orderId)
            .populate('items.productId', 'dealerId');

        if (!order) {
            return res.status(404).json({
                error: 'Order not found'
            });
        }

        // Check if order contains any products from this dealer
        const dealerProducts = await Product.find({
            dealerId: dealerId
        }).select('_id');
        const dealerProductIds = dealerProducts.map(p => p._id);

        const hasDealerProduct = order.items.some(item => {
            const productId = item.productId && item.productId._id ? item.productId._id : item.productId;
            return dealerProductIds.some(id => String(id) === String(productId));
        });

        if (!hasDealerProduct) {
            return res.status(403).json({
                error: 'Access denied. This order does not contain any of your products.'
            });
        }

        // Update the order
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            req.body, {
                new: true,
                runValidators: true
            }
        ).populate('customerId', 'name email');

        console.log(`✅ Dealer ${dealerId} updated order ${orderId}`);

        return res.json({
            data: {
                order: updatedOrder
            },
            success: true
        });
    } catch (err) {
        console.error('Update order error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Helper function to generate bill from order
async function generateBillFromOrder(order) {
    try {
        // Check if bill already exists for this order
        const existingBill = await Bill.findOne({
            orderId: order._id
        });
        if (existingBill) {
            console.log(`📄 Bill already exists for order ${order._id}: ${existingBill.billNumber}`);
            return existingBill;
        }

        // Get dealer details (use first dealer or defaults)
        let dealerDetails = {
            companyName: 'Svasthyaa E-Commerce',
            email: 'info@svasthyaa.com',
            phone: '+91 98765 43210',
            address: '123 Health Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001',
            gstNumber: ''
        };

        try {
            const dealer = await Dealer.findOne();
            if (dealer) {
                dealerDetails.companyName = dealer.companyName || dealerDetails.companyName;
                dealerDetails.email = dealer.email || dealerDetails.email;
                dealerDetails.phone = dealer.phone || dealerDetails.phone;
            }
        } catch (dealerError) {
            console.log('Using default dealer details');
        }

        // Get customer details
        let customerDetails = {
            name: (order.shippingAddress && order.shippingAddress.name) || 'Guest Customer',
            email: '',
            phone: (order.shippingAddress && order.shippingAddress.phone) || '',
            address: (order.shippingAddress && order.shippingAddress.address) || '',
            city: (order.shippingAddress && order.shippingAddress.city) || '',
            state: (order.shippingAddress && order.shippingAddress.state) || '',
            zipCode: (order.shippingAddress && order.shippingAddress.zipCode) || ''
        };

        if (order.customerId) {
            const customer = await Customer.findById(order.customerId);
            if (customer) {
                customerDetails.email = customer.email || '';
                if (!customerDetails.name || customerDetails.name === 'Guest Customer') {
                    customerDetails.name = customer.name || customerDetails.name;
                }
            }
        }

        // Create bill
        const bill = await Bill.create({
            orderId: order._id,
            customerId: order.customerId || null,
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity
            })),
            subtotal: order.subtotal,
            tax: order.tax,
            shipping: order.shipping,
            total: order.total,
            paymentMethod: order.paymentMethod || 'COD',
            dealerDetails: dealerDetails,
            customerDetails: customerDetails,
            status: order.status === 'delivered' ? 'delivered' : 'confirmed'
        });

        console.log(`✅ Generated bill ${bill.billNumber} for order ${order._id}`);
        return bill;
    } catch (error) {
        console.error('Error generating bill from order:', error);
        throw error;
    }
}

// PUT /api/admin/dealer/orders/:id/status - Update order status
// Only allows updating orders that contain products from the authenticated dealer
app.put('/api/admin/dealer/orders/:id/status', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const dealerId = req.auth.userId;
        const {
            status
        } = req.body;
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Valid status is required'
            });
        }

        // Get the order first to verify access
        const order = await Order.findById(req.params.id)
            .populate('items.productId', 'dealerId');

        if (!order) {
            return res.status(404).json({
                error: 'Order not found'
            });
        }

        // Check if order contains any products from this dealer
        const dealerProducts = await Product.find({
            dealerId: dealerId
        }).select('_id');
        const dealerProductIds = dealerProducts.map(p => p._id);

        const hasDealerProduct = order.items.some(item => {
            const productId = item.productId && item.productId._id ? item.productId._id : item.productId;
            return dealerProductIds.some(id => String(id) === String(productId));
        });

        if (!hasDealerProduct) {
            return res.status(403).json({
                error: 'Access denied. This order does not contain any of your products.'
            });
        }

        // Update the order status
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id, {
                status
            }, {
                new: true,
                runValidators: true
            }
        ).populate('customerId', 'name email');

        // Automatically generate bill when order is confirmed or delivered
        if (status === 'confirmed' || status === 'delivered') {
            try {
                await generateBillFromOrder(updatedOrder);
            } catch (billError) {
                console.error('⚠️ Error generating bill (order update succeeded):', billError);
                // Don't fail the order update if bill generation fails
            }
        }

        // Emit Socket.IO event
        if (io) {
            const orderObj = updatedOrder.toObject ? updatedOrder.toObject() : updatedOrder;
            io.emit('orderUpdated', orderObj);
        }

        console.log(`✅ Dealer ${dealerId} updated order ${req.params.id} status to ${status}`);

        return res.json({
            data: {
                order: updatedOrder
            },
            success: true
        });
    } catch (err) {
        console.error('Update order status error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// POST /api/admin/dealer/orders/bulk-status - Bulk update order statuses
// Only allows updating orders that contain products from the authenticated dealer
app.post('/api/admin/dealer/orders/bulk-status', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const dealerId = req.auth.userId;
        const {
            orderIds,
            status
        } = req.body;
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({
                error: 'orderIds array is required'
            });
        }

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Valid status is required'
            });
        }

        // Get all product IDs created by this dealer
        const dealerProducts = await Product.find({
            dealerId: dealerId
        }).select('_id');
        const dealerProductIds = dealerProducts.map(p => p._id);

        // Get orders and filter to only those containing dealer's products
        const orders = await Order.find({
            _id: {
                $in: orderIds
            }
        }).populate('items.productId', 'dealerId');

        // Filter orders to only include those with dealer's products
        const authorizedOrderIds = [];
        orders.forEach(order => {
            const hasDealerProduct = order.items.some(item => {
                const productId = item.productId && item.productId._id ? item.productId._id : item.productId;
                return dealerProductIds.some(id => String(id) === String(productId));
            });
            if (hasDealerProduct) {
                authorizedOrderIds.push(order._id);
            }
        });

        if (authorizedOrderIds.length === 0) {
            return res.status(403).json({
                error: 'Access denied. None of the specified orders contain your products.'
            });
        }

        // Update only authorized orders
        const result = await Order.updateMany({
            _id: {
                $in: authorizedOrderIds
            }
        }, {
            status
        });

        // Generate bills for confirmed or delivered orders
        if (status === 'confirmed' || status === 'delivered') {
            try {
                const updatedOrders = await Order.find({
                    _id: {
                        $in: authorizedOrderIds
                    }
                });
                for (const order of updatedOrders) {
                    try {
                        await generateBillFromOrder(order);
                    } catch (billError) {
                        console.error(`⚠️ Error generating bill for order ${order._id}:`, billError);
                    }
                }
            } catch (bulkBillError) {
                console.error('⚠️ Error generating bills in bulk:', bulkBillError);
            }
        }

        // Emit Socket.IO events
        if (io) {
            const updatedOrders = await Order.find({
                _id: {
                    $in: authorizedOrderIds
                }
            });
            updatedOrders.forEach(order => {
                const orderObj = order.toObject ? order.toObject() : order;
                io.emit('orderUpdated', orderObj);
            });
        }

        console.log(`✅ Dealer ${dealerId} bulk updated ${result.modifiedCount} orders (${authorizedOrderIds.length} authorized out of ${orderIds.length} requested)`);

        return res.json({
            data: {
                matched: result.matchedCount,
                modified: result.modifiedCount,
                authorized: authorizedOrderIds.length,
                requested: orderIds.length
            },
            success: true
        });
    } catch (err) {
        console.error('Bulk update order status error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Analytics Routes (for dealer)
app.get('/api/analytics/sales', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const dealerId = req.auth.userId;

        // Get all product IDs created by this dealer
        const dealerProducts = await Product.find({
            dealerId: dealerId
        }).select('_id');
        const dealerProductIds = dealerProducts.map(p => p._id);

        if (dealerProductIds.length === 0) {
            return res.json({
                data: {
                    totalSales: 0,
                    totalOrders: 0,
                    averageOrderValue: 0
                },
                success: true
            });
        }

        // Find orders containing dealer's products
        const orders = await Order.find({
            status: {
                $ne: 'cancelled'
            },
            'items.productId': {
                $in: dealerProductIds
            }
        });

        // Calculate sales only for items from dealer's products
        let totalSales = 0;
        const dealerOrderIds = new Set();
        for (const order of orders) {
            for (const item of order.items) {
                const productId = item.productId && item.productId._id ? item.productId._id : item.productId;
                if (dealerProductIds.some(id => String(id) === String(productId))) {
                    totalSales += item.price * item.quantity;
                    dealerOrderIds.add(String(order._id));
                }
            }
        }

        const salesData = {
            totalSales: totalSales,
            totalOrders: dealerOrderIds.size,
            averageOrderValue: dealerOrderIds.size > 0 ? totalSales / dealerOrderIds.size : 0
        };

        console.log(`📊 Analytics for dealer ${dealerId}: ${salesData.totalOrders} orders, ₹${salesData.totalSales}`);

        return res.json({
            data: salesData,
            success: true
        });
    } catch (err) {
        console.error('Analytics error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

app.get('/api/analytics/orders', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const dealerId = req.auth.userId;

        // Get all product IDs created by this dealer
        const dealerProducts = await Product.find({
            dealerId: dealerId
        }).select('_id');
        const dealerProductIds = dealerProducts.map(p => p._id);

        if (dealerProductIds.length === 0) {
            return res.json({
                data: {
                    statusCounts: []
                },
                success: true
            });
        }

        // Find orders containing dealer's products and aggregate by status
        const orders = await Order.find({
            'items.productId': {
                $in: dealerProductIds
            }
        });

        // Count orders by status (only count unique orders)
        const orderStatusMap = new Map();
        orders.forEach(order => {
            // Check if order has at least one item from dealer's products
            const hasDealerProduct = order.items.some(item => {
                const productId = item.productId && item.productId._id ? item.productId._id : item.productId;
                return dealerProductIds.some(id => String(id) === String(productId));
            });

            if (hasDealerProduct) {
                const status = order.status || 'pending';
                orderStatusMap.set(status, (orderStatusMap.get(status) || 0) + 1);
            }
        });

        const statusCounts = Array.from(orderStatusMap.entries()).map(([status, count]) => ({
            _id: status,
            count: count
        }));

        return res.json({
            data: {
                statusCounts
            },
            success: true
        });
    } catch (err) {
        console.error('Analytics error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Customers Routes (for dealer)
app.get('/api/customers', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const customers = await Customer.find().select('-passwordHash').sort({
            createdAt: -1
        });
        return res.json({
            data: {
                customers
            },
            success: true
        });
    } catch (err) {
        console.error('Get customers error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// PUT /api/dealer/update-profile - Update dealer profile
app.put('/api/dealer/update-profile', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const {
            name,
            companyName,
            email,
            phone,
            currentPassword,
            newPassword
        } = req.body;
        const dealerId = req.auth.userId;

        const dealer = await Dealer.findById(dealerId);
        if (!dealer) {
            return res.status(404).json({
                error: 'Dealer not found'
            });
        }

        // Update password if provided
        if (currentPassword && newPassword) {
            const isValid = await bcrypt.compare(currentPassword, dealer.passwordHash);
            if (!isValid) {
                return res.status(400).json({
                    error: 'Current password is incorrect'
                });
            }
            dealer.passwordHash = await bcrypt.hash(newPassword, 10);
        }

        // Update other fields
        if (name) dealer.name = name;
        if (companyName) dealer.companyName = companyName;
        if (email) dealer.email = email;
        if (phone) dealer.phone = phone;

        await dealer.save();

        return res.json({
            data: {
                dealer: {
                    _id: dealer._id,
                    name: dealer.name,
                    companyName: dealer.companyName,
                    email: dealer.email,
                    phone: dealer.phone
                }
            },
            success: true
        });
    } catch (err) {
        console.error('Update dealer profile error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

app.get('/api/customers/:id', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).select('-passwordHash');
        if (!customer) {
            return res.status(404).json({
                error: 'Customer not found'
            });
        }
        return res.json({
            data: {
                customer
            },
            success: true
        });
    } catch (err) {
        console.error('Get customer error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET /api/customer/profile - Get current customer's profile
app.get('/api/customer/profile', verifyJwt, verifyCustomer, async (req, res) => {
    try {
        const customer = await Customer.findById(req.auth.userId).select('-passwordHash');
        if (!customer) {
            return res.status(404).json({
                error: 'Customer not found'
            });
        }
        return res.json({
            data: {
                customer
            },
            success: true
        });
    } catch (err) {
        console.error('Get customer profile error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// PUT /api/customer/profile - Update current customer's profile
app.put('/api/customer/profile', verifyJwt, verifyCustomer, async (req, res) => {
    try {
        const {
            name,
            phone,
            address,
            city,
            state,
            zipCode,
            country,
            dateOfBirth,
            gender,
            language,
            currency,
            newsletter,
            smsNotifications,
            emailNotifications,
            currentPassword,
            newPassword
        } = req.body;
        const customerId = req.auth.userId;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                error: 'Customer not found'
            });
        }

        // Update password if provided
        if (currentPassword && newPassword) {
            const isValid = await bcrypt.compare(currentPassword, customer.passwordHash);
            if (!isValid) {
                return res.status(400).json({
                    error: 'Current password is incorrect'
                });
            }
            customer.passwordHash = await bcrypt.hash(newPassword, 10);
        }

        // Update other fields
        if (name !== undefined) customer.name = name;
        if (phone !== undefined) customer.phone = phone;
        if (address !== undefined) customer.address = address;
        if (city !== undefined) customer.city = city;
        if (state !== undefined) customer.state = state;
        if (zipCode !== undefined) customer.zipCode = zipCode;
        if (country !== undefined) customer.country = country;
        if (dateOfBirth !== undefined) customer.dateOfBirth = dateOfBirth;
        if (gender !== undefined) customer.gender = gender;
        if (language !== undefined) customer.language = language;
        if (currency !== undefined) customer.currency = currency;
        if (newsletter !== undefined) customer.newsletter = newsletter;
        if (smsNotifications !== undefined) customer.smsNotifications = smsNotifications;
        if (emailNotifications !== undefined) customer.emailNotifications = emailNotifications;

        await customer.save();

        return res.json({
            data: {
                customer: {
                    _id: customer._id,
                    email: customer.email,
                    name: customer.name,
                    phone: customer.phone,
                    address: customer.address,
                    city: customer.city,
                    state: customer.state,
                    zipCode: customer.zipCode,
                    country: customer.country,
                    dateOfBirth: customer.dateOfBirth,
                    gender: customer.gender,
                    language: customer.language,
                    currency: customer.currency,
                    newsletter: customer.newsletter,
                    smsNotifications: customer.smsNotifications,
                    emailNotifications: customer.emailNotifications,
                    createdAt: customer.createdAt,
                    updatedAt: customer.updatedAt
                }
            },
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (err) {
        console.error('Update customer profile error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Test Submission Endpoint
app.post('/api/test/submit', async (req, res) => {
    try {
        const {
            name,
            email,
            testScore,
            feedback,
            date
        } = req.body;

        // Validate required fields
        if (!name || !email || testScore === undefined) {
            return res.status(400).json({
                error: 'name, email, and testScore are required'
            });
        }

        // Validate testScore range
        if (typeof testScore !== 'number' || testScore < 0 || testScore > 100) {
            return res.status(400).json({
                error: 'testScore must be a number between 0 and 100'
            });
        }

        // Create test submission
        const submission = await TestSubmission.create({
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            testScore: Number(testScore),
            feedback: feedback ? String(feedback).trim() : '',
            date: date ? new Date(date) : new Date()
        });

        return res.status(201).json({
            message: 'Test data stored successfully',
            data: {
                id: submission._id,
                name: submission.name,
                email: submission.email,
                testScore: submission.testScore,
                feedback: submission.feedback,
                date: submission.date
            }
        });
    } catch (err) {
        console.error('Test submission error:', err);

        // Handle duplicate email error or validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', ')
            });
        }

        return res.status(500).json({
            error: 'Internal server error',
            details: err.message
        });
    }
});

// Cart Routes
// POST /api/cart - Add product to cart
app.post('/api/cart', verifyJwt, verifyCustomer, async (req, res) => {
    try {
        const {
            productId,
            quantity = 1
        } = req.body;
        const userId = req.auth.userId;

        if (!productId) {
            return res.status(400).json({
                error: 'productId is required'
            });
        }

        // Get product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                error: 'Product not found'
            });
        }

        // Find or create cart for user
        let cart = await Cart.findOne({
            userId
        });
        if (!cart) {
            cart = await Cart.create({
                userId,
                items: []
            });
        }

        // Check if product already in cart
        const existingItemIndex = cart.items.findIndex(
            item => String(item.productId) === String(productId)
        );

        if (existingItemIndex >= 0) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                productId,
                name: product.name,
                price: product.price,
                quantity,
                image: product.imageURL || product.image || product.primaryImage || ''
            });
        }

        await cart.save();

        // Create or update pending order for processing
        try {
            // Calculate order totals from cart
            const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const shipping = subtotal > 599 ? 0 : 50;
            const tax = subtotal * 0.05;
            const total = subtotal + shipping + tax;

            // Find existing pending order for this customer
            let pendingOrder = await Order.findOne({
                customerId: userId,
                status: 'pending'
            });

            // Get customer details for default shipping address
            const customer = await Customer.findById(userId);

            // Default shipping address (will be updated during checkout)
            const defaultShippingAddress = {
                name: (customer && customer.name) || 'Customer',
                address: 'Address to be provided during checkout',
                city: 'City to be provided',
                state: 'State to be provided',
                zipCode: '000000',
                phone: '0000000000'
            };

            if (pendingOrder) {
                // Update existing pending order with current cart items
                pendingOrder.items = cart.items.map(item => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image || ''
                }));
                pendingOrder.subtotal = subtotal;
                pendingOrder.shipping = shipping;
                pendingOrder.tax = tax;
                pendingOrder.total = total;

                // Keep existing shipping address if it was already set, otherwise use default
                if (!pendingOrder.shippingAddress || pendingOrder.shippingAddress.address === 'Address to be provided during checkout') {
                    pendingOrder.shippingAddress = defaultShippingAddress;
                }

                await pendingOrder.save();
                console.log(`📦 Updated pending order ${pendingOrder._id} for customer ${userId} with ${cart.items.length} items`);
            } else {
                // Create new pending order
                pendingOrder = await Order.create({
                    customerId: userId,
                    items: cart.items.map(item => ({
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image || ''
                    })),
                    subtotal: subtotal,
                    shipping: shipping,
                    tax: tax,
                    total: total,
                    shippingAddress: defaultShippingAddress,
                    paymentMethod: 'COD',
                    status: 'pending',
                    notes: 'Order created from cart - awaiting checkout confirmation'
                });
                console.log(`🆕 Created pending order ${pendingOrder._id} for customer ${userId} with ${cart.items.length} items`);
            }

            // Emit Socket.IO event for real-time order update to dealers
            if (io) {
                const orderObj = pendingOrder.toObject ? pendingOrder.toObject() : pendingOrder;
                io.emit('orderUpdated', orderObj);
                console.log('📡 Socket.IO event BROADCASTED: orderUpdated');
            }
        } catch (orderErr) {
            // Log error but don't fail cart operation
            console.error('⚠️ Error creating/updating pending order:', orderErr);
            console.error('   Cart operation succeeded, but order processing may be delayed');
        }

        return res.status(201).json({
            data: {
                cart
            },
            success: true
        });
    } catch (err) {
        console.error('Add to cart error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET /api/cart/:userId - Get user's cart
app.get('/api/cart/:userId', verifyJwt, verifyCustomer, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Verify user can only access their own cart
        if (String(userId) !== req.auth.userId) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        const cart = await Cart.findOne({
            userId
        }).populate('items.productId');
        if (!cart) {
            return res.json({
                data: {
                    cart: {
                        userId,
                        items: []
                    }
                },
                success: true
            });
        }

        return res.json({
            data: {
                cart
            },
            success: true
        });
    } catch (err) {
        console.error('Get cart error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// PUT /api/cart/:userId/item/:productId - Update cart item quantity
app.put('/api/cart/:userId/item/:productId', verifyJwt, verifyCustomer, async (req, res) => {
    try {
        const userId = req.params.userId;
        const productId = req.params.productId;
        const {
            quantity
        } = req.body;

        // Verify user can only update their own cart
        if (String(userId) !== req.auth.userId) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        if (!quantity || quantity < 0) {
            return res.status(400).json({
                error: 'Valid quantity is required'
            });
        }

        const cart = await Cart.findOne({
            userId
        });
        if (!cart) {
            return res.status(404).json({
                error: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(
            item => String(item.productId) === String(productId)
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                error: 'Item not found in cart'
            });
        }

        if (quantity === 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            cart.items[itemIndex].quantity = quantity;
        }

        await cart.save();

        // Update pending order
        try {
            const pendingOrder = await Order.findOne({
                customerId: userId,
                status: 'pending'
            });

            if (pendingOrder) {
                const orderItemIndex = pendingOrder.items.findIndex(
                    item => String(item.productId) === String(productId)
                );

                if (orderItemIndex !== -1) {
                    if (quantity === 0) {
                        pendingOrder.items.splice(orderItemIndex, 1);
                    } else {
                        pendingOrder.items[orderItemIndex].quantity = quantity;
                    }

                    // Recalculate totals
                    const subtotal = pendingOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const shipping = subtotal > 599 ? 0 : 50;
                    const tax = subtotal * 0.05;
                    const total = subtotal + shipping + tax;

                    pendingOrder.subtotal = subtotal;
                    pendingOrder.shipping = shipping;
                    pendingOrder.tax = tax;
                    pendingOrder.total = total;

                    await pendingOrder.save();

                    // Emit Socket.IO event
                    if (io) {
                        const orderObj = pendingOrder.toObject ? pendingOrder.toObject() : pendingOrder;
                        io.emit('orderUpdated', orderObj);
                    }
                }
            }
        } catch (orderErr) {
            console.error('⚠️ Error updating pending order:', orderErr);
        }

        return res.json({
            data: {
                cart
            },
            success: true
        });
    } catch (err) {
        console.error('Update cart item error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// DELETE /api/cart/:userId/item/:productId - Remove item from cart
app.delete('/api/cart/:userId/item/:productId', verifyJwt, verifyCustomer, async (req, res) => {
    try {
        const userId = req.params.userId;
        const productId = req.params.productId;

        // Verify user can only update their own cart
        if (String(userId) !== req.auth.userId) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        const cart = await Cart.findOne({
            userId
        });
        if (!cart) {
            return res.status(404).json({
                error: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(
            item => String(item.productId) === String(productId)
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                error: 'Item not found in cart'
            });
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();

        // Update pending order
        try {
            const pendingOrder = await Order.findOne({
                customerId: userId,
                status: 'pending'
            });

            if (pendingOrder) {
                const orderItemIndex = pendingOrder.items.findIndex(
                    item => String(item.productId) === String(productId)
                );

                if (orderItemIndex !== -1) {
                    pendingOrder.items.splice(orderItemIndex, 1);

                    // Recalculate totals
                    const subtotal = pendingOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const shipping = subtotal > 599 ? 0 : 50;
                    const tax = subtotal * 0.05;
                    const total = subtotal + shipping + tax;

                    pendingOrder.subtotal = subtotal;
                    pendingOrder.shipping = shipping;
                    pendingOrder.tax = tax;
                    pendingOrder.total = total;

                    await pendingOrder.save();

                    // Emit Socket.IO event
                    if (io) {
                        const orderObj = pendingOrder.toObject ? pendingOrder.toObject() : pendingOrder;
                        io.emit('orderUpdated', orderObj);
                    }
                }
            }
        } catch (orderErr) {
            console.error('⚠️ Error updating pending order:', orderErr);
        }

        return res.json({
            message: 'Item removed from cart',
            success: true
        });
    } catch (err) {
        console.error('Remove cart item error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// DELETE /api/cart/:userId - Clear user's cart
app.delete('/api/cart/:userId', verifyJwt, verifyCustomer, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Verify user can only clear their own cart
        if (String(userId) !== req.auth.userId) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        await Cart.findOneAndUpdate({
            userId
        }, {
            items: []
        }, {
            new: true,
            upsert: false
        });

        // Update or delete pending order when cart is cleared
        try {
            const pendingOrder = await Order.findOne({
                customerId: userId,
                status: 'pending'
            });

            if (pendingOrder) {
                // Update pending order to have empty items (or delete it)
                pendingOrder.items = [];
                pendingOrder.subtotal = 0;
                pendingOrder.shipping = 0;
                pendingOrder.tax = 0;
                pendingOrder.total = 0;
                await pendingOrder.save();
                console.log(`📦 Updated pending order ${pendingOrder._id} - cart cleared, order items cleared`);

                // Emit Socket.IO event
                if (io) {
                    const orderObj = pendingOrder.toObject ? pendingOrder.toObject() : pendingOrder;
                    io.emit('orderUpdated', orderObj);
                }
            }
        } catch (orderErr) {
            console.error('⚠️ Error updating pending order when clearing cart:', orderErr);
        }

        return res.json({
            message: 'Cart cleared successfully',
            success: true
        });
    } catch (err) {
        console.error('Clear cart error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Bill Routes
// GET /api/bills - Get all bills for authenticated customer
app.get('/api/bills', verifyJwt, verifyCustomer, async (req, res) => {
    try {
        const userId = req.auth.userId;

        const bills = await Bill.find({
                customerId: userId
            })
            .populate('orderId', 'status')
            .sort({
                createdAt: -1
            });

        return res.json({
            data: {
                bills
            },
            success: true
        });
    } catch (err) {
        console.error('Get bills error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET /api/bills/:billId - Get specific bill
app.get('/api/bills/:billId', verifyJwt, verifyCustomer, async (req, res) => {
    try {
        const userId = req.auth.userId;
        const billId = req.params.billId;

        const bill = await Bill.findOne({
                _id: billId,
                customerId: userId
            })
            .populate('orderId', 'status');

        if (!bill) {
            return res.status(404).json({
                error: 'Bill not found'
            });
        }

        return res.json({
            data: {
                bill
            },
            success: true
        });
    } catch (err) {
        console.error('Get bill error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Contact Form Submission Endpoint
app.post('/api/contact/submit', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            message,
            fileUrl,
            customerId
        } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                error: 'name, email, and message are required'
            });
        }

        // Try to find customer by email if customerId not provided
        let linkedCustomerId = customerId || null;
        if (!linkedCustomerId) {
            try {
                const customer = await Customer.findOne({
                    email: String(email).trim().toLowerCase()
                });
                if (customer) {
                    linkedCustomerId = customer._id;
                }
            } catch (err) {
                console.log('Could not link to customer:', err.message);
            }
        }

        // Create contact submission
        const contact = await Contact.create({
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            phone: phone ? String(phone).trim() : '',
            message: String(message).trim(),
            fileUrl: fileUrl || '',
            customerId: linkedCustomerId,
            status: 'new'
        });

        return res.status(201).json({
            message: 'Contact form submitted successfully',
            data: {
                id: contact._id,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                message: contact.message
            }
        });
    } catch (err) {
        console.error('Contact submission error:', err);

        if (err.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', ')
            });
        }

        return res.status(500).json({
            error: 'Internal server error',
            details: err.message
        });
    }
});

// GET /api/dealer/customers/:customerId/feedback - Get feedback for a specific customer (Dealer only)
app.get('/api/dealer/customers/:customerId/feedback', verifyJwt, verifyDealer, async (req, res) => {
    try {
        const {
            customerId
        } = req.params;

        // Find all feedback submissions for this customer
        const feedback = await Contact.find({
                customerId: customerId
            })
            .sort({
                createdAt: -1
            }) // Newest first
            .lean();

        return res.json({
            success: true,
            data: {
                feedback: feedback || []
            }
        });
    } catch (err) {
        console.error('Get customer feedback error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// Serve dealer product management page
app.get('/dealer-site/product-management', (req, res) => {
    res.sendFile(path.join(__dirname, '../Dealer/product-management.html'));
});


// Serve variety page
app.get('/variety', (req, res) => {
    res.sendFile(path.join(__dirname, '../customer/variety.html'));
});

httpServer.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 Customer frontend: http://localhost:${PORT}/`);
    console.log(`🏪 Dealer dashboard: http://localhost:${PORT}/dealer`);
    console.log(`📦 Product Management: http://localhost:${PORT}/dealer-site/product-management`);
    console.log(`🏪 Dealer2 dashboard: http://localhost:${PORT}/dealer2`);
    console.log(`🔐 Customer login: http://localhost:${PORT}/login`);
    console.log(`🔐 Dealer login: http://localhost:${PORT}/dealer/login`);
    console.log(`🔑 Unified Auth (Sign Up/In): http://localhost:${PORT}/auth`);
    console.log(`🧪 Test submission: http://localhost:${PORT}/test-submission`);
    console.log(`📊 API health: http://localhost:${PORT}/api/health`);
    console.log(`🔌 Socket.IO enabled for real-time updates\n`);
});