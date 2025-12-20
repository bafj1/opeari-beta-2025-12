const Airtable = require('airtable');

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

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
    const { email, token } = JSON.parse(event.body || '{}');
    
    console.log('🔍 Token verification request:', { 
      email: email || 'not provided', 
      token: token ? `${token.substring(0, 8)}...` : 'missing' 
    });

    if (!token) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "Missing token" }) };
    }

    // Validate token format (UUID)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(token)) {
      console.log('❌ Invalid token format');
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "Invalid token format" }) };
    }

    // 🔥 BULLETPROOF: Search using your exact Airtable field names
    let filterFormula;
    if (email) {
      filterFormula = `AND(LOWER({Email}) = "${email.toLowerCase()}", {Verification Token} = "${token}")`;
    } else {
      filterFormula = `{Verification Token} = "${token}"`;
    }

    console.log('🔍 Searching waitlist table with formula:', filterFormula);

    const records = await airtable('waitlist').select({
      filterByFormula: filterFormula,
      maxRecords: 1,
    }).firstPage();

    if (!records.length) {
      console.log('❌ No records found for token in waitlist table');
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "Invalid or expired token" }) };
    }

    const record = records[0];
    const fields = record.fields;

    console.log('✅ Record found in waitlist table:', { 
      email: fields.Email, 
      status: fields.Status,
      hasToken: !!fields['Verification Token'],
      hasExpiry: !!fields['Verification Expiry']
    });

    // Check if already verified
    if (fields.AccountVerified === true) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "Account already verified" }) };
    }

    // 🔥 BULLETPROOF: Check expiry using your exact field name
    if (fields['Verification Expiry']) {
      const expiry = new Date(fields['Verification Expiry']);
      const now = new Date();
      console.log('⏰ Expiry check:', { 
        expiry: expiry.toISOString(), 
        now: now.toISOString(), 
        expired: now > expiry 
      });
      
      if (now > expiry) {
        console.log("⏰ Token has expired. Returning graceful response.");
        return {
          statusCode: 200, // Graceful handling
          headers,
          body: JSON.stringify({ 
            success: false,
            expired: true,
            email: fields.Email,
            name: fields['First Name'] || ''
          }),
        };
      }
    }

    // Check if user is approved
    if (fields.Status !== 'Approved') {
      console.log('❌ User not approved, status:', fields.Status);
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "Account not yet approved" }) };
    }

    console.log('✅ Token verification successful');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        valid: true,
        email: fields.Email,
        name: fields['First Name'] || '',
        role: fields.Role || ''
      }),
    };
  } catch (err) {
    console.error("🔥 verify-invite error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: "Server error" }) };
  }
};
