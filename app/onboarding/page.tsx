import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { OnboardingForm } from "@/components/onboarding-form"
import { Filter } from "lucide-react"

export default async function OnboardingPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user already has keywords
  const { data: keywords } = await supabase.from("keywords").select("id").eq("user_id", user.id).limit(1)

  if (keywords && keywords.length > 0) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Filter className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">HAROFilter</span>
        </div>
      </header>

      {/* Onboarding Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">What topics match your expertise?</h1>
            <p className="text-muted-foreground">
              Add keywords to help us filter HARO queries that are relevant to you. You can always update these later.
            </p>
          </div>

          <OnboardingForm userId={user.id} />
        </div>
      </main>
    </div>
  )
}
