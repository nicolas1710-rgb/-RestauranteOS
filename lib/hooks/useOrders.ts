'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import type { Order, OrderItem, MenuItem } from '@/types/database'

import { MOCK_ORDERS } from '@/lib/mockData'

export type OrderWithItems = Order & {
    table: any
    order_items: (OrderItem & { menu_item: MenuItem })[]
}

export function useOrders(restaurantId?: string) {
    const supabase = createClient()
    const [orders, setOrders] = useState<OrderWithItems[]>([])
    const [loading, setLoading] = useState(true)

    const fetchOrders = async () => {
        if (!restaurantId) return
        const { data } = await supabase
            .from('orders')
            .select(`*, table:tables(*), order_items(*, menu_item:menu_items(*))`)
            .eq('restaurant_id', restaurantId)
            .in('status', ['open', 'sent', 'preparing', 'ready', 'delivered'])
            .order('created_at', { ascending: false })

        setOrders((data as OrderWithItems[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        if (!restaurantId) return

        // Mock mode detection
        const isMockMoke = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
        
        if (isMockMoke) {
            setOrders(MOCK_ORDERS as any)
            setLoading(false)
            
            // Channel for cross-tab sync in mock mode
            const channel = new BroadcastChannel(`mock-orders-${restaurantId}`)
            channel.onmessage = (event) => {
                const { type, payload } = event.data
                if (type === 'UPDATE_ORDER_STATUS') {
                    setOrders(prev => prev.map(o => 
                        o.id === payload.orderId ? { ...o, status: payload.status, ...payload.extra } : o
                    ))
                } else if (type === 'UPDATE_ITEM_STATUS') {
                    setOrders(prev => prev.map(order => ({
                        ...order,
                        order_items: order.order_items.map(item => 
                            item.id === payload.itemId ? { ...item, status: payload.status, ready_at: payload.ready_at } : item
                        )
                    })))
                } else if (type === 'DELIVER_ORDER') {
                    setOrders(prev => prev.filter(o => o.id !== payload.orderId))
                }
            }
            return () => channel.close()
        }

        fetchOrders()

        const channelId = `orders-${restaurantId}-${Math.random().toString(36).substring(7)}`
        const channel = supabase
            .channel(channelId)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `restaurant_id=eq.${restaurantId}`,
            }, () => fetchOrders())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'order_items',
            }, () => fetchOrders())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [restaurantId])

    async function updateOrderStatus(orderId: string, status: Order['status'], extra?: Partial<Order>) {
        // Optimistic update
        setOrders(prev => prev.map(o => 
            o.id === orderId ? { ...o, status, ...extra } : o
        ))

        if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
            const channel = new BroadcastChannel(`mock-orders-${restaurantId}`)
            channel.postMessage({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status, extra } })
            channel.close()
            return
        }

        await supabase.from('orders').update({ status, ...extra }).eq('id', orderId)
    }

    async function updateItemStatus(itemId: string, status: OrderItem['status']) {
        const ready_at = status === 'ready' ? new Date().toISOString() : null
        
        // Optimistic update
        setOrders(prev => prev.map(order => ({
            ...order,
            order_items: order.order_items.map(item => 
                item.id === itemId ? { ...item, status, ready_at } : item
            )
        })))

        if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
            const channel = new BroadcastChannel(`mock-orders-${restaurantId}`)
            channel.postMessage({ type: 'UPDATE_ITEM_STATUS', payload: { itemId, status, ready_at } })
            channel.close()
            return
        }

        await supabase.from('order_items').update({ status, ready_at }).eq('id', itemId)
    }

    async function deliverOrder(orderId: string, tableId: string) {
        // Optimistic: mark order as delivered (removes it from active views)
        setOrders(prev => prev.filter(o => o.id !== orderId))

        if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
            const channel = new BroadcastChannel(`mock-orders-${restaurantId}`)
            channel.postMessage({ type: 'DELIVER_ORDER', payload: { orderId, tableId } })
            channel.close()
            return
        }

        // Update order status and free the table in parallel
        await Promise.all([
            supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId),
            supabase.from('tables').update({ status: 'available' }).eq('id', tableId),
        ])
    }

    return { orders, loading, updateOrderStatus, updateItemStatus, deliverOrder, refetch: fetchOrders }
}
