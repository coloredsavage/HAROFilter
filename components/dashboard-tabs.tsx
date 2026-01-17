"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QueryList } from "@/components/query-list"
import { Inbox, Bookmark, CheckCircle2 } from "lucide-react"

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

interface DashboardTabsProps {
  newQueries: Query[]
  savedQueries: Query[]
  respondedQueries: Query[]
  userId: string
  userQueryMap: Record<string, UserQuery>
}

export function DashboardTabs({
  newQueries,
  savedQueries,
  respondedQueries,
  userId,
  userQueryMap,
}: DashboardTabsProps) {
  return (
    <Tabs defaultValue="new" className="space-y-4">
      <TabsList>
        <TabsTrigger value="new" className="gap-2">
          <Inbox className="h-4 w-4" />
          New ({newQueries.length})
        </TabsTrigger>
        <TabsTrigger value="saved" className="gap-2">
          <Bookmark className="h-4 w-4" />
          Saved ({savedQueries.length})
        </TabsTrigger>
        <TabsTrigger value="responded" className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Responded ({respondedQueries.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="new">
        <QueryList
          queries={newQueries}
          userId={userId}
          userQueryMap={userQueryMap}
          emptyMessage="No new queries matching your keywords. Check back soon!"
        />
      </TabsContent>

      <TabsContent value="saved">
        <QueryList
          queries={savedQueries}
          userId={userId}
          userQueryMap={userQueryMap}
          emptyMessage="No saved queries yet. Save queries to respond to them later."
        />
      </TabsContent>

      <TabsContent value="responded">
        <QueryList
          queries={respondedQueries}
          userId={userId}
          userQueryMap={userQueryMap}
          emptyMessage="No responded queries yet. Mark queries as responded after you pitch."
        />
      </TabsContent>
    </Tabs>
  )
}
