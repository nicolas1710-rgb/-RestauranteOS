import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, SelectedModifier } from '@/types/database'

interface CartStore {
    tableId: string | null
    tableNumber: string | null
    orderId: string | null
    items: CartItem[]
    isOpen: boolean

    setTable: (tableId: string, tableNumber: string) => void
    setOrderId: (orderId: string) => void
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
    updateQuantity: (menuItemId: string, delta: number) => void
    removeItem: (menuItemId: string) => void
    clearCart: () => void
    toggleCart: () => void
    openCart: () => void

    getTotal: () => number
    getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            tableId: null,
            tableNumber: null,
            orderId: null,
            items: [],
            isOpen: false,

            setTable: (tableId, tableNumber) =>
                set({ tableId, tableNumber, items: [], orderId: null }),

            setOrderId: (orderId) => set({ orderId }),

            addItem: (newItem) => {
                set((state) => {
                    const existing = state.items.find(
                        (i) => i.menuItemId === newItem.menuItemId &&
                            JSON.stringify(i.selectedModifiers) === JSON.stringify(newItem.selectedModifiers) &&
                            i.notes === newItem.notes
                    )
                    if (existing) {
                        return {
                            items: state.items.map((i) =>
                                i === existing
                                    ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
                                    : i
                            ),
                        }
                    }
                    return {
                        items: [...state.items, { ...newItem, quantity: newItem.quantity ?? 1 }],
                    }
                })
            },

            updateQuantity: (menuItemId, delta) => {
                set((state) => ({
                    items: state.items
                        .map((i) =>
                            i.menuItemId === menuItemId
                                ? { ...i, quantity: i.quantity + delta }
                                : i
                        )
                        .filter((i) => i.quantity > 0),
                }))
            },

            removeItem: (menuItemId) => {
                set((state) => ({
                    items: state.items.filter((i) => i.menuItemId !== menuItemId),
                }))
            },

            clearCart: () =>
                set({ items: [], tableId: null, tableNumber: null, orderId: null }),

            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            openCart: () => set({ isOpen: true }),

            getTotal: () => {
                const { items } = get()
                return items.reduce((sum, item) => {
                    const modTotal = item.selectedModifiers.reduce(
                        (s, m) => s + m.priceDelta,
                        0
                    )
                    return sum + (item.unitPrice + modTotal) * item.quantity
                }, 0)
            },

            getItemCount: () => {
                return get().items.reduce((sum, item) => sum + item.quantity, 0)
            },
        }),
        {
            name: 'restaurant-cart',
        }
    )
)
