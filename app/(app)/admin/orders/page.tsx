'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency, formatTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import type { Order, Table } from '@/types/database'
import { User } from 'lucide-react'

type OrderWithDetails = Order & { table: Table, waiter: { full_name: string | null } }

export default function AdminOrdersPage() {
    const { profile } = useAuth()
    const supabase = createClient()
    const [orders, setOrders] = useState<OrderWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'today' | 'week'>('today')

    useEffect(() => { if (profile?.restaurant_id) load() }, [profile?.restaurant_id, filter])

    async function load() {
        const from = new Date()
        if (filter === 'week') from.setDate(from.getDate() - 7)
        else from.setHours(0, 0, 0, 0)

        const { data } = await supabase
            .from('orders')
            .select('*, table:tables(*), waiter:profiles(full_name)')
            .eq('restaurant_id', profile!.restaurant_id)
            .gte('created_at', from.toISOString())
            .order('created_at', { ascending: false })
        setOrders((data as OrderWithDetails[]) ?? [])
        setLoading(false)
    }

    const totalRevenue = orders
        .filter(o => ['delivered', 'closed'].includes(o.status) || o.payment_status === 'paid')
        .reduce((sum, o) => sum + o.total, 0)

    return (
        <div className="px-4 py-4 space-y-4">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Historial de pedidos</h2>
                <p className="text-sm text-gray-500">{orders.length} pedidos · {formatCurrency(totalRevenue)} vendido</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                {(['today', 'week'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        {f === 'today' ? 'Hoy' : 'Última semana'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-3xl mb-2">📋</p>
                    <p>No hay pedidos en este período</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {orders.map(order => (
                        <div key={order.id} className="card p-4 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                    <span className="font-bold text-gray-900">{order.order_number}</span>
                                    <div className="h-3 w-[1px] bg-gray-200" />
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="font-medium">Mesa {order.table?.number}</span>
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                            <User className="w-3 h-3 text-gray-400" />
                                            <span className="font-semibold text-gray-600">{order.waiter?.full_name || 'Sin asignar'}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] uppercase font-black text-gray-300 tracking-wider flex items-center gap-1.5 ml-0.5">
                                    <span className="text-[8px]">🕒</span> {formatTime(order.created_at)}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                                <span className={`badge text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                                    {ORDER_STATUS_LABELS[order.status]}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
