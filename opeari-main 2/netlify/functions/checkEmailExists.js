// /.netlify/functions/checkEmailExists.js
const Airtable = require('airtable');
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
    const { email } = JSON.parse(event.body || '{}');
    
    if (!email) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: 'Email is required' }) };
    }

    // Check Members table
    const memberRecords = await base('Members')
      .select({ 
        filterByFormula: `LOWER({Email}) = "${email.toLowerCase()}"`,
        maxRecords: 1 
      })
      .firstPage();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ exists: memberRecords.length > 0 })
    };

  } catch (error) {
    console.error('checkEmailExists error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ message: 'Internal server error' }) 
    };
  }
};
