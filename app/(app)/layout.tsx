'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { ChefHat, LayoutGrid, ClipboardList, Settings, LogOut, Utensils } from 'lucide-react'
import { Toaster } from 'react-hot-toast'

interface NavItem {
    href: string
    label: string
    icon: React.ReactNode
    roles: string[]
}

const navItems: NavItem[] = [
    { href: '/waiter', label: 'Mesas', icon: <LayoutGrid className="w-5 h-5" />, roles: ['waiter'] },
    { href: '/waiter/orders', label: 'Pedidos', icon: <ClipboardList className="w-5 h-5" />, roles: ['waiter'] },
    { href: '/kitchen', label: 'Cocina', icon: <Utensils className="w-5 h-5" />, roles: ['kitchen'] },
    { href: '/admin', label: 'Dashboard', icon: <LayoutGrid className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
    { href: '/admin/menu', label: 'Menú', icon: <ClipboardList className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
    { href: '/admin/tables', label: 'Mesas', icon: <LayoutGrid className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
    { href: '/admin/staff', label: 'Staff', icon: <Settings className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { profile, signOut } = useAuth()
    const pathname = usePathname()

    // Kitchen is fullscreen — no nav
    if (pathname.startsWith('/kitchen')) return <>{children}</>

    const myNavItems = navItems.filter(n => n.roles.includes(profile?.role ?? ''))

    return (
        <div className="flex flex-col min-h-screen">
            <Toaster position="top-center" reverseOrder={false} />
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                        <ChefHat className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-sm">RestaurantOS</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 hidden sm:block">
                        {profile?.full_name}
                    </span>
                    <button
                        onClick={signOut}
                        className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors min-h-0"
                        title="Cerrar sesión"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 pt-14" style={{ paddingBottom: 'var(--bottom-nav-height, 64px)' }}>{children}</main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 shadow-lg z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                <div className="flex justify-around">
                    {myNavItems.map(item => {
                        const active = pathname === item.href ||
                            (item.href !== '/admin' && item.href !== '/waiter' && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-colors min-h-0 ${active
                                        ? 'text-orange-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {item.icon}
                                <span className="text-[10px] font-medium">{item.label}</span>
                                {active && <div className="w-1 h-1 rounded-full bg-orange-500" />}
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
