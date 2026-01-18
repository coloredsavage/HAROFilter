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

async function checkRemainingDuplicates() {
  console.log('🔍 Checking for remaining duplicates with different matching strategies...\n')

  const { data: allQueries, error } = await supabase
    .from('queries')
    .select('id, headline, publication, reporter_name, journalist_contact, deadline, created_at, posted_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Error fetching queries:', error)
    return
  }

  console.log(`📊 Current database state: ${allQueries?.length || 0} queries`)

  if (!allQueries || allQueries.length === 0) {
    return
  }

  // Strategy 1: Exact headline matches (stricter)
  console.log(`\n🎯 Strategy 1: Exact headline duplicates`)
  const headlineGroups = new Map<string, any[]>()

  allQueries.forEach(query => {
    const key = query.headline?.toLowerCase().trim() || 'no-headline'
    if (!headlineGroups.has(key)) {
      headlineGroups.set(key, [])
    }
    headlineGroups.get(key)!.push(query)
  })

  const headlineDuplicates = Array.from(headlineGroups.values()).filter(group => group.length > 1)
  console.log(`   Found ${headlineDuplicates.length} headline duplicate groups`)

  if (headlineDuplicates.length > 0) {
    console.log(`   📋 Sample headline duplicates:`)
    headlineDuplicates.slice(0, 5).forEach((group, index) => {
      console.log(`      ${index + 1}. "${group[0].headline}" (${group.length} copies)`)
      group.forEach((query, i) => {
        console.log(`         ${query.id} - Reporter: ${query.reporter_name || 'NULL'} - Created: ${query.created_at}`)
      })
    })
  }

  // Strategy 2: Similar headlines with minor variations
  console.log(`\n🎯 Strategy 2: Similar headlines (fuzzy matching)`)
  const similarGroups = new Map<string, any[]>()

  allQueries.forEach(query => {
    // Normalize headline for fuzzy matching
    const normalizedHeadline = query.headline
      ?.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim() || 'no-headline'

    if (!similarGroups.has(normalizedHeadline)) {
      similarGroups.set(normalizedHeadline, [])
    }
    similarGroups.get(normalizedHeadline)!.push(query)
  })

  const similarDuplicates = Array.from(similarGroups.values()).filter(group => group.length > 1)
  console.log(`   Found ${similarDuplicates.length} similar headline groups`)

  if (similarDuplicates.length > 0) {
    console.log(`   📋 Sample similar duplicates:`)
    similarDuplicates.slice(0, 5).forEach((group, index) => {
      console.log(`      ${index + 1}. Similar to "${group[0].headline}" (${group.length} copies)`)
      group.forEach((query, i) => {
        console.log(`         "${query.headline}" - ID: ${query.id}`)
      })
    })
  }

  // Strategy 3: Same reporter + similar deadline
  console.log(`\n🎯 Strategy 3: Same reporter with close deadlines`)
  const reporterGroups = new Map<string, any[]>()

  allQueries.forEach(query => {
    if (query.reporter_name) {
      const key = query.reporter_name.toLowerCase().trim()
      if (!reporterGroups.has(key)) {
        reporterGroups.set(key, [])
      }
      reporterGroups.get(key)!.push(query)
    }
  })

  const reporterDuplicates = Array.from(reporterGroups.values()).filter(group => group.length > 1)
  console.log(`   Found ${reporterDuplicates.length} reporters with multiple queries`)

  if (reporterDuplicates.length > 0) {
    console.log(`   📋 Sample reporter duplicates:`)
    reporterDuplicates.slice(0, 3).forEach((group, index) => {
      console.log(`      ${index + 1}. Reporter: ${group[0].reporter_name} (${group.length} queries)`)
      group.forEach((query, i) => {
        console.log(`         "${query.headline}" - Deadline: ${query.deadline}`)
      })
    })
  }

  // Count total potential duplicates
  const totalHeadlineDuplicates = headlineDuplicates.reduce((sum, group) => sum + (group.length - 1), 0)
  const totalSimilarDuplicates = similarDuplicates.reduce((sum, group) => sum + (group.length - 1), 0)

  console.log(`\n📊 Summary of remaining duplicates:`)
  console.log(`   ${totalHeadlineDuplicates} exact headline duplicates to remove`)
  console.log(`   ${totalSimilarDuplicates} similar headline duplicates to remove`)
  console.log(`   ${reporterDuplicates.length} reporters with multiple queries`)

  if (totalHeadlineDuplicates > 0 || totalSimilarDuplicates > 0) {
    console.log(`\n⚠️  You're right - there are still duplicates to clean up!`)
    console.log(`💡 The previous script used headline+reporter+deadline matching`)
    console.log(`💡 But some duplicates have slight variations or missing data`)
  } else {
    console.log(`\n✅ No obvious duplicates found. The issue might be browser cache.`)
    console.log(`💡 Try force refresh or check if you're seeing old cached data`)
  }

  return { headlineDuplicates, similarDuplicates }
}

checkRemainingDuplicates().catch(console.error)