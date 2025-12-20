// netlify/functions/send-connection-email.js
// Sends email when someone sends a connection request

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Email service not configured' }) };
  }

  try {
    const { recipientEmail, recipientName, senderName } = JSON.parse(event.body || '{}');

    if (!recipientEmail || !senderName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    console.log('📧 Sending connection email to:', recipientEmail);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Opeari <breada@opeari.com>',
        to: recipientEmail,
        subject: `💌 ${senderName}'s family wants to connect!`,
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e6b4e 0%, #2a8f6a 100%); padding: 40px 24px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">New Connection Request!</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">Someone wants to join your village</p>
            </div>
            
            <div style="padding: 32px 24px; background: #FFF8F0;">
              <h2 style="color: #1e6b4e; margin-top: 0;">Hi${recipientName ? ` ${recipientName}` : ''}! 👋</h2>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Great news! <strong>${senderName}'s family</strong> wants to connect with you on Opeari.
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Log in to see their profile and decide if you'd like to connect.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://opeari.com/matches" 
                   style="background: #1e6b4e; color: white; padding: 16px 40px; 
                          text-decoration: none; border-radius: 50px; font-weight: bold;
                          display: inline-block; font-size: 16px;">
                  View Request →
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
                Building your village, one connection at a time. 🏡
              </p>
            </div>
            
            <div style="padding: 20px 24px; background: #E8F5E9; text-align: center; border-radius: 0 0 16px 16px;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Opeari · 
                <a href="https://opeari.com" style="color: #1e6b4e;">opeari.com</a>
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Resend error:', error);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send email' }) };
    }

    const data = await response.json();
    console.log('✅ Email sent successfully:', data.id);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, id: data.id }),
    };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};