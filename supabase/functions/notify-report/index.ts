import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
    try {
        const { reason, description, reporterName, itemType } = await req.json()

        await resend.emails.send({
            from: 'Opeari <notifications@opeari.com>',
            to: 'breada@opeari.com',
            subject: `🚨 New Content Report: ${reason}`,
            html: `
        <h2>New Content Report</h2>
        <p><strong>Type:</strong> ${itemType}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Reporter:</strong> ${reporterName}</p>
        ${description ? `<p><strong>Details:</strong> ${description}</p>` : ''}
        <p><a href="https://supabase.com/dashboard/project/YOUR_PROJECT/editor">Review in Supabase</a></p>
      `
        })

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
