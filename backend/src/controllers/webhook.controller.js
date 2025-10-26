const { Webhook } = require('svix');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responses');

/**
 * Handle Clerk webhook events
 */
const handleClerkWebhook = async (req, res) => {
  try {
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ Missing Svix headers');
      return errorResponse(res, 400, 'Missing Svix headers');
    }

    const payload = req.body;
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    let evt;
    try {
      evt = wh.verify(JSON.stringify(payload), {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('❌ Webhook verification failed:', err.message);
      return errorResponse(res, 400, 'Webhook verification failed');
    }

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
    // Return 200 even on error so Clerk doesn't retry
    return successResponse(res, 200, 'Webhook received (with errors)');
  }
};

/**
 * Extract email from webhook data
 * Handles multiple formats from real webhooks vs test webhooks
 */
const extractEmailFromWebhook = (data) => {
  try {
    // Format 1: Real OAuth sign-in - email in external_accounts
    if (data.external_accounts && data.external_accounts.length > 0) {
      const googleAccount = data.external_accounts.find(acc => acc.provider === 'oauth_google');
      if (googleAccount && googleAccount.email_address) {
        console.log(`✅ Found email in external_accounts: ${googleAccount.email_address}`);
        return googleAccount.email_address;
      }
    }

    // Format 2: Email in email_addresses array
    if (data.email_addresses && data.email_addresses.length > 0) {
      const primaryEmail = data.email_addresses.find(addr => addr.id === data.primary_email_address_id)
        || data.email_addresses[0];
      if (primaryEmail && primaryEmail.email_address) {
        console.log(`✅ Found email in email_addresses: ${primaryEmail.email_address}`);
        return primaryEmail.email_address;
      }
    }

    // Format 3: Direct email field
    if (data.email) {
      console.log(`✅ Found direct email: ${data.email}`);
      return data.email;
    }

    console.warn('⚠️  No email found in webhook data');
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

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: id });
    if (existingUser) {
      console.log(`ℹ️  User ${id} already exists - skipping`);
      return;
    }

    // Extract email
    const email = extractEmailFromWebhook(data);
    
    if (!email) {
      // This is likely a TEST webhook with fake data
      console.warn('⚠️  No email in webhook - likely a test event, skipping user creation');
      console.log('📝 Test webhook data:', JSON.stringify(data, null, 2));
      return; // Don't throw error, just skip
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
    console.log(`✅ Created user: ${newUser.email} (${id})`);
  } catch (error) {
    console.error('❌ Error in handleUserCreated:', error.message);
    // Don't throw - just log and continue
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
      console.log(`⚠️  User ${id} not found - might be test data, skipping`);
      return;
    }

    // Update email if provided
    const email = extractEmailFromWebhook(data);
    if (email) {
      user.email = email.toLowerCase();
    }

    user.firstName = first_name || user.firstName;
    user.lastName = last_name || user.lastName;
    user.profileImageUrl = image_url || user.profileImageUrl;

    await user.save();
    console.log(`✅ Updated user: ${user.email}`);
  } catch (error) {
    console.error('❌ Error in handleUserUpdated:', error.message);
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
      console.log(`ℹ️  User ${id} not found - might be test data`);
    }
  } catch (error) {
    console.error('❌ Error in handleUserDeleted:', error.message);
  }
};

module.exports = {
  handleClerkWebhook,
};
