const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const clean = (str) => (str ? String(str).trim() : '');

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

    // Accept both old format ("First Name") and new format (firstName)
    const firstName = clean(data.firstName || data["First Name"]);
    const lastName = clean(data.lastName || data["Last Name"]);
    const email = clean(data.email || data.Email).toLowerCase();
    const zipCode = clean(data.zipCode || data.zip_code);
    const userType = clean(data.userType || data.user_type || 'family');
    const urgency = clean(data.urgency);
    const referralSource = clean(data.referralSource || data.referral_source);
    const referralName = clean(data.referralName || data.referral_name);
    const linkedinUrl = clean(data.linkedinUrl || data.linkedin_url);
    const whyJoin = clean(data.whyJoin || data.why_join);
    const referralCode = clean(data.referralCode || data.referral_code);
    const referredBy = clean(data.referredBy || data.referred_by);

    if (!firstName || !lastName || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields." }),
      };
    }

    console.log("🔍 Checking for existing email:", email);

    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: "Email already registered"
        }),
      };
    }

    console.log("📊 Calculating waitlist position...");
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    const position = (count || 0) + 1;
    console.log(`📍 New position will be: ${position}`);

    // Generate referral code for the user (FIRSTNAME-XXXX format)
    const generatedReferralCode = `${firstName.toUpperCase().slice(0, 4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const { data: newRecord, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        zip_code: zipCode,
        user_type: userType,
        urgency: urgency,
        referral_source: referralSource,
        referral_name: referralName,
        linkedin_url: linkedinUrl,
        why_join: whyJoin,
        referral_code: generatedReferralCode,
        referred_by: referredBy,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (insertError) {
      console.error("❌ Supabase Insert Error:", insertError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: insertError.message }),
      };
    }

    console.log("✅ Waitlist record created:", newRecord.id, "at position:", position);

    // Send confirmation email to user
    console.log("📧 Sending confirmation email...");
    
    const isFoundingMember = position <= 100;
    const userTypeLabel = {
      'family': 'Looking for childcare',
      'caregiver': 'Want to provide care',
      'both': 'Both'
    }[userType] || userType;
    
    try {
      // Email to the user
      await resend.emails.send({
        from: "Opeari <hello@opeari.com>",
        to: [email],
        subject: "You're on the list! 🍐",
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
    <div style="background: linear-gradient(135deg, #e1f5ee 0%, #c9f2e3 100%); padding: 45px 30px; text-align: center; border-radius: 16px 16px 0 0;">
      <h1 style="color: #1e6b4e; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Opeari!</h1>
      <p style="color: #3d8c6c; font-size: 16px; margin: 12px 0 0 0;">Your village is waiting...</p>
    </div>
    
    <!-- Body -->
    <div style="background: white; padding: 36px 30px;">
      <p style="color: #1e6b4e; font-size: 18px; margin: 0 0 20px 0;">Hey ${firstName}! 👋</p>
      
      <p style="color: #2d3748; font-size: 16px; line-height: 1.7; margin: 0 0 28px 0;">
        Thanks for joining the waitlist! Opeari is reimagining childcare — rooted in trust, shared support, and flexible help when you need it most.
      </p>
      
      <!-- Position Badge -->
      <div style="background: linear-gradient(135deg, #1e6b4e 0%, #3ca370 100%); padding: 26px; border-radius: 16px; text-align: center; margin: 0 0 24px 0;">
        <div style="color: white; font-size: 26px; font-weight: 700; margin-bottom: 8px;">
          You're #${position} in line! ✨
        </div>
        <div style="color: rgba(255,255,255,0.9); font-size: 15px;">
          We'll send you an account setup link when it's your turn 🍐
        </div>
      </div>
      
      ${isFoundingMember ? `
      <!-- Founding Member -->
      <div style="background: linear-gradient(135deg, #fff7d6 0%, #ffecec 100%); padding: 24px; border-radius: 14px; text-align: center; margin: 0 0 28px 0;">
        <div style="font-size: 28px; margin-bottom: 10px;">🌟</div>
        <div style="color: #1e6b4e; font-weight: 700; font-size: 18px;">You're one of our Founding 100!</div>
        <div style="color: #5a8a72; font-size: 15px; margin-top: 8px; line-height: 1.5;">You'll help shape what comes next — and get priority access when we launch.</div>
      </div>
      ` : ''}
      
      <!-- Referral Section -->
      <div style="background: #f0fdf9; padding: 24px; border-radius: 14px; text-align: center; margin: 0 0 28px 0;">
        <div style="color: #1e6b4e; font-weight: 700; font-size: 16px; margin-bottom: 8px;">Skip the wait</div>
        <div style="color: #5a8a72; font-size: 14px; margin-bottom: 16px;">Every neighbor who joins moves you up</div>
        <div style="background: white; border: 1px solid #c8e6d9; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 14px; color: #1e6b4e;">
          opeari.com/waitlist?ref=${generatedReferralCode}
        </div>
      </div>
      
      <!-- What's Next -->
      <div style="background: #f8fdf8; border-left: 4px solid #8bd7c7; padding: 22px 26px; border-radius: 0 12px 12px 0;">
        <h3 style="color: #1e6b4e; margin: 0 0 14px 0; font-size: 16px; font-weight: 600;">What happens next?</h3>
        <ul style="color: #48735e; font-size: 15px; line-height: 2; margin: 0; padding-left: 18px;">
          <li>We'll email you when it's time to complete your account</li>
          <li>You'll get priority access to test features and give feedback</li>
          <li>We'll keep you updated on our progress</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: linear-gradient(135deg, #f0faf4 0%, #e8f4ec 100%); padding: 28px 30px; text-align: center; border-radius: 0 0 16px 16px;">
      <p style="color: #1e6b4e; font-size: 16px; margin: 0; font-weight: 600;">🍐 Welcome to the village!</p>
      <p style="color: #5a8a72; font-size: 14px; margin: 10px 0 0 0;">The Opeari Team</p>
    </div>
    
  </div>
</body>
</html>
        `,
      });

      // Admin notification
      await resend.emails.send({
        from: "Opeari <hello@opeari.com>",
        to: ["breadafarrell@gmail.com"],
        subject: `🎉 New signup: ${firstName} ${lastName} (#${position})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <div style="background: #1e6b4e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">New Waitlist Signup!</h2>
            </div>
            <div style="background: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>ZIP:</strong> ${zipCode || '—'}</p>
              <p><strong>Type:</strong> ${userTypeLabel}</p>
              <p><strong>Urgency:</strong> ${urgency || '—'}</p>
              <p><strong>Position:</strong> #${position} ${isFoundingMember ? '⭐ Founding 100' : ''}</p>
              <p><strong>Referral Source:</strong> ${referralSource || '—'}</p>
              <p><strong>Referred by:</strong> ${referredBy || '—'}</p>
              <p><strong>Why join:</strong> ${whyJoin || '—'}</p>
              <p><strong>LinkedIn:</strong> ${linkedinUrl || '—'}</p>
            </div>
          </div>
        `,
      });

      console.log("📬 Emails sent successfully");
      
    } catch (emailError) {
      console.error("❌ Email error:", emailError);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        position,
        referralCode: generatedReferralCode,
        message: "You're on the waitlist!"
      }),
    };

  } catch (err) {
    console.error("🔥 Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Something went wrong", details: err.message }),
    };
  }
};
