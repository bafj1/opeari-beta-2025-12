const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method not allowed' }),
      };
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid JSON' }),
      };
    }

    const { email } = body;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email is required' }),
      };
    }

    // Use case-insensitive matching
    const records = await base('Members')
      .select({ filterByFormula: `LOWER({Email}) = "${email.toLowerCase()}"` })
      .firstPage();

    if (records.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User not found' }),
      };
    }

    const user = records[0].fields;
    
    // Add some calculated fields for better personalization
    user.Points = user.Points || calculateUserPoints(user);
    user.TrustScore = user.TrustScore || calculateTrustScore(user);
    user.ProfileCompletion = calculateProfileCompletion(user);

    return {
      statusCode: 200,
      body: JSON.stringify(user),
    };
  } catch (error) {
    console.error('❌ getUserProfile error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

// Helper functions (add these to the function)
function calculateUserPoints(userData) {
  // Same logic as frontend
  let points = 0;
  const requiredFields = ['FullName', 'Email', 'PhoneNumber', 'Neighborhood', 'Bio'];
  const completed = requiredFields.filter(field => userData[field]).length;
  points += (completed / requiredFields.length) * 1000;
  
  if (userData.BackgroundCheckVerified) points += 500;
  if (userData.PhoneNumberVerified) points += 100;
  points += (userData.CareHours || 0) * 10;
  
  return Math.max(points, 0);
}

function calculateTrustScore(userData) {
  // Same logic as frontend
  let score = 30; // Base score
  if (userData.BackgroundCheckVerified) score += 30;
  if (userData.PhoneNumberVerified) score += 15;
  if (userData.Rating >= 4.5) score += 25;
  return Math.min(score, 100);
}

function calculateProfileCompletion(userData) {
  const requiredFields = ['FullName', 'Email', 'PhoneNumber', 'Neighborhood', 'Bio'];
  const completed = requiredFields.filter(field => userData[field]).length;
  return Math.round((completed / requiredFields.length) * 100);
}
