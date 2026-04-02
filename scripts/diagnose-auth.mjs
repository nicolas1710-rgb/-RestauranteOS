import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, serviceKey)

async function diagnose() {
  console.log('🔍 Diagnosing Auth Schema...')
  
  const { data: users, error: uError } = await supabase.auth.admin.listUsers()
  if (uError) {
    console.error('❌ Error listing users:', uError.message)
  } else {
    console.log(`✅ Users found in auth.users: ${users.users.length}`)
    users.users.forEach(u => {
      console.log(` - ${u.email} (ID: ${u.id})`)
    })
  }

  // Check if they exist in profiles but NOT in auth
  const { data: pData, error: pError } = await supabase.from('profiles').select('id, role')
  if (pError) console.error('❌ Error reading profiles:', pError.message)
  else {
    console.log(`📊 Profiles in public.profiles: ${pData.length}`)
    pData.forEach(p => {
      const existsInAuth = users?.users.some(u => u.id === p.id)
      console.log(` - Profile ${p.id}: Auth exists? ${existsInAuth}`)
    })
  }
}

diagnose()
