import { createClient } from '@supabase/supabase-js'

export async function handler(event) {
    if (event.httpMethod !== 'GET') {
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
            console.error('Missing Supabase Env Vars')
            return { statusCode: 500, body: JSON.stringify({ error: 'Configuration Error' }) }
        }

        // Log Hostname for Data Consistency Verification
        try {
            console.log('Connecting to Supabase Host:', new URL(supabaseUrl).hostname)
        } catch (e) {
            console.warn('Could not parse Supabase URL for logging')
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data, error } = await supabase
            .from('waitlist')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        }
    } catch (err) {
        console.error('Admin Fetch Error:', err)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        }
    }
}
