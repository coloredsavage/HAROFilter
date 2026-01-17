type ProfileRow = {
  plan: "free" | "pro" | null
  keyword_limit: number | null
}

export async function checkKeywordLimit(
  userId: string,
  supabase: ReturnType<typeof createClient>
): Promise<KeywordLimitCheck> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, keyword_limit")
    .eq("id", userId)
    .single<ProfileRow>()

  if (profileError || !profile) {
    throw new Error("Failed to fetch user profile")
  }

  const { data: keywords, error: keywordsError } = await supabase
    .from("keywords")
    .select("id")
    .eq("user_id", userId)

  if (keywordsError) {
    throw new Error("Failed to fetch keywords")
  }

  const currentCount = keywords?.length ?? 0
  const limit = profile.keyword_limit ?? 5

  return {
    canAdd: currentCount < limit,
    currentCount,
    limit,
    plan: profile.plan ?? "free",
  }
}
