'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { ChefHat, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const { signIn } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await signIn(email, password)
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-8">
            {/* Logo */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl shadow-xl shadow-orange-200 mb-4">
                    <ChefHat className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">RestaurantOS</h1>
                <p className="text-gray-500 mt-1">Sistema de gestión de pedidos</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                            <span className="text-base">⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailLogin} className="space-y-4">
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
                        <div>
                            <label className="label">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="input !pl-12 pr-10"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-0"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="flex justify-end pt-1">
                                <Link href="/recover-password" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {loading ? 'Ingresando...' : 'Iniciar sesión'}
                        </button>
                    </form>
                </div>
            </div>

            <p className="mt-6 text-xs text-gray-400">
                RestaurantOS v1.0 • Powered by Supabase
            </p>
        </div>
    )
}
