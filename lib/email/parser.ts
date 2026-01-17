import { HaroQuery, ParsedEmail, RawHaroQuery } from '@/types/haro';

/**
 * Parse a HARO email and extract individual queries
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
    const category = extractCategory(emailSubject);
    const cleanBody = cleanEmailBody(emailBody);
    const querySections = splitIntoQueries(cleanBody);

    for (let i = 0; i < querySections.length; i++) {
      try {
        const rawQuery = parseQuerySection(querySections[i], emailId, category);
        const validatedQuery = validateQuery(rawQuery);

        if (validatedQuery) {
          queries.push(validatedQuery);
        } else {
          parseErrors.push(`Query ${i + 1}: Failed validation - missing required fields`);
        }
      } catch (error) {
        parseErrors.push(
          `Query ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return { emailId, category, receivedAt, queries, parseErrors };
  } catch (error) {
    parseErrors.push(
      `Email parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
  const match = subject.match(/HARO:\s*(.+?)\s+Queries/i);
  return match?.[1]?.trim() ?? 'General';
}

/**
 * Clean email body
 */
function cleanEmailBody(body: string): string {
  let cleaned = body.replace(/<[^>]*>/g, ' ');

  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Split email body into individual query sections
 */
function splitIntoQueries(body: string): string[] {
  let sections = body.split(/\n\s*---+\s*\n/);

  if (sections.length < 2) {
    sections = body.split(/(?=Query:)/i);
  }

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

  // Query / Headline
  const queryMatch = section.match(
    /Query:\s*([\s\S]+?)(?=\n|Summary:|Requirements:|$)/i
  );
  if (queryMatch) query.headline = queryMatch[1].trim();

  // Summary
  const summaryMatch = section.match(
    /Summary:\s*([\s\S]+?)(?=\n\s*Requirements:|Deadline:|Contact:|Query:|$)/i
  );
  if (summaryMatch) query.fullText = summaryMatch[1].trim();

  // Requirements
  const requirementsMatch = section.match(
    /Requirements?:\s*([\s\S]+?)(?=\n\s*Deadline:|Contact:|Query:|$)/i
  );
  if (requirementsMatch) query.requirements = requirementsMatch[1].trim();

  // Deadline
  const deadlineMatch = section.match(
    /Deadline:\s*([\s\S]+?)(?=\n\s*Contact:|Query:|$)/i
  );
  if (deadlineMatch) query.deadline = deadlineMatch[1].trim();

  // Contact email
  const contactMatch = section.match(
    /Contact:\s*([\s\S]+?)(?=\n|Query:|$)/i
  );
  if (contactMatch) {
    const contact = contactMatch[1].trim();
    query.journalistEmail =
      contact && contact.includes('@') && contact.toLowerCase() !== 'not provided'
        ? contact
        : null;
  }

  // Publication
  const publicationMatch = section.match(
    /(?:for|writing for|published in|outlet:\s*)([A-Z][A-Za-z\s&]+?)(?:\.|,|\n|$)/
  );
  query.publication = publicationMatch?.[1]?.trim() ?? 'Unknown Publication';

  return query;
}

/**
 * Validate and convert RawHaroQuery to HaroQuery
 */
function validateQuery(raw: RawHaroQuery): HaroQuery | null {
  if (!raw.headline || !raw.fullText || !raw.deadline) return null;

  let deadlineDate: Date;
  try {
    deadlineDate = parseDeadline(raw.deadline);
  } catch {
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
 * Parse deadline string
 */
function parseDeadline(deadlineStr: string): Date {
  const cleaned = deadlineStr
    .replace(/\s+(EST|EDT|PST|PDT|CST|CDT|MST|MDT)\b/gi, '')
    .trim();

  let date = new Date(cleaned);

  if (isNaN(date.getTime())) {
    const match = cleaned.match(
      /([A-Za-z]+)\s+(\d+)(?:,?\s+(\d{4}))?\s+(?:at\s+)?(\d+):?(\d*)?\s*(am|pm)?/i
    );

    if (match) {
      const [, month, day, year, hour, minute, ampm] = match;
      const monthNum = new Date(`${month} 1, 2000`).getMonth();
      const yearNum = year ? parseInt(year) : new Date().getFullYear();
      let hourNum = parseInt(hour);

      if (ampm?.toLowerCase() === 'pm' && hourNum < 12) hourNum += 12;
      if (ampm?.toLowerCase() === 'am' && hourNum === 12) hourNum = 0;

      date = new Date(
        yearNum,
        monthNum,
        parseInt(day),
        hourNum,
        parseInt(minute || '0')
      );
    }
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid deadline format: ${deadlineStr}`);
  }

  return date;
}

/**
 * Deadline urgency check
 */
export function isDeadlineUrgent(deadline: Date): boolean {
  const hours = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);
  return hours < 24 && hours > 0;
}
