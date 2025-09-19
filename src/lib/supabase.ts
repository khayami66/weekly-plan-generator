import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// Client-side Supabase client with types
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Re-export database types for convenience
export type { Database } from '@/types/database.types'