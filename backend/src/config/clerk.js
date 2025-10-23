const { clerkMiddleware, requireAuth } = require('@clerk/express');

// Clerk middleware for Express
// This replaces ClerkExpressRequireAuth from old SDK
const clerkAuth = clerkMiddleware({
  // Optional configuration
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Validate Clerk configuration
if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
  console.error('❌ Missing Clerk API keys. Check your .env file.');
  process.exit(1);
}

module.exports = {
  clerkAuth,      // Add to app.use() before routes
  requireAuth,    // Use on protected routes
};
