'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency, generateOrderNumber } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { X, Trash2, Plus, Minus, Send, ShoppingBag, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
    tableId: string
}

export default function OrderCart({ tableId }: Props) {
    const { profile } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const { items, isOpen, toggleCart, updateQuantity, removeItem, clearCart, getTotal, tableNumber, orderId, setOrderId } = useCartStore()
    const [sending, setSending] = useState(false)
    const [generalNotes, setGeneralNotes] = useState('')
    const [showConfirm, setShowConfirm] = useState(false)

    const total = getTotal()
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

    async function handleConfirmOrder() {
        if (!profile || items.length === 0) return
        setSending(true)
        setShowConfirm(false)

        try {
            // Get order count for numbering
            const { count } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('restaurant_id', profile.restaurant_id)

            const orderNumber = generateOrderNumber((count ?? 0) + 1)

            let currentOrderId = orderId

            if (!currentOrderId) {
                // Create order
                const { data: order, error } = await supabase
                    .from('orders')
                    .insert({
                        restaurant_id: profile.restaurant_id,
                        table_id: tableId,
                        waiter_id: profile.id,
                        order_number: orderNumber,
                        status: 'sent',
                        notes: generalNotes,
                        guests: 1,
                        subtotal: total,
                        tax: 0,
                        total: total,
                        payment_status: 'pending',
                        sent_at: new Date().toISOString(),
                    })
                    .select()
                    .single()

                if (error || !order) throw new Error(error?.message ?? 'Error al crear la orden')
                currentOrderId = order.id
                setOrderId(currentOrderId)

                // Update table status to occupied
                await supabase
                    .from('tables')
                    .update({ status: 'occupied' })
                    .eq('id', tableId)
            } else {
                // Update existing order
                await supabase
                    .from('orders')
                    .update({ status: 'sent', subtotal: total, total: total, sent_at: new Date().toISOString() })
                    .eq('id', currentOrderId)
            }

            // Insert order items
            const orderItemsPayload = items.map(item => ({
                order_id: currentOrderId!,
                menu_item_id: item.menuItemId,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                notes: item.notes || null,
                status: 'pending' as const,
                sent_to_kitchen_at: new Date().toISOString(),
                selected_modifiers: item.selectedModifiers.length > 0 ? item.selectedModifiers : null,
            }))

            await supabase.from('order_items').insert(orderItemsPayload)

            clearCart()
            toggleCart()
            toast.success('¡Pedido enviado a cocina! 🍽️')
            router.push('/waiter')

        } catch (err: any) {
            toast.error(err.message || 'Error al enviar el pedido')
        } finally {
            setSending(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => { toggleCart(); setShowConfirm(false) }}
            />

            {/* Drawer */}
            <div
                className="absolute right-0 top-0 bottom-0 w-full sm:max-w-sm bg-white shadow-2xl flex flex-col animate-slide-in-right"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-orange-500" />
                        <h3 className="font-bold text-gray-900">Pedido — Mesa {tableNumber}</h3>
                    </div>
                    <button onClick={toggleCart} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 min-h-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                    {items.length === 0 ? (
                        /* Mejora D — empty state */
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <ShoppingCart className="w-10 h-10 mb-3 opacity-25" />
                            <p className="font-medium text-gray-500 text-sm">El carrito está vacío</p>
                            <p className="text-xs mt-1 text-gray-400">Agrega items desde el menú</p>
                        </div>
                    ) : (
                        items.map((item, idx) => (
                            <div key={`${item.menuItemId}-${idx}`} className="card p-3 flex gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm">{item.menuItemName}</p>
                                    {item.selectedModifiers.length > 0 && (
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {item.selectedModifiers.map(m => m.optionName).join(', ')}
                                        </p>
                                    )}
                                    {item.notes && (
                                        <p className="text-xs text-orange-600 mt-0.5 italic">📝 {item.notes}</p>
                                    )}
                                    <p className="text-orange-600 font-bold text-sm mt-1">
                                        {formatCurrency(item.unitPrice * item.quantity)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => updateQuantity(item.menuItemId, -1)}
                                        className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 min-h-0"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-bold text-gray-800 w-5 text-center text-sm">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.menuItemId, 1)}
                                        className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center hover:bg-orange-200 min-h-0"
                                    >
                                        <Plus className="w-3 h-3 text-orange-600" />
                                    </button>
                                    <button
                                        onClick={() => removeItem(item.menuItemId)}
                                        className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 min-h-0 ml-1"
                                    >
                                        <Trash2 className="w-3 h-3 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Notes */}
                    {items.length > 0 && (
                        <div>
                            <label className="label">Notas generales del pedido</label>
                            <textarea
                                value={generalNotes}
                                onChange={e => setGeneralNotes(e.target.value)}
                                placeholder="Alérgenos, preferencias especiales..."
                                className="input resize-none text-sm"
                                rows={2}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-gray-100 p-5 space-y-3 bg-white">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Total</span>
                            <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
                        </div>
                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={sending}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {sending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {sending ? 'Enviando...' : 'Enviar a cocina'}
                        </button>
                    </div>
                )}
            </div>

            {/* Mejora C — Confirm bottom sheet */}
            {showConfirm && (
                <div
                    className="fixed inset-x-0 z-[60] bg-white rounded-t-2xl p-6 shadow-2xl animate-slide-in-bottom"
                    style={{
                        bottom: 0,
                        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
                    }}
                >
                    <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                    <h3 className="font-bold text-lg mb-1">¿Confirmar pedido?</h3>
                    <p className="text-gray-500 text-sm mb-5">
                        Mesa {tableNumber} · {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatCurrency(total)}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Revisar
                        </button>
                        <button
                            onClick={handleConfirmOrder}
                            disabled={sending}
                            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {sending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>Enviar a cocina 🚀</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
