'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChefHat, Eye, EyeOff, Loader2, Lock } from 'lucide-react'

export default function UpdatePasswordPage() {
    const supabase = createClient()
    const router = useRouter()
    
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Check if user is trying to access this page without a valid flow
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                setError('No se pudo verificar la sesión. ¿El enlace caducó?')
            }
        })
    }, [])

    async function handleUpdatePassword(e: React.FormEvent) {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }
        
        setLoading(true)
        setError('')
        
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            
            setSuccess(true)
            setTimeout(() => {
                router.push('/login')
            }, 3000)
            
        } catch (err: any) {
            setError(err.message || 'Error al actualizar la contraseña')
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
                <p className="text-gray-500 mt-1">Actualizar contraseña</p>
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
                                ✅
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">¡Contraseña actualizada!</h3>
                            <p className="text-sm text-gray-500">
                                Serás redirigido al inicio de sesión en unos segundos...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div>
                                <label className="label">Nueva Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="input !pl-12 pr-10"
                                        placeholder="Min. 6 caracteres"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-0"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="label">Confirmar Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="input !pl-12"
                                        placeholder="Repite la contraseña"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Guardar nueva contraseña
                            </button>
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
