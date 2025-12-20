// Create this as a one-time cleanup function: /.netlify/functions/fixPositions.js
// Run once to fix all existing position numbers

const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log("🔧 Starting position cleanup...");

    // Get all valid records, sorted by date
    const allRecords = await base('Waitlist').select({
      fields: ['Email', 'Date', 'Status', 'First Name'],
      filterByFormula: `
        AND(
          {Status} = 'Pending',
          NOT({Email} = ''),
          NOT(FIND('test', LOWER({Email})) > 0),
          NOT(FIND('example', LOWER({Email})) > 0),
          NOT({First Name} = 'Test')
        )
      `,
      sort: [{ field: 'Date', direction: 'asc' }]
    }).all();

    console.log(`📊 Found ${allRecords.length} valid records to update`);

    // Update positions in batches of 10 (Airtable limit)
    const batchSize = 10;
    let updated = 0;

    for (let i = 0; i < allRecords.length; i += batchSize) {
      const batch = allRecords.slice(i, i + batchSize);
      
      const updates = batch.map((record, index) => ({
        id: record.id,
        fields: {
          Position: i + index + 1 // Calculate correct position
        }
      }));

      await base('Waitlist').update(updates);
      updated += updates.length;
      
      console.log(`✅ Updated positions for batch ${Math.floor(i/batchSize) + 1}: records ${i + 1}-${i + updates.length}`);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        message: `Updated ${updated} position numbers`,
        totalRecords: allRecords.length 
      })
    };

  } catch (error) {
    console.error('❌ Position cleanup failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

// To run this cleanup:
// 1. Create the file above
// 2. Deploy to Netlify  
// 3. Run: curl -X POST https://opeari.com/.netlify/functions/fixPositions
// 4. Delete the file after running once