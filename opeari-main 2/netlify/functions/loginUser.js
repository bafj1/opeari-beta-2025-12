// netlify/functions/loginUser.js - Enhanced with comprehensive session and user data management
const Airtable = require('airtable');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const loginAttempts = new Map();
const activeSessions = new Map(); // Track active sessions

const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  LOCKOUT_DURATION: 30 * 60 * 1000 // 30 minutes
};

const SESSION_CONFIG = {
  DEFAULT_DURATION: 8 * 3600, // 8 hours in seconds
  REMEMBER_ME_DURATION: 30 * 86400, // 30 days in seconds
  CLEANUP_INTERVAL: 60 * 60 * 1000 // 1 hour cleanup interval
};

const SecurityUtils = {
  checkRateLimit: (identifier) => {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier) || { count: 0, firstAttempt: now, lockedUntil: 0 };
    
    if (attempts.lockedUntil > now) {
      const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
      return { 
        allowed: false, 
        message: `Too many login attempts. Try again in ${remainingTime} minutes.`, 
        remainingTime 
      };
    }
    
    if (now - attempts.firstAttempt > RATE_LIMIT.WINDOW_MS) {
      attempts.count = 0;
      attempts.firstAttempt = now;
    }
    
    return { allowed: true, attempts };
  },

  recordFailedAttempt: (identifier) => {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier) || { count: 0, firstAttempt: now, lockedUntil: 0 };
    attempts.count++;
    
    if (attempts.count >= RATE_LIMIT.MAX_ATTEMPTS) {
      attempts.lockedUntil = now + RATE_LIMIT.LOCKOUT_DURATION;
    }
    
    loginAttempts.set(identifier, attempts);
  },

  clearAttempts: (identifier) => loginAttempts.delete(identifier),

  generateSessionToken: () => crypto.randomBytes(32).toString('hex'),

  generateSessionData: (rememberMe = false) => {
    const sessionToken = SecurityUtils.generateSessionToken();
    const duration = rememberMe ? SESSION_CONFIG.REMEMBER_ME_DURATION : SESSION_CONFIG.DEFAULT_DURATION;
    const expiresAt = new Date(Date.now() + (duration * 1000));
    
    return {
      token: sessionToken,
      expiresIn: duration,
      expiresAt: expiresAt.toISOString(),
      rememberMe
    };
  },

  cleanupExpiredSessions: () => {
    const now = Date.now();
    for (const [token, sessionData] of activeSessions.entries()) {
      if (new Date(sessionData.expiresAt) < now) {
        activeSessions.delete(token);
      }
    }
  },

  logSecurityEvent: async (airtable, event, details) => {
    try {
      await airtable('SecurityLogs').create({
        'Event': event,
        'Details': JSON.stringify(details),
        'Timestamp': new Date().toISOString(),
        'IP': details.ip || 'unknown',
        'UserAgent': details.userAgent || 'unknown',
        'UserEmail': details.email || 'unknown'
      });
    } catch (e) {
      console.warn('Security logging failed:', e.message);
    }
  }
};

// Cleanup expired sessions periodically
setInterval(SecurityUtils.cleanupExpiredSessions, SESSION_CONFIG.CLEANUP_INTERVAL);

const airtable = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY 
}).base(process.env.AIRTABLE_BASE_ID);

const UserUtils = {
  // Comprehensive user data extraction from Airtable record
  extractUserData: (userRecord) => {
    const member = userRecord.fields;
    
    return {
      id: userRecord.id,
      email: member.Email,
      name: member.Name || '',
      username: member.Username || '',
      firstName: member.FirstName || '',
      lastName: member.LastName || '',
      role: member.Role || 'parent',
      
      // Profile Information
      tagline: member.Tagline || '',
      bio: member.Bio || '',
      location: member.Location || '',
      address: member.Address || '',
      addressLine2: member.AddressLine2 || '',
      phoneNumber: member.PhoneNumber || '',
      spokenLanguages: member.SpokenLanguages || '',
      
      // Account Status
      accountVerified: member.AccountVerified || false,
      emailVerified: member.EmailVerified || false,
      status: member.Status || 'active',
      profileComplete: member.ProfileComplete || false,
      
      // Preferences
      careTypes: member.CareTypes || '',
      ageGroups: member.AgeGroups || '',
      hourlyRate: member.HourlyRate || '',
      experience: member.Experience || '',
      maxChildren: member.MaxChildren || '',
      
      // Household Information
      petFriendly: member.PetFriendly || false,
      providesEquipment: member.ProvidesEquipment || false,
      hasPets: member.HasPets || false,
      hasAllergies: member.HasAllergies || false,
      hasSpecialNeeds: member.HasSpecialNeeds || false,
      multilingualHousehold: member.MultilingualHousehold || false,
      flexibleSchedule: member.FlexibleSchedule || false,
      structuredRoutine: member.StructuredRoutine || false,
      
      // Caregiver Preferences
      preferredGender: member.PreferredGender || '',
      preferredAgeRange: member.PreferredAgeRange || '',
      searchRadius: member.SearchRadius || '',
      
      // Community Settings
      acceptingNewConnections: member.AcceptingNewConnections || false,
      careSwapParticipation: member.CareSwapParticipation || false,
      communityEvents: member.CommunityEvents || false,
      profileVisibility: member.ProfileVisibility || 'Public',
      
      // Notification Settings
      notificationChannel: member.NotificationChannel || 'Email',
      notifyCareOpportunities: member.NotifyCareOpportunities || false,
      notifyMessages: member.NotifyMessages || true,
      showActiveStatus: member.ShowActiveStatus || false,
      communityStories: member.CommunityStories || false,
      loginAlerts: member.LoginAlerts || false,
      
      // App Settings
      darkMode: member.DarkMode || false,
      autoRenewBackground: member.AutoRenewBackground || false,
      liveLocationSharing: member.LiveLocationSharing || false,
      
      // System fields
      loginCount: member.LoginCount || 0,
      lastLogin: member.LastLogin || null,
      lastLoginIP: member.LastLoginIP || '',
      createdAt: member.CreatedAt || null,
      lastUpdated: member.LastUpdated || null
    };
  },

  // Validate user account status
  validateAccountStatus: (member, userRecord) => {
    const validationErrors = [];

    if (member.Status === 'suspended') {
      return {
        valid: false,
        statusCode: 403,
        error: 'account_suspended',
        message: 'Account suspended. Contact support for assistance.'
      };
    }

    if (member.Status === 'deleted' || member.Status === 'inactive') {
      return {
        valid: false,
        statusCode: 401,
        error: 'account_inactive',
        message: 'Account is inactive. Please contact support.'
      };
    }

    if (!member.PasswordHash) {
      return {
        valid: false,
        statusCode: 401,
        error: 'setup_incomplete',
        message: 'Account setup incomplete. Please complete your registration.'
      };
    }

    if (!member.AccountVerified) {
      return {
        valid: false,
        statusCode: 401,
        error: 'email_verification_required',
        message: 'Please verify your email address before logging in.'
      };
    }

    return { valid: true };
  }
};

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'https://opeari.com',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With, X-CSRF-Token, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ 
        success: false, 
        message: 'Method Not Allowed',
        type: 'method_not_allowed' 
      }) 
    };
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      await SecurityUtils.logSecurityEvent(airtable, 'login_invalid_json', { 
        error: parseError.message,
        ip: event.headers['x-forwarded-for'] || 'unknown',
        userAgent: event.headers['user-agent'] || 'unknown'
      });
      
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid request format',
          type: 'invalid_json' 
        }) 
      };
    }

    const { 
      email, 
      password, 
      rememberMe = false, 
      deviceFingerprint = null 
    } = requestBody;

    const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                    event.headers['x-real-ip'] || 'unknown';
    const userAgent = event.headers['user-agent'] || 'unknown';
    const identifier = `${email}:${clientIP}`;

    // Input validation
    if (!email || !password) {
      await SecurityUtils.logSecurityEvent(airtable, 'login_missing_credentials', { 
        email: email || 'missing',
        ip: clientIP, 
        userAgent 
      });
      
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ 
          success: false, 
          message: 'Email and password are required',
          type: 'validation_error' 
        }) 
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await SecurityUtils.logSecurityEvent(airtable, 'login_invalid_email_format', { 
        email, 
        ip: clientIP, 
        userAgent 
      });
      
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid email format',
          type: 'validation_error' 
        }) 
      };
    }

    // Rate limiting check
    const rateLimitCheck = SecurityUtils.checkRateLimit(identifier);
    if (!rateLimitCheck.allowed) {
      await SecurityUtils.logSecurityEvent(airtable, 'login_rate_limited', { 
        email, 
        ip: clientIP, 
        userAgent, 
        remainingTime: rateLimitCheck.remainingTime 
      });
      
      return { 
        statusCode: 429, 
        headers: { 
          ...headers, 
          'Retry-After': rateLimitCheck.remainingTime * 60 
        }, 
        body: JSON.stringify({ 
          success: false, 
          message: rateLimitCheck.message,
          type: 'rate_limit',
          retryAfter: rateLimitCheck.remainingTime 
        }) 
      };
    }

    // Find user in database
    const records = await airtable('Members').select({ 
      filterByFormula: `LOWER({Email}) = "${email.toLowerCase()}"`, 
      maxRecords: 1 
    }).firstPage();

    if (!records.length) {
      SecurityUtils.recordFailedAttempt(identifier);
      await SecurityUtils.logSecurityEvent(airtable, 'login_user_not_found', { 
        email, 
        ip: clientIP, 
        userAgent 
      });
      
      return { 
        statusCode: 401, 
        headers, 
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid email or password',
          type: 'invalid_credentials' 
        }) 
      };
    }

    const userRecord = records[0];
    const member = userRecord.fields;

    // Validate account status
    const accountValidation = UserUtils.validateAccountStatus(member, userRecord);
    if (!accountValidation.valid) {
      await SecurityUtils.logSecurityEvent(airtable, `login_${accountValidation.error}`, { 
        email, 
        userId: userRecord.id, 
        ip: clientIP, 
        userAgent 
      });
      
      return { 
        statusCode: accountValidation.statusCode, 
        headers, 
        body: JSON.stringify({ 
          success: false, 
          message: accountValidation.message,
          type: accountValidation.error 
        }) 
      };
    }

    // Password verification
    const passwordMatch = await bcrypt.compare(password, member.PasswordHash);
    if (!passwordMatch) {
      SecurityUtils.recordFailedAttempt(identifier);
      await SecurityUtils.logSecurityEvent(airtable, 'login_invalid_password', { 
        email, 
        userId: userRecord.id, 
        ip: clientIP, 
        userAgent 
      });
      
      return { 
        statusCode: 401, 
        headers, 
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid email or password',
          type: 'invalid_credentials' 
        }) 
      };
    }

    // Successful authentication - clear failed attempts
    SecurityUtils.clearAttempts(identifier);

    // Generate session data
    const sessionData = SecurityUtils.generateSessionData(rememberMe);
    
    // Store session in memory (consider using Redis for production)
    activeSessions.set(sessionData.token, {
      userId: userRecord.id,
      email: member.Email,
      expiresAt: sessionData.expiresAt,
      deviceFingerprint,
      ip: clientIP,
      userAgent
    });

    // Update user record with login information
    const updateData = {
      LastLogin: new Date().toISOString(),
      LoginCount: (member.LoginCount || 0) + 1,
      LastLoginIP: clientIP,
      SessionToken: sessionData.token,
      LastUpdated: new Date().toISOString()
    };

    await airtable('Members').update(userRecord.id, updateData);

    // Log successful login
    await SecurityUtils.logSecurityEvent(airtable, 'login_successful', { 
      email, 
      userId: userRecord.id, 
      ip: clientIP, 
      userAgent,
      rememberMe,
      deviceFingerprint
    });

    // Extract comprehensive user data
    const userData = UserUtils.extractUserData(userRecord);

    // Successful login response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        user: userData,
        sessionInfo: sessionData,
        loginInfo: {
          loginCount: updateData.LoginCount,
          lastLogin: updateData.LastLogin,
          isFirstLogin: updateData.LoginCount === 1
        }
      })
    };

  } catch (error) {
    console.error('🔥 Login system error:', error);
    
    await SecurityUtils.logSecurityEvent(airtable, 'login_system_error', { 
      error: error.message, 
      stack: error.stack,
      ip: event.headers['x-forwarded-for'] || 'unknown',
      userAgent: event.headers['user-agent'] || 'unknown'
    });
    
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        success: false, 
        message: 'System error occurred. Please try again later.',
        type: 'system_error' 
      }) 
    };
  }
};
