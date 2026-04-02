import { createBrowserClient } from '@supabase/ssr'
import { createMockSupabaseClient } from './mockClient'

export function createClient() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
        return createMockSupabaseClient()
    }

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
