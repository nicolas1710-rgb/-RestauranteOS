'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatElapsed, formatCurrency, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { Clock, CheckCircle2, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Order, Table } from '@/types/database'

type OrderWithTable = Order & { table: Table }

export default function WaiterOrdersPage() {
    const { profile } = useAuth()
    const supabase = createClient()
    const [orders, setOrders] = useState<OrderWithTable[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!profile) return
        fetchOrders()

        const channel = supabase
            .channel('waiter-my-orders')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `waiter_id=eq.${profile.id}`,
            }, fetchOrders)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [profile?.id])

    async function fetchOrders() {
        const { data } = await supabase
            .from('orders')
            .select('*, table:tables(*)')
            .eq('waiter_id', profile!.id)
            .in('status', ['sent', 'preparing', 'ready', 'delivered'])
            .order('created_at', { ascending: false })

        setOrders((data as OrderWithTable[]) ?? [])
        setLoading(false)
    }

    async function markDelivered(orderId: string) {
        await supabase
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', orderId)
        toast.success('Pedido marcado como entregado')
        fetchOrders()
    }

    async function markPaid(orderId: string, tableId: string) {
        await supabase
            .from('orders')
            .update({ status: 'closed', payment_status: 'paid', closed_at: new Date().toISOString() })
            .eq('id', orderId)

        await supabase
            .from('tables')
            .update({ status: 'available' })
            .eq('id', tableId)

        toast.success('¡Pago confirmado! Mesa liberada ✅')
        fetchOrders()
    }

    if (loading) return (
        <div className="flex items-center justify-center h-[80vh]">
            <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="px-4 py-4">
            <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-900">Mis pedidos activos</h2>
                <p className="text-sm text-gray-500">{orders.length} pedidos en curso</p>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No tienes pedidos activos</p>
                    <p className="text-sm">Los pedidos que envíes a cocina aparecerán aquí</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map(order => {
                        const isReady = order.status === 'ready'
                        const isDelivered = order.status === 'delivered'

                        return (
                            <div
                                key={order.id}
                                className={`card p-4 border-2 ${isReady ? 'border-amber-300 bg-amber-50/50 shadow-amber-100' :
                                        isDelivered ? 'border-gray-200' :
                                            'border-transparent'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900">Mesa {order.table?.number}</span>
                                            <span className="text-sm text-gray-400">{order.order_number}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Clock className="w-3 h-3" />
                                            {formatElapsed(order.created_at)}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className={`badge ${ORDER_STATUS_COLORS[order.status]}`}>
                                            {isReady && <span className="animate-pulse">🔔</span>}
                                            {ORDER_STATUS_LABELS[order.status]}
                                        </span>
                                        <span className="font-bold text-gray-900 text-sm">{formatCurrency(order.total)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-3">
                                    {isReady && (
                                        <button
                                            onClick={() => markDelivered(order.id)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white font-semibold py-2.5 rounded-xl hover:bg-amber-600 transition-colors"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Marcar entregado
                                        </button>
                                    )}

                                    {isDelivered && (
                                        <button
                                            onClick={() => markPaid(order.id, order.table_id)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-600 transition-colors"
                                        >
                                            💳 Confirmar pago
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
