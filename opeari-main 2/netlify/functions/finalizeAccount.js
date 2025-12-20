const Airtable = require('airtable');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: "Method Not Allowed" }) };

  try {
    const { email, password, firstName, lastName, token } = JSON.parse(event.body || '{}');
    
    console.log(`🔍 Finalizing account for: ${email}`);

    if (!email || !password || !firstName || !lastName || !token) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Missing required fields' }) };
    }

    // Find user with matching email and token in waitlist
    const userRecords = await airtable('waitlist').select({
      filterByFormula: `AND(LOWER({Email}) = "${email.toLowerCase()}", {Verification Token} = "${token}")`,
      maxRecords: 1
    }).firstPage();

    if (!userRecords.length) {
      console.log('❌ No user found with matching email and token');
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid token or email' }) };
    }

    const userRecord = userRecords[0];
    const userFields = userRecord.fields;

    console.log('✅ Found user record:', { email: userFields.Email, status: userFields.Status });

    // Check if token expired
    if (userFields['Verification Expiry']) {
      if (new Date() > new Date(userFields['Verification Expiry'])) {
        console.log('❌ Token has expired');
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Token has expired' }) };
      }
    }

    // Check if approved
    if (userFields.Status !== 'Approved') {
      console.log('❌ User not approved');
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Account not approved' }) };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // 🔥 FIXED: Use the correct field names from your Airtable Members table
    console.log('📝 Creating Members record with corrected field mapping...');
    
    const memberFields = {
      'Email': userFields.Email,
      'PasswordHash': hashedPassword,
      'FirstName': firstName,
      'LastName': lastName,
      'CreatedAt': new Date().toISOString(),
      'Status': 'Approved',
      'EmailVerified': true,     // 🔥 FIXED: No space, matches your Airtable schema
      'AccountVerified': true    // 🔥 FIXED: No space, matches your Airtable schema
    };

    console.log('📋 Corrected member fields to create:', memberFields);

    const memberRecord = await airtable('Members').create([{ 
      fields: memberFields 
    }]);

    console.log('✅ Created Members record:', memberRecord[0].id);

    // Now try to add optional fields one by one
    const optionalUpdates = {};
    
    // Try to add Role if it exists in waitlist
    if (userFields.Role) {
      optionalUpdates.Role = userFields.Role;
    }

    // Try to add Position if it exists in waitlist (but don't fail if Members table doesn't have this field)
    if (userFields.Position) {
      try {
        optionalUpdates.Position = userFields.Position;
      } catch (e) {
        console.log('⚠️ Position field might not exist in Members table, skipping...');
      }
    }

    // Update with optional fields if any
    if (Object.keys(optionalUpdates).length > 0) {
      try {
        await airtable('Members').update(memberRecord[0].id, optionalUpdates);
        console.log('✅ Updated with optional fields:', optionalUpdates);
      } catch (updateError) {
        console.log('⚠️ Some optional fields failed to update, but member created successfully:', updateError.message);
      }
    }

    // Update waitlist record to mark as completed
    try {
      const waitlistUpdateFields = {
        'AccountVerified': true,
        'Verification Token': '',
        'Verification Expiry': ''
      };

      await airtable('waitlist').update(userRecord.id, waitlistUpdateFields);
      console.log('✅ Updated waitlist record');
    } catch (waitlistError) {
      console.error('⚠️ Failed to update waitlist:', waitlistError);
      // Don't fail the whole process if waitlist update fails
    }

    // Send welcome email
    try {
      console.log("📧 Sending welcome email...");
      
      await resend.emails.send({
        from: 'Opeari <welcome@opeari.com>',
        to: email,
        subject: 'Welcome to your Opeari village! 🍐',
        html: `
          <div style="font-family: 'Comfortaa', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fffaf2;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #e1f5ee 0%, #c9f2e3 100%); padding: 40px 30px; text-align: center; border-radius: 15px 15px 0 0; border: 4px solid #8bd7c7;">
              <div style="width: 80px; height: 80px; margin: 0 auto 20px; background-color: #8bd7c7; border: 4px solid #1e6b4e; border-radius: 50%; background-image: url('https://opeari.com/images/icon.png'); background-size: 60px 60px; background-repeat: no-repeat; background-position: center;">
              </div>
              <h1 style="color: #1e6b4e; margin: 0; font-size: 28px; font-weight: 700; font-family: 'Comfortaa', sans-serif;">Welcome to Opeari! 🎉</h1>
              <p style="color: #3d8c6c; font-size: 16px; margin: 10px 0 0 0; font-family: 'Comfortaa', sans-serif;">Your village awaits</p>
            </div>
            
            <!-- Main Content -->
            <div style="background: white; padding: 40px 30px;">
              <h2 style="color: #1e6b4e; margin: 0 0 20px 0; font-family: 'Comfortaa', sans-serif;">Welcome to Opeari, ${firstName}! 🍐</h2>
              
              <p style="color: #1e6b4e; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0; font-family: 'Comfortaa', sans-serif;">
                Your account is now active and ready to use. You're officially part of our village of parents, providers, and childcare champions.
              </p>
              
              <!-- Call to Action Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="https://opeari.com/login" style="
                  background: linear-gradient(135deg, #20b2aa 0%, #1e6b4e 100%); 
                  color: white; 
                  padding: 16px 32px; 
                  text-decoration: none; 
                  border-radius: 25px;
                  font-size: 18px;
                  font-weight: 600;
                  font-family: 'Comfortaa', sans-serif;
                  display: inline-block;
                  box-shadow: 0 4px 15px rgba(32, 178, 170, 0.3);
                ">
                  Enter My Village
                </a>
              </div>
              
              <p style="color: #1e6b4e; font-size: 16px; line-height: 1.7; margin: 25px 0 0 0; font-family: 'Comfortaa', sans-serif;">
                We're thrilled to have you aboard. Together, we're making childcare more accessible, flexible, and community-driven.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fffe; padding: 30px; text-align: center; border-radius: 0 0 15px 15px; border-top: 3px solid #8bd7c7;">
              <p style="color: #3d8c6c; font-size: 16px; margin: 0 0 15px 0; font-weight: 600; font-family: 'Comfortaa', sans-serif;">
                🍐 Welcome to the village,<br>The Opeari Team
              </p>
              <p style="color: #8bd7c7; font-size: 13px; margin: 0; font-style: italic; font-family: 'Comfortaa', sans-serif;">
                Questions? Reply to this email and we'll help!
              </p>
            </div>
            
          </div>
        `
      });
      
      console.log("✅ Welcome email sent successfully");
    } catch (emailError) {
      console.error("⚠️ Welcome email failed:", emailError);
      // Don't fail account creation if email fails
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Account created successfully',
        user: {
          email: userFields.Email,
          name: firstName,
          memberId: memberRecord[0].id
        }
      })
    };

  } catch (err) {
    console.error('🔥 finalizeAccount error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error: ' + err.message })
    };
  }
};
