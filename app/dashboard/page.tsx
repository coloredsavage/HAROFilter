import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardTabs } from "@/components/dashboard-tabs"

export default async function DashboardPage() {
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

  const { data: allQueries, error: queriesError } = await supabase
    .from("queries")
    .select("id, publication, headline, full_text, requirements, journalist_contact, deadline, posted_at")
    .order("deadline", { ascending: true })

  console.log("[v0] Dashboard - Sample query:", allQueries?.[0])
  console.log("[v0] Dashboard - Keywords:", keywordValues)

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
        summary: query.full_text,
        outlet: query.publication,
        category: query.requirements,
        deadline: query.deadline,
        reporter_email: query.journalist_contact,
        created_at: query.posted_at,
      })) || []

  console.log("[v0] Dashboard - Matching queries:", matchingQueries.length)

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
          <div>
            <h1 className="text-2xl font-bold">Your HARO Matches</h1>
            <p className="text-muted-foreground">
              Found {matchingQueries.length} queries matching your keywords: {keywordValues.join(", ")}
            </p>
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
