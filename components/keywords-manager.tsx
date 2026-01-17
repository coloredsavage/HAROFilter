"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { X, Plus, Loader2 } from "lucide-react"

interface Keyword {
  id: string
  keyword: string
  user_id: string
  created_at: string
}

interface KeywordsManagerProps {
  userId: string
  initialKeywords: Keyword[]
  keywordLimit: number
  plan: string
}

export function KeywordsManager({ userId, initialKeywords, keywordLimit, plan }: KeywordsManagerProps) {
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords)
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function addKeyword() {
    const trimmed = inputValue.trim().toLowerCase()
    if (!trimmed || keywords.some((k) => k.keyword === trimmed)) {
      setInputValue("")
      return
    }

    // Check keyword limit
    if (keywords.length >= keywordLimit) {
      setError(`You've reached your limit of ${keywordLimit} keywords. ${plan === "free" ? "Upgrade to Pro for unlimited keywords!" : ""}`)
      return
    }

    setLoading(true)
    setError(null)
    const supabase = getSupabaseBrowserClient()

    const { data, error: insertError } = await supabase
      .from("keywords")
      .insert({ user_id: userId, keyword: trimmed })
      .select()
      .single()

    if (insertError) {
      setError("Failed to add keyword. Please try again.")
      setLoading(false)
      return
    }

    if (data) {
      setKeywords([...keywords, data])
    }

    setInputValue("")
    setLoading(false)
    router.refresh()
  }

  async function removeKeyword(id: string) {
    setDeletingId(id)
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase.from("keywords").delete().eq("id", id)

    if (!error) {
      setKeywords(keywords.filter((k) => k.id !== id))
    }

    setDeletingId(null)
    router.refresh()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword()
    }
  }

  const isAtLimit = keywords.length >= keywordLimit

  return (
    <div className="space-y-4">
      {/* Add Keyword Input */}
      <div className="flex gap-2">
        <Input
          placeholder={isAtLimit ? `Limit reached (${keywordLimit} keywords)` : "Add a keyword..."}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          className="flex-1"
          disabled={isAtLimit}
        />
        <Button onClick={addKeyword} disabled={loading || !inputValue.trim() || isAtLimit}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-1">Add</span>
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">{error}</div>
      )}

      {/* Current Keywords */}
      {keywords.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <Badge key={keyword.id} variant="secondary" className="gap-1 pr-1 text-sm py-1">
              {keyword.keyword}
              <button
                type="button"
                onClick={() => removeKeyword(keyword.id)}
                disabled={deletingId === keyword.id}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 disabled:opacity-50"
              >
                {deletingId === keyword.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No keywords yet. Add keywords to start filtering HARO queries.</p>
      )}
    </div>
  )
}
