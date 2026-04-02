'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TableWithArea } from '@/types/database'

export function useTables(restaurantId?: string) {
    const supabase = createClient()
    const [tables, setTables] = useState<TableWithArea[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTables = async () => {
        if (!restaurantId) return
        const { data } = await supabase
            .from('tables')
            .select('*, area:areas(*)')
            .eq('restaurant_id', restaurantId)
            .order('number')

        setTables((data as TableWithArea[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        if (!restaurantId) return

        // Mock mode detection
        if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
            setLoading(false)
            return
        }

        fetchTables()

        const channel = supabase
            .channel(`tables-${restaurantId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tables',
                filter: `restaurant_id=eq.${restaurantId}`,
            }, () => fetchTables())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'areas',
                filter: `restaurant_id=eq.${restaurantId}`,
            }, () => fetchTables())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [restaurantId])

    return { tables, loading, refetch: fetchTables }
}
