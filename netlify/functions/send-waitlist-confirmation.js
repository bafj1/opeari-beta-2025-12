
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
};

export const handler = async (event) => {
    // 1. Handle OPTIONS (Preflight)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: 'Method not allowed'
        };
    }

    try {
        const { email, firstName } = JSON.parse(event.body);

        if (!email) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ ok: false, error: 'Email is required' })
            };
        }

        const results = {};
        // Using breada@opeari.com as the single verbalized active email
        const SENDER_EMAIL = 'Opeari <breada@opeari.com>';
        const ADMIN_EMAIL = 'breada@opeari.com';

        // 2. Send User Confirmation
        try {
            const userEmail = await resend.emails.send({
                from: SENDER_EMAIL,
                to: email,
                subject: "You're on the list! 🍐",
                html: `
            <div style="font-family: 'Comfortaa', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e6b4e;">
              <h2 style="color: #1e6b4e;">Welcome to the neighborhood!</h2>
              <p>Hi ${firstName || 'Neighbor'},</p>
              <p>Thanks for joining the Opeari waitlist. We've saved your spot.</p>
              <p>We're launching neighborhood by neighborhood, so we'll be in touch as soon as we're ready for you.</p>
              <br>
              <p>Warmly,</p>
              <p>The Opeari Team</p>
            </div>
          `
            });
            results.userEmail = userEmail;
        } catch (e) {
            console.error('Failed to send user email:', e);
            results.userEmailError = e.message;
        }

        // 3. Send Admin Notification
        try {
            const adminEmail = await resend.emails.send({
                from: SENDER_EMAIL,
                to: ADMIN_EMAIL,
                subject: `🍐 New Waitlist: ${firstName} (${email})`,
                html: `
            <p><strong>New Sign-up:</strong></p>
            <ul>
              <li>Name: ${firstName}</li>
              <li>Email: ${email}</li>
            </ul>
            <p><a href="https://supabase.com/dashboard/project/rvostbkbbddbgcnxqchv/editor/28596">View in Supabase</a></p>
          `
            });
            results.adminEmail = adminEmail;
        } catch (e) {
            console.error('Failed to send admin email:', e);
            results.adminEmailError = e.message;
        }

        // 4. Return Success
        const anySuccess = results.userEmail?.data || results.adminEmail?.data;
        const errors = [results.userEmailError, results.adminEmailError].filter(Boolean);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ok: !!anySuccess,
                message: anySuccess ? 'Emails processed' : 'Failed to send emails',
                errors: errors.length > 0 ? errors : undefined
            })
        };

    } catch (err) {
        console.error('Function Error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                ok: false,
                error: err.message
            })
        };
    }
};
