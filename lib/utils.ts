export function generateOrderNumber(count: number): string {
    return `ORD-${String(count).padStart(4, '0')}`
}

export function formatCurrency(amount: number, currency = 'COP'): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function getElapsedMinutes(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
}

export function formatElapsed(dateStr: string): string {
    const mins = getElapsedMinutes(dateStr)
    if (mins < 60) return `${mins}min`
    const hrs = Math.floor(mins / 60)
    const remaining = mins % 60
    return `${hrs}h ${remaining}min`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ')
}

export const STATUS_COLORS = {
    available: 'bg-emerald-500',
    occupied: 'bg-red-500',
    reserved: 'bg-slate-400',
} as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
    open: 'Abierto',
    sent: 'Enviado a cocina',
    preparing: 'En preparación',
    ready: 'Listo ✅',
    delivered: 'Entregado',
    closed: 'Cerrado',
    cancelled: 'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
    open: 'bg-slate-100 text-slate-700',
    sent: 'bg-blue-100 text-blue-700',
    preparing: 'bg-orange-100 text-orange-700',
    ready: 'bg-emerald-100 text-emerald-700',
    delivered: 'bg-purple-100 text-purple-700',
    closed: 'bg-slate-100 text-slate-500',
    cancelled: 'bg-red-100 text-red-700',
}

export function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        
        oscillator.connect(gain)
        gain.connect(ctx.destination)
        
        // "Message" style sound (two tones)
        oscillator.frequency.setValueAtTime(880, ctx.currentTime) // A5
        oscillator.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1) // D6
        
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.5)
    } catch (e) {
        console.error('Error playing notification sound:', e)
    }
}
