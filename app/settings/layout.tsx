import type React from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { User, Key, ArrowLeft } from "lucide-react"

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={user.user_metadata?.full_name || user.email || "User"} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <nav className="space-y-1">
            <Link href="/settings/profile">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <User className="h-4 w-4" />
                Profile
              </Button>
            </Link>
            <Link href="/settings/keywords">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Key className="h-4 w-4" />
                Keywords
              </Button>
            </Link>
          </nav>

          {/* Content */}
          <div className="md:col-span-3">{children}</div>
        </div>
      </main>
    </div>
  )
}
