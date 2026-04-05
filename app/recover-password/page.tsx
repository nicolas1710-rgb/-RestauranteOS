'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChefHat, Loader2, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RecoverPasswordPage() {
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    async function handleRecover(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            })
            
            if (error) throw error
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Error al intentar recuperar la contraseña')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-8">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl shadow-xl shadow-orange-200 mb-4">
                    <ChefHat className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">RestaurantOS</h1>
                <p className="text-gray-500 mt-1">Recuperación de contraseña</p>
            </div>

            <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                            <span className="text-base">⚠️</span> {error}
                        </div>
                    )}
                    
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl">
                                ✉️
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Correo enviado</h3>
                            <p className="text-sm text-gray-500">
                                Revisa tu bandeja de entrada para restablecer tu contraseña.
                            </p>
                            <Link href="/login" className="btn-secondary w-full flex items-center justify-center mt-4">
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleRecover} className="space-y-4">
                            <p className="text-sm text-gray-500 mb-4 text-center">
                                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                            </p>
                            <div>
                                <label className="label">Correo electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="input !pl-12"
                                        placeholder="correo@ejemplo.com"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Enviar enlace de recuperación
                            </button>
                            
                            <div className="text-center mt-6">
                                <Link href="/login" className="text-sm text-orange-600 font-semibold hover:text-orange-700 inline-flex items-center gap-1">
                                    <ArrowLeft className="w-4 h-4" /> Volver al inicio
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
            
            <p className="mt-6 text-xs text-gray-400">
                RestaurantOS v1.0 • Powered by Supabase
            </p>
        </div>
    )
}
