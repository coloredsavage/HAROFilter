"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Bookmark, CheckCircle2, Clock, ExternalLink, Mail, Loader2, AlertTriangle, Shield, User, Globe } from "lucide-react"
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns"

interface Query {
  id: string
  title: string
  summary: string
  outlet: string | null
  category: string | null
  deadline: string
  reporter_email: string | null
  created_at: string
  // New fields from schema update
  reporter_name?: string | null
  outlet_url?: string | null
  haro_query_number?: number | null
  special_flags?: string[]
  is_direct_email?: boolean
  has_ai_detection?: boolean
  trigger_words?: string[]
  decoded_instructions?: string | null
}

interface UserQuery {
  query_id: string
  status: string
  responded_at: string | null
}

interface QueryCardProps {
  query: Query
  userId: string
  userQuery?: UserQuery
}

// Clean text from encoding artifacts at display time
function cleanDisplayText(text: string): string {
  if (!text) return text;

  return text
    // Remove common encoding artifacts
    .replace(/[âÂ]+/g, ' ')
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€\x9D/g, '"')
    .replace(/â€"/g, '–')
    .replace(/â€\x94/g, '—')
    .replace(/â€¦/g, '...')
    .replace(/Â/g, ' ')
    // Fix common contractions with encoding issues
    .replace(/weâ€™re/g, "we're")
    .replace(/weâ€™ll/g, "we'll")
    .replace(/youâ€™re/g, "you're")
    .replace(/itâ€™s/g, "it's")
    .replace(/donâ€™t/g, "don't")
    .replace(/canâ€™t/g, "can't")
    .replace(/wonâ€™t/g, "won't")
    .replace(/isnâ€™t/g, "isn't")
    .replace(/hasnâ€™t/g, "hasn't")
    .replace(/havenâ€™t/g, "haven't")
    .replace(/didnâ€™t/g, "didn't")
    .replace(/wouldnâ€™t/g, "wouldn't")
    .replace(/couldnâ€™t/g, "couldn't")
    .replace(/shouldnâ€™t/g, "shouldn't")
    // Legacy patterns
    .replace(/weâÂôre/g, "we're")
    .replace(/weâÂll/g, "we'll")
    .replace(/youâÂre/g, "you're")
    .replace(/itâÂs/g, "it's")
    .replace(/donâÂt/g, "don't")
    .replace(/canâÂt/g, "can't")
    .replace(/wonâÂt/g, "won't")
    // Remove any remaining invalid characters (keep normal punctuation and symbols)
    .replace(/[^\w\s.,;:!?()\-'"\/\[\]{}@#$%&*+=<>|~`]/g, ' ')
    // Clean up excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export function QueryCard({ query, userId, userQuery }: QueryCardProps) {
  const [status, setStatus] = useState(userQuery?.status || null)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const deadline = new Date(query.deadline)
  const isExpired = isPast(deadline)
  const daysUntil = differenceInDays(deadline, new Date())

  function getDeadlineBadgeVariant() {
    if (isExpired) return "destructive"
    if (daysUntil <= 1) return "destructive"
    if (daysUntil <= 3) return "secondary"
    return "outline"
  }

  async function handleStatusChange(newStatus: "saved" | "responded") {
    setLoading(newStatus)
    const supabase = getSupabaseBrowserClient()

    try {
      if (status === newStatus) {
        // Remove status
        const { error } = await supabase
          .from("user_queries")
          .delete()
          .eq("user_id", userId)
          .eq("query_id", query.id)

        if (error) {
          console.error('Error removing query status:', error)
          throw error
        }

        setStatus(null)
      } else {
        // Upsert status
        const { error } = await supabase
          .from("user_queries")
          .upsert(
            {
              user_id: userId,
              query_id: query.id,
              status: newStatus,
              responded_at: newStatus === "responded" ? new Date().toISOString() : null,
            },
            {
              onConflict: "user_id,query_id",
            },
          )

        if (error) {
          console.error('Error updating query status:', error)
          throw error
        }

        setStatus(newStatus)
      }

      setLoading(null)
      router.refresh()
    } catch (error) {
      console.error('Database operation failed:', error)
      setLoading(null)
      // You might want to show a toast notification here about the error
    }
  }

  return (
    <Card className={isExpired ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {query.category && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {cleanDisplayText(query.category)}
                </Badge>
              )}
              {query.special_flags?.includes('no_ai') && (
                <Badge variant="destructive" className="text-xs shrink-0 gap-1">
                  <Shield className="h-3 w-3" />
                  No AI
                </Badge>
              )}
              {query.is_direct_email && (
                <Badge variant="default" className="text-xs shrink-0 gap-1">
                  <Mail className="h-3 w-3" />
                  Direct
                </Badge>
              )}
              {query.outlet && (
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">{cleanDisplayText(query.outlet)}</span>
              )}
              {query.reporter_name && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {cleanDisplayText(query.reporter_name)}
                </span>
              )}
            </div>
            <h3 className="font-semibold leading-tight">{cleanDisplayText(query.title)}</h3>
          </div>

          <Badge variant={getDeadlineBadgeVariant()} className="shrink-0 gap-1 self-start whitespace-nowrap">
            <Clock className="h-3 w-3" />
            {isExpired ? "Expired" : `${formatDistanceToNow(deadline)} left`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {query.has_ai_detection && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">AI Detection Warning</span>
            </div>
            <p className="text-sm text-yellow-700">
              This query contains hidden anti-AI instructions. Avoid using these trigger words:
            </p>
            {query.trigger_words && query.trigger_words.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {query.trigger_words.map((word, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-yellow-100 border-yellow-300">
                    {cleanDisplayText(word)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-3">{cleanDisplayText(query.summary)}</p>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              variant={status === "saved" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange("saved")}
              disabled={loading !== null}
            >
              {loading === "saved" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bookmark className={`h-4 w-4 ${status === "saved" ? "fill-current" : ""}`} />
              )}
              <span className="ml-1">Save</span>
            </Button>

            <Button
              variant={status === "responded" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange("responded")}
              disabled={loading !== null}
            >
              {loading === "responded" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className={`h-4 w-4 ${status === "responded" ? "fill-current" : ""}`} />
              )}
              <span className="ml-1">Responded</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {query.outlet_url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={query.outlet_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-1" />
                  Outlet
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
            {query.reporter_email && (
              <Button variant="ghost" size="sm" asChild>
                <a href={`mailto:${query.reporter_email}`}>
                  <Mail className="h-4 w-4 mr-1" />
                  Pitch
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
