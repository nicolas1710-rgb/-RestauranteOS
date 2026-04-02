'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Plus, ToggleLeft, ToggleRight, UserCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Profile } from '@/types/database'

const ROLE_LABELS: Record<string, string> = {
    admin: '⚙️ Gerente',
    waiter: '🧑‍🍳 Mesero',
    kitchen: '👨‍🍳 Cocina',
}

export default function AdminStaffPage() {
    const { profile } = useAuth()
    const supabase = createClient()
    const [staff, setStaff] = useState<Profile[]>([])
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ full_name: '', role: 'waiter' })
    const [loading, setLoading] = useState(true)

    useEffect(() => { if (profile?.restaurant_id) load() }, [profile?.restaurant_id])

    async function load() {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('restaurant_id', profile!.restaurant_id)
            .neq('id', profile!.id)
            .order('full_name')
        setStaff(data ?? [])
        setLoading(false)
    }

    async function toggleActive(id: string, active: boolean) {
        await supabase.from('profiles').update({ active: !active }).eq('id', id)
        toast.success(!active ? 'Usuario activado' : 'Usuario desactivado')
        load()
    }

    if (loading) return <div className="flex items-center justify-center h-[80vh]"><div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>

    return (
        <div className="px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Staff</h2>
                    <p className="text-sm text-gray-500">{staff.length} miembros del equipo</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nuevo usuario
                </button>
            </div>

            {showForm && (
                <div className="card p-4 border-2 border-orange-200 space-y-3">
                    <h3 className="font-semibold text-gray-800">Nuevo miembro del equipo</h3>
                    <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded-lg">
                        ℹ️ El usuario debe registrarse en Supabase Auth con su email. Aquí configuras su nombre y rol.
                    </p>
                    <input
                        value={form.full_name}
                        onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                        className="input"
                        placeholder="Nombre completo"
                    />
                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input">
                        <option value="waiter">🧑‍🍳 Mesero</option>
                        <option value="kitchen">👨‍🍳 Cocina (KDS)</option>
                        <option value="admin">⚙️ Gerente</option>
                    </select>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                        <strong>Nota:</strong> Para crear usuarios necesitas que el usuario se registre vía Auth de Supabase.
                        Luego actualiza su perfil con este formulario desde el SQL Editor o configura el webhook de registro.
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowForm(false)} className="btn-secondary text-sm flex-1">Cerrar</button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {staff.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No hay miembros del equipo configurados</p>
                    </div>
                ) : (
                    staff.map(member => (
                        <div key={member.id} className={`card p-4 flex items-center gap-3 ${!member.active ? 'opacity-60' : ''}`}>
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg">{ROLE_LABELS[member.role]?.split(' ')[0] ?? '👤'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800">{member.full_name || 'Sin nombre'}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="badge badge-default text-xs">{ROLE_LABELS[member.role] ?? member.role}</span>
                                </div>
                            </div>
                            <button onClick={() => toggleActive(member.id, member.active)} className="min-h-0 p-1">
                                {member.active
                                    ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                                    : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
