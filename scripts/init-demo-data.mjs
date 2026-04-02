import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Faltan variables de entorno en .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function init() {
    console.log('🚀 Iniciando inicialización de datos para "Los Pollos"...')

    const restaurantId = 'a0000000-0000-0000-0000-000000000001'

    // 1. Crear Restaurante
    const { error: resError } = await supabase.from('restaurants').upsert({
        id: restaurantId,
        name: 'Los Pollos',
        slug: 'los-pollos',
        currency: 'COP',
        timezone: 'America/Bogota'
    }, { onConflict: 'slug' })

    if (resError) console.error('❌ Error creando restaurante:', resError.message)
    else console.log('✅ Restaurante "Los Pollos" inicializado.')

    // 2. Crear Usuarios en Auth y Profiles
    const users = [
        { id: 'e0000000-0000-0000-0000-000000000001', email: 'admin@a', role: 'admin', name: 'Admin Demo' },
        { id: 'e0000000-0000-0000-0000-000000000002', email: 'mesero@a', role: 'waiter', name: 'Mesero Demo' },
        { id: 'e0000000-0000-0000-0000-000000000003', email: 'cocina@a', role: 'kitchen', name: 'Cocina Demo' }
    ]

    for (const user of users) {
        // Crear en Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            id: user.id,
            email: user.email,
            password: '123',
            email_confirm: true,
            user_metadata: { full_name: user.name }
        })

        if (authError && authError.message !== 'User already exists') {
            console.error(`❌ Error creando auth user ${user.email}:`, authError.message)
        } else {
            console.log(`✅ Usuario auth ${user.email} listo.`)
        }

        // Crear en Profile
        const { error: profError } = await supabase.from('profiles').upsert({
            id: user.id,
            restaurant_id: restaurantId,
            full_name: user.name,
            role: user.role,
            active: true
        })

        if (profError) console.error(`❌ Error creando perfil ${user.email}:`, profError.message)
        else console.log(`✅ Perfil ${user.role} creado.`)
    }

    // 3. Crear Áreas
    const areas = [
        { id: 'a1000000-0000-0000-0000-000000000001', restaurant_id: restaurantId, name: 'Salón Principal', display_order: 0 },
        { id: 'a1000000-0000-0000-0000-000000000002', restaurant_id: restaurantId, name: 'Terraza', display_order: 1 },
        { id: 'a1000000-0000-0000-0000-000000000003', restaurant_id: restaurantId, name: 'Bar', display_order: 2 }
    ]

    const { error: areaError } = await supabase.from('areas').upsert(areas)
    if (areaError) console.error('❌ Error creando áreas:', areaError.message)
    else console.log('✅ Áreas creadas.')

    // 4. Crear Mesas
    const tables = [
        { id: 'b1000000-0000-0000-0000-000000000001', restaurant_id: restaurantId, area_id: areas[0].id, number: '1', capacity: 4, status: 'available' },
        { id: 'b1000000-0000-0000-0000-000000000002', restaurant_id: restaurantId, area_id: areas[0].id, number: '2', capacity: 4, status: 'available' },
        { id: 'b1000000-0000-0000-0000-000000000005', restaurant_id: restaurantId, area_id: areas[1].id, number: 'T1', capacity: 4, status: 'available' },
        { id: 'b1000000-0000-0000-0000-000000000007', restaurant_id: restaurantId, area_id: areas[2].id, number: 'B1', capacity: 2, status: 'available' }
    ]

    const { error: tableError } = await supabase.from('tables').upsert(tables)
    if (tableError) console.error('❌ Error creando mesas:', tableError.message)
    else console.log('✅ Mesas creadas.')

    console.log('✨ ¡Inicialización completada! Ya puedes entrar con admin@a / 123')
}

init()
