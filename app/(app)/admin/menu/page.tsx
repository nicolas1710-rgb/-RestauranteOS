'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import type { MenuCategory, MenuItem } from '@/types/database'

export default function AdminMenuPage() {
    const { profile } = useAuth()
    const supabase = createClient()
    const [categories, setCategories] = useState<MenuCategory[]>([])
    const [items, setItems] = useState<MenuItem[]>([])
    const [expandedCat, setExpandedCat] = useState<string | null>(null)
    const [showCatForm, setShowCatForm] = useState(false)
    const [showItemForm, setShowItemForm] = useState<string | null>(null) // categoryId
    const [catName, setCatName] = useState('')
    const [catIcon, setCatIcon] = useState('🍽️')
    const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', image_url: '' })
    const [loading, setLoading] = useState(true)

    useEffect(() => { if (profile?.restaurant_id) loadData() }, [profile?.restaurant_id])

    async function loadData() {
        const [catRes, itemRes] = await Promise.all([
            supabase.from('menu_categories').select('*').eq('restaurant_id', profile!.restaurant_id).order('display_order'),
            supabase.from('menu_items').select('*').eq('restaurant_id', profile!.restaurant_id).order('display_order'),
        ])
        setCategories(catRes.data ?? [])
        setItems(itemRes.data ?? [])
        setLoading(false)
    }

    async function createCategory() {
        if (!catName.trim()) return
        const { error } = await (supabase.from('menu_categories') as any).insert({
            restaurant_id: profile!.restaurant_id,
            name: catName.trim(),
            icon: catIcon,
            display_order: categories.length,
            active: true,
        })
        if (error) { toast.error(error.message); return }
        toast.success('Categoría creada')
        setCatName(''); setShowCatForm(false)
        loadData()
    }

    async function toggleCategory(id: string, active: boolean) {
        await supabase.from('menu_categories').update({ active: !active }).eq('id', id)
        loadData()
    }

    async function deleteCategory(id: string) {
        if (!confirm('¿Eliminar categoría y todos sus items?')) return
        await supabase.from('menu_items').delete().eq('category_id', id)
        await supabase.from('menu_categories').delete().eq('id', id)
        toast.success('Categoría eliminada')
        loadData()
    }

    async function createItem(categoryId: string) {
        if (!itemForm.name.trim() || !itemForm.price) return
        const { error } = await (supabase.from('menu_items') as any).insert({
            restaurant_id: profile!.restaurant_id,
            category_id: categoryId,
            name: itemForm.name.trim(),
            description: itemForm.description || null,
            price: parseFloat(itemForm.price),
            image_url: itemForm.image_url || null,
            preparation_time: 0,
            available: true,
            display_order: items.filter(i => i.category_id === categoryId).length,
        })
        if (error) { toast.error(error.message); return }
        toast.success('Item creado')
        setItemForm({ name: '', description: '', price: '', image_url: '' })
        setShowItemForm(null)
        loadData()
    }

    async function toggleItem(id: string, available: boolean) {
        await supabase.from('menu_items').update({ available: !available }).eq('id', id)
        toast.success(!available ? 'Item disponible' : 'Item marcado como agotado')
        loadData()
    }

    async function deleteItem(id: string) {
        if (!confirm('¿Eliminar este item del menú?')) return
        await supabase.from('menu_items').delete().eq('id', id)
        toast.success('Item eliminado')
        loadData()
    }

    if (loading) return <div className="flex items-center justify-center h-[80vh]"><div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>

    return (
        <div className="px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Menú</h2>
                    <p className="text-sm text-gray-500">{categories.length} categorías · {items.length} items</p>
                </div>
                <button onClick={() => setShowCatForm(true)} className="btn-primary flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" /> Categoría
                </button>
            </div>

            {/* New category form */}
            {showCatForm && (
                <div className="card p-5 border-2 border-orange-200 bg-orange-50/30 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-orange-500" /> Nueva Categoría
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Ícono</label>
                            <input
                                value={catIcon}
                                onChange={e => setCatIcon(e.target.value)}
                                className="input text-center text-2xl h-[46px]"
                                placeholder="🍽️"
                            />
                            <p className="text-[10px] text-gray-400 ml-1">Emoji representativo</p>
                        </div>
                        <div className="sm:col-span-3 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nombre de la Categoría</label>
                            <input
                                value={catName}
                                onChange={e => setCatName(e.target.value)}
                                className="input flex-1 h-[46px]"
                                placeholder="Ej: Entradas, Bebidas, Postres..."
                            />
                            <p className="text-[10px] text-gray-400 ml-1">Este nombre aparecerá en el menú del cliente</p>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button onClick={createCategory} className="btn-primary flex-1 py-3 shadow-lg shadow-orange-200">Crear Categoría</button>
                        <button onClick={() => setShowCatForm(false)} className="btn-secondary px-6 py-3">Cancelar</button>
                    </div>
                </div>
            )}

            {/* Categories */}
            {categories.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-3xl mb-2">🍽️</p>
                    <p>No hay categorías aún. ¡Crea la primera!</p>
                </div>
            ) : (
                categories.map(cat => {
                    const catItems = items.filter(i => i.category_id === cat.id)
                    const isExpanded = expandedCat === cat.id

                    return (
                        <div key={cat.id} className="card overflow-hidden">
                            {/* Category header */}
                            <div
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${!cat.active ? 'opacity-50' : ''}`}
                                onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                            >
                                <span className="text-xl">{cat.icon}</span>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{cat.name}</p>
                                    <p className="text-xs text-gray-400">{catItems.length} items</p>
                                </div>
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => toggleCategory(cat.id, cat.active)} className="text-gray-400 hover:text-orange-500 min-h-0 p-1">
                                        {cat.active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                                    </button>
                                    <button onClick={() => deleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 min-h-0 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                </div>
                            </div>

                            {/* Category items */}
                            {isExpanded && (
                                <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                                    {catItems.map(item => (
                                        <div key={item.id} className={`flex items-center gap-3 py-2 ${!item.available ? 'opacity-60' : ''}`}>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                                                {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                                                <p className="text-orange-600 font-semibold text-sm">{formatCurrency(item.price)}</p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button onClick={() => toggleItem(item.id, item.available)} className="min-h-0 p-1">
                                                    {item.available ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                                                </button>
                                                <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-500 min-h-0 p-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* New item form */}
                                    {showItemForm === cat.id ? (
                                        <div className="bg-white border-2 border-orange-100 rounded-2xl p-4 space-y-4 shadow-sm mt-2">
                                            <div className="flex items-center gap-2 pb-1 border-b border-orange-50">
                                                <Plus className="w-4 h-4 text-orange-500" />
                                                <span className="text-sm font-bold text-gray-800">Nuevo ítem en {cat.name}</span>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre del Plato</label>
                                                    <input
                                                        value={itemForm.name}
                                                        onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                                                        className="input text-sm h-11"
                                                        placeholder="Ej: Hamburguesa de la Casa"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                                                    <input
                                                        value={itemForm.description}
                                                        onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                                                        className="input text-sm h-11"
                                                        placeholder="Ingredientes, alérgenos o detalles..."
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                        <span>Precio de Venta</span>
                                                        <span className="text-orange-500 text-xs">💰</span>
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                                        <input
                                                            value={itemForm.price}
                                                            onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))}
                                                            type="number"
                                                            className="input text-sm h-11 pl-16"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <p className="text-[9px] text-gray-400 ml-1">Solo números, sin signos de moneda</p>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                        <span>URL de la Imagen</span>
                                                        <span className="text-orange-500 text-xs">🖼️</span>
                                                    </label>
                                                    <input
                                                        value={itemForm.image_url}
                                                        onChange={e => setItemForm(f => ({ ...f, image_url: e.target.value }))}
                                                        className="input text-sm h-11"
                                                        placeholder="https://ejemplo.com/imagen.jpg (Opcional)"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <button onClick={() => createItem(cat.id)} className="btn-primary flex-1 py-2.5 text-sm font-bold">Guardar Plato</button>
                                                <button onClick={() => setShowItemForm(null)} className="btn-secondary px-4 py-2.5 text-sm">Cancelar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowItemForm(cat.id)}
                                            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Agregar item
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })
            )}
        </div>
    )
}
