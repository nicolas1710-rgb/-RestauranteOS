'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import { X, Plus, Minus } from 'lucide-react'
import type { MenuItemWithModifiers, SelectedModifier } from '@/types/database'

interface Props {
    item: MenuItemWithModifiers
    onClose: () => void
}

export default function OrderItemModal({ item, onClose }: Props) {
    const { addItem } = useCartStore()
    const [quantity, setQuantity] = useState(1)
    const [notes, setNotes] = useState('')
    const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([])

    const modifierLinks = item.menu_item_modifiers ?? []

    function handleSingleModifier(modifierId: string, modifierName: string, optionId: string, optionName: string, priceDelta: number) {
        setSelectedModifiers(prev => {
            const filtered = prev.filter(m => m.modifierId !== modifierId)
            return [...filtered, { modifierId, modifierName, optionId, optionName, priceDelta }]
        })
    }

    function handleMultipleModifier(modifierId: string, modifierName: string, optionId: string, optionName: string, priceDelta: number, checked: boolean) {
        setSelectedModifiers(prev => {
            if (checked) {
                return [...prev, { modifierId, modifierName, optionId, optionName, priceDelta }]
            } else {
                return prev.filter(m => !(m.modifierId === modifierId && m.optionId === optionId))
            }
        })
    }

    const modifierTotal = selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0)
    const unitPriceWithMods = item.price + modifierTotal
    const totalPrice = unitPriceWithMods * quantity

    function handleAdd() {
        addItem({
            menuItemId: item.id,
            menuItemName: item.name,
            unitPrice: item.price,
            quantity,
            notes,
            selectedModifiers,
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto animate-slide-in-bottom">
                {/* Header */}
                <div className="flex items-start justify-between p-5 pb-3 sticky top-0 bg-white rounded-t-3xl border-b border-gray-100">
                    <div className="flex-1 mr-3">
                        <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                        {item.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 min-h-0 flex-shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Modifiers */}
                    {modifierLinks.map(({ modifier, required }) => (
                        <div key={modifier.id}>
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-gray-800">{modifier.name}</p>
                                {required && (
                                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                                        Obligatorio
                                    </span>
                                )}
                            </div>

                            {modifier.type === 'single' ? (
                                <div className="space-y-2">
                                    {modifier.modifier_options.map(opt => {
                                        const isSelected = selectedModifiers.some(
                                            m => m.modifierId === modifier.id && m.optionId === opt.id
                                        )
                                        return (
                                            <label
                                                key={opt.id}
                                                className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-orange-400 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                                                        }`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        className="sr-only"
                                                        checked={isSelected}
                                                        onChange={() => handleSingleModifier(modifier.id, modifier.name, opt.id, opt.name, opt.price_delta)}
                                                    />
                                                    <span className="font-medium text-gray-800">{opt.name}</span>
                                                </div>
                                                {opt.price_delta !== 0 && (
                                                    <span className={`text-sm font-semibold ${opt.price_delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {opt.price_delta > 0 ? '+' : ''}{formatCurrency(opt.price_delta)}
                                                    </span>
                                                )}
                                            </label>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {modifier.modifier_options.map(opt => {
                                        const isSelected = selectedModifiers.some(
                                            m => m.modifierId === modifier.id && m.optionId === opt.id
                                        )
                                        return (
                                            <label
                                                key={opt.id}
                                                className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-orange-400 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                                                        }`}>
                                                        {isSelected && <span className="text-white text-xs">✓</span>}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={isSelected}
                                                        onChange={e => handleMultipleModifier(modifier.id, modifier.name, opt.id, opt.name, opt.price_delta, e.target.checked)}
                                                    />
                                                    <span className="font-medium text-gray-800">{opt.name}</span>
                                                </div>
                                                {opt.price_delta !== 0 && (
                                                    <span className={`text-sm font-semibold ${opt.price_delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {opt.price_delta > 0 ? '+' : ''}{formatCurrency(opt.price_delta)}
                                                    </span>
                                                )}
                                            </label>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Notes */}
                    <div>
                        <label className="label">Notas especiales</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="sin cebolla, extra picante, bien cocido..."
                            className="input resize-none"
                            rows={2}
                        />
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800">Cantidad</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 min-h-0"
                            >
                                <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="text-xl font-bold text-gray-900 w-8 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(q => q + 1)}
                                className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center hover:bg-orange-200 min-h-0"
                            >
                                <Plus className="w-4 h-4 text-orange-600" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add button */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
                    <button
                        onClick={handleAdd}
                        className="btn-primary w-full flex items-center justify-between"
                    >
                        <span className="bg-orange-600 rounded-lg px-2 py-0.5 text-sm">{quantity}x</span>
                        <span>Agregar al pedido</span>
                        <span className="font-bold">{formatCurrency(totalPrice)}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
