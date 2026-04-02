import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están definidas en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Probando conexión a:', supabaseUrl)
  console.log('🔑 Usando llave (primeros caracteres):', supabaseKey.substring(0, 15) + '...')

  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "public.profiles" does not exist')) {
        console.log('❌ Error: La tabla "profiles" no existe. ¿Has ejecutado las migraciones SQL?')
      } else {
        console.error('❌ Error de Supabase:', error.message)
        console.error('Código:', error.code)
      }
    } else {
      console.log('✅ Conexión exitosa. La tabla "profiles" existe.')
    }

    // Probar lista de tablas
    const { data: schemas, error: schemaError } = await supabase.rpc('get_schemas') // Esto podría fallar si no hay RPC
    if (schemaError) {
      console.log('ℹ️ No se pudo consultar esquemas mediante RPC (normal si no está configurado).')
    }

  } catch (err) {
    console.error('💥 Error inesperado:', err.message)
  }
}

testConnection()
