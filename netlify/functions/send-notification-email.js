import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method not allowed' };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!resendApiKey || !supabaseUrl || !supabaseServiceKey) {
        console.error('Missing env vars');
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configuration error' }) };
    }

    try {
        const { recipientId, type, senderName, senderFirstName, messagePreview } = JSON.parse(event.body);

        if (!recipientId || !type) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing recipientId or type' }) };
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const resend = new Resend(resendApiKey);

        // 1. Fetch recipient's email and notification preferences
        const { data: recipient, error: recipientError } = await supabase
            .from('members')
            .select('email, first_name, notification_prefs')
            .eq('id', recipientId)
            .single();

        if (recipientError || !recipient) {
            console.error('Recipient not found:', recipientError);
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Recipient not found' }) };
        }

        // 2. Check notification preferences — respect user's email settings
        const emailPrefs = recipient.notification_prefs?.email || {};

        // Map notification types to preference keys
        const prefMap = {
            'connection_request': 'connection_alerts',
            'connection_accepted': 'connection_alerts',
            'message': 'connection_alerts',  // messages fall under connection alerts
        };

        const prefKey = prefMap[type];
        if (prefKey && emailPrefs[prefKey] === false) {
            console.log(`User ${recipientId} has ${prefKey} emails disabled. Skipping.`);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true, skipped: true, reason: 'preference_disabled' }) };
        }

        // 3. Get recipient email from auth (members table may not have it)
        const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(recipientId);
        const recipientEmail = authUser?.email || recipient.email;

        if (!recipientEmail) {
            console.error('No email found for recipient');
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'No email for recipient' }) };
        }

        // 4. Build email content based on type
        const siteUrl = process.env.URL || 'https://opeari.com';
        const recipientName = recipient.first_name || 'there';
        let subject, heading, body, ctaText, ctaUrl;

        switch (type) {
            case 'connection_request':
                subject = `${senderName || 'Someone'} wants to connect on Opeari`;
                heading = 'New Connection Request';
                body = `<p style="color: #333; font-size: 16px; line-height: 1.6;">${senderName || 'A family'} would like to connect with you on Opeari. Check out their profile and decide if you'd like to welcome them into your village.</p>`;
                ctaText = 'View Request';
                ctaUrl = `${siteUrl}/village`;
                break;

            case 'connection_accepted':
                subject = `${senderName || 'Someone'} accepted your connection on Opeari`;
                heading = 'Connection Accepted';
                body = `<p style="color: #333; font-size: 16px; line-height: 1.6;">Great news! ${senderName || 'A family'} accepted your connection request. You can now view their full profile and start messaging.</p>`;
                ctaText = 'Start a Conversation';
                ctaUrl = `${siteUrl}/messages`;
                break;

            case 'message':
                subject = `New message from ${senderFirstName || 'someone'} on Opeari`;
                heading = 'New Message';
                body = `<p style="color: #333; font-size: 16px; line-height: 1.6;">${senderFirstName || 'Someone'} sent you a message on Opeari.</p>
                ${messagePreview ? `<div style="background: #f8fdf8; border-left: 4px solid #8bd7c7; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0;"><p style="color: #555; font-size: 14px; margin: 0; font-style: italic;">"${messagePreview.substring(0, 150)}${messagePreview.length > 150 ? '...' : ''}"</p></div>` : ''}`;
                ctaText = 'Read Message';
                ctaUrl = `${siteUrl}/messages`;
                break;

            default:
                subject = 'New notification on Opeari';
                heading = 'New Notification';
                body = `<p style="color: #333; font-size: 16px; line-height: 1.6;">You have a new notification on Opeari.</p>`;
                ctaText = 'View on Opeari';
                ctaUrl = `${siteUrl}/village`;
        }

        // 5. Send email
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Opeari <breada@opeari.com>',
            to: recipientEmail,
            subject,
            html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1E6B4E 0%, #3ca370 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 700;">${heading}</h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
            <p style="color: #1E6B4E; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Hey ${recipientName},</p>
            ${body}

            <!-- CTA -->
            <div style="text-align: center; margin: 32px 0;">
                <a href="${ctaUrl}" style="background: #1E6B4E; color: white; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                    ${ctaText}
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #f0faf4; padding: 24px; text-align: center; border-top: 1px solid #e1f0e5;">
            <p style="color: #1E6B4E; font-weight: 600; margin: 0; font-size: 14px;">The Opeari Team</p>
            <p style="color: #999; font-size: 12px; margin: 12px 0 0;">
                You're receiving this because you have email notifications enabled. 
                <a href="${siteUrl}/settings?tab=notifications" style="color: #1E6B4E;">Manage preferences</a>
            </p>
        </div>
    </div>
</div>
            `
        });

        if (emailError) {
            console.error('Resend error:', emailError);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true, emailSent: false, error: emailError }) };
        }

        console.log(`Notification email sent to ${recipientEmail} (type: ${type})`);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, emailSent: true }) };

    } catch (err) {
        console.error('Notification email error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
