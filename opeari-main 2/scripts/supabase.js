import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rvostbkbbddbgcnxqchv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2b3N0YmtiYmRkYmdjbnhxY2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzcwMjAsImV4cCI6MjA4MDQ1MzAyMH0.k8LLGt_nCsFO9xINa-80Y49NSPSxryYxCoACwk97E_w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
