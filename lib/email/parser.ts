import { HaroQuery, ParsedEmail, RawHaroQuery } from '@/types/haro';

/**
 * Anti-AI Detection System
 */
interface AiDetectionResult {
  hasAiDetection: boolean;
  triggerWords: string[];
  decodedInstructions: string | null;
  cleanedText: string;
}

/**
 * Detect and decode anti-AI instructions hidden in text
 */
function detectAntiAiInstructions(text: string): AiDetectionResult {
  const result: AiDetectionResult = {
    hasAiDetection: false,
    triggerWords: [],
    decodedInstructions: null,
    cleanedText: text
  };

  // Look for base64 encoded strings (50+ chars, ends with =)
  const base64Regex = /[A-Za-z0-9+/]{50,}=*/g;
  const base64Matches = text.match(base64Regex);

  // Look for hex encoded strings (50+ chars, only hex digits)
  const hexRegex = /[0-9a-fA-F]{50,}/g;
  const hexMatches = text.match(hexRegex);

  let cleanedText = text;

  // Process base64 strings
  if (base64Matches) {
    for (const match of base64Matches) {
      try {
        const decoded = atob(match);
        if (decoded.toLowerCase().includes('ai') && decoded.toLowerCase().includes('word')) {
          result.hasAiDetection = true;
          result.decodedInstructions = decoded;
          // Extract trigger words from instructions
          const wordMatches = decoded.match(/"([^"]+)"|'([^']+)'|word\s+(\w+)/gi);
          if (wordMatches) {
            result.triggerWords.push(...wordMatches.map(w => w.replace(/["']/g, '').replace(/word\s+/i, '')));
          }
          cleanedText = cleanedText.replace(match, '');
        }
      } catch {
        // Not valid base64, skip
      }
    }
  }

  // Process hex strings
  if (hexMatches) {
    for (const match of hexMatches) {
      try {
        const decoded = Buffer.from(match, 'hex').toString('utf8');
        if (decoded.toLowerCase().includes('ai') && decoded.toLowerCase().includes('word')) {
          result.hasAiDetection = true;
          result.decodedInstructions = decoded;
          // Extract trigger words from instructions
          const wordMatches = decoded.match(/"([^"]+)"|'([^']+)'|word\s+(\w+)/gi);
          if (wordMatches) {
            result.triggerWords.push(...wordMatches.map(w => w.replace(/["']/g, '').replace(/word\s+/i, '')));
          }
          cleanedText = cleanedText.replace(match, '');
        }
      } catch {
        // Not valid hex, skip
      }
    }
  }

  result.cleanedText = cleanedText.trim();
  return result;
}

/**
 * Extract and categorize URLs from query text
 */
function extractUrls(text: string): { extractedUrls: string[], haroArticleUrl: string | null } {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  const urls = text.match(urlRegex) || [];

  // Clean and deduplicate URLs
  const cleanUrls = [...new Set(urls.map(url => {
    // Remove trailing punctuation that's likely not part of the URL
    return url.replace(/[.,;:!?)\]}]+$/, '');
  }))];

  // Try to identify HARO article/reference URLs
  let haroArticleUrl = null;
  const potentialHaroUrls = cleanUrls.filter(url =>
    url.includes('helpareporter.com') ||
    url.includes('haro') ||
    url.includes('journalist') ||
    // Common article patterns
    (url.includes('article') || url.includes('story') || url.includes('news'))
  );

  if (potentialHaroUrls.length > 0) {
    haroArticleUrl = potentialHaroUrls[0]; // Take the first one
  }

  return {
    extractedUrls: cleanUrls,
    haroArticleUrl
  };
}

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
        console.log(`🔍 Processing query section ${i + 1}:`);
        console.log(`📝 Section preview (first 300 chars): "${querySections[i].substring(0, 300).replace(/\n/g, '\\n')}..."`);

        const rawQuery = parseQuerySection(querySections[i], emailId, category);
        console.log(`📊 Extracted fields: headline="${rawQuery.headline?.substring(0, 50)}...", fullText="${rawQuery.fullText?.substring(0, 50)}...", deadline="${rawQuery.deadline}"`);

        const validatedQuery = validateQuery(rawQuery);

        if (validatedQuery) {
          queries.push(validatedQuery);
          console.log(`✅ Query ${i + 1}: Successfully validated`);
        } else {
          console.log(`❌ Query ${i + 1}: Failed validation - headline=${!!rawQuery.headline}, fullText=${!!rawQuery.fullText}, deadline=${!!rawQuery.deadline}`);
          parseErrors.push(`Query ${i + 1}: Failed validation - missing required fields`);
        }
      } catch (error) {
        console.log(`❌ Query ${i + 1}: Error during parsing:`, error);
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
 * Parse a single query section with enhanced field extraction
 */
function parseQuerySection(
  section: string,
  emailId: string,
  category: string,
  queryNumber?: number,
  edition?: string
): RawHaroQuery {
  // Detect anti-AI instructions first
  const aiDetection = detectAntiAiInstructions(section);

  const query: RawHaroQuery = {
    haroEmailId: emailId,
    category,
    haroQueryNumber: queryNumber || null,
    haroEdition: edition || null,
    hasAiDetection: aiDetection.hasAiDetection,
    triggerWords: aiDetection.triggerWords,
    decodedInstructions: aiDetection.decodedInstructions,
    specialFlags: [],
    isDirectEmail: false,
  };

  // Use cleaned text for further parsing
  const cleanedSection = aiDetection.cleanedText;

  // Extract reporter name from "Name: Reporter Name" pattern
  const nameMatch = cleanedSection.match(/Name:\s*([^\n]+)/i);
  if (nameMatch) query.reporterName = nameMatch[1].trim();

  // Extract query number from section (e.g., "1) Summary:" or "Query #5")
  if (!query.haroQueryNumber) {
    const numberMatch = cleanedSection.match(/(?:^|\n)(\d+)\)\s*Summary:|Query\s*#?(\d+)/i);
    if (numberMatch) query.haroQueryNumber = parseInt(numberMatch[1] || numberMatch[2]);
  }

  // Query / Headline
  const queryMatch = cleanedSection.match(
    /(?:Query:|Summary:)\s*([\s\S]+?)(?=\n(?:Name:|Category:|Email:|Media Outlet:|Deadline:)|$)/i
  );
  if (queryMatch) query.headline = queryMatch[1].trim();

  // Full text (longer description)
  const fullTextMatch = cleanedSection.match(
    /Query:\s*([\s\S]+?)(?=\n\s*(?:Requirements?:|Back to Top|------|$))/i
  );
  if (fullTextMatch) query.fullText = fullTextMatch[1].trim();

  // Requirements
  const requirementsMatch = cleanedSection.match(
    /Requirements?:\s*([\s\S]+?)(?=\n\s*(?:Deadline:|Contact:|Query:|Back to Top|$))/i
  );
  if (requirementsMatch) query.requirements = requirementsMatch[1].trim();

  // Deadline
  const deadlineMatch = cleanedSection.match(
    /Deadline:\s*([\s\S]+?)(?=\n\s*(?:Contact:|Query:|Back to Top|$))/i
  );
  if (deadlineMatch) query.deadline = deadlineMatch[1].trim();

  // Contact email - detect if it's HARO reply email or direct
  const emailMatch = cleanedSection.match(/Email:\s*([^\n]+)/i);
  if (emailMatch) {
    const email = emailMatch[1].trim();
    query.journalistEmail = email && email.includes('@') ? email : null;
    query.isDirectEmail = !email.includes('helpareporter.com');
  }

  // Media outlet name and URL
  const outletMatch = cleanedSection.match(/Media Outlet:\s*([^(]+)(?:\s*\(([^)]+)\))?/i);
  if (outletMatch) {
    query.publication = outletMatch[1].trim();
    if (outletMatch[2] && outletMatch[2].startsWith('http')) {
      query.outletUrl = outletMatch[2].trim();
    }
  }

  // Special flags detection
  const flags = [];
  if (cleanedSection.toLowerCase().includes('no ai pitches')) flags.push('no_ai');
  if (cleanedSection.toLowerCase().includes('urgent')) flags.push('urgent');
  if (cleanedSection.toLowerCase().includes('paid')) flags.push('paid');
  if (cleanedSection.toLowerCase().includes('exclusive')) flags.push('exclusive');
  query.specialFlags = flags;

  // Extract URLs from the entire section
  const urlExtraction = extractUrls(section); // Use original section to catch all URLs
  query.extractedUrls = urlExtraction.extractedUrls;
  query.haroArticleUrl = urlExtraction.haroArticleUrl;

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
    // New fields
    reporterName: raw.reporterName || null,
    outletUrl: raw.outletUrl || null,
    haroQueryNumber: raw.haroQueryNumber || null,
    haroEdition: raw.haroEdition || null,
    specialFlags: raw.specialFlags || [],
    isDirectEmail: raw.isDirectEmail || false,
    hasAiDetection: raw.hasAiDetection || false,
    triggerWords: raw.triggerWords || [],
    decodedInstructions: raw.decodedInstructions || null,
    extractedUrls: raw.extractedUrls || [],
    haroArticleUrl: raw.haroArticleUrl || null,
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
