import { createClient } from '@/lib/supabase/server';
import { HaroQuery, KeywordMatch, UserQueryMatch } from '@/types/haro';

/**
 * Match HARO queries to user keywords
 * @param queries - Array of parsed HARO queries
 * @returns Array of user-query matches
 */
export async function matchQueriesToKeywords(
  queries: HaroQuery[]
): Promise<UserQueryMatch[]> {
  const supabase = await createClient();
  const matches: UserQueryMatch[] = [];

  try {
    // Fetch all active keywords with user information
    const { data: keywords, error: keywordsError } = await supabase
      .from('keywords')
      .select(`
        id,
        keyword,
        user_id,
        profiles!inner (
          email,
          email_new_matches
        )
      `)
      .order('keyword');

    if (keywordsError) {
      console.error('Error fetching keywords:', keywordsError);
      throw keywordsError;
    }

    if (!keywords || keywords.length === 0) {
      console.log('No keywords found in database');
      return [];
    }

    // For each query, check if it matches any keywords
    for (const query of queries) {
      const matchedKeywords: Map<string, string[]> = new Map(); // userId -> matched keywords

      // Search text includes headline, full text, and requirements
      const searchText = `${query.headline} ${query.fullText} ${query.requirements}`.toLowerCase();

      // Check each keyword
      for (const keywordData of keywords) {
        const keyword = keywordData.keyword.toLowerCase();

        // Case-insensitive, whole-word matching
        const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');

        if (regex.test(searchText)) {
          // Add to matched keywords for this user
          if (!matchedKeywords.has(keywordData.user_id)) {
            matchedKeywords.set(keywordData.user_id, []);
          }
          matchedKeywords.get(keywordData.user_id)!.push(keywordData.keyword);
        }
      }

      // For this query, we need to first insert it and get its ID
      // This will be done by the query processor, so we'll return a placeholder
      // The processor will handle inserting queries and then creating matches

      // Store match data for later processing
      for (const [userId, keywords] of matchedKeywords.entries()) {
        matches.push({
          user_id: userId,
          query_id: '', // Will be filled in by processor after query insertion
          matched_keywords: keywords,
          status: 'new',
        });
      }
    }

    return matches;
  } catch (error) {
    console.error('Error matching queries to keywords:', error);
    throw error;
  }
}

/**
 * Match a single query to keywords and return matching users
 * @param query - HARO query to match
 * @returns Array of keyword matches with user information
 */
export async function matchQueryToKeywords(
  query: HaroQuery
): Promise<KeywordMatch[]> {
  const supabase = await createClient();
  const matches: KeywordMatch[] = [];

  try {
    // Fetch all active keywords with user information
    const { data: keywords, error: keywordsError } = await supabase
      .from('keywords')
      .select(`
        id,
        keyword,
        user_id,
        profiles!inner (
          email,
          email_new_matches
        )
      `)
      .order('keyword');

    if (keywordsError) {
      throw keywordsError;
    }

    if (!keywords) {
      return [];
    }

    // Search text includes headline, full text, and requirements
    const searchText = `${query.headline} ${query.fullText} ${query.requirements}`.toLowerCase();

    // Track matches per user to avoid duplicates
    const userMatches: Map<string, KeywordMatch> = new Map();

    // Check each keyword
    for (const keywordData of keywords) {
      const keyword = keywordData.keyword.toLowerCase();

      // Case-insensitive, whole-word matching
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');

      if (regex.test(searchText)) {
        const userId = keywordData.user_id;

        if (userMatches.has(userId)) {
          // Add keyword to existing match
          userMatches.get(userId)!.matchedKeywords.push(keywordData.keyword);
        } else {
          // Create new match
          const profile = Array.isArray(keywordData.profiles)
            ? keywordData.profiles[0]
            : keywordData.profiles;

          userMatches.set(userId, {
            userId,
            queryId: '', // Will be filled in after query insertion
            matchedKeywords: [keywordData.keyword],
            userEmail: profile?.email || '',
            userNotificationEnabled: profile?.email_new_matches || false,
          });
        }
      }
    }

    return Array.from(userMatches.values());
  } catch (error) {
    console.error('Error matching query to keywords:', error);
    throw error;
  }
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create user_queries records for matched queries
 * @param matches - Array of keyword matches with query IDs
 */
export async function createUserQueryRecords(
  matches: KeywordMatch[]
): Promise<void> {
  if (matches.length === 0) {
    return;
  }

  const supabase = await createClient();

  try {
    // Prepare user_queries records for insertion
    const userQueries = matches.map((match) => ({
      user_id: match.userId,
      query_id: match.queryId,
      matched_keywords: match.matchedKeywords,
      status: 'new',
    }));

    // Batch insert user_queries records
    const { error } = await supabase.from('user_queries').insert(userQueries);

    if (error) {
      console.error('Error creating user_queries records:', error);
      throw error;
    }

    console.log(`Created ${userQueries.length} user_query records`);
  } catch (error) {
    console.error('Error in createUserQueryRecords:', error);
    throw error;
  }
}
