const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const clean = (str) => (str ? str.trim() : '');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Missing Supabase configuration' }),
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const data = JSON.parse(event.body);
    console.log("📥 Received waitlist signup:", data);

    // Basic fields
    const firstName = clean(data["First Name"]);
    const lastName = clean(data["Last Name"]);
    const email = clean(data.Email).toLowerCase();
    const sendEmail = !!data.SendEmail;

    // User type
    const rawUserRole = clean(data["User Role"]);
    const validRoles = ['parent', 'caregiver', 'provider', 'both', 'exploring', 'other'];
    const userType = validRoles.includes(rawUserRole) ? rawUserRole : 'parent';

    // Vetting fields
    const interests = Array.isArray(data.Interests) ? data.Interests : [];
    const situation = Array.isArray(data.Situation) ? data.Situation : [];
    const childcareChallenge = clean(data["Childcare Challenge"]) || null;
    const heardFrom = clean(data["Heard From"]) || null;
    const socialHandle = clean(data["Social Handle"]) || null;
    const referralCode = clean(data["Referral Code"]) || null;

    if (!firstName || !lastName || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields." }),
      };
    }

    console.log("🔍 Checking for existing email:", email);

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('waitlist')
      .select('position, approved')
      .eq('email', email)
      .single();

    if (existing) {
      console.log("⚠️ Email already exists at position:", existing.position);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: "Email already registered",
          position: existing.position || 1,
          accountStatus: existing.approved ? 'approved' : 'waitlist'
        }),
      };
    }

    // Calculate position
    console.log("📊 Calculating waitlist position...");
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    const position = (count || 0) + 1;
    console.log(`📍 New position will be: ${position}`);

    // Insert into waitlist with ALL fields
    const { data: newRecord, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        user_type: userType,
        interests: interests,
        situation: situation,
        childcare_challenge: childcareChallenge,
        heard_from: heardFrom,
        social_handle: socialHandle,
        referral_code: referralCode,
        position: position,
        approved: false,
        invite_sent: false
      })
      .select()
      .single();
      
    if (insertError) {
      console.error("❌ Supabase Insert Error:", insertError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: insertError.message, details: insertError }),
      };
    }

    console.log("✅ Waitlist record created:", newRecord.id, "at position:", position);

    // Send emails if requested
    if (sendEmail) {
      console.log("📧 Sending confirmation email...");
      
      const isFoundingMember = position <= 100;
      
      try {
        // User confirmation email
        await resend.emails.send({
          from: "Opeari <hello@opeari.com>",
          to: [email],
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
      <p style="color: #1e6b4e; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">Hey ${firstName}! 👋</p>
      
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
      
      <!-- What's Next -->
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
          `,
        });

        // Admin notification email
        await resend.emails.send({
          from: "Opeari <hello@opeari.com>",
          to: ["hello@opeari.com"],
          subject: `New waitlist signup: ${firstName} ${lastName} (#${position})`,
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
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Type:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${userType}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Position:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">#${position} ${isFoundingMember ? '⭐ Founding 100' : ''}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Looking for:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${interests.length > 0 ? interests.join(', ') : 'Not specified'}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Kid ages:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${situation.length > 0 ? situation.join(', ') : 'Not specified'}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Challenge:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${childcareChallenge || 'Not provided'}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Heard from:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${heardFrom || 'Not specified'}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong>Social:</strong></td><td style="padding: 8px 0;">${socialHandle || 'Not provided'}</td></tr>
                </table>
                <p style="margin-top: 20px; padding: 12px; background: ${childcareChallenge ? '#d4edda' : '#fff3cd'}; border-radius: 6px;">
                  <strong>Intent signal:</strong> ${childcareChallenge ? '✅ Provided challenge details' : '⚠️ No challenge provided'}
                </p>
              </div>
            </div>
          `,
        });

        console.log("📬 Emails sent successfully");
        
      } catch (emailError) {
        console.error("❌ Email error:", emailError);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        position,
        cohort: position <= 100 ? 'founding-100' : 'early-access',
        accountStatus: 'waitlist',
        message: "You're on the waitlist!"
      }),
    };

  } catch (err) {
    console.error("🔥 Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Something went wrong", 
        details: err.message 
      }),
    };
  }
};
