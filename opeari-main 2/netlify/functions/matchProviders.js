// netlify/functions/matchProviders.js
const Airtable = require('airtable');

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Get parent's profile and care needs
    const parentRecord = await getParentProfile(email);
    if (!parentRecord) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Parent profile not found' })
      };
    }

    // Get all provider profiles
    const providers = await getAllProviders();
    
    // Match providers to parent needs
    const matches = matchProvidersToParent(parentRecord, providers);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        parentName: parentRecord.fullName,
        totalMatches: matches.length,
        matches: matches
      })
    };

  } catch (error) {
    console.error('Error in matchProviders:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function getParentProfile(email) {
  try {
    const records = await base('Members').select({
      filterByFormula: `AND({email} = '${email}', {role} = 'parent')`
    }).firstPage();
    
    if (records.length === 0) return null;
    
    const record = records[0];
    return {
      id: record.id,
      fullName: record.get('fullName'),
      email: record.get('email'),
      careTypes: record.get('careTypes') || [],
      availability: record.get('availability') || [],
      ageGroups: record.get('ageGroups') || [],
      languages: record.get('languages') || [],
      neighborhood: record.get('neighborhood') || ''
    };
  } catch (error) {
    console.error('Error getting parent profile:', error);
    return null;
  }
}

async function getAllProviders() {
  try {
    const providers = [];
    await base('Members').select({
      filterByFormula: `{role} = 'provider'`
    }).eachPage((records, fetchNextPage) => {
      records.forEach(record => {
        providers.push({
          id: record.id,
          fullName: record.get('fullName'),
          email: record.get('email'),
          careTypes: record.get('careTypes') || [],
          availability: record.get('availability') || [],
          ageGroups: record.get('ageGroups') || [],
          languages: record.get('languages') || [],
          neighborhood: record.get('neighborhood') || '',
          backgroundCheck: record.get('backgroundCheck') || 'Pending',
          bio: record.get('bio') || '',
          hourlyRate: record.get('hourlyRate') || '',
          experience: record.get('experience') || ''
        });
      });
      fetchNextPage();
    });
    
    return providers;
  } catch (error) {
    console.error('Error getting providers:', error);
    return [];
  }
}

function matchProvidersToParent(parent, providers) {
  const matches = [];
  
  providers.forEach(provider => {
    const score = calculateMatchScore(parent, provider);
    
    // Only include providers with a match score > 0
    if (score.total > 0) {
      matches.push({
        ...provider,
        matchScore: score.total,
        matchDetails: score.details
      });
    }
  });
  
  // Sort by match score (highest first)
  matches.sort((a, b) => b.matchScore - a.matchScore);
  
  // Return top 10 matches
  return matches.slice(0, 10);
}

function calculateMatchScore(parent, provider) {
  let score = 0;
  const details = [];
  
  // Care Types Match (25 points max)
  const careTypeMatch = hasOverlap(parent.careTypes, provider.careTypes);
  if (careTypeMatch) {
    score += 25;
    details.push('Offers your needed care type');
  }
  
  // Age Groups Match (20 points max)
  const ageGroupMatch = hasOverlap(parent.ageGroups, provider.ageGroups);
  if (ageGroupMatch) {
    score += 20;
    details.push('Works with your child\'s age group');
  }
  
  // Availability Match (20 points max)
  const availabilityMatch = hasOverlap(parent.availability, provider.availability);
  if (availabilityMatch) {
    score += 20;
    details.push('Available when you need care');
  }
  
  // Languages Match (15 points max)
  const languageMatch = hasOverlap(parent.languages, provider.languages);
  if (languageMatch) {
    score += 15;
    details.push('Speaks your preferred language');
  }
  
  // Neighborhood Match (10 points max)
  if (parent.neighborhood && provider.neighborhood && 
      parent.neighborhood.toLowerCase() === provider.neighborhood.toLowerCase()) {
    score += 10;
    details.push('In your neighborhood');
  }
  
  // Background Check Bonus (10 points max)
  if (provider.backgroundCheck === 'Passed' || provider.backgroundCheck === 'Completed') {
    score += 10;
    details.push('Background check completed');
  }
  
  return {
    total: score,
    details: details
  };
}

function hasOverlap(array1, array2) {
  if (!array1 || !array2 || array1.length === 0 || array2.length === 0) {
    return false;
  }
  
  return array1.some(item => 
    array2.some(item2 => 
      item.toLowerCase().trim() === item2.toLowerCase().trim()
    )
  );
}
