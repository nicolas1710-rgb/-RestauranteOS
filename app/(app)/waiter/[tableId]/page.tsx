'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import OrderItemModal from '@/components/waiter/OrderItemModal'
import OrderCart from '@/components/waiter/OrderCart'
import { ArrowLeft, ShoppingCart, ChevronRight, Tag } from 'lucide-react'
import type { MenuCategory, MenuItemWithModifiers } from '@/types/database'

interface Props {
    params: Promise<{ tableId: string }>
}

export default function WaiterMenuPage({ params }: Props) {
    const { tableId } = use(params)
    const { profile } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const { tableNumber, items, getItemCount, openCart } = useCartStore()

    const [categories, setCategories] = useState<MenuCategory[]>([])
    const [menuItems, setMenuItems] = useState<MenuItemWithModifiers[]>([])
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [selectedItem, setSelectedItem] = useState<MenuItemWithModifiers | null>(null)
    const [tableName, setTableName] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!profile?.restaurant_id) return
        loadData()
        loadTable()
    }, [profile?.restaurant_id, tableId])

    async function loadTable() {
        const { data } = await supabase
            .from('tables')
            .select('number, area:areas(name)')
            .eq('id', tableId)
            .single()
        if (data) {
            const area = (data.area as any)?.name
            setTableName(area ? `Mesa ${data.number} — ${area}` : `Mesa ${data.number}`)
        }
    }

    async function loadData() {
        const [catRes, itemsRes] = await Promise.all([
            supabase
                .from('menu_categories')
                .select('*')
                .eq('restaurant_id', profile!.restaurant_id)
                .eq('active', true)
                .order('display_order'),
            supabase
                .from('menu_items')
                .select(`
          *,
          menu_item_modifiers (
            *,
            modifier: modifiers (
              *,
              modifier_options (*)
            )
          )
        `)
                .eq('restaurant_id', profile!.restaurant_id)
                .order('display_order'),
        ])

        setCategories(catRes.data ?? [])
        setMenuItems((itemsRes.data as MenuItemWithModifiers[]) ?? [])
        if (catRes.data && catRes.data.length > 0) setActiveCategory(catRes.data[0].id)
        setLoading(false)
    }

    const categoryItems = menuItems.filter(i => i.category_id === activeCategory)
    const itemCount = getItemCount()

    if (loading) return (
        <div className="flex items-center justify-center h-[80vh]">
            <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="flex flex-col h-[calc(100vh-56px)]">
            {/* Header */}
            <div className="page-header">
                <button onClick={() => router.back()} className="p-1.5 rounded-xl hover:bg-gray-100 min-h-0">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                    <h2 className="font-bold text-gray-900 text-sm">{tableName}</h2>
                    <p className="text-xs text-gray-500">Selecciona los items del pedido</p>
                </div>
                <button
                    onClick={openCart}
                    className="relative p-2 rounded-xl bg-orange-500 text-white min-h-0"
                >
                    <ShoppingCart className="w-5 h-5" />
                    {itemCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {itemCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-white border-b border-gray-100 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all min-h-0 flex-shrink-0 ${activeCategory === cat.id
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {cat.icon && <span>{cat.icon}</span>}
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Menu grid */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
                {categoryItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-3xl mb-2">🍽️</p>
                        <p>No hay items en esta categoría</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categoryItems.map(item => {
                            const inCart = items.find(i => i.menuItemId === item.id)
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => item.available && setSelectedItem(item)}
                                    className={`card text-left overflow-hidden transition-all active:scale-98 ${item.available
                                            ? 'hover:shadow-md'
                                            : 'opacity-60 cursor-not-allowed'
                                        } ${inCart ? 'ring-2 ring-orange-400' : ''}`}
                                >
                                    {/* Item image placeholder */}
                                    <div className="h-24 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center text-3xl relative">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>🍽️</span>
                                        )}
                                        {!item.available && (
                                            <div className="absolute inset-0 bg-gray-800/60 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold bg-gray-700 px-2 py-1 rounded-full">Agotado</span>
                                            </div>
                                        )}
                                        {inCart && (
                                            <div className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                                {inCart.quantity}
                                            </div>
                                        )}
                                        {item.tags?.includes('popular') && (
                                            <div className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-semibold flex items-center gap-0.5">
                                                <Tag className="w-2.5 h-2.5" /> Hot
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2.5">
                                        <p className="font-semibold text-gray-800 text-sm leading-tight">{item.name}</p>
                                        {item.description && (
                                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                                        )}
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-orange-600 font-bold text-sm">
                                                {formatCurrency(item.price)}
                                            </span>
                                            {item.preparation_time && (
                                                <span className="text-xs text-gray-400">{item.preparation_time}min</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* OrderItemModal */}
            {selectedItem && (
                <OrderItemModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}

            {/* OrderCart drawer */}
            <OrderCart tableId={tableId} />
        </div>
    )
}
