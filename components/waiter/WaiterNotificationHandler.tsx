'use client'

import { useEffect, useRef } from 'react'
import { useOrders } from '@/lib/hooks/useOrders'
import { useAuth } from '@/lib/hooks/useAuth'
import { playNotificationSound } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function WaiterNotificationHandler() {
    const { profile } = useAuth()
    const { orders } = useOrders(profile?.restaurant_id)
    const prevReadyIdsRef = useRef<Set<string>>(new Set())
    const initialSyncRef = useRef(false)

    useEffect(() => {
        if (!orders) return

        const currentReadyOrders = orders.filter(o => o.status === 'ready')
        const currentReadyIds = new Set(currentReadyOrders.map(o => o.id))

        // On first load, just snapshot without alerting
        if (!initialSyncRef.current) {
            prevReadyIdsRef.current = currentReadyIds
            initialSyncRef.current = true
            return
        }

        // Find orders that are NEWLY ready
        const newlyReady = currentReadyOrders.filter(o => !prevReadyIdsRef.current.has(o.id))

        newlyReady.forEach(order => {
            const tableNum = (order.table as any)?.number ?? '?'

            toast.success(
                (t) => (
                    <div onClick={() => toast.dismiss(t.id)} className="cursor-pointer">
                        <p className="font-bold text-sm">🔔 ¡Pedido Listo para entregar!</p>
                        <p className="text-xs text-gray-600 mt-0.5">Mesa {tableNum} — {order.order_number}</p>
                        <p className="text-xs text-orange-500 mt-1 font-medium">Toca para cerrar</p>
                    </div>
                ),
                {
                    duration: 8000,
                    style: {
                        borderRadius: '14px',
                        background: '#fff',
                        color: '#1a1a1a',
                        border: '2px solid #f97316',
                        boxShadow: '0 8px 30px rgba(249, 115, 22, 0.2)',
                        padding: '12px 16px',
                    },
                    icon: '🍽️',
                }
            )
            playNotificationSound()
        })

        prevReadyIdsRef.current = currentReadyIds
    }, [orders])

    return null
}
