import { HaroQuery, ParsedEmail, RawHaroQuery } from '@/types/haro';

/**
 * Parse a HARO email and extract individual queries
 * @param emailBody - The full HTML or plain text email body
 * @param emailId - Gmail message ID
 * @param emailSubject - Email subject line
 * @param receivedAt - When the email was received
 * @returns ParsedEmail object with extracted queries
 */
export function parseHaroEmail(
  emailBody: string,
  emailId: string,
  emailSubject: string,
  receivedAt: Date
): ParsedEmail {
  const parseErrors: string[] = [];
  const queries: HaroQuery[] = [];

  try {
    // Extract category from subject line
    // Example: "HARO: Business & Finance Queries - Dec 15, 2023"
    const category = extractCategory(emailSubject);

    // Clean up email body (remove HTML tags if present)
    const cleanBody = cleanEmailBody(emailBody);

    // Split email into individual query sections
    const querySections = splitIntoQueries(cleanBody);

    // Parse each query section
    for (let i = 0; i < querySections.length; i++) {
      try {
        const rawQuery = parseQuerySection(querySections[i], emailId, category);

        // Validate and convert to HaroQuery
        const validatedQuery = validateQuery(rawQuery);
        if (validatedQuery) {
          queries.push(validatedQuery);
        } else {
          parseErrors.push(`Query ${i + 1}: Failed validation - missing required fields`);
        }
      } catch (error) {
        parseErrors.push(`Query ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      emailId,
      category,
      receivedAt,
      queries,
      parseErrors,
    };
  } catch (error) {
    parseErrors.push(`Email parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      emailId,
      category: 'Unknown',
      receivedAt,
      queries: [],
      parseErrors,
    };
  }
}

/**
 * Extract category from email subject line
 */
function extractCategory(subject: string): string {
  // HARO subject format: "HARO: Category Name Queries - Date"
  const match = subject.match(/HARO:\s*(.+?)\s+Queries/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return 'General';
}

/**
 * Clean email body by removing HTML tags and normalizing whitespace
 */
function cleanEmailBody(body: string): string {
  // Remove HTML tags
  let cleaned = body.replace(/<[^>]*>/g, ' ');

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Split email body into individual query sections
 */
function splitIntoQueries(body: string): string[] {
  // HARO queries are typically separated by "---" or start with "Query:"
  // Try splitting by "---" first
  let sections = body.split(/\n\s*---+\s*\n/);

  // If that doesn't work well, try splitting by "Query:" markers
  if (sections.length < 2) {
    sections = body.split(/(?=Query:)/i);
  }

  // Filter out empty sections and very short sections (likely not queries)
  return sections
    .map(s => s.trim())
    .filter(s => s.length > 50 && /Query:/i.test(s));
}

/**
 * Parse a single query section
 */
function parseQuerySection(
  section: string,
  emailId: string,
  category: string
): RawHaroQuery {
  const query: RawHaroQuery = {
    haroEmailId: emailId,
    category,
  };

  // Extract Query/Headline
  const queryMatch = section.match(/Query:\s*(.+?)(?=\n|Summary:|Requirements:|$)/is);
  if (queryMatch) {
    query.headline = queryMatch[1].trim();
  }

  // Extract Summary/Full Text
  const summaryMatch = section.match(/Summary:\s*(.+?)(?=\n\s*Requirements:|Deadline:|Contact:|Query:|$)/is);
  if (summaryMatch) {
    query.fullText = summaryMatch[1].trim();
  }

  // Extract Requirements
  const requirementsMatch = section.match(/Requirements?:\s*(.+?)(?=\n\s*Deadline:|Contact:|Query:|$)/is);
  if (requirementsMatch) {
    query.requirements = requirementsMatch[1].trim();
  }

  // Extract Deadline
  const deadlineMatch = section.match(/Deadline:\s*(.+?)(?=\n\s*Contact:|Query:|$)/is);
  if (deadlineMatch) {
    query.deadline = deadlineMatch[1].trim();
  }

  // Extract Contact Email
  const contactMatch = section.match(/Contact:\s*(.+?)(?=\n|Query:|$)/is);
  if (contactMatch) {
    const contact = contactMatch[1].trim();
    // Check if it's an email or "Not provided"
    if (contact && contact.toLowerCase() !== 'not provided' && contact.includes('@')) {
      query.journalistEmail = contact;
    } else {
      query.journalistEmail = null;
    }
  }

  // Extract publication from the query text if mentioned
  const publicationMatch = section.match(/(?:for|writing for|published in|outlet:\s*)([A-Z][A-Za-z\s&]+?)(?:\.|,|\n|$)/);
  if (publicationMatch) {
    query.publication = publicationMatch[1].trim();
  } else {
    query.publication = 'Unknown Publication';
  }

  return query;
}

/**
 * Validate and convert RawHaroQuery to HaroQuery
 */
function validateQuery(raw: RawHaroQuery): HaroQuery | null {
  // Required fields: headline, fullText, deadline
  if (!raw.headline || !raw.fullText || !raw.deadline) {
    return null;
  }

  // Parse deadline string to Date
  let deadlineDate: Date;
  try {
    deadlineDate = parseDeadline(raw.deadline);
  } catch {
    // If deadline parsing fails, set to 7 days from now as fallback
    deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);
  }

  return {
    headline: raw.headline,
    fullText: raw.fullText,
    requirements: raw.requirements || '',
    deadline: deadlineDate,
    journalistEmail: raw.journalistEmail || null,
    publication: raw.publication || 'Unknown Publication',
    category: raw.category || 'General',
    haroEmailId: raw.haroEmailId || '',
  };
}

/**
 * Parse deadline string to Date object
 * Handles formats like:
 * - "Dec 15, 2023 at 5:00 PM EST"
 * - "12/15/2023 5:00 PM"
 * - "Friday, December 15 at 5pm"
 */
function parseDeadline(deadlineStr: string): Date {
  // Remove timezone abbreviations for easier parsing
  let cleaned = deadlineStr
    .replace(/\s+(EST|EDT|PST|PDT|CST|CDT|MST|MDT)\b/gi, '')
    .trim();

  // Try to parse with Date constructor first
  let date = new Date(cleaned);

  // If that fails, try some manual parsing
  if (isNaN(date.getTime())) {
    // Try format: "December 15 at 5pm" or "Dec 15 at 5:00 PM"
    const match = cleaned.match(/([A-Za-z]+)\s+(\d+)(?:,?\s+(\d{4}))?\s+(?:at\s+)?(\d+):?(\d*)?\s*(am|pm)?/i);
    if (match) {
      const [, month, day, year, hour, minute, ampm] = match;
      const monthNum = new Date(`${month} 1, 2000`).getMonth();
      const yearNum = year ? parseInt(year) : new Date().getFullYear();
      let hourNum = parseInt(hour);

      // Handle AM/PM
      if (ampm && ampm.toLowerCase() === 'pm' && hourNum < 12) {
        hourNum += 12;
      } else if (ampm && ampm.toLowerCase() === 'am' && hourNum === 12) {
        hourNum = 0;
      }

      date = new Date(yearNum, monthNum, parseInt(day), hourNum, parseInt(minute || '0'));
    }
  }

  // If still invalid, throw error
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid deadline format: ${deadlineStr}`);
  }

  return date;
}

/**
 * Extract publication name from query text (helper function)
 */
export function extractPublication(queryText: string): string {
  // Look for common patterns like "for [Publication]" or "writing for [Publication]"
  const patterns = [
    /(?:for|writing for|published in)\s+([A-Z][A-Za-z\s&]+?)(?:\.|,|\n|$)/,
    /(?:outlet|publication):\s*([A-Za-z\s&]+?)(?:\.|,|\n|$)/i,
  ];

  for (const pattern of patterns) {
    const match = queryText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'Unknown Publication';
}

/**
 * Check if a deadline is urgent (less than 24 hours away)
 */
export function isDeadlineUrgent(deadline: Date): boolean {
  const now = new Date();
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilDeadline < 24 && hoursUntilDeadline > 0;
}
