
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


        // 4. Get Email from Waitlist Entry first
        const { data: entry, error: fetchError } = await supabase
            .from('waitlist')
            .select('email')
            .eq('id', id)
            .single()

        if (fetchError || !entry) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Entry not found' }) }
        }

        console.log('Resetting user:', entry.email)

        // 5. Attempt to Find & Delete Auth User (Hard Reset)
        // Note: listUsers is not efficient for huge userbases, but fine for beta/admin.
        // We need to find the user ID to delete them.
        try {
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

            if (!listError && users) {
                const userToDelete = users.find(u => u.email?.toLowerCase() === entry.email.toLowerCase())

                if (userToDelete) {
                    console.log('Found Auth User via Email:', userToDelete.id)
                    const { error: deleteError } = await supabase.auth.admin.deleteUser(userToDelete.id)
                    if (deleteError) {
                        console.error('Failed to delete auth user:', deleteError)
                    } else {
                        console.log('Auth User Deleted successfully.')
                    }
                } else {
                    console.log('No matching Auth User found to delete.')
                }
            }
        } catch (authErr) {
            console.error('Auth cleanup failed (continuing reset):', authErr)
        }

        // 6. Update Database Status (Reset to Pending)
        const { data, error } = await supabase
            .from('waitlist')
            .update({
                status: 'pending',
                invited_at: null,
                approved_at: null,    // Also clear approval time
                converted_at: null    // And conversion time if it exists
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
