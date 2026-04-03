'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export function PwaInstallPrompt() {
    const [isInstallable, setIsInstallable] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        // Detectar si ya está instalada o es standalone
        const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
        setIsStandalone(isAppStandalone)

        if (isAppStandalone) return

        // Detectar iOS para instrucciones manuales (Safari no soporta beforeinstallprompt)
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isAppleDevice = /iphone|ipad|ipod/.test(userAgent)
        setIsIOS(isAppleDevice)

        // Evento nativo de Android/Chrome para instalar PWA
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsInstallable(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
            setIsInstallable(false)
        }
        setDeferredPrompt(null)
    }

    if (isStandalone || dismissed) return null
    if (!isInstallable && !isIOS) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-orange-50 border-t border-orange-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-8 sm:pb-4 animate-in slide-in-from-bottom">
            <div className="max-w-md mx-auto flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-orange-100 flex items-center justify-center flex-shrink-0 text-orange-500 font-bold text-xl">
                    OS
                </div>
                
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">Instalar RestaurantOS</h3>
                    <p className="text-xs text-gray-600 leading-tight mt-0.5">
                        {isIOS 
                            ? "Toca el botón 'Compartir' y luego 'Agregar a Inicio'"
                            : "Instala la aplicación para una mejor experiencia y rapidez."}
                    </p>
                </div>

                {isInstallable && (
                    <button 
                        onClick={handleInstallClick}
                        className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Instalar
                    </button>
                )}

                <button 
                    onClick={() => setDismissed(true)} 
                    className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full border border-gray-200"
                    aria-label="Cerrar"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
