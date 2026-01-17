"use client"

import { useState, useEffect } from "react"
import { Github, Star } from "lucide-react"
import Link from "next/link"

interface GitHubStarBadgeProps {
  repo: string
  className?: string
}

export function GitHubStarBadge({ repo, className = "" }: GitHubStarBadgeProps) {
  const [starCount, setStarCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStarCount = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo}`)
        if (response.ok) {
          const data = await response.json()
          setStarCount(data.stargazers_count)
        }
      } catch (error) {
        console.error("Failed to fetch GitHub stars:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStarCount()
  }, [repo])

  const formatStarCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toLocaleString()
  }

  return (
    <Link
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <div className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-900 transition-colors border border-gray-700">
        <Github className="h-3 w-3" />
        <span className="text-sm font-medium">Star us!</span>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium">
            {isLoading ? "..." : starCount ? formatStarCount(starCount) : "0"}
          </span>
        </div>
      </div>
    </Link>
  )
}