
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { email } = JSON.parse(event.body);

        if (!email) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email required' }) };
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: user, error: fetchError } = await supabase
            .from('waitlist_entries')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .eq('status', 'approved')
            .single();

        if (fetchError || !user) {
            return { statusCode: 200, headers, body: JSON.stringify({ success: false, reason: 'not_found' }) };
        }

        const siteUrl = process.env.URL || 'https://opeari.com';

        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'invite',
            email: email,
            options: { redirectTo: `${siteUrl}/onboarding` }
        });

        if (linkError) throw linkError;

        const resend = new Resend(process.env.RESEND_API_KEY);
        const inviteLink = linkData?.properties?.action_link;
        const firstName = user.first_name || 'there';

        await resend.emails.send({
            from: 'Opeari <breada@opeari.com>',
            to: email,
            subject: "Your new Opeari invite link 🔗",
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #2D5A3D 0%, #4A7C59 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px;">🔗</div>
              <h1 style="color: white; font-size: 28px; margin: 16px 0;">Fresh Link, Coming Right Up!</h1>
            </div>
            <div style="padding: 40px;">
              <p style="font-size: 18px; color: #333;">Hey ${firstName},</p>
              <p style="color: #555; line-height: 1.6;">You requested a new invite link — here it is! Click below to set up your Opeari account.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" style="background: #4A7C59; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Create My Account</a>
              </div>
              <p style="color: #888; font-size: 14px; text-align: center;">This link expires in 24 hours.</p>
            </div>
            <div style="background: #f0f7f0; padding: 24px; text-align: center;">
              <p style="color: #2D5A3D; font-weight: 600; margin: 0;">🍐 Welcome to the village!</p>
              <p style="color: #666; font-size: 14px; margin: 8px 0 0 0;">The Opeari Team</p>
            </div>
          </div>
        </div>
      `
        });

        console.log('New invite link sent to:', email);

        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

    } catch (error) {
        console.error('Request new link error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send link' }) };
    }
};
