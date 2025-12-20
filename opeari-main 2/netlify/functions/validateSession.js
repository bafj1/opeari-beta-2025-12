// netlify/functions/validateSession.js
const Airtable = require('airtable');

const airtable = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY 
}).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'https://opeari.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ valid: false, message: 'Method not allowed' }) 
    };
  }

  try {
    const { email, sessionToken } = JSON.parse(event.body || '{}');

    if (!email || !sessionToken) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ valid: false, message: 'Email and session token required' }) 
      };
    }

    // Find user and validate session token
    const records = await airtable('Members').select({
      filterByFormula: `AND(LOWER({Email}) = "${email.toLowerCase()}", {SessionToken} = "${sessionToken}")`,
      maxRecords: 1
    }).firstPage();

    if (!records.length) {
      return { 
        statusCode: 401, 
        headers, 
        body: JSON.stringify({ valid: false, message: 'Invalid session' }) 
      };
    }

    const userRecord = records[0];
    const member = userRecord.fields;

    // Check if account is still active
    if (member.Status === 'suspended' || member.Status === 'deleted') {
      return { 
        statusCode: 403, 
        headers, 
        body: JSON.stringify({ valid: false, message: 'Account suspended' }) 
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        user: {
          id: userRecord.id,
          email: member.Email,
          name: member.Name || '',
          role: member.Role || 'parent',
          status: member.Status || 'active'
        }
      })
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ valid: false, message: 'Server error' }) 
    };
  }
};
