'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Plus, Trash2, CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Area, Table, TableStatus } from '@/types/database'
import { cn } from '@/lib/utils'

export default function AdminTablesPage() {
    const { profile } = useAuth()
    const supabase = createClient()
    const [areas, setAreas] = useState<Area[]>([])
    const [tables, setTables] = useState<Table[]>([])
    const [showAreaForm, setShowAreaForm] = useState(false)
    const [areaName, setAreaName] = useState('')
    const [showTableForm, setShowTableForm] = useState<string | null>(null)
    const [tableForm, setTableForm] = useState({ number: '', capacity: '4' })

    useEffect(() => { if (profile?.restaurant_id) load() }, [profile?.restaurant_id])

    async function load() {
        const [areasRes, tablesRes] = await Promise.all([
            supabase.from('areas').select('*').eq('restaurant_id', profile!.restaurant_id).order('display_order'),
            supabase.from('tables').select('*').eq('restaurant_id', profile!.restaurant_id).order('number'),
        ])
        setAreas(areasRes.data ?? [])
        setTables(tablesRes.data ?? [])
    }

    async function createArea() {
        if (!areaName.trim()) return
        await (supabase.from('areas') as any).insert({ restaurant_id: profile!.restaurant_id, name: areaName, display_order: areas.length })
        setAreaName(''); setShowAreaForm(false)
        toast.success('Área creada'); load()
    }

    async function deleteArea(id: string) {
        if (!confirm('¿Eliminar área y todas sus mesas?')) return
        await supabase.from('tables').delete().eq('area_id', id)
        await supabase.from('areas').delete().eq('id', id)
        toast.success('Área eliminada'); load()
    }

    async function createTable(areaId: string) {
        if (!tableForm.number.trim()) return
        await supabase.from('tables').insert({
            restaurant_id: profile!.restaurant_id,
            area_id: areaId,
            number: tableForm.number,
            capacity: parseInt(tableForm.capacity),
            status: 'available',
        })
        setTableForm({ number: '', capacity: '4' }); setShowTableForm(null)
        toast.success('Mesa creada'); load()
    }

    async function deleteTable(id: string) {
        if (!confirm('¿Eliminar esta mesa?')) return
        await supabase.from('tables').delete().eq('id', id)
        toast.success('Mesa eliminada'); load()
    }

    async function updateTableStatus(id: string, currentStatus: TableStatus) {
        if (currentStatus === 'occupied') {
            toast.error('No se puede reservar una mesa ocupada')
            return
        }
        const newStatus = currentStatus === 'reserved' ? 'available' : 'reserved'
        const { error } = await supabase.from('tables').update({ status: newStatus }).eq('id', id)
        if (error) {
            toast.error('Error al actualizar el estado')
        } else {
            toast.success(newStatus === 'reserved' ? 'Mesa marcada como Reservada' : 'Reserva cancelada')
            load()
        }
    }

    const STATUS_LABELS: Record<string, string> = {
        available: '🟢 Libre',
        occupied: '🔴 Ocupada',
        reserved: '⚪ Reservada',
    }

    return (
        <div className="px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Mesas y Áreas</h2>
                    <p className="text-sm text-gray-500">{areas.length} áreas · {tables.length} mesas</p>
                </div>
                <button onClick={() => setShowAreaForm(true)} className="btn-primary text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Área
                </button>
            </div>

            {showAreaForm && (
                <div className="card p-5 border-2 border-orange-200 bg-orange-50/30 space-y-4">
                    <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-orange-500" />
                        <h3 className="font-bold text-gray-900 text-lg">Nueva Área de Servicio</h3>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre del Área</label>
                        <input
                            value={areaName}
                            onChange={e => setAreaName(e.target.value)}
                            className="input h-11"
                            placeholder="Ej. Salón Principal, Terraza, Planta Alta..."
                        />
                        <p className="text-[10px] text-gray-400 ml-1">Agrupa tus mesas por zonas físicas del restaurante</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button onClick={createArea} className="btn-primary flex-1 py-3 font-bold shadow-lg shadow-orange-100">Crear Área</button>
                        <button onClick={() => setShowAreaForm(false)} className="btn-secondary px-6 py-3">Cancelar</button>
                    </div>
                </div>
            )}

            {areas.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-3xl mb-2">🪑</p>
                    <p>No hay áreas aún. Crea una primera área</p>
                </div>
            )}

            {areas.map(area => {
                const areaTables = tables.filter(t => t.area_id === area.id)
                return (
                    <div key={area.id} className="card overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <p className="font-semibold text-gray-800">{area.name}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{areaTables.length} mesas</span>
                                <button onClick={() => setShowTableForm(area.id)} className="text-orange-500 hover:text-orange-600 min-h-0 p-1">
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteArea(area.id)} className="text-gray-400 hover:text-red-500 min-h-0 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 space-y-2">
                            {/* Table creation form */}
                            {showTableForm === area.id && (
                                <div className="bg-white border-2 border-orange-100 rounded-2xl p-4 space-y-4 shadow-sm mb-4">
                                    <div className="flex items-center gap-2 pb-1 border-b border-orange-50">
                                        <Plus className="w-4 h-4 text-orange-500" />
                                        <span className="text-sm font-bold text-gray-800">Nueva Mesa en {area.name}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Identificador</label>
                                            <input
                                                value={tableForm.number}
                                                onChange={e => setTableForm(f => ({ ...f, number: e.target.value }))}
                                                className="input text-sm h-10"
                                                placeholder="Ej. T1"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1">
                                                <span>Capacidad</span>
                                                <span className="text-orange-500 text-xs">👥</span>
                                            </label>
                                            <select
                                                value={tableForm.capacity}
                                                onChange={e => setTableForm(f => ({ ...f, capacity: e.target.value }))}
                                                className="input text-sm h-12 bg-white"
                                            >
                                                {[2, 4, 6, 8, 10, 12, 16, 20].map(n => <option key={n} value={n}>{n} personas</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button onClick={() => createTable(area.id)} className="btn-primary flex-1 py-2 text-sm font-bold">Guardar Mesa</button>
                                        <button onClick={() => setShowTableForm(null)} className="btn-secondary px-4 py-2 text-sm">Cancelar</button>
                                    </div>
                                </div>
                            )}

                            {/* Table grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {areaTables.map(table => (
                                    <div key={table.id} className="relative group">
                                        <button
                                            onClick={() => updateTableStatus(table.id, table.status)}
                                            disabled={table.status === 'occupied'}
                                            className={cn(
                                                "w-full card p-3 text-center transition-all duration-200 active:scale-95",
                                                table.status === 'reserved' ? "border-2 border-slate-300 bg-slate-50" : "hover:border-orange-200",
                                                table.status === 'occupied' ? "opacity-90 cursor-default" : "cursor-pointer"
                                            )}
                                        >
                                            <p className="text-2xl font-bold text-gray-800">{table.number}</p>
                                            <p className="text-xs text-gray-400 font-medium mb-1">{table.capacity} pers.</p>
                                            
                                            <div className={cn(
                                                "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                                                table.status === 'available' ? "bg-emerald-100 text-emerald-700" :
                                                table.status === 'reserved' ? "bg-slate-200 text-slate-700" :
                                                "bg-red-100 text-red-700 font-bold"
                                            )}>
                                                {table.status === 'reserved' && <CalendarClock className="w-3 h-3" />}
                                                {STATUS_LABELS[table.status]}
                                            </div>
                                        </button>
                                        
                                        <button
                                            onClick={() => deleteTable(table.id)}
                                            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-1.5 bg-white shadow-md border border-gray-100 rounded-full text-gray-400 hover:text-red-500 min-h-0 transition-all z-10"
                                            title="Eliminar mesa"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {areaTables.length === 0 && (
                                    <div className="col-span-full text-center text-gray-400 py-4 text-sm">
                                        Sin mesas — agrega la primera
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
