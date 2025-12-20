// netlify/functions/sendApprovalInvite.js
// Sends ONE celebratory branded email when user is approved

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const SITE_URL = 'https://opeari.com';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing Supabase configuration' }) };
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { waitlistId, email } = JSON.parse(event.body);

    if (!waitlistId && !email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing waitlistId or email' }) };
    }

    console.log('Processing approval for:', email || waitlistId);

    // Get waitlist record
    let waitlistRecord;
    const query = waitlistId 
      ? supabaseAdmin.from('waitlist').select('*').eq('id', waitlistId).single()
      : supabaseAdmin.from('waitlist').select('*').eq('email', email.toLowerCase()).single();
    
    const { data, error } = await query;
    if (error || !data) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Waitlist record not found' }) };
    }
    waitlistRecord = data;

    const userEmail = waitlistRecord.email;
    const firstName = waitlistRecord.first_name || 'there';

    console.log('Found:', userEmail);

    // Try to generate invite link, fall back to magic link if user exists
    let inviteLink;
    
    // First, try invite (for new users)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: userEmail,
      options: { redirectTo: `${SITE_URL}/account-setup.html` }
    });

    if (linkError) {
      console.log('Invite failed, trying magic link:', linkError.message);
      
      // If user exists, generate a magic link instead
      if (linkError.message.includes('already') || linkError.code === 'email_exists') {
        const { data: magicData, error: magicError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: userEmail,
          options: { redirectTo: `${SITE_URL}/account-setup.html` }
        });
        
        if (magicError) {
          console.error('Magic link error:', magicError);
          return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to generate link' }) };
        }
        inviteLink = magicData?.properties?.action_link;
      } else {
        console.error('Link error:', linkError);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to generate invite link' }) };
      }
    } else {
      inviteLink = linkData?.properties?.action_link;
    }

    if (!inviteLink) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'No invite link generated' }) };
    }

    console.log('Invite link generated');

    // Update waitlist
    await supabaseAdmin.from('waitlist').update({
      approved: true,
      invite_sent: true,
      approved_at: new Date().toISOString(),
      invite_sent_at: new Date().toISOString()
    }).eq('id', waitlistRecord.id);

    // Send the CELEBRATION email! 🎉
    try {
      await resend.emails.send({
        from: "Opeari <hello@opeari.com>",
        to: [userEmail],
        subject: "🎉 You're in! Welcome to Opeari",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fdf8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Celebration Header -->
    <div style="background: linear-gradient(135deg, #1e6b4e 0%, #2d9a6a 50%, #3cb878 100%); padding: 50px 30px; text-align: center; border-radius: 16px 16px 0 0;">
      <div style="font-size: 52px; margin-bottom: 16px;">🎉</div>
      <h1 style="color: white; margin: 0; font-size: 34px; font-weight: 700;">You're In!</h1>
      <p style="color: rgba(255,255,255,0.9); font-size: 17px; margin: 14px 0 0 0;">Welcome to the Opeari community</p>
    </div>
    
    <!-- Body -->
    <div style="background: white; padding: 38px 30px;">
      <p style="color: #1e6b4e; font-size: 20px; margin: 0 0 22px 0; font-weight: 600;">Hey ${firstName}! 👋</p>
      
      <p style="color: #2d3748; font-size: 16px; line-height: 1.75; margin: 0 0 24px 0;">
        Big news — you've been approved to join Opeari! We're building a trusted community of families who support each other with childcare, and we're so excited to have you.
      </p>
      
      <p style="color: #2d3748; font-size: 16px; line-height: 1.75; margin: 0 0 32px 0;">
        Click below to set up your account and complete your profile:
      </p>
      
      <!-- Big Beautiful CTA Button -->
      <div style="text-align: center; margin: 36px 0;">
        <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #1e6b4e 0%, #3ca370 100%); color: white; text-decoration: none; padding: 18px 52px; border-radius: 50px; font-size: 18px; font-weight: 700; box-shadow: 0 6px 20px rgba(30, 107, 78, 0.35);">
          ✨ Set Up My Account ✨
        </a>
      </div>
      
      <!-- What's Next -->
      <div style="background: linear-gradient(135deg, #f8fdf8 0%, #f0faf4 100%); border-left: 4px solid #3ca370; padding: 24px 28px; margin: 32px 0 0 0; border-radius: 0 14px 14px 0;">
        <h3 style="color: #1e6b4e; margin: 0 0 16px 0; font-size: 17px; font-weight: 600;">What happens next?</h3>
        <ol style="color: #48735e; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
          <li>Click the button above to create your password</li>
          <li>Complete your family profile</li>
          <li>Get matched with families near you</li>
          <li>Start building your childcare village! 🏘️</li>
        </ol>
      </div>
      
      <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 28px 0 0 0; text-align: center;">
        This link expires in 24 hours. Questions? Just reply to this email!
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: linear-gradient(135deg, #e8f4ec 0%, #d4e8dc 100%); padding: 30px; text-align: center; border-radius: 0 0 16px 16px;">
      <p style="color: #1e6b4e; font-size: 17px; margin: 0; font-weight: 600;">🍐 Welcome to the village!</p>
      <p style="color: #5a8a72; font-size: 14px; margin: 10px 0 0 0;">The Opeari Team</p>
    </div>
    
    <!-- Fallback link -->
    <p style="color: #a0aec0; font-size: 12px; text-align: center; margin-top: 24px; word-break: break-all;">
      Button not working? Copy this link:<br>
      <a href="${inviteLink}" style="color: #5a8a72;">${inviteLink}</a>
    </p>
    
  </div>
</body>
</html>
        `,
      });
      console.log('Celebration email sent!');
    } catch (emailError) {
      console.error('Email error:', emailError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send email' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Invite sent!', email: userEmail }),
    };

  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Something went wrong' }) };
  }
};
