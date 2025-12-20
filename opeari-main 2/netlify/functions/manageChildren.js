// /.netlify/functions/manageChildren.js - Handle child record operations
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const { action, email, childData, childId } = JSON.parse(event.body || '{}');

    if (!email) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ message: 'Email is required' }) 
      };
    }

    switch (action) {
      case 'list':
        return await listChildren(email, headers);
      
      case 'create':
        return await createChild(email, childData, headers);
      
      case 'update':
        return await updateChild(childId, childData, headers);
      
      case 'delete':
        return await deleteChild(childId, headers);
      
      default:
        return { 
          statusCode: 400, 
          headers, 
          body: JSON.stringify({ message: 'Invalid action' }) 
        };
    }

  } catch (error) {
    console.error('manageChildren error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        message: 'Operation failed', 
        error: error.message 
      }) 
    };
  }
};

// List all children for a parent
async function listChildren(email, headers) {
  try {
    const records = await base('Kids').select({
      filterByFormula: `LOWER({ParentEmail}) = "${email.toLowerCase()}"`
    }).all();

    const children = records.map(record => ({
      id: record.id,
      ...record.fields
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        children: children
      })
    };

  } catch (error) {
    throw new Error(`Failed to list children: ${error.message}`);
  }
}

// Create a new child record
async function createChild(email, childData, headers) {
  try {
    if (!childData || !childData.FirstName || !childData.Age) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ message: 'FirstName and Age are required for child' }) 
      };
    }

    const childFields = {
      ParentEmail: email,
      FirstName: childData.FirstName,
      Age: parseInt(childData.Age),
      Grade: childData.Grade || '',
      School: childData.School || '',
      Personality: childData.Personality || '',
      Allergies: childData.Allergies || '',
      MedicalNeeds: childData.MedicalNeeds || '',
      Interests: childData.Interests || '',
      CreatedAt: new Date().toISOString()
    };

    const newRecord = await base('Kids').create([{ fields: childFields }]);
    
    console.log(`✅ Created child record:`, newRecord[0].id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Child added successfully',
        child: {
          id: newRecord[0].id,
          ...newRecord[0].fields
        }
      })
    };

  } catch (error) {
    throw new Error(`Failed to create child: ${error.message}`);
  }
}

// Update existing child record
async function updateChild(childId, childData, headers) {
  try {
    if (!childId) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ message: 'Child ID is required for update' }) 
      };
    }

    const updateFields = {
      ...childData,
      LastUpdated: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] === undefined || updateFields[key] === null) {
        delete updateFields[key];
      }
    });

    await base('Kids').update(childId, updateFields);
    
    console.log(`✅ Updated child record:`, childId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Child updated successfully'
      })
    };

  } catch (error) {
    throw new Error(`Failed to update child: ${error.message}`);
  }
}

// Delete child record
async function deleteChild(childId, headers) {
  try {
    if (!childId) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ message: 'Child ID is required for deletion' }) 
      };
    }

    await base('Kids').destroy([childId]);
    
    console.log(`✅ Deleted child record:`, childId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Child removed successfully'
      })
    };

  } catch (error) {
    throw new Error(`Failed to delete child: ${error.message}`);
  }
}
