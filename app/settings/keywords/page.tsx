import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { KeywordsManager } from "@/components/keywords-manager"
import { UpgradeBanner } from "@/components/upgrade-banner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function KeywordsSettingsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: keywords } = await supabase.from("keywords").select("*").eq("user_id", user.id).order("created_at")

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, keyword_limit")
    .eq("id", user.id)
    .single()

  const plan = profile?.plan || "free"
  const keywordLimit = profile?.keyword_limit || 5

  return (
    <div className="space-y-4">
      {plan === "free" && <UpgradeBanner userId={user.id} currentCount={keywords?.length || 0} limit={keywordLimit} />}

      <Card>
        <CardHeader>
          <CardTitle>Keywords</CardTitle>
          <CardDescription>
            Manage the keywords used to filter HARO queries for you.{" "}
            <span className="font-semibold">
              ({keywords?.length || 0}/{keywordLimit} keywords)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeywordsManager
            userId={user.id}
            initialKeywords={keywords || []}
            keywordLimit={keywordLimit}
            plan={plan}
          />
        </CardContent>
      </Card>
    </div>
  )
}
