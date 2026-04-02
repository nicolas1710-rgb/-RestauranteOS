import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogin() {
  console.log('🔐 Intentando login con admin@a / 123...')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@a',
    password: '123'
  })
  if (error) {
    console.error('❌ Error de login:', error.message)
    console.error('   Código:', error.status, error.code)
  } else {
    console.log('✅ Login exitoso! User:', data.user?.email)
  }
  
  // Also test if auth service is reachable
  console.log('\n🔎 Verificando si el servicio de autenticación está activo...')
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { 'apikey': supabaseKey }
    })
    console.log('Auth health status:', res.status, res.statusText)
    const body = await res.text()
    console.log('Body:', body.substring(0, 200))
  } catch (err) {
    console.error('Error al verificar health:', err.message)
  }
}

testLogin()
