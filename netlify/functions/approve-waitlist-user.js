
const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')

exports.handler = async (event) => {
    // 1. Headers & Method Check
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    }

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' }
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method not allowed' }
    }

    // 2. Security Check (Admin Secret)
    const secret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    if (secret !== process.env.NETLIFY_ADMIN_SECRET) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    // 3. Env Check
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const resendApiKey = process.env.RESEND_API_KEY
    const siteUrl = process.env.URL || 'https://opeari.com'

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
        console.error('Missing Env Vars')
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configuration Error' }) }
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const resend = new Resend(resendApiKey)

        // 4. Parse Body
        const { id, email, firstName } = JSON.parse(event.body)

        if (!id || !email) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing ID or Email' }) }
        }

        // 5. Generate Invite Link (Supabase Auth)
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'invite',
            email: email,
            options: {
                redirectTo: `${siteUrl}/onboarding`
            }
        })

        if (linkError) {
            console.error('Generate Link Error:', linkError)
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to generate invite link' }) }
        }

        const inviteLink = linkData.properties.action_link
        console.log('Generated Invite Link:', inviteLink)

        // 6. Update Database (waitlist)
        const { data, error } = await supabase
            .from('waitlist_entries')
            .update({
                status: 'approved',
                invited_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()

        if (error) throw error

        // 7. Send Email (Resend)
        try {
            const { data: emailData, error: emailError } = await resend.emails.send({
                from: 'Opeari <breada@opeari.com>',
                to: [email],
                subject: 'You\'re in! 🎉 Welcome to Opeari',
                html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a4731;">
                    <h1 style="color: #4A7A4A;">You're in! 🎉</h1>
                    <p>Hi ${firstName || 'Neighbor'},</p>
                    <p>We are thrilled to welcome you to Opeari. Changing the way we find childcare starts with you.</p>
                    <p>You can now create your account and start building your village.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${inviteLink}" 
                           style="background-color: #4A7A4A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                           Create My Account
                        </a>
                    </div>
                    <p style="text-align: center; font-size: 12px; color: #888;">
                        (Link expires in 24 hours)
                    </p>
                    <p style="font-size: 14px; color: #666; margin-top: 40px;">
                        Welcome to the village,<br/>
                        The Opeari Team
                    </p>
                </div>
                `
            });

            if (emailError) {
                console.error('Resend Error:', emailError)
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ ok: true, data, emailSent: false, emailError })
                }
            }

            console.log('Invite Email sent to:', email)
        } catch (mailErr) {
            console.error('Email Exception:', mailErr)
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ ok: true, data, emailSent: true })
        }

    } catch (err) {
        console.error('Admin Approve Error:', err)
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        }
    }
}
