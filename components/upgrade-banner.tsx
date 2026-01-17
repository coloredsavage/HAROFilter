"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, X } from "lucide-react"
import Link from "next/link"

interface UpgradeBannerProps {
  userId: string
  currentCount: number
  limit: number
}

export function UpgradeBanner({ userId, currentCount, limit }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  if (dismissed) return null

  async function handleUpgrade() {
    setUpgrading(true)

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Upgrade error:", error)
      setUpgrading(false)
    }
  }

  const isNearLimit = currentCount >= limit - 1

  return (
    <div
      className={`relative rounded-lg p-6 ${
        isNearLimit ? "bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200" : "bg-blue-50 border border-blue-200"
      }`}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="rounded-full bg-blue-100 p-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            {isNearLimit ? "🚀 Upgrade to unlock unlimited keywords!" : "Get unlimited keywords"}
          </h3>
          <p className="text-gray-700 mb-4">
            {isNearLimit
              ? `You're using ${currentCount}/${limit} keywords. Upgrade to Pro for unlimited keywords - just $5 one-time, lifetime access.`
              : "Upgrade to Pro for unlimited keywords for just $5 one-time. No monthly fees, lifetime access."}
          </p>

          <div className="flex gap-3">
            <Button onClick={handleUpgrade} disabled={upgrading} className="bg-blue-600 hover:bg-blue-700">
              {upgrading ? "Redirecting..." : "Upgrade for $5"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
