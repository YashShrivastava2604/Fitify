const { Webhook } = require('svix');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responses');

/**
 * Handle Clerk webhook events
 * Syncs user creation, updates, and deletions from Clerk to MongoDB
 */
const handleClerkWebhook = async (req, res) => {
  try {
    // Get Svix headers for verification
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    // If missing headers, reject
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return errorResponse(res, 400, 'Missing Svix headers');
    }

    // Get raw body
    const payload = req.body;

    // Create Svix instance with webhook secret
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    let evt;
    try {
      // Verify webhook signature
      evt = wh.verify(JSON.stringify(payload), {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('❌ Webhook verification failed:', err);
      return errorResponse(res, 400, 'Webhook verification failed');
    }

    // Handle different event types
    const eventType = evt.type;
    console.log(`📨 Webhook event: ${eventType}`);

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;

      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;

      default:
        console.log(`ℹ️  Unhandled event type: ${eventType}`);
    }

    return successResponse(res, 200, 'Webhook processed successfully');
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return errorResponse(res, 500, 'Webhook processing failed', error.message);
  }
};

/**
 * Handle user.created event
 */
const handleUserCreated = async (data) => {
  try {
    const { id, email_addresses, first_name, last_name, image_url } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: id });
    if (existingUser) {
      console.log(`ℹ️  User ${email_addresses[0].email_address} already exists`);
      return;
    }

    // Create new user
    const newUser = new User({
      clerkId: id,
      email: email_addresses[0].email_address,
      firstName: first_name || '',
      lastName: last_name || '',
      profileImageUrl: image_url || '',
      isOnboarded: false,
    });

    await newUser.save();
    console.log(`✅ Created user: ${newUser.email}`);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
};

/**
 * Handle user.updated event
 */
const handleUserUpdated = async (data) => {
  try {
    const { id, email_addresses, first_name, last_name, image_url } = data;

    const user = await User.findOne({ clerkId: id });
    if (!user) {
      console.log(`⚠️  User ${id} not found for update`);
      return;
    }

    // Update user fields
    user.email = email_addresses[0].email_address;
    user.firstName = first_name || user.firstName;
    user.lastName = last_name || user.lastName;
    user.profileImageUrl = image_url || user.profileImageUrl;

    await user.save();
    console.log(`✅ Updated user: ${user.email}`);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    throw error;
  }
};

/**
 * Handle user.deleted event
 */
const handleUserDeleted = async (data) => {
  try {
    const { id } = data;

    const user = await User.findOne({ clerkId: id });
    if (user) {
      user.isActive = false;
      await user.save();
      console.log(`✅ Soft deleted user: ${user.email}`);
    }
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    throw error;
  }
};

module.exports = {
  handleClerkWebhook,
};

