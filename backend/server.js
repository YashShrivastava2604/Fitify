require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/database');
const { validateConfig } = require('./src/config/cloudinary');
const { clerkAuth } = require('./src/config/clerk');
const { errorHandler, notFoundHandler } = require('./src/middleware/error.middleware');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Validate Cloudinary config
validateConfig();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN === '*' 
    ? '*' 
    : process.env.CORS_ORIGIN.split(','),
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Clerk authentication middleware (MUST be before routes)
app.use(clerkAuth);

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'FitiFy API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.get('/api/ping', (req, res) => {
  console.log('Received ping from frontend');
  res.json({ message: "pong", time: new Date() });
});


// Add this BEFORE your routes (after clerkAuth)
app.get('/api/debug/users', async (req, res) => {
  try {
    const User = require('./src/models/User');
    const users = await User.find({}).select('clerkId email firstName lastName isOnboarded');
    res.json({ 
      success: true, 
      count: users.length,
      users: users.map(u => ({
        clerkId: u.clerkId,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        isOnboarded: u.isOnboarded
      }))
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Add this to check what Clerk is sending
app.get('/api/debug/auth', clerkAuth, async (req, res) => {
  try {
    let auth;
    if (typeof req.auth === 'function') {
      auth = await req.auth();
    } else {
      auth = req.auth;
    }
    
    res.json({
      success: true,
      clerkUserId: auth?.userId,
      sessionClaims: auth?.sessionClaims,
      hasAuth: !!auth
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});



// API Routes
app.use('/api/webhooks', require('./src/routes/webhook.routes'));
app.use('/api/user', require('./src/routes/user.routes'));




// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 FitiFy Backend Server`);
  // console.log(`📡 Running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});