'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTables } from '@/lib/hooks/useTables'
import { useOrders } from '@/lib/hooks/useOrders'
import { useCartStore } from '@/store/cartStore'
import { cn } from '@/lib/utils'
import { Users, ShoppingCart, CheckCircle } from 'lucide-react'
import type { TableWithArea } from '@/types/database'
import WaiterNotificationHandler from '@/components/waiter/WaiterNotificationHandler'
import toast from 'react-hot-toast'

export default function WaiterPage() {
    const { profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const { setTable } = useCartStore()

    const { tables, loading: tablesLoading, refetch: refetchTables } = useTables(profile?.restaurant_id)
    const { orders: activeOrders, loading: ordersLoading, deliverOrder } = useOrders(profile?.restaurant_id)

    function getTableOrder(tableId: string) {
        return activeOrders.find(o => o.table_id === tableId && ['open', 'sent', 'preparing', 'ready'].includes(o.status))
    }

    function handleTableClick(table: TableWithArea) {
        setTable(table.id, table.number)
        router.push(`/waiter/${table.id}`)
    }

    async function handleDeliverOrder(e: React.MouseEvent, order: any, table: TableWithArea) {
        e.stopPropagation() // don't navigate to table
        toast.promise(
            deliverOrder(order.id, table.id).then(() => refetchTables?.()),
            {
                loading: 'Entregando pedido...',
                success: `✅ Mesa ${table.number} liberada`,
                error: 'Error al entregar el pedido',
            }
        )
    }

    // Group by area
    const areas = [...new Set(tables.map(t => t.area?.name ?? 'Sin área'))]
    const grouped = areas.map(area => ({
        area,
        tables: tables.filter(t => (t.area?.name ?? 'Sin área') === area),
    }))

    if (authLoading || tablesLoading || ordersLoading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Cargando mesas...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="px-4 py-4">
            <WaiterNotificationHandler />
            {/* Header stats */}
            <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-900">Mesas</h2>
                <p className="text-sm text-gray-500">
                    {activeOrders.length} pedidos activos · {tables.filter(t => t.status === 'available').length} mesas libres
                </p>
            </div>

            {/* Legend */}
            <div className="flex gap-3 mb-5 flex-wrap">
                {[
                    { color: 'bg-emerald-500', label: 'Libre' },
                    { color: 'bg-red-500', label: 'Ocupada' },
                    { color: 'bg-amber-400', label: 'Lista ✅' },
                    { color: 'bg-slate-300', label: 'Reservada' },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <div className={`w-3 h-3 rounded-full ${color}`} />
                        {label}
                    </div>
                ))}
            </div>

            {/* Table groups */}
            {grouped.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-4xl mb-3">🍽️</p>
                    <p className="font-medium">No hay mesas configuradas</p>
                    <p className="text-sm">El administrador debe agregar mesas primero</p>
                </div>
            ) : (
                grouped.map(({ area, tables: areaTables }) => (
                    <div key={area} className="mb-6">
                        <p className="section-title">{area}</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {areaTables.map(table => {
                                const order = getTableOrder(table.id)
                                const isReady = order?.status === 'ready'
                                const isOccupied = !!order

                                return (
                                    <div key={table.id} className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleTableClick(table)}
                                            className={cn(
                                                'relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm border-2',
                                                isReady
                                                    ? 'bg-amber-50 border-amber-400 shadow-amber-200'
                                                    : isOccupied
                                                        ? 'bg-red-50 border-red-200'
                                                        : table.status === 'available'
                                                            ? 'bg-white border-emerald-200 hover:border-emerald-300'
                                                            : 'bg-slate-50 border-slate-200'
                                            )}
                                        >
                                            {/* Status indicator */}
                                            <div className={cn(
                                                'absolute top-2 right-2 w-2.5 h-2.5 rounded-full',
                                                isReady ? 'bg-amber-400' : isOccupied ? 'bg-red-500' :
                                                    table.status === 'available' ? 'bg-emerald-500' : 'bg-slate-300'
                                            )}>
                                                {isReady && (
                                                    <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping" />
                                                )}
                                            </div>

                                            <span className="text-2xl font-bold text-gray-700">{table.number}</span>

                                            <div className="flex items-center gap-1 text-gray-400">
                                                <Users className="w-3 h-3" />
                                                <span className="text-xs">{table.capacity}</span>
                                            </div>

                                            {isOccupied && (
                                                <div className={cn(
                                                    'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                                                    isReady ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                )}>
                                                    {isReady ? '✅ Listo' : <><ShoppingCart className="w-3 h-3" />{order?.order_number}</>}
                                                </div>
                                            )}
                                        </button>

                                        {/* Deliver button — only when order is ready */}
                                        {isReady && order && (
                                            <button
                                                onClick={(e) => handleDeliverOrder(e, order, table)}
                                                className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                ENTREGAR
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
