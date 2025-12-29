
const { Resend } = require('resend'); // Converted to CJS

const resend = new Resend(process.env.RESEND_API_KEY);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

// Helper: Clean strings
const clean = (str) => (str ? str.trim() : '');

exports.handler = async (event) => {
  // 1. Handle OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: 'Method not allowed'
    };
  }

  try {
    const data = JSON.parse(event.body);

    // Extract fields
    const email = clean(data.email);
    const firstName = clean(data.firstName);
    const lastName = clean(data.lastName);
    const zipCode = clean(data.zipCode);
    const userType = clean(data.userType);

    // Position handling: allow 0, handle undefined
    let position = data.position;
    if (position === undefined || position === null) {
      position = 'Unknown'; // Frontend didn't send it
    }

    const referralSource = clean(data.referralSource);
    const referralName = clean(data.referralName);
    const childcareChallenge = clean(data.childcareChallenge);

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: 'Email is required' })
      };
    }

    const isFoundingMember = (typeof position === 'number' && position <= 100 && position > 0);
    const SENDER_EMAIL = 'Opeari <breada@opeari.com>';
    const ADMIN_EMAIL = 'breada@opeari.com';

    const results = {};

    // 1. Send RICH User Confirmation
    try {
      const userEmail = await resend.emails.send({
        from: SENDER_EMAIL,
        to: email,
        subject: "You're on the Opeari waitlist! 🍐",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fdf8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #e8f4ec 0%, #d4e8dc 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; border: 2px solid #8bd7c7; border-bottom: none;">
      <div style="font-size: 48px; margin-bottom: 16px;">🍐</div>
      <h1 style="color: #1e6b4e; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Opeari!</h1>
      <p style="color: #5a8a72; font-size: 16px; margin: 10px 0 0 0;">Your village is waiting...</p>
    </div>
    
    <!-- Body -->
    <div style="background: white; padding: 40px 30px; border-left: 2px solid #8bd7c7; border-right: 2px solid #8bd7c7;">
      <p style="color: #1e6b4e; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">Hey ${firstName || 'Neighbor'}! 👋</p>
      
      <p style="color: #2d3748; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
        Thanks for joining the waitlist! Opeari is reimagining childcare — rooted in trust, shared support, and flexible help when you need it most.
      </p>
      
      <!-- Position Badge -->
      <div style="background: linear-gradient(135deg, #1e6b4e 0%, #3ca370 100%); padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
        <div style="color: white; font-size: 24px; font-weight: 700; margin-bottom: 6px;">
          You're #${position} in line! ✨
        </div>
        <div style="color: rgba(255,255,255,0.85); font-size: 14px;">
          We'll send you an account setup link when it's your turn
        </div>
      </div>
      
      ${isFoundingMember ? `
      <!-- Founding Member Badge -->
      <div style="background: linear-gradient(135deg, #fff9e6 0%, #fff0f0 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0; border: 2px solid #ffd700;">
        <div style="font-size: 24px; margin-bottom: 8px;">⭐</div>
        <div style="color: #1e6b4e; font-weight: 700; font-size: 16px;">You're one of our Founding 100!</div>
        <div style="color: #5a8a72; font-size: 14px; margin-top: 6px;">You'll help shape what comes next — and get priority access when we launch.</div>
      </div>
      ` : ''}
    
      <!-- Next Steps -->
      <div style="background: #f8fdf8; border: 2px solid #d4e8dc; border-radius: 12px; padding: 24px; margin: 24px 0;">
         <h3 style="color: #1e6b4e; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">What happens next?</h3>
         <ul style="color: #48735e; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
           <li>We'll email you when it's time to complete your account</li>
           <li>You'll get priority access to test features and give feedback</li>
           <li>We'll keep you updated on our progress</li>
         </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f0faf4; padding: 30px; text-align: center; border-radius: 0 0 16px 16px; border: 2px solid #8bd7c7; border-top: none;">
      <p style="color: #1e6b4e; font-size: 16px; margin: 0; font-weight: 600;">🍐 Welcome to the village!</p>
      <p style="color: #5a8a72; font-size: 14px; margin: 8px 0 0 0;">The Opeari Team</p>
    </div>
    
  </div>
</body>
</html>
          `
      });
      results.userEmail = userEmail;
    } catch (e) {
      console.error('Failed to send user email:', e);
      results.userEmailError = e.message;
    }

    // 2. Send Admin Notification
    try {
      const adminEmail = await resend.emails.send({
        from: SENDER_EMAIL,
        to: ADMIN_EMAIL,
        subject: `🍐 New Waitlist: ${firstName} (${email})`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1e6b4e; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">New Waitlist Signup! 🎉</h1>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #ddd;">
                <h2 style="color: #1e6b4e; margin-top: 0;">User Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${firstName} ${lastName}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${email}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Zip Code:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${zipCode || 'Not provided'}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Type:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${userType || 'Not provided'}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Position:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">#${position} ${isFoundingMember ? '⭐ Founding 100' : ''}</td></tr>
                   <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Intent/Challenge:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${childcareChallenge || 'Not provided'}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Referral:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${referralSource || 'None'} ${referralName ? `(${referralName})` : ''}</td></tr>
                </table>
                <p style="margin-top: 20px;">
                    <a href="https://supabase.com/dashboard/project/rvostbkbbddbgcnxqchv/editor/28596" style="display: inline-block; padding: 10px 20px; background: #1e6b4e; color: white; text-decoration: none; border-radius: 4px;">View in Supabase</a>
                </p>
              </div>
            </div>
          `
      });
      results.adminEmail = adminEmail;
    } catch (e) {
      console.error('Failed to send admin email:', e);
      results.adminEmailError = e.message;
    }

    // Return Success
    const anySuccess = results.userEmail?.data || results.adminEmail?.data;
    const errors = [results.userEmailError, results.adminEmailError].filter(Boolean);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: !!anySuccess,
        // Return 'emailSent' (for legacy frontend check) AND 'message'
        emailSent: !!results.userEmail?.data,
        message: anySuccess ? 'Emails processed' : 'Failed to send emails',
        error: errors.length > 0 ? errors.join('; ') : undefined // Flatten errors to string for frontend logs
      })
    };

  } catch (err) {
    console.error('Function Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        emailSent: false,
        error: err.message
      })
    };
  }
};
