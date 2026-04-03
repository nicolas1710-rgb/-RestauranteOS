'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useOrders } from '@/lib/hooks/useOrders'
import { getElapsedMinutes, formatElapsed } from '@/lib/utils'
import { Flame, CheckCircle2, Clock, ChefHat, Info, LogOut, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Order, OrderItem, MenuItem, Table } from '@/types/database'

type FullOrder = Order & {
    table: Table
    order_items: (OrderItem & { menu_item: MenuItem })[]
}

const IS_DEMO_MODE =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === ''

// Ticket styling by status
const ticketStyles: Record<string, string> = {
    sent: 'bg-gray-800 border-l-4 border-l-orange-500 border border-gray-700 shadow-md',
    preparing: 'bg-amber-950/40 border-l-4 border-l-amber-400 border border-amber-700/30',
    ready: 'bg-emerald-950/40 border-l-4 border-l-emerald-500 border border-emerald-700/30 opacity-80',
}

export default function KitchenPage() {
    const router = useRouter()
    const { profile, signOut } = useAuth()
    const { orders: allOrders, loading, updateOrderStatus, updateItemStatus, deliverOrder } = useOrders(profile?.restaurant_id)
    const prevCountRef = useRef(0)

    // Filter only relevant active orders for kitchen
    const activeOrders = (allOrders as FullOrder[]).filter(o => 
        ['sent', 'preparing', 'ready'].includes(o.status)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    useEffect(() => {
        if (activeOrders.length > prevCountRef.current && prevCountRef.current > 0) {
            playAlert()
        }
        prevCountRef.current = activeOrders.length
    }, [activeOrders.length])

    function playAlert() {
        try {
            const ctx = new AudioContext()
            const oscillator = ctx.createOscillator()
            const gain = ctx.createGain()
            oscillator.connect(gain)
            gain.connect(ctx.destination)
            oscillator.frequency.setValueAtTime(880, ctx.currentTime)
            oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
            oscillator.start(ctx.currentTime)
            oscillator.stop(ctx.currentTime + 0.4)
        } catch { }
    }

    async function takeOrder(orderId: string) {
        toast.success('Orden tomada')
        await updateOrderStatus(orderId, 'preparing')
    }

    async function markReady(orderId: string) {
        toast.success('¡Orden lista! Notificando al mesero...')
        await updateOrderStatus(orderId, 'ready')
    }

    async function markDelivered(orderId: string, tableId: string) {
        toast.success('✅ Pedido entregado — mesa liberada')
        await deliverOrder(orderId, tableId)
    }

    async function toggleItemStatus(itemId: string, current: string) {
        const next = current === 'pending' ? 'preparing' : current === 'preparing' ? 'ready' : 'pending'
        await updateItemStatus(itemId, next as OrderItem['status'])
    }

    const newOrders = activeOrders.filter(o => o.status === 'sent')
    const preparingOrders = activeOrders.filter(o => o.status === 'preparing')
    const readyOrders = activeOrders.filter(o => o.status === 'ready')

    const columns = [
        { title: 'NUEVOS', emoji: '🔔', orders: newOrders, color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
        { title: 'EN PREPARACIÓN', emoji: '🔥', orders: preparingOrders, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
        { title: 'LISTOS', emoji: '✅', orders: readyOrders, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
    ]

    if (loading) return (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400">Cargando cocina...</p>
            </div>
        </div>
    )

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            {/* Demo mode banner */}
            {IS_DEMO_MODE && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-amber-300">
                        Modo demo — los cambios son solo visuales y no se guardan en base de datos
                    </span>
                </div>
            )}

            <div className="flex-1 p-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Flame className="w-6 h-6 text-orange-400" />
                        <h1 className="text-white font-bold text-xl">Cocina</h1>
                        <span className="text-gray-500 text-sm">·</span>
                        <span className="text-gray-400 text-sm">{activeOrders.length} pedidos activos</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <div className="flex items-center gap-2 hidden sm:flex">
                            <Clock className="w-4 h-4" />
                            <span>{new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors min-h-0"
                            title="Volver"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={signOut}
                            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors min-h-0"
                            title="Cerrar sesión"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Kanban columns */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {columns.map(({ title, emoji, orders: colOrders, color, border, bg }) => (
                        <div key={title} className={`rounded-2xl border ${border} ${bg} p-3 flex flex-col min-h-[200px]`}>
                            {/* Column header */}
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{emoji}</span>
                                    <span className={`font-bold text-sm ${color}`}>{title}</span>
                                </div>
                                {colOrders.length > 0 && (
                                    <span className={`w-6 h-6 rounded-full ${bg} border ${border} flex items-center justify-center text-xs font-bold ${color}`}>
                                        {colOrders.length}
                                    </span>
                                )}
                            </div>

                            {/* Orders */}
                            <div className="space-y-3 flex-1 overflow-y-auto">
                                {colOrders.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-32 text-gray-600">
                                        <ChefHat className="w-8 h-8 mb-2 opacity-30" />
                                        <p className="text-sm">Sin pedidos</p>
                                    </div>
                                ) : (
                                    colOrders.map(order => {
                                        const elapsed = getElapsedMinutes(order.sent_at ?? order.created_at)
                                        const isUrgent = elapsed >= 15
                                        const isWarning = elapsed >= 8 && elapsed < 15

                                        return (
                                            <div
                                                key={order.id}
                                                className={`rounded-xl p-3 transition-all ${isUrgent
                                                    ? 'bg-red-900/30 border-l-4 border-l-red-500 border border-red-500/50 shadow-lg shadow-red-500/10'
                                                    : ticketStyles[order.status] ?? 'bg-gray-800 border border-gray-700'
                                                    }`}
                                            >
                                                {/* Ticket header */}
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <span className="text-white font-bold text-lg">Mesa {order.table?.number}</span>
                                                        <span className="text-gray-500 text-xs ml-2">{order.order_number}</span>
                                                        {order.status === 'sent' && (
                                                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse">
                                                                NUEVO
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`flex items-center gap-1 text-sm font-bold ${isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-gray-400'
                                                        }`}>
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatElapsed(order.sent_at ?? order.created_at)}
                                                        {isUrgent && <span className="text-red-400 animate-pulse ml-1">⚠️</span>}
                                                    </div>
                                                </div>

                                                {/* Items */}
                                                <div className="space-y-1.5 mb-3">
                                                    {order.order_items.map(item => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => toggleItemStatus(item.id, item.status)}
                                                            className={`w-full text-left flex items-start gap-2 p-2 rounded-lg transition-all ${item.status === 'ready'
                                                                ? 'bg-emerald-900/30 border border-emerald-500/30'
                                                                : item.status === 'preparing'
                                                                    ? 'bg-orange-900/30 border border-orange-500/30'
                                                                    : 'bg-gray-700/50'
                                                                }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded mt-0.5 flex-shrink-0 flex items-center justify-center text-xs ${item.status === 'ready' ? 'bg-emerald-500' :
                                                                item.status === 'preparing' ? 'bg-orange-500' : 'bg-gray-600'
                                                                }`}>
                                                                {item.status === 'ready' && '✓'}
                                                                {item.status === 'preparing' && '·'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <span className={`font-medium text-sm ${item.status === 'ready' ? 'text-gray-400 line-through' : 'text-white'}`}>
                                                                    {item.quantity}x {item.menu_item?.name}
                                                                </span>
                                                                {item.notes && (
                                                                    <p className="text-amber-300 text-xs mt-0.5 italic">📝 {item.notes}</p>
                                                                )}
                                                                {item.selected_modifiers && (Array.isArray(item.selected_modifiers)) && (
                                                                    <p className="text-gray-400 text-xs mt-0.5">
                                                                        {(item.selected_modifiers as any[]).map((m: any) => m.optionName).join(' · ')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Notes */}
                                                {order.notes && (
                                                    <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg p-2 mb-3">
                                                        <p className="text-amber-300 text-xs">📋 {order.notes}</p>
                                                    </div>
                                                )}

                                                {/* Action buttons */}
                                                {order.status === 'sent' && (
                                                    <button
                                                        onClick={() => takeOrder(order.id)}
                                                        className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Flame className="w-4 h-4" /> TOMAR ORDEN
                                                    </button>
                                                )}
                                                {order.status === 'preparing' && (
                                                    <button
                                                        onClick={() => markReady(order.id)}
                                                        className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" /> MARCAR LISTO
                                                    </button>
                                                )}
                                                {order.status === 'ready' && (
                                                    <button
                                                        onClick={() => markDelivered(order.id, order.table_id)}
                                                        className="w-full bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" /> MARCAR ENTREGADO
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
