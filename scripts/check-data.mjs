import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('📊 Verificando datos...')
  
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(5)
  if (pError) {
    console.error('❌ Error al leer perfiles:', pError.message)
  } else {
    console.log(`✅ Se encontraron ${profiles.length} perfiles.`)
    if (profiles.length > 0) {
      console.log('Primeros perfiles:', profiles.map(p => p.full_name || p.role).join(', '))
    } else {
      console.log('⚠️ La tabla "profiles" está VACÍA.')
    }
  }

  const { data: areas, error: aError } = await supabase.from('areas').select('*').limit(1)
  if (aError) console.log('❌ Error al leer áreas:', aError.message)
  else console.log(`✅ Áreas encontradas: ${areas.length}`)
}

checkData()
