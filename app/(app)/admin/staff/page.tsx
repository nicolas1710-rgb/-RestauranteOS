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
    const [form, setForm] = useState({ full_name: '', role: 'waiter', email: '', password: '' })
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

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

    async function handleCreateStaff() {
        if (!form.full_name || !form.email || !form.password) {
            toast.error('Llena todos los campos')
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    restaurant_id: profile!.restaurant_id
                })
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Error al crear usuario')
            } else {
                toast.success('Usuario creado correctamente')
                setForm({ full_name: '', role: 'waiter', email: '', password: '' })
                setShowForm(false)
                load()
            }
        } catch (error) {
            toast.error('Error de red al crear usuario')
        } finally {
            setSubmitting(false)
        }
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
                <div className="card p-5 border-2 border-orange-200 space-y-4">
                    <h3 className="font-semibold text-gray-800">Crea un Nuevo Miembro del Staff</h3>
                    
                    <div className="space-y-3">
                        <input
                            value={form.full_name}
                            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                            className="input"
                            placeholder="Nombre Completo"
                        />
                        <input
                            value={form.email}
                            type="email"
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            className="input"
                            placeholder="Correo Electrónico (acceso)"
                        />
                        <input
                            value={form.password}
                            type="password"
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            className="input"
                            placeholder="Contraseña Temporal (min 6 caracteres)"
                        />
                        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input">
                            <option value="waiter">🧑‍🍳 Mesero</option>
                            <option value="kitchen">👨‍🍳 Cocina (KDS)</option>
                            <option value="admin">⚙️ Gerente</option>
                        </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={handleCreateStaff} disabled={submitting} className="btn-primary flex-1 shadow-lg shadow-orange-200">
                            {submitting ? 'Creando...' : 'Crear Usuario'}
                        </button>
                        <button onClick={() => setShowForm(false)} className="btn-secondary px-6">Cancelar</button>
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
