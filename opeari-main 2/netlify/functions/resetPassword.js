const Airtable = require('airtable');
const crypto = require('crypto');
const { Resend } = require('resend');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const resend = new Resend(process.env.RESEND_API_KEY);

const RESET_TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'https://opeari.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Find user
    const records = await base('Members')
      .select({
        filterByFormula: `LOWER({Email}) = "${email.toLowerCase()}"`,
        maxRecords: 1
      })
      .firstPage();

    // Don't reveal if email exists
    if (records.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          message: 'If an account exists with this email, a password reset link will be sent.' 
        })
      };
    }

    const user = records[0];

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY).toISOString();

    // Update user record with reset token
    await base('Members').update(user.id, {
      'PasswordResetToken': resetToken,
      'PasswordResetExpiry': resetExpiry
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
    
    await resend.emails.send({
      from: 'noreply@opeari.com',
      to: email,
      subject: 'Reset Your Opeari Password',
      html: `
        <h2>Reset Your Password</h2>
        <p>A password reset was requested for your Opeari account. If you didn't make this request, please ignore this email.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you're having trouble, copy and paste this URL into your browser:</p>
        <p>${resetUrl}</p>
        <p>For security reasons, please:</p>
        <ul>
          <li>Never share this link with anyone</li>
          <li>Choose a strong password that you haven't used before</li>
          <li>Enable two-factor authentication if available</li>
        </ul>
        <p>Need help? Contact our support team.</p>
      `
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent.'
      })
    };

  } catch (error) {
    console.error('Password reset error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'An error occurred while processing your request'
      })
    };
  }
};
