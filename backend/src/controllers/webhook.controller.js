const { Webhook } = require('svix');
const { clerkClient } = require('@clerk/express');
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
      console.error('❌ Missing Svix headers');
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
      console.error('❌ Webhook verification failed:', err.message);
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
 * Helper function to get user email from Clerk API
 * Required because webhook data doesn't always include email details
 */
const getUserEmailFromClerk = async (userId, primaryEmailAddressId) => {
  try {
    console.log(`🔍 Fetching email for user ${userId} with email ID ${primaryEmailAddressId}`);
    
    // Fetch full user data from Clerk API
    const clerkUser = await clerkClient.users.getUser(userId);
    
    if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
      // Find the primary email or use first one
      const primaryEmail = clerkUser.emailAddresses.find(
        addr => addr.id === primaryEmailAddressId
      ) || clerkUser.emailAddresses[0];
      
      console.log(`✅ Found email via Clerk API: ${primaryEmail.emailAddress}`);
      return primaryEmail.emailAddress;
    }
    
    console.warn('⚠️  No email addresses found in Clerk user data');
    return null;
  } catch (error) {
    console.error('❌ Error fetching user from Clerk API:', error.message);
    throw error;
  }
};

/**
 * Handle user.created event
 */
const handleUserCreated = async (data) => {
  try {
    console.log('📨 Processing user.created event');
    
    const { id, first_name, last_name, image_url, primary_email_address_id } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: id });
    if (existingUser) {
      console.log(`ℹ️  User ${id} already exists in database`);
      return;
    }

    // Get email from Clerk API (since webhook doesn't include it)
    let email = null;
    
    if (primary_email_address_id) {
      email = await getUserEmailFromClerk(id, primary_email_address_id);
    }
    
    if (!email) {
      console.error('❌ Could not retrieve email for user:', id);
      throw new Error('No email address available for user');
    }

    // Create new user
    const newUser = new User({
      clerkId: id,
      email: email.toLowerCase(),
      firstName: first_name || '',
      lastName: last_name || '',
      profileImageUrl: image_url || '',
      isOnboarded: false,
    });

    await newUser.save();
    console.log(`✅ Created user in MongoDB: ${newUser.email} (Clerk ID: ${id})`);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    console.error('❌ Full error:', error);
    throw error;
  }
};

/**
 * Handle user.updated event
 */
const handleUserUpdated = async (data) => {
  try {
    console.log('📨 Processing user.updated event');
    
    const { id, first_name, last_name, image_url, primary_email_address_id } = data;

    const user = await User.findOne({ clerkId: id });
    if (!user) {
      console.log(`⚠️  User ${id} not found in database for update`);
      return;
    }

    // Update email if changed
    if (primary_email_address_id) {
      try {
        const email = await getUserEmailFromClerk(id, primary_email_address_id);
        if (email) {
          user.email = email.toLowerCase();
        }
      } catch (error) {
        console.warn('⚠️  Could not update email, keeping existing:', error.message);
      }
    }

    user.firstName = first_name || user.firstName;
    user.lastName = last_name || user.lastName;
    user.profileImageUrl = image_url || user.profileImageUrl;

    await user.save();
    console.log(`✅ Updated user in MongoDB: ${user.email}`);
  } catch (error) {
    console.error('❌ Error updating user:', error.message);
    throw error;
  }
};

/**
 * Handle user.deleted event
 */
const handleUserDeleted = async (data) => {
  try {
    console.log('📨 Processing user.deleted event');
    
    const { id } = data;

    const user = await User.findOne({ clerkId: id });
    if (user) {
      user.isActive = false;
      await user.save();
      console.log(`✅ Soft deleted user: ${user.email}`);
    } else {
      console.log(`ℹ️  User ${id} not found for deletion`);
    }
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    throw error;
  }
};

module.exports = {
  handleClerkWebhook,
};
