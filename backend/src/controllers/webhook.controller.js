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
 * Helper function to extract email from Clerk user data
 * Handles multiple email formats from different Clerk versions
 */
const extractEmail = (data) => {
  try {
    // Format 1: email_addresses array with objects
    if (data.email_addresses && Array.isArray(data.email_addresses) && data.email_addresses.length > 0) {
      const primaryEmail = data.email_addresses.find(addr => addr.verification?.status === 'verified') 
        || data.email_addresses[0];
      return primaryEmail.email_address;
    }

    // Format 2: Direct email field
    if (data.email) {
      return data.email;
    }

    // Format 3: primary_email_address field
    if (data.primary_email_address) {
      return data.primary_email_address;
    }

    // Format 4: Email in primary email object
    if (data.primary_email && typeof data.primary_email === 'object') {
      return data.primary_email.email_address;
    }

    console.warn('⚠️  Could not extract email, data:', JSON.stringify(data, null, 2));
    return null;
  } catch (error) {
    console.error('❌ Error extracting email:', error);
    return null;
  }
};

/**
 * Handle user.created event
 */
const handleUserCreated = async (data) => {
  try {
    console.log('📨 Processing user.created event');
    
    const { id, first_name, last_name, image_url } = data;

    // Extract email using helper function
    const email = extractEmail(data);
    
    if (!email) {
      console.error('❌ No email found in user.created data:', JSON.stringify(data, null, 2));
      throw new Error('No email address found in Clerk user data');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: id });
    if (existingUser) {
      console.log(`ℹ️  User ${email} already exists in database`);
      return;
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
    
    const { id, first_name, last_name, image_url } = data;

    const user = await User.findOne({ clerkId: id });
    if (!user) {
      console.log(`⚠️  User ${id} not found in database for update`);
      return;
    }

    // Extract and update email
    const email = extractEmail(data);
    if (email) {
      user.email = email.toLowerCase();
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
