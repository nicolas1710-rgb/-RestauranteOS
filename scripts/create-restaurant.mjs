import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

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

async function createRestaurant(name, slug, adminEmail, adminPassword, adminName) {
  if (!name || !slug || !adminEmail || !adminPassword || !adminName) {
    console.error(`❌ Uso incorrecto:`)
    console.error(`node scripts/create-restaurant.mjs "Nombre" "slug-unico" "admin@email.com" "password123" "Nombre Admin"`)
    process.exit(1)
  }

  console.log(`🚀 Creando nuevo restaurante: "${name}" (${slug})...`)

  // 1. Crear Restaurante
  const restaurantId = randomUUID()
  const { error: restErr } = await supabase.from('restaurants').insert({
    id: restaurantId,
    name: name,
    slug: slug,
    currency: 'COP',
    timezone: 'America/Bogota',
    active: true
  })
  
  if (restErr) {
    if (restErr.code === '23505') {
       console.error(`❌ Error crando restaurante: El slug "${slug}" ya existe. Elige otro.`)
    } else {
       console.error('❌ Error creando restaurante:', restErr.message)
    }
    return
  }
  console.log(`✅ Restaurante "${name}" creado exitosamente (ID: ${restaurantId}).`)

  console.log(`\n👤 Configurando cuenta de administrador para ${adminEmail}...`)
  
  // 2. Crear Administrador en Auth
  const { data: userData, error: authErr } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: adminName }
  })

  let userId = userData?.user?.id

  if (authErr) {
    if (authErr.message.includes('already registered')) {
      console.log('   ℹ️ El usuario ya existe en Auth. Intentando vincularlo a este restaurante...')
      const { data: list } = await supabase.auth.admin.listUsers()
      userId = list.users.find(x => x.email === adminEmail)?.id
    } else {
      console.error('   ❌ Error en Auth:', authErr.message)
      return
    }
  } else {
    console.log('   ✅ Usuario creado en Auth correctamente.')
  }

  if (userId) {
    // 3. Crear Perfil de Admin
    const { error: profErr } = await supabase.from('profiles').upsert({
      id: userId,
      restaurant_id: restaurantId,
      full_name: adminName,
      role: 'admin',
      active: true
    })

    if (profErr) {
        console.error('   ❌ Error creando Perfil:', profErr.message)
    } else {
        console.log(`   ✅ Perfil vinculado como Admin exitosamente.`)
    }
  }

  console.log(`\n✨ ¡Proceso completado!`)
  console.log(`🍕 Restaurante creado. Puedes iniciar sesión con el administrador ${adminEmail} en la app.`)
}

// Ejecutar
const [, , name, slug, email, password, adminName] = process.argv
createRestaurant(name, slug, email, password, adminName)
