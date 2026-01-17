"use client"

import { QueryCard } from "@/components/query-card"
import { Card, CardContent } from "@/components/ui/card"
import { Inbox } from "lucide-react"

interface Query {
  id: string
  title: string
  summary: string
  outlet: string | null
  category: string | null
  deadline: string
  reporter_email: string | null
  created_at: string
}

interface UserQuery {
  query_id: string
  status: string
  responded_at: string | null
}

interface QueryListProps {
  queries: Query[]
  userId: string
  userQueryMap: Record<string, UserQuery>
  emptyMessage: string
}

export function QueryList({ queries, userId, userQueryMap, emptyMessage }: QueryListProps) {
  if (queries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {queries.map((query) => (
        <QueryCard key={query.id} query={query} userId={userId} userQuery={userQueryMap[query.id]} />
      ))}
    </div>
  )
}
