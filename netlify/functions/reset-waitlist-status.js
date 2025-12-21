
const { createClient } = require('@supabase/supabase-js')

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

    if (!supabaseUrl || !supabaseServiceKey) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configuration Error' }) }
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const { id } = JSON.parse(event.body)

        if (!id) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing ID' }) }
        }

        // 4. Update Database
        const { data, error } = await supabase
            .from('waitlist_entries')
            .update({
                status: 'pending',
                invited_at: null // Clear invited timestamp
            })
            .eq('id', id)
            .select()

        if (error) throw error

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ ok: true, data })
        }

    } catch (err) {
        console.error('Reset Error:', err)
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        }
    }
}
