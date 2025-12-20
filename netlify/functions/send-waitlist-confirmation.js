import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const { email, firstName } = JSON.parse(event.body);

        if (!email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ ok: false, error: 'Email is required' })
            };
        }

        const { data, error } = await resend.emails.send({
            from: 'Opeari <noreply@send.opeari.com>',
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

        if (error) {
            console.error('Resend Error:', error);
            return {
                statusCode: 200, // Do not block signup
                body: JSON.stringify({
                    ok: true,
                    emailSent: false,
                    error: error.message || error.name
                })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                ok: true,
                emailSent: true,
                messageId: data.id
            })
        };

    } catch (err) {
        console.error('Function Error:', err);
        return {
            statusCode: 200, // Do not block signup
            body: JSON.stringify({
                ok: true,
                emailSent: false,
                error: err.message
            })
        };
    }
};
