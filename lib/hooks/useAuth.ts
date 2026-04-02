'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Profile, UserRole } from '@/types/database'
import { MOCK_PROFILES } from '@/lib/mockData'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
    const supabase = createClient()
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for mock session first
        const mockUserId = localStorage.getItem('mock_user_id')
        if (mockUserId && process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
            const mockProfile = MOCK_PROFILES.find(p => p.id === mockUserId)
            if (mockProfile) {
                setUser({ id: mockProfile.id, email: mockProfile.role + '@demo.com' } as any)
                setProfile(mockProfile)
                setLoading(false)
                return
            }
        }

        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
            if (user) loadProfile(user.id)
            else setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null)
                if (session?.user) loadProfile(session.user.id)
                else {
                    setProfile(null)
                    setLoading(false)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    async function loadProfile(userId: string) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data)
        setLoading(false)
    }

    async function signIn(email: string, password: string) {
        // Mock Login for local testing/demo
        if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
            const mockProfile = MOCK_PROFILES.find(p => {
                const prefix = p.role === 'admin' ? 'admin' : p.role === 'waiter' ? 'mesero' : 'cocina';
                return email.startsWith(prefix);
            });

            if (mockProfile) {
                setUser({ id: mockProfile.id, email } as any)
                setProfile(mockProfile)
                setLoading(false)

                localStorage.setItem('mock_user_id', mockProfile.id);
                document.cookie = `mock_user_id=${mockProfile.id}; path=/; max-age=86400`;

                if (mockProfile.role === 'kitchen') router.push('/kitchen')
                else if (mockProfile.role === 'admin' || mockProfile.role === 'superadmin') router.push('/admin')
                else router.push('/waiter')
                return
            }
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        await redirectByRole()
    }

    async function redirectByRole() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: p } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = p?.role as UserRole
        if (role === 'kitchen') router.push('/kitchen')
        else if (role === 'admin' || role === 'superadmin') router.push('/admin')
        else router.push('/waiter')
    }

    async function signOut() {
        localStorage.removeItem('mock_user_id');
        document.cookie = "mock_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        await supabase.auth.signOut()
        router.push('/login')
    }

    return { user, profile, loading, signIn, signOut }
}
