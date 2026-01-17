// TypeScript interfaces for HARO email integration

/**
 * Represents a single HARO query extracted from an email
 */
export interface HaroQuery {
  headline: string;
  fullText: string;
  requirements: string;
  deadline: Date;
  journalistEmail: string | null;
  publication: string;
  category: string;
  haroEmailId: string;
}

/**
 * Raw parsed query before validation
 */
export interface RawHaroQuery {
  headline?: string;
  fullText?: string;
  requirements?: string;
  deadline?: string;
  journalistEmail?: string | null;
  publication?: string;
  category?: string;
  haroEmailId?: string;
}

/**
 * Result of parsing a HARO email
 */
export interface ParsedEmail {
  emailId: string;
  category: string;
  receivedAt: Date;
  queries: HaroQuery[];
  parseErrors: string[];
}

/**
 * Gmail API message metadata
 */
export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
      parts?: any[];
    }>;
  };
  internalDate: string;
}

/**
 * Email notification data
 */
export interface EmailNotification {
  id: string;
  userId: string;
  notificationType: 'new_match' | 'daily_digest' | 'urgent';
  queryIds: string[];
  sentAt: Date;
  status: 'sent' | 'failed' | 'bounced';
  errorMessage?: string;
}

/**
 * Processing log entry
 */
export interface ProcessingLog {
  id: string;
  emailId: string;
  status: 'received' | 'parsed' | 'stored' | 'matched' | 'notified' | 'failed';
  queriesExtracted: number;
  usersNotified: number;
  errorMessage?: string;
  processingTimeMs: number;
  createdAt: Date;
}

/**
 * Keyword match result
 */
export interface KeywordMatch {
  userId: string;
  queryId: string;
  matchedKeywords: string[];
  userEmail: string;
  userNotificationEnabled: boolean;
}

/**
 * User query match for insertion
 */
export interface UserQueryMatch {
  user_id: string;
  query_id: string;
  matched_keywords: string[];
  status: 'new' | 'saved' | 'responded';
}

/**
 * Email template data for new match notifications
 */
export interface NewMatchEmailData {
  userName: string;
  queries: Array<{
    headline: string;
    publication: string;
    deadline: Date;
    matchedKeywords: string[];
    isUrgent: boolean;
  }>;
  dashboardUrl: string;
  unsubscribeUrl: string;
}

/**
 * Email template data for daily digest
 */
export interface DigestEmailData {
  userName: string;
  date: Date;
  queries: Array<{
    headline: string;
    publication: string;
    deadline: Date;
    matchedKeywords: string[];
  }>;
  totalMatches: number;
  dashboardUrl: string;
  unsubscribeUrl: string;
}

/**
 * Gmail API authentication tokens
 */
export interface GmailTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

/**
 * Processing statistics for monitoring
 */
export interface ProcessingStats {
  emailsProcessed: number;
  queriesExtracted: number;
  usersNotified: number;
  errors: number;
  processingTimeMs: number;
}
