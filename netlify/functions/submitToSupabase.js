import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Generate referral code from first name + random string
    const referralCode = `${data.firstName?.toLowerCase() || 'user'}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Insert into waitlist table (matching actual schema)
    const { data: insertedData, error } = await supabase
      .from('waitlist')
      .insert([
        {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          zip_code: data.zipCode,
          user_type: data.role || 'both',           // role → user_type
          urgency: data.timeline,                    // timeline → urgency
          heard_from: data.referralSource,           // how did you hear
          referral_source: data.referralSource,      // keep both for compatibility
          referred_by: data.referredBy || null,
          referral_name: data.referredBy || null,    // also store in referral_name
          linkedin_url: data.linkedin || null,
          why_join: data.whyJoin || null,
          referral_code: referralCode,
          approved: false,
          invite_sent: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      // Check for duplicate email
      if (error.code === '23505') {
        return {
          statusCode: 409,
          body: JSON.stringify({ error: 'Email already registered' }),
        };
      }
      
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    // Return success with position and referral code
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        position: insertedData.position || 1,
        referralCode: referralCode,
        message: 'Successfully joined the waitlist!',
      }),
    };

  } catch (err) {
    console.error('Handler error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}