/**
 * Aplica el schema SQL al proyecto de Supabase via Management API
 * Ejecutar: node scripts/apply-schema.mjs
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

async function runSQL(sql, description) {
  console.log(`⏳ ${description}...`)
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ query: sql })
    }
  )

  if (!response.ok) {
    const text = await response.text()
    // Try alternative endpoint via direct REST
    console.log(`  ⚠ Management API no disponible (${response.status}), intentando via REST directo...`)
    return false
  }
  
  const result = await response.json()
  return true
}

async function applyViaRest() {
  // Use the SQL endpoint that Supabase exposes
  const schemaSql = readFileSync(path.join(__dirname, '../supabase/migrations/001_schema.sql'), 'utf8')
  const seedSql = readFileSync(path.join(__dirname, '../supabase/seed.sql'), 'utf8')
  const usersSql = readFileSync(path.join(__dirname, '../supabase/create_test_users.sql'), 'utf8')

  // Try via pg-rest endpoint
  for (const [sql, desc] of [[schemaSql, 'Schema'], [seedSql, 'Seed data'], [usersSql, 'Test users']]) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        },
        body: JSON.stringify({ sql })
      })
      const text = await res.text()
      console.log(`${desc}: status ${res.status}`, text.substring(0, 100))
    } catch (e) {
      console.log(`${desc} error:`, e.message)
    }
  }

  console.log('\n📋 INSTRUCCIONES MANUALES:')
  console.log('La API automática no está disponible. Por favor sigue estos pasos:')
  console.log('')
  console.log('1. Ve a https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
  console.log('2. Pega TODO el contenido de: supabase/migrations/001_schema.sql')
  console.log('3. Haz clic en "Run". Espera que termine.')
  console.log('4. Crea un nuevo query. Pega el contenido de: supabase/seed.sql')
  console.log('5. Haz clic en "Run".')
  console.log('6. Crea un nuevo query. Pega el contenido de: supabase/create_test_users.sql')
  console.log('7. Haz clic en "Run".')
  console.log('')
  console.log(`🔗 Link directo al SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new`)
}

applyViaRest()
