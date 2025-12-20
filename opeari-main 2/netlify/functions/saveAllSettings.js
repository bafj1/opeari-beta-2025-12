// /.netlify/functions/saveAllSettings.js - Simple debug version
const Airtable = require('airtable');

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
    console.log('🔄 saveAllSettings called');
    
    // Check environment variables
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ 
          success: false,
          message: 'Missing environment variables',
          debug: {
            hasApiKey: !!process.env.AIRTABLE_API_KEY,
            hasBaseId: !!process.env.AIRTABLE_BASE_ID
          }
        }) 
      };
    }

    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const { email, userData } = JSON.parse(event.body || '{}');

    console.log('📧 Email:', email);
    console.log('📦 UserData:', userData);

    if (!email || !userData || !userData.Members) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ message: 'Missing email or Members data' }) 
      };
    }

    // STEP 1: Get existing field names from Airtable
    console.log('🔍 Getting existing Airtable field names...');
    let existingFields = [];
    try {
      const sampleRecords = await base('Members').select({ maxRecords: 1 }).firstPage();
      if (sampleRecords.length > 0) {
        existingFields = Object.keys(sampleRecords[0].fields);
        console.log('📋 EXISTING AIRTABLE FIELDS:', existingFields);
      }
    } catch (schemaError) {
      console.log('⚠️ Could not get existing fields:', schemaError.message);
    }

    // STEP 2: Show what you're trying to send vs what exists
    const incomingFields = Object.keys(userData.Members);
    console.log('📝 INCOMING FIELDS FROM YOUR FORM:', incomingFields);
    
    const validFields = incomingFields.filter(field => existingFields.includes(field));
    const invalidFields = incomingFields.filter(field => !existingFields.includes(field));
    
    console.log('✅ VALID FIELDS (will save):', validFields);
    console.log('❌ INVALID FIELDS (will be ignored):', invalidFields);

    // STEP 3: Try to save only the valid fields
    const validData = {};
    validFields.forEach(field => {
      validData[field] = userData.Members[field];
    });
    
    // Always include email
    validData.Email = email;

    console.log('💾 Attempting to save this data:', validData);

    // Find or create record
    const records = await base('Members').select({
      filterByFormula: `LOWER({Email}) = "${email.toLowerCase()}"`,
      maxRecords: 1
    }).firstPage();

    let result;
    if (records.length === 0) {
      console.log('➕ Creating new record...');
      const newRecord = await base('Members').create([{ fields: validData }]);
      result = { action: 'created', recordId: newRecord[0].id };
    } else {
      console.log('📝 Updating existing record...');
      await base('Members').update(records[0].id, validData);
      result = { action: 'updated', recordId: records[0].id };
    }

    console.log('✅ Success!', result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Settings ${result.action} successfully!`,
        debug: {
          existingAirtableFields: existingFields,
          incomingFields: incomingFields,
          validFields: validFields,
          invalidFields: invalidFields,
          savedFieldCount: validFields.length,
          ignoredFieldCount: invalidFields.length
        }
      })
    };

  } catch (error) {
    console.error('💥 Error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        success: false,
        message: 'Save failed', 
        error: error.message 
      }) 
    };
  }
};
