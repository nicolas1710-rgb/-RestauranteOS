'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Users, ShoppingBag, Clock, ChefHat, UtensilsCrossed } from 'lucide-react'

export default function AdminPage() {
    const { profile } = useAuth()
    const supabase = createClient()
    const [stats, setStats] = useState({
        todaySales: 0,
        openOrders: 0,
        totalTables: 0,
        occupiedTables: 0,
        avgPrepTime: 0,
        topItems: [] as { name: string; count: number }[],
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!profile?.restaurant_id) return
        loadStats()

        const channel = supabase
            .channel('admin-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${profile.restaurant_id}` }, loadStats)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [profile?.restaurant_id])

    async function loadStats() {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [salesRes, openRes, tablesRes, occupiedRes, itemsRes] = await Promise.all([
            // Considera ventas los pedidos que ya fueron entregados o cerrados (pagados)
            supabase.from('orders').select('total').eq('restaurant_id', profile!.restaurant_id).gte('created_at', today.toISOString()).in('status', ['delivered', 'closed']),
            supabase.from('orders').select('id', { count: 'exact', head: true }).eq('restaurant_id', profile!.restaurant_id).in('status', ['sent', 'preparing', 'ready']),
            supabase.from('tables').select('id', { count: 'exact', head: true }).eq('restaurant_id', profile!.restaurant_id),
            supabase.from('tables').select('id', { count: 'exact', head: true }).eq('restaurant_id', profile!.restaurant_id).eq('status', 'occupied'),
            // Para poder filtrar por columnas de la tabla foránea, se requiere !inner
            supabase.from('order_items').select('menu_item:menu_items!inner(name, restaurant_id), quantity').eq('menu_items.restaurant_id', profile!.restaurant_id).gte('sent_to_kitchen_at', today.toISOString()).limit(100),
        ])

        const todaySales = salesRes.data?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0

        // Aggregate top items
        const itemMap: Record<string, number> = {}
        itemsRes.data?.forEach((oi: any) => {
            const name = oi.menu_item?.name
            if (name) itemMap[name] = (itemMap[name] ?? 0) + oi.quantity
        })
        const topItems = Object.entries(itemMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))

        setStats({
            todaySales,
            openOrders: openRes.count ?? 0,
            totalTables: tablesRes.count ?? 0,
            occupiedTables: occupiedRes.count ?? 0,
            avgPrepTime: 15,
            topItems,
        })
        setLoading(false)
    }

    const metricsCards = [
        {
            label: 'Ventas hoy',
            value: formatCurrency(stats.todaySales),
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'bg-emerald-50 text-emerald-600',
            accent: 'border-emerald-200',
        },
        {
            label: 'Pedidos activos',
            value: String(stats.openOrders),
            icon: <ShoppingBag className="w-5 h-5" />,
            color: 'bg-orange-50 text-orange-600',
            accent: 'border-orange-200',
        },
        {
            label: 'Mesas ocupadas',
            value: `${stats.occupiedTables} / ${stats.totalTables}`,
            icon: <Users className="w-5 h-5" />,
            color: 'bg-blue-50 text-blue-600',
            accent: 'border-blue-200',
        },
        {
            label: 'Tiempo promedio',
            value: `${stats.avgPrepTime} min`,
            icon: <Clock className="w-5 h-5" />,
            color: 'bg-purple-50 text-purple-600',
            accent: 'border-purple-200',
        },
    ]

    if (loading) return (
        <div className="flex items-center justify-center h-[80vh]">
            <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="px-4 py-4 space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-sm text-gray-500">Resumen del día en tiempo real</p>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3">
                {metricsCards.map(card => (
                    <div key={card.label} className={`card border-2 ${card.accent} p-4`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                            {card.icon}
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Top items */}
            {stats.topItems.length > 0 && (
                <div>
                    <p className="section-title">Top items hoy</p>
                    <div className="card divide-y divide-gray-100">
                        {stats.topItems.map((item, idx) => (
                            <div key={item.name} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                                </div>
                                <span className="badge badge-default">{item.count}x</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick links */}
            <div>
                <p className="section-title">Gestión rápida</p>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { href: '/admin/menu', label: 'Gestionar menú', emoji: '🍽️' },
                        { href: '/admin/tables', label: 'Mesas y áreas', emoji: '🪑' },
                        { href: '/admin/staff', label: 'Staff', emoji: '👤' },
                        { href: '/admin/orders', label: 'Historial', emoji: '📋' },
                    ].map(link => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="card-hover p-4 flex items-center gap-3"
                        >
                            <span className="text-2xl">{link.emoji}</span>
                            <span className="font-semibold text-gray-700 text-sm">{link.label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    )
}
