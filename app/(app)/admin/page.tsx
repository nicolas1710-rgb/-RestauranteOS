'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Users, ShoppingBag, Clock, BarChart2 } from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Cell, LabelList
} from 'recharts'
import Link from 'next/link'
import { AdvancedStatsModal } from '@/components/admin/AdvancedStatsModal'

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#6366f1']

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
        waiterStats: [] as { name: string; ordenes: number }[],
        weeklySales: [] as { date: string; ventas: number }[]
    })
    const [loading, setLoading] = useState(true)
    const [showAdvancedStats, setShowAdvancedStats] = useState(false)

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

        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 6)
        weekAgo.setHours(0, 0, 0, 0)

        const [ordersRes, tablesRes, occupiedRes, itemsRes, weeklySalesRes] = await Promise.all([
            // Hoy orders
            supabase.from('orders').select('id, total, status, waiter:profiles(full_name)').eq('restaurant_id', profile!.restaurant_id).gte('created_at', today.toISOString()),
            // Tables
            supabase.from('tables').select('id', { count: 'exact', head: true }).eq('restaurant_id', profile!.restaurant_id),
            supabase.from('tables').select('id', { count: 'exact', head: true }).eq('restaurant_id', profile!.restaurant_id).eq('status', 'occupied'),
            // Top items
            supabase.from('order_items').select('menu_item:menu_items!inner(name, restaurant_id), quantity').eq('menu_items.restaurant_id', profile!.restaurant_id).gte('sent_to_kitchen_at', today.toISOString()).limit(500),
            // Weekly sales
            supabase.from('orders').select('created_at, total').eq('restaurant_id', profile!.restaurant_id).gte('created_at', weekAgo.toISOString()).in('status', ['delivered', 'closed'])
        ])

        const orders = ordersRes.data || []
        
        // Calcular stats de hoy
        const todaySales = orders
            .filter(o => ['delivered', 'closed'].includes(o.status))
            .reduce((sum, o) => sum + (o.total ?? 0), 0)
            
        const openOrders = orders
            .filter(o => ['sent', 'preparing', 'ready'].includes(o.status)).length

        // Calcular ordenes por mesero
        const waiterMap: Record<string, number> = {}
        orders.forEach((o: any) => {
            const name = o.waiter?.full_name || 'Desconocido'
            waiterMap[name] = (waiterMap[name] || 0) + 1
        })
        const waiterStats = Object.entries(waiterMap)
            .map(([name, ordenes]) => ({ name, ordenes }))
            .sort((a, b) => b.ordenes - a.ordenes)

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

        // Aggregate weekly sales
        const daysMap: Record<string, number> = {}
        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' })
            daysMap[dayStr] = 0
        }
        
        weeklySalesRes.data?.forEach((o: any) => {
            if (!o.created_at) return
            const d = new Date(o.created_at)
            const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' })
            if (daysMap[dayStr] !== undefined) {
                daysMap[dayStr] += (o.total || 0)
            }
        })
        const weeklySales = Object.entries(daysMap).map(([date, ventas]) => ({ date, ventas }))

        setStats({
            todaySales,
            openOrders,
            totalTables: tablesRes.count ?? 0,
            occupiedTables: occupiedRes.count ?? 0,
            avgPrepTime: 15, // TODO: Compute from delivered orders
            topItems,
            waiterStats,
            weeklySales
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
        <div className="px-4 py-4 space-y-6 pb-20">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-sm text-gray-500">Resumen del día en tiempo real y estadísticas completas</p>
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

            {/* Weekly Sales Chart */}
            <div>
                <p className="section-title">Ventas últimos 7 días</p>
                <div className="card p-4 min-h-[300px]">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={stats.weeklySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                            <RechartsTooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom charts grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Top Waiters */}
                <div>
                    <p className="section-title">Órdenes por mesero (Hoy)</p>
                    <div className="card p-4 min-h-[250px]">
                        {stats.waiterStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={stats.waiterStats} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" type="category" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                    <YAxis type="number" tick={{fontSize: 12}} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <RechartsTooltip 
                                        cursor={{fill: 'transparent'}}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="ordenes" name="Órdenes" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                        {stats.waiterStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                        <LabelList dataKey="ordenes" position="top" style={{ fontSize: '12px', fill: '#6b7280', fontWeight: 'bold' }} formatter={(val: number) => `${val} ventas`} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm py-10">No hay datos hoy</div>
                        )}
                    </div>
                </div>

                {/* Top Items Pie Chart */}
                <div>
                    <p className="section-title">Top 5 productos (Hoy)</p>
                    <div className="card p-4 min-h-[250px] flex items-center justify-center">
                        {stats.topItems.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={stats.topItems} margin={{ top: 0, right: 30, left: 10, bottom: 0 }} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                    <XAxis type="number" hide allowDecimals={false} />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        tick={{fontSize: 11}} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        width={110} 
                                        interval={0} 
                                        tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} 
                                    />
                                    <RechartsTooltip 
                                        cursor={{fill: 'transparent'}}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" name="Vendidos" fill="#10b981" radius={[0, 4, 4, 0]}>
                                        {stats.topItems.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                                        ))}
                                        <LabelList dataKey="count" position="right" style={{ fontSize: '12px', fill: '#6b7280', fontWeight: 'bold' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm py-10">No hay datos hoy</div>
                        )}
                    </div>
                </div>

            </div>

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
                        <Link
                            key={link.href}
                            href={link.href}
                            className="card-hover p-4 flex items-center gap-3"
                        >
                            <span className="text-2xl">{link.emoji}</span>
                            <span className="font-semibold text-gray-700 text-sm">{link.label}</span>
                        </Link>
                    ))}
                    {/* Estadísticas Avanzadas */}
                    <button
                        id="btn-advanced-stats"
                        onClick={() => setShowAdvancedStats(true)}
                        className="card-hover p-4 flex items-center gap-3 text-left w-full border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50"
                    >
                        <span className="text-2xl">📊</span>
                        <div>
                            <span className="font-semibold text-orange-700 text-sm block">Estadísticas Avanzadas</span>
                            <span className="text-xs text-orange-400">6 KPIs de alto impacto</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Advanced Stats Modal */}
            {showAdvancedStats && profile?.restaurant_id && (
                <AdvancedStatsModal
                    restaurantId={profile.restaurant_id}
                    onClose={() => setShowAdvancedStats(false)}
                />
            )}
        </div>
    )
}
