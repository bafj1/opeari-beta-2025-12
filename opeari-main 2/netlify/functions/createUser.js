// /.netlify/functions/createUser.js - FIXED with correct field names
const Airtable = require('airtable');
const bcrypt = require('bcryptjs');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method not allowed' }) };

  try {
    const userData = JSON.parse(event.body || '{}');
    const { email, password, userType, firstName, lastName, phone, username } = userData;

    console.log('Creating user:', { email, userType, username });

    // Validate required fields
    if (!email || !password || !userType || !firstName || !lastName) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ message: 'Missing required fields: email, password, userType, firstName, lastName' }) 
      };
    }

    // Check if email already exists
    const existingRecords = await base('Members')
      .select({ 
        filterByFormula: `LOWER({Email}) = "${email.toLowerCase()}"`,
        maxRecords: 1 
      })
      .firstPage();

    if (existingRecords.length > 0) {
      return { 
        statusCode: 409, 
        headers, 
        body: JSON.stringify({ message: 'Email already registered' }) 
      };
    }

    // Check if username already exists (if provided)
    if (username) {
      const usernameRecords = await base('Members')
        .select({ 
          filterByFormula: `LOWER({Username}) = "${username.toLowerCase()}"`,
          maxRecords: 1 
        })
        .firstPage();

      if (usernameRecords.length > 0) {
        return { 
          statusCode: 409, 
          headers, 
          body: JSON.stringify({ message: 'Username already taken' }) 
        };
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate username if not provided
    const finalUsername = username || `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;

    // 🔥 FIXED: Use correct field names that match your Airtable schema
    const memberFields = {
      'Email': email,
      'PasswordHash': hashedPassword,
      'First Name': firstName,           // 🔥 FIXED: Changed from 'FirstName' to 'First Name'
      'Last Name': lastName,             // 🔥 FIXED: Changed from 'LastName' to 'Last Name'
      'Phone Number': phone || '',       // 🔥 FIXED: Changed from 'Phone' to 'Phone Number'
      'Username': finalUsername,         // 🔥 NEW: Added username field
      'Status': 'Approved',              // 🔥 CHANGED: Set to Approved instead of Pending
      'AccountVerified': true,           // 🔥 CHANGED: Set to true for immediate access
      'EmailVerified': true,             // 🔥 CHANGED: Set to true for immediate access
      'CreatedAt': new Date().toISOString(),
      'Role': userType
    };

    console.log('📝 Creating member with fields:', Object.keys(memberFields));

    const memberRecord = await base('Members').create([{ fields: memberFields }]);
    console.log('✅ Created Members record:', memberRecord[0].id);

    // 🔥 REMOVED: Parent/Provider table creation to avoid more field errors
    // Focus on getting the main Members table working first

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Account created successfully',
        user: {
          id: memberRecord[0].id,
          email: email,
          username: finalUsername,
          name: `${firstName} ${lastName}`,
          userType: userType
        }
      })
    };

  } catch (error) {
    console.error('❌ createUser error:', error);
    
    // Better error handling for field name issues
    if (error.message.includes('UNKNOWN_FIELD_NAME')) {
      console.error('🔥 FIELD NAME ERROR - Check your Airtable field names!');
      return { 
        statusCode: 422, 
        headers, 
        body: JSON.stringify({ 
          message: 'Database field error - please contact support',
          error: 'Field name mismatch',
          debug: error.message 
        }) 
      };
    }

    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        message: 'Failed to create account', 
        error: error.message 
      }) 
    };
  }
};
