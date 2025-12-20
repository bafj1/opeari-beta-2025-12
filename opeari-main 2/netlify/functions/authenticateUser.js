const Airtable = require('airtable');
const bcrypt = require('bcryptjs');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// Simple rate limiting store (upgrade to Redis for production)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid JSON in request body' })
    };
  }

  const { email, password } = requestBody;

  // Validate required fields
  if (!email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Email and password are required' })
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid email format' })
    };
  }

  // Rate limiting check
  const clientIP = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  const identifier = `${email}:${clientIP}`;
  const now = Date.now();
  
  const attempts = loginAttempts.get(identifier) || { count: 0, firstAttempt: now, lockedUntil: 0 };
  
  // Check if still locked out
  if (attempts.lockedUntil > now) {
    const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ 
        message: `Too many login attempts. Please try again in ${remainingTime} minutes.`,
        type: 'rate_limit',
        retryAfter: remainingTime
      })
    };
  }

  // Reset if window expired (15 minutes)
  if (now - attempts.firstAttempt > LOCKOUT_DURATION) {
    attempts.count = 0;
    attempts.firstAttempt = now;
  }

  try {
    console.log(`Authentication attempt for: ${email}`);

    // Search for user in Airtable with case-insensitive email
    const records = await base('Members')
      .select({ 
        filterByFormula: `LOWER({Email}) = "${email.toLowerCase()}"`,
        maxRecords: 1
      })
      .firstPage();

    if (records.length === 0) {
      console.log(`User not found: ${email}`);
      
      // Record failed attempt
      attempts.count++;
      if (attempts.count >= MAX_ATTEMPTS) {
        attempts.lockedUntil = now + LOCKOUT_DURATION;
      }
      loginAttempts.set(identifier, attempts);
      
      return { 
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          message: 'Invalid credentials',
          type: 'invalid_credentials'
        }) 
      };
    }

    const user = records[0].fields;
    console.log(`User found: ${email}, Status: ${user.Status}`);

    // Check if user has a password hash field (FIXED FIELD NAME)
    if (!user.PasswordHash) {
      console.log(`No password set for user: ${email}`);
      
      // Record failed attempt
      attempts.count++;
      if (attempts.count >= MAX_ATTEMPTS) {
        attempts.lockedUntil = now + LOCKOUT_DURATION;
      }
      loginAttempts.set(identifier, attempts);
      
      return { 
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          message: 'Account setup not completed. Please complete your registration.',
          type: 'setup_incomplete'
        }) 
      };
    }

    // FIXED: Use bcrypt to compare password with hash
    const passwordMatch = await bcrypt.compare(password, user.PasswordHash);
    
    if (!passwordMatch) {
      console.log(`Invalid password for user: ${email}`);
      
      // Record failed attempt
      attempts.count++;
      if (attempts.count >= MAX_ATTEMPTS) {
        attempts.lockedUntil = now + LOCKOUT_DURATION;
      }
      loginAttempts.set(identifier, attempts);
      
      return { 
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          message: 'Invalid credentials',
          type: 'invalid_credentials'
        }) 
      };
    }

    // Check user status
    if (user.Status === 'Pending Verification') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          message: 'Account not verified',
          status: 'verification_required',
          type: 'verification_required'
        })
      };
    }

    if (user.Status === 'Pending Approval') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          message: 'Account pending approval',
          status: 'approval_pending',
          type: 'approval_pending'
        })
      };
    }

    if (user.Status !== 'Approved') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          message: 'Account access not permitted',
          status: 'access_denied',
          type: 'access_denied'
        })
      };
    }

    // Check if account is verified
    if (!user.AccountVerified) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          message: 'Please verify your email before logging in.',
          type: 'email_verification_required'
        })
      };
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(identifier);

    // Update last login timestamp
    try {
      await base('Members').update(records[0].id, {
        'LastLogin': new Date().toISOString(),
        'LoginCount': (user.LoginCount || 0) + 1
      });
    } catch (updateError) {
      console.warn('Failed to update login timestamp:', updateError);
      // Don't fail login if timestamp update fails
    }

    console.log(`Authentication successful for: ${email}`);

    // Return success with basic user info
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Authentication successful',
        success: true,
        user: {
          id: records[0].id,
          email: user.Email,
          firstName: user.FirstName || '',
          lastName: user.LastName || '',
          name: user.Name || `${user.FirstName || ''} ${user.LastName || ''}`.trim(),
          role: user.Role || 'Parent',
          status: user.Status,
          accountVerified: user.AccountVerified || false,
          emailVerified: user.EmailVerified || false
        }
      })
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return { 
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Authentication failed',
        type: 'system_error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      }) 
    };
  }
};
