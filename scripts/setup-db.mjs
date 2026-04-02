/**
 * RestaurantOS - Script Final para Configurar Usuarios
 * Ejecuta: node scripts/setup-db.mjs
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Error: Configuración de Supabase no encontrada en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const RESTAURANT_ID = 'a0000000-0000-0000-0000-000000000001'

async function setup() {
  console.log('🚀 Iniciando configuración de usuarios...')

  // 1. Asegurar Restaurante
  const { error: restErr } = await supabase.from('restaurants').upsert({
    id: RESTAURANT_ID,
    name: 'Los Pollos',
    slug: 'los-pollos',
    currency: 'COP',
    timezone: 'America/Bogota'
  })
  if (restErr) {
    console.error('❌ Error creano restaurante:', restErr.message)
    return
  }
  console.log('✅ Restaurante listo.')

  // 2. Usuarios a crear
  const users = [
    { email: 'admin@a', password: '123', name: 'Admin Demo', role: 'admin' },
    { email: 'mesero@a', password: '123', name: 'Mesero Demo', role: 'waiter' },
    { email: 'cocina@a', password: '123', name: 'Cocina Demo', role: 'kitchen' }
  ]

  for (const u of users) {
    console.log(`\n👤 Configurando ${u.email}...`)
    
    // Crear en Auth (o recuperar si ya existe)
    const { data: userData, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.name }
    })

    let userId = userData?.user?.id

    if (authErr) {
      if (authErr.message.includes('already registered')) {
        console.log('   ℹ️ El usuario ya existe en Auth.')
        // Recuperar ID
        const { data: list } = await supabase.auth.admin.listUsers()
        userId = list.users.find(x => x.email === u.email)?.id
      } else {
        console.error('   ❌ Error en Auth:', authErr.message)
        continue
      }
    } else {
      console.log('   ✅ Creado en Auth correctamente.')
    }

    if (userId) {
      // Crear Perfil
      const { error: profErr } = await supabase.from('profiles').upsert({
        id: userId,
        restaurant_id: RESTAURANT_ID,
        full_name: u.name,
        role: u.role,
        active: true
      })

      if (profErr) console.error('   ❌ Error en Perfil:', profErr.message)
      else console.log(`   ✅ Perfil vinculado (${u.role}).`)
    }
  }

  console.log('\n✨ ¡Todo listo! Ahora puedes loguearte en la app.')
}

setup()
