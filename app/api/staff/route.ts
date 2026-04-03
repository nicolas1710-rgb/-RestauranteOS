import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email, password, full_name, role, restaurant_id } = await request.json()

        if (!email || !password || !full_name || !restaurant_id) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Crear el usuario en auth.users
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name,
                role,
                restaurant_id
            }
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        // 2. Insertar el perfil en la tabla public.profiles
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: authData.user.id,
            restaurant_id,
            full_name,
            role,
            active: true
        })

        if (profileError) {
             return NextResponse.json({ error: profileError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, user: authData.user })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
