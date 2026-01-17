"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { X, Plus, Loader2, Lightbulb } from "lucide-react"

interface OnboardingFormProps {
  userId: string
}

const SUGGESTED_KEYWORDS = [
  "Marketing",
  "SaaS",
  "Technology",
  "Finance",
  "Healthcare",
  "Real Estate",
  "Legal",
  "HR",
  "E-commerce",
  "Startups",
  "AI",
  "Cybersecurity",
]

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const [keywords, setKeywords] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function addKeyword(keyword: string) {
    const trimmed = keyword.trim().toLowerCase()
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed])
    }
    setInputValue("")
  }

  function removeKeyword(keyword: string) {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword(inputValue)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (keywords.length === 0) {
      setError("Please add at least one keyword")
      return
    }

    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()

    // Insert keywords
    const keywordRows = keywords.map((keyword) => ({
      user_id: userId,
      keyword,
    }))

    const { error: insertError } = await supabase.from("keywords").insert(keywordRows)

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Keyword Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Type a keyword and press Enter..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon" onClick={() => addKeyword(inputValue)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Keywords */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Suggestions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              <span>Suggested keywords:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_KEYWORDS.filter((s) => !keywords.includes(s.toLowerCase())).map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => addKeyword(suggestion)}
                >
                  + {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={loading || keywords.length === 0}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Go to Dashboard
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        You can update your keywords anytime from the settings page.
      </p>
    </form>
  )
}
