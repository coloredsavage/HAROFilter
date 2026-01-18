import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role to bypass RLS and see all data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get latest queries directly from database
    const { data: queries, error } = await supabase
      .from('queries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check for encoding artifacts
    const hasArtifacts = queries?.some(q =>
      q.headline?.includes('â') ||
      q.requirements?.includes('â') ||
      q.full_text?.includes('â')
    ) || false

    const response = {
      timestamp: new Date().toISOString(),
      total_queries_found: queries?.length || 0,
      has_encoding_artifacts: hasArtifacts,
      database_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      sample_queries: queries?.map(q => ({
        id: q.id,
        headline: q.headline,
        requirements_preview: q.requirements?.substring(0, 200) || 'NULL',
        full_text_preview: q.full_text?.substring(0, 200) || 'NULL',
        reporter_name: q.reporter_name,
        publication: q.publication,
        created_at: q.created_at,
        has_headline_artifacts: q.headline?.includes('â') || false,
        has_requirements_artifacts: q.requirements?.includes('â') || false,
      })) || []
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    )
  }
}