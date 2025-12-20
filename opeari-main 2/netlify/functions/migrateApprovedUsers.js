const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async (event) => {
  try {
    // Find all approved users not yet in Members table
    const waitlistRecords = await base('waitlist').select({
      filterByFormula: `AND({Status} = "Approved", {Migrated} != "Yes")`
    }).all();

    console.log(`Found ${waitlistRecords.length} users to migrate`);

    for (const record of waitlistRecords) {
      const fields = record.fields;
      
      // Create in Members table
      await base('Members').create([{
        fields: {
          FirstName: fields["First Name"],
          LastName: fields["Last Name"], 
          Email: fields.Email,
          Status: "Approved",
          AccountVerified: false,
          CreatedAt: new Date().toISOString(),
          WaitlistPosition: fields.Position,
          Role: fields.Role,
          ResendCount: 0
        }
      }]);

      // Mark as migrated in waitlist
      await base('waitlist').update(record.id, {
        "Migrated": "Yes",
        "Migration Date": new Date().toISOString()
      });

      console.log(`✅ Migrated: ${fields.Email}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        migrated: waitlistRecords.length 
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
