"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function RefreshButton() {
  const router = useRouter()

  const handleRefresh = () => {
    // Force hard refresh of the current page
    router.refresh()
    window.location.reload()
  }

  return (
    <Button
      onClick={handleRefresh}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Force Refresh
    </Button>
  )
}