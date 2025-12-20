// netlify/functions/notifyWaitlistSignup.js
// Sends notification when someone joins the waitlist

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Admin email to notify
const ADMIN_EMAIL = 'breadafarrell@gmail.com';

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { firstName, lastName, email, zipCode, userType, urgency, referralSource, referralName } = data;

    // Format user type for display
    const typeLabels = {
      'family': 'Looking for childcare',
      'caregiver': 'Want to provide care',
      'both': 'Both (seeking & providing)'
    };

    const urgencyLabels = {
      'asap': 'ASAP',
      '1-3months': '1-3 months',
      '3-6months': '3-6 months',
      'exploring': 'Just exploring'
    };

    const referralLabels = {
      'friend': 'Friend or family',
      'neighbor': 'Neighbor',
      'parent_group': 'Parent group / school',
      'social_media': 'Social media',
      'search': 'Google / search',
      'other': 'Other'
    };

    // Build email content
    const subject = `🍐 New Waitlist Signup: ${firstName} ${lastName}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e6b4e;">New Opeari Waitlist Signup!</h2>
        
        <div style="background: #e8f5f0; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1e6b4e; margin-top: 0;">${firstName} ${lastName}</h3>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>ZIP Code:</strong> ${zipCode}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${typeLabels[userType] || userType}</p>
          <p style="margin: 5px 0;"><strong>Urgency:</strong> ${urgencyLabels[urgency] || urgency}</p>
          <p style="margin: 5px 0;"><strong>Referral:</strong> ${referralLabels[referralSource] || referralSource}${referralName ? ` (${referralName})` : ''}</p>
        </div>
        
        <p style="color: #5a8a72;">
          <a href="https://supabase.com/dashboard/project/rvostbkbbddbgcnxqchv/editor/28596" style="color: #1e6b4e;">
            View in Supabase →
          </a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #c8e6d9; margin: 20px 0;">
        <p style="color: #8fb89f; font-size: 12px;">This is an automated notification from Opeari.</p>
      </div>
    `;

    // For now, we'll use Supabase's built-in email (or you can integrate with your email provider)
    // This is a placeholder - you'll need to set up actual email sending
    
    // Option 1: Log to database for manual review
    await supabase
      .from('admin_notifications')
      .insert({
        type: 'waitlist_signup',
        subject: subject,
        body: htmlBody,
        metadata: { firstName, lastName, email, zipCode, userType, urgency, referralSource, referralName },
        created_at: new Date().toISOString()
      });

    // Option 2: Send via your email service (Zoho, SendGrid, etc.)
    // Uncomment and configure when ready:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to: ADMIN_EMAIL,
      from: 'notifications@opeari.com',
      subject: subject,
      html: htmlBody
    });
    */

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Notification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send notification' })
    };
  }
};
