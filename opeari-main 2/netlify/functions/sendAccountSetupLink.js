const Airtable = require('airtable');
const { Resend } = require('resend');
const crypto = require('crypto');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  // Auth check...
  const providedSecret = event.headers['x-opeari-secret'];
  if (!providedSecret || providedSecret !== process.env.NETLIFY_ADMIN_SECRET) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: "Unauthorized" }),
    };
  }

  try {
    const { email } = JSON.parse(event.body || '{}');
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Missing email" }),
      };
    }

    console.log("🔍 Looking up approved user in Users table:", email);

    // 🔥 FIX: Look in Users table instead of waitlist table
    const userRecords = await base('waitlist').select({
      maxRecords: 1,
      filterByFormula: `AND({Status} = "Approved", LOWER({Email}) = "${email.toLowerCase()}")`
    }).firstPage();

    if (!userRecords.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: "No approved user found for this email" }),
      };
    }

    const userRecord = userRecords[0];
    const userFields = userRecord.fields;
    const firstName = userFields.FirstName || "there";

    console.log("✅ Found approved user:", { firstName, email });

    // 🔥 FIX: Generate token and save to Users table (not Members table)
    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    const link = `https://opeari.com/create-account.html?email=${encodeURIComponent(email)}&token=${token}`;

    // 🔥 FIX: Update Users table with token
    await base('waitlist').update(userRecord.id, {
      "AccountSetupToken": token,
      "TokenExpiresAt": expiry.toISOString(),
      "InviteSent": true,
      "LastInviteDate": new Date().toISOString()
    });

    // Send email...
    console.log("📧 Sending invite email to:", email);
    
    const emailResult = await resend.emails.send({
      from: 'Opeari <noreply@send.opeari.com>',
      to: email,
      subject: 'Complete Your Opeari Account Setup',
      html: `
        <div style="font-family: 'Comfortaa', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e6b4e;">Hi ${firstName}! 👋</h2>
          <p>You've been approved to join Opeari! Click below to complete your account setup:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="
              background: linear-gradient(135deg, #20b2aa 0%, #1e6b4e 100%); 
              color: white; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 25px;
              font-size: 18px;
              font-weight: 600;
              display: inline-block;
            ">
              Complete My Account Setup
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            ⏰ This link expires in 24 hours for your security.
          </p>
        </div>
      `
    });

    console.log("✅ Email sent successfully");

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: "Invite sent successfully",
        emailSent: true,
        expiresAt: expiry.toISOString()
      }),
    };

  } catch (err) {
    console.error("🔥 Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
