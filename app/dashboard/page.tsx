import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardTabs } from "@/components/dashboard-tabs"
import { RefreshButton } from "@/components/refresh-button"

// Disable caching for this page to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  // Force fresh response headers
  const headersList = await headers()
  const timestamp = Date.now()

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user has keywords, redirect to onboarding if not
  const { data: keywords, error: keywordsError } = await supabase.from("keywords").select("*").eq("user_id", user.id)

  if (!keywords || keywords.length === 0) {
    redirect("/onboarding")
  }

  // Get matching queries based on user keywords
  const keywordValues = keywords.map((k) => k.keyword.toLowerCase())

  // Add timestamp to break any potential Supabase client caching
  const queryTimestamp = Date.now()
  const { data: allQueries, error: queriesError } = await supabase
    .from("queries")
    .select(`
      id, publication, headline, full_text, requirements, journalist_contact, deadline, posted_at,
      reporter_name, outlet_url, haro_query_number, haro_edition, special_flags,
      is_direct_email, has_ai_detection, trigger_words, decoded_instructions,
      extracted_urls, haro_article_url, created_at
    `)
    .order("deadline", { ascending: true })

  // Debug: Log sample data to verify what we're getting
  if (allQueries?.length) {
    console.log(`🔍 Dashboard Debug (${new Date().toISOString()}) - Sample query data:`)
    console.log('First query headline:', allQueries[0]?.headline)
    console.log('First query requirements:', allQueries[0]?.requirements?.substring(0, 100))
    console.log('First query created_at:', allQueries[0]?.created_at)
    console.log('Total queries fetched:', allQueries.length)

    // Check for encoding artifacts
    const hasArtifacts = allQueries.some(q =>
      q.headline?.includes('â') ||
      q.requirements?.includes('â') ||
      q.full_text?.includes('â')
    )
    console.log('Has encoding artifacts:', hasArtifacts)

    if (hasArtifacts) {
      console.log('⚠️ Found corrupted data in dashboard query!')
    }
  }


  const matchingQueries =
    allQueries
      ?.filter((query) => {
        const queryText =
          `${query.headline || ""} ${query.full_text || ""} ${query.publication || ""} ${query.requirements || ""}`.toLowerCase()
        const matches = keywordValues.some((keyword) => queryText.includes(keyword))
        return matches
      })
      .map((query) => ({
        // Map database columns to component expected format
        id: query.id,
        title: query.headline,
        summary: query.requirements || query.full_text, // Use requirements as detailed description
        outlet: query.publication,
        category: null, // Will be determined from email subject
        deadline: query.deadline,
        reporter_email: query.journalist_contact,
        created_at: query.posted_at,
        // New fields
        reporter_name: query.reporter_name,
        outlet_url: query.outlet_url,
        haro_query_number: query.haro_query_number,
        special_flags: query.special_flags || [],
        is_direct_email: query.is_direct_email,
        has_ai_detection: query.has_ai_detection,
        trigger_words: query.trigger_words || [],
        decoded_instructions: query.decoded_instructions,
        extracted_urls: query.extracted_urls || [],
        haro_article_url: query.haro_article_url,
      })) || []

  // Get user's query statuses
  const { data: userQueries } = await supabase.from("user_queries").select("*").eq("user_id", user.id)

  const userQueryMap = new Map(userQueries?.map((uq) => [uq.query_id, uq]) || [])

  // Categorize queries
  const newQueries = matchingQueries.filter((q) => !userQueryMap.has(q.id))
  const savedQueries = matchingQueries.filter((q) => userQueryMap.get(q.id)?.status === "saved")
  const respondedQueries = matchingQueries.filter((q) => userQueryMap.get(q.id)?.status === "responded")

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={user.user_metadata?.full_name || user.email || "User"} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Your HARO Matches</h1>
              <p className="text-muted-foreground">
                Found {matchingQueries.length} queries matching your keywords: {keywordValues.join(", ")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Fresh data loaded at {new Date().toLocaleTimeString()}
              </p>
            </div>
            <RefreshButton />
          </div>

          <DashboardTabs
            newQueries={newQueries}
            savedQueries={savedQueries}
            respondedQueries={respondedQueries}
            userId={user.id}
            userQueryMap={Object.fromEntries(userQueryMap)}
          />
        </div>
      </main>
    </div>
  )
}
