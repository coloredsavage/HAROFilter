import type { SupabaseClient } from "@supabase/supabase-js"

export interface KeywordLimitCheck {
  canAdd: boolean
  currentCount: number
  limit: number
  plan: "free" | "pro"
}

export async function checkKeywordLimit(
  userId: string,
  supabase: SupabaseClient
): Promise<KeywordLimitCheck> {
  // Get user's plan and keyword limit
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, keyword_limit")
    .eq("id", userId)
    .single()

  if (profileError || !profile) {
    throw new Error("Failed to fetch user profile")
  }

  // Count current keywords
  const { data: keywords, error: keywordsError } = await supabase
    .from("keywords")
    .select("id")
    .eq("user_id", userId)

  if (keywordsError) {
    throw new Error("Failed to fetch keywords")
  }

  const currentCount = keywords?.length ?? 0
  const limit = profile.keyword_limit ?? 5
  const canAdd = currentCount < limit

  return {
    canAdd,
    currentCount,
    limit,
    plan: profile.plan ?? "free",
  }
}

export async function canAddKeyword(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const check = await checkKeywordLimit(userId, supabase)
  return check.canAdd
}
