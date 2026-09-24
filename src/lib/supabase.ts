import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
  console.warn(
    '[Gorjeta Mira] NEXT_PUBLIC_SUPABASE_URL não está configurada. ' +
    'Configure o ficheiro .env.local com as credenciais do Supabase.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
