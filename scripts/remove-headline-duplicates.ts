import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function removeHeadlineDuplicates() {
  console.log('🗑️  Removing remaining duplicates by exact headline matching...\n')

  const { data: allQueries, error } = await supabase
    .from('queries')
    .select('id, headline, publication, reporter_name, journalist_contact, deadline, created_at, posted_at')
    .order('created_at', { ascending: true }) // Keep oldest

  if (error) {
    console.error('❌ Error fetching queries:', error)
    return
  }

  console.log(`📊 Starting with ${allQueries?.length || 0} queries`)

  if (!allQueries || allQueries.length === 0) {
    return
  }

  // Group by exact headline (case-insensitive)
  const headlineGroups = new Map<string, any[]>()

  allQueries.forEach(query => {
    const key = query.headline?.toLowerCase().trim() || `no-headline-${query.id}`
    if (!headlineGroups.has(key)) {
      headlineGroups.set(key, [])
    }
    headlineGroups.get(key)!.push(query)
  })

  // Find duplicate groups
  const duplicateGroups = Array.from(headlineGroups.values()).filter(group => group.length > 1)

  console.log(`🔍 Found ${duplicateGroups.length} duplicate headline groups`)

  if (duplicateGroups.length === 0) {
    console.log('✅ No headline duplicates found!')
    return
  }

  // Collect IDs to delete (keep first/oldest, delete rest)
  const idsToDelete: string[] = []

  duplicateGroups.forEach((group, index) => {
    const toDelete = group.slice(1).map(q => q.id) // Skip first (keep oldest)
    idsToDelete.push(...toDelete)

    console.log(`📋 ${index + 1}. "${group[0].headline}" - Keeping 1, deleting ${toDelete.length}`)
    group.forEach((query, i) => {
      const action = i === 0 ? 'KEEP' : 'DELETE'
      console.log(`   ${query.id} - Created: ${query.created_at} - ${action}`)
    })
  })

  console.log(`\n🗑️  Total duplicates to delete: ${idsToDelete.length}`)
  console.log(`✅ Unique queries remaining: ${allQueries.length - idsToDelete.length}`)

  if (idsToDelete.length === 0) {
    console.log('✅ No duplicates to remove!')
    return
  }

  // Delete in batches
  const BATCH_SIZE = 1000
  let deletedCount = 0

  for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
    const batch = idsToDelete.slice(i, i + BATCH_SIZE)

    console.log(`\n🔄 Deleting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(idsToDelete.length / BATCH_SIZE)} (${batch.length} duplicates)...`)

    const { error: deleteError } = await supabase
      .from('queries')
      .delete()
      .in('id', batch)

    if (deleteError) {
      console.error(`❌ Error deleting batch:`, deleteError)
      console.log(`⚠️  Stopped at ${deletedCount} deletions`)
      return
    }

    deletedCount += batch.length
    console.log(`✅ Deleted ${batch.length} duplicates (${deletedCount}/${idsToDelete.length} total)`)
  }

  console.log(`\n🎉 SUCCESS! Removed ${deletedCount} headline duplicates`)

  // Final verification
  const { count: finalCount } = await supabase
    .from('queries')
    .select('*', { count: 'exact', head: true })

  console.log(`\n📊 Final database state:`)
  console.log(`   ${finalCount} unique queries remaining`)
  console.log(`   ${deletedCount} headline duplicates removed`)
  console.log(`   Total cleanup: ${((deletedCount / allQueries.length) * 100).toFixed(1)}% more duplicates eliminated`)

  console.log(`\n🚀 Your dashboard should now show ${finalCount} truly unique queries!`)
}

removeHeadlineDuplicates().catch(console.error)