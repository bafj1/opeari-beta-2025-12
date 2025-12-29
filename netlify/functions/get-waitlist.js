
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
    // 1. Headers & Method Check
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    }

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' }
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: 'Method not allowed' }
    }

    // 2. Security Check (Admin Secret)
    const secret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    if (secret !== process.env.NETLIFY_ADMIN_SECRET) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase Env Vars')
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configuration Error' }) }
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data, error } = await supabase
            .from('waitlist')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        }
    } catch (err) {
        console.error('Admin Fetch Error:', err)
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        }
    }
}
