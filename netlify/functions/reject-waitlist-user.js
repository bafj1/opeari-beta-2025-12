
import { createClient } from '@supabase/supabase-js'

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' }
    }

    // Security Check
    const secret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    if (secret !== process.env.NETLIFY_ADMIN_SECRET) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Configuration Error' }) }
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const { id } = JSON.parse(event.body)

        if (!id) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing ID' }) }
        }

        const { data, error } = await supabase
            .from('waitlist_entries')
            .update({ status: 'rejected' })
            .eq('id', id)
            .select()

        if (error) throw error

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true, data })
        }
    } catch (err) {
        console.error('Admin Reject Error:', err)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        }
    }
}
