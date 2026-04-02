'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Save, Loader2, Webhook, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
    const { profile } = useAuth()
    const supabase = createClient()
    const [settings, setSettings] = useState({ name: '', currency: 'COP', n8n_webhook_url: '' })
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => { if (profile?.restaurant_id) load() }, [profile?.restaurant_id])

    async function load() {
        const { data } = await supabase
            .from('restaurants')
            .select('name, currency, n8n_webhook_url')
            .eq('id', profile!.restaurant_id)
            .single()
        if (data) setSettings({ name: data.name, currency: data.currency, n8n_webhook_url: data.n8n_webhook_url ?? '' })
        setLoading(false)
    }

    async function save() {
        setSaving(true)
        const { error } = await supabase
            .from('restaurants')
            .update({ name: settings.name, currency: settings.currency, n8n_webhook_url: settings.n8n_webhook_url || null })
            .eq('id', profile!.restaurant_id)
        if (error) toast.error(error.message)
        else toast.success('Configuración guardada ✓')
        setSaving(false)
    }

    if (loading) return <div className="flex items-center justify-center h-[80vh]"><div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>

    return (
        <div className="px-4 py-4 space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
                <p className="text-sm text-gray-500">Ajustes del restaurante</p>
            </div>

            {/* General settings */}
            <div className="card p-4 space-y-4">
                <h3 className="font-semibold text-gray-800">General</h3>
                <div>
                    <label className="label">Nombre del restaurante</label>
                    <input value={settings.name} onChange={e => setSettings(s => ({ ...s, name: e.target.value }))} className="input" placeholder="La Trattoria" />
                </div>
                <div>
                    <label className="label">Moneda</label>
                    <select value={settings.currency} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))} className="input">
                        <option value="COP">COP — Peso colombiano</option>
                        <option value="USD">USD — Dólar</option>
                        <option value="EUR">EUR — Euro</option>
                        <option value="MXN">MXN — Peso mexicano</option>
                    </select>
                </div>
            </div>

            {/* n8n webhook */}
            <div className="card p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-800">Automatización con n8n</h3>
                    <span className="badge badge-default text-xs">Opcional</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <div className="flex gap-2">
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-700 space-y-1">
                            <p><strong>¿Qué es n8n?</strong> Una plataforma de automatización. Conéctala para:</p>
                            <ul className="list-disc list-inside space-y-0.5 ml-1">
                                <li>Enviar resumen de ventas por WhatsApp</li>
                                <li>Notificaciones por Telegram cuando un pedido está listo</li>
                                <li>Registrar pedidos en Google Sheets</li>
                                <li>Alertas si un pedido lleva +20 min sin prepararse</li>
                            </ul>
                            <p className="pt-1">Si dejas este campo vacío, la app funciona perfectamente sin n8n.</p>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="label">URL del webhook de n8n</label>
                    <input
                        value={settings.n8n_webhook_url}
                        onChange={e => setSettings(s => ({ ...s, n8n_webhook_url: e.target.value }))}
                        className="input"
                        placeholder="https://tu-n8n.app/webhook/xxxx"
                    />
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Eventos que se disparan:</p>
                    <div className="grid grid-cols-2 gap-1">
                        {['order.created', 'order.ready', 'order.delivered', 'order.paid', 'table.opened', 'daily.summary'].map(e => (
                            <span key={e} className="text-xs font-mono bg-white border border-gray-200 rounded px-2 py-1 text-gray-600">{e}</span>
                        ))}
                    </div>
                </div>
            </div>

            <button onClick={save} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
        </div>
    )
}
