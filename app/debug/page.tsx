import { getSupabaseServerClient } from "@/lib/supabase/server"

// Disable caching for debug page
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DebugPage() {
  const supabase = await getSupabaseServerClient()

  // Get the same query the dashboard uses
  const { data: allQueries, error: queriesError } = await supabase
    .from("queries")
    .select(`
      id, publication, headline, full_text, requirements, journalist_contact, deadline, posted_at,
      reporter_name, outlet_url, haro_query_number, haro_edition, special_flags,
      is_direct_email, has_ai_detection, trigger_words, decoded_instructions,
      extracted_urls, haro_article_url, created_at
    `)
    .order("deadline", { ascending: true })
    .limit(5)

  // Check for encoding artifacts
  const hasArtifacts = allQueries?.some(q =>
    q.headline?.includes('â') ||
    q.requirements?.includes('â') ||
    q.full_text?.includes('â')
  ) || false

  return (
    <div className="p-8 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">🔍 Database Debug Page</h1>
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
        <p><strong>Total Queries:</strong> {allQueries?.length || 0}</p>
        <p><strong>Has Encoding Artifacts:</strong> {hasArtifacts ? '❌ YES' : '✅ NO'}</p>
        <p><strong>Query Error:</strong> {queriesError ? queriesError.message : 'None'}</p>
      </div>

      <h2 className="text-lg font-bold mb-2">📊 Sample Query Data:</h2>
      <div className="space-y-4">
        {allQueries?.map((query, index) => (
          <div key={query.id} className="border p-4 rounded">
            <p><strong>#{index + 1} ID:</strong> {query.id}</p>
            <p><strong>Headline:</strong> {query.headline || 'NULL'}</p>
            <p><strong>Requirements (200 chars):</strong> {query.requirements?.substring(0, 200) || 'NULL'}</p>
            <p><strong>Full Text (200 chars):</strong> {query.full_text?.substring(0, 200) || 'NULL'}</p>
            <p><strong>Reporter:</strong> {query.reporter_name || 'NULL'}</p>
            <p><strong>Publication:</strong> {query.publication || 'NULL'}</p>
            <p><strong>Created:</strong> {query.created_at}</p>
            <p><strong>Has â artifacts:</strong> {
              (query.headline?.includes('â') || query.requirements?.includes('â') || query.full_text?.includes('â'))
                ? '❌ YES'
                : '✅ NO'
            }</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-yellow-100 p-4 rounded">
        <h2 className="font-bold">🔧 Debug Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Check if this page shows clean data vs your dashboard</li>
          <li>Visit <code>/api/debug/raw-queries</code> for JSON view</li>
          <li>Compare timestamps to ensure fresh data</li>
          <li>If this shows clean data but dashboard doesn't, it's a component issue</li>
          <li>If both show corrupted data, it's a database/connection issue</li>
        </ol>
      </div>
    </div>
  )
}