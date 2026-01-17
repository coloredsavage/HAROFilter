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

  // Additional cleaning for encoding artifacts and garbage characters
  cleanedText = cleanedText
    // Remove common encoding artifacts
    .replace(/[âÂ]+/g, ' ')
    .replace(/[^\w\s.,;:!?()\-'"\/\[\]{}@#$%&*+=<>|~`]/g, ' ')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove lines that are mostly garbage characters
    .split('\n')
    .filter(line => {
      const cleanLine = line.replace(/[^\w\s]/g, '');
      return cleanLine.length > line.length * 0.3; // Keep lines that are at least 30% normal characters
    })
    .join('\n');

  result.cleanedText = cleanedText.trim();
  return result;
}

/**
 * Clean individual text fields from encoding artifacts and garbage
 */
function cleanTextField(text: string): string {
  if (!text) return text;

  return text
    // Remove encoding artifacts
    .replace(/[âÂ]+/g, ' ')
    .replace(/[^\w\s.,;:!?()\-'"\/\[\]{}@#$%&*+=<>|~`]/g, ' ')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove standalone garbage characters
    .replace(/\b[âÂ]{1,10}\b/g, ' ')
    // Clean up any remaining weird characters
    .replace(/[\u00A0-\u00FF]{3,}/g, ' ')
    .trim();
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
 * Clean email body - remove all noise and keep only core query content
 */
function cleanEmailBody(body: string): string {
  // Remove HTML tags first
  let cleaned = body.replace(/<[^>]*>/g, ' ');

  // Remove CSS styles completely (they appear as text after HTML removal)
  cleaned = cleaned
    // Remove CSS declarations
    .replace(/[a-z-]+\s*:\s*[^;}]+[;}]/gi, ' ')
    // Remove CSS selectors and blocks
    .replace(/@media[^}]+}/gi, ' ')
    .replace(/\.[a-z-]+\s*\{[^}]*\}/gi, ' ')
    .replace(/#[a-z-]+\s*\{[^}]*\}/gi, ' ')
    .replace(/[a-z]+\s*\{[^}]*\}/gi, ' ')

    // Remove unsubscribe and footer content
    .replace(/unsubscribe[\s\S]*?$/gi, ' ')
    .replace(/manage subscription[\s\S]*$/gi, ' ')
    .replace(/follow us on[\s\S]*$/gi, ' ')
    .replace(/help a reporter out \d+[\s\S]*$/gi, ' ')
    .replace(/your haro subscription address[\s\S]*$/gi, ' ')
    .replace(/for delivery help[\s\S]*$/gi, ' ')

    // Remove tokens and tracking URLs
    .replace(/\?token=[\w.-]+/gi, ' ')
    .replace(/eyJ[\w.-]+/gi, ' ')

    // Remove sponsored/advertisement content
    .replace(/earn high commissions[\s\S]*?become an affiliate[^.]*\./gi, ' ')
    .replace(/sponsored[\s\S]*?queries from/gi, 'Queries from')
    .replace(/\*+\s*INDEX\s*\*+[\s\S]*?\*+/gi, ' ')

    // Remove social media and promotional content
    .replace(/follow us on \w+[\s\S]*?https?:\/\/[^\s]+/gi, ' ')
    .replace(/@\w+\s+https?:\/\/[^\s]+/gi, ' ')

    // Remove "Back to Top" and navigation elements
    .replace(/back to top/gi, ' ')
    .replace(/forwarded this email\?[\s\S]*?helpareporter\.com/gi, ' ')

    // Remove HARO promotional content
    .replace(/haro connects journalists with expert sources/gi, ' ')

    // Remove email artifacts
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

    // Remove excessive whitespace and normalize
    .replace(/\s+/g, ' ')
    .trim();

  // Remove any remaining footer-like content at the end
  // Look for patterns like "Help a Reporter Out 2025" or similar
  cleaned = cleaned.replace(/help a reporter out \d{4}.*$/gi, '');

  return cleaned;
}

/**
 * Split email body into individual query sections - focus on actual queries only
 */
function splitIntoQueries(body: string): string[] {
  // First, find where queries actually start (after index/promotional content)
  const queryStartIndicators = [
    /\*+\s*$/m, // End of index section with asterisks
    /(?:\d+\s*\)\s*Summary:|Summary:)/i, // Numbered summaries
    /^Business and Finance/im, // Category headers
    /^Health and Pharma/im,
    /^General$/im,
    /^Technology$/im,
    /^Lifestyle/im,
    /^Podcasts/im
  ];

  let queryStartIndex = 0;
  for (const pattern of queryStartIndicators) {
    const match = body.search(pattern);
    if (match > queryStartIndex && match > 100) { // Must be past initial content
      queryStartIndex = match;
      break;
    }
  }

  // Extract only the query content portion
  const queryContent = body.substring(queryStartIndex);

  // Split into sections using multiple patterns
  let sections: string[] = [];

  // Try splitting by numbered summaries first (1) Summary:, 2) Summary:, etc.)
  const numberedSections = queryContent.split(/(?=\d+\s*\)\s*Summary:)/i);
  if (numberedSections.length > 1) {
    sections = numberedSections;
  } else {
    // Fallback: try splitting by "Summary:" or "Query:" patterns
    sections = queryContent.split(/(?=(?:Summary:|Query:))/i);
  }

  // Clean and filter sections to only include actual queries
  return sections
    .map(s => s.trim())
    .filter(s => {
      // Must have minimum length
      if (s.length < 50) return false;

      // Must contain either "Summary:" or "Query:"
      if (!(/Summary:|Query:/i.test(s))) return false;

      // Must contain essential query information (Name, Email, etc.)
      const hasRequiredFields = /Name:|Email:|Media Outlet:|Deadline:/i.test(s);

      // Skip index-only content or category headers
      const isIndexContent = /^(Business and Finance|Health and Pharma|General|Technology|Lifestyle|Podcasts|INDEX)[\s\d\)]*$/im.test(s);

      return hasRequiredFields && !isIndexContent;
    })
    .slice(0, 50); // Limit to reasonable number of queries
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

  // Extract reporter name from "Name: Reporter Name" pattern (single line)
  const nameMatch = cleanedSection.match(/Name:\s*([^]+?)(?=\s+Category:)/i);
  if (nameMatch) {
    query.reporterName = nameMatch[1].trim();
  }

  // Extract query number from section (e.g., "1) Summary:" or "Query #5")
  if (!query.haroQueryNumber) {
    const numberMatch = cleanedSection.match(/(?:^|\n)(\d+)\)\s*Summary:|Query\s*#?(\d+)/i);
    if (numberMatch) query.haroQueryNumber = parseInt(numberMatch[1] || numberMatch[2]);
  }

  // Query / Headline - parse the actual summary text
  let queryMatch = null;

  // Try to match "20 ) Summary: Engineer or manufacturer..."
  queryMatch = cleanedSection.match(/\d+\s*\)\s*Summary:\s*([^]+?)(?=\s+Name:)/i);

  // If not found, try "Summary: Text" format
  if (!queryMatch) {
    queryMatch = cleanedSection.match(/Summary:\s*([^]+?)(?=\s+Name:)/i);
  }

  // If not found, try "Query: Text" format
  if (!queryMatch) {
    queryMatch = cleanedSection.match(/Query:\s*([^]+?)(?=\s+Name:)/i);
  }

  if (queryMatch) {
    query.headline = cleanTextField(queryMatch[1].trim());
    query.fullText = cleanTextField(queryMatch[1].trim());
  }

  // Description/Requirements - extract the detailed explanation (single line format)
  const requirementsMatch = cleanedSection.match(/Requirements?:\s*([^]+?)$/i);
  if (requirementsMatch) {
    const description = cleanTextField(requirementsMatch[1].trim());
    query.requirements = description;

    // Also set as fullText if it's more detailed than the headline
    if (description.length > (query.fullText?.length || 0)) {
      query.fullText = `${query.headline} - ${description}`;
    }
  }

  // Deadline (single line)
  const deadlineMatch = cleanedSection.match(/Deadline:\s*([^]+?)(?=\s+Requirements?:|$)/i);
  if (deadlineMatch) {
    query.deadline = deadlineMatch[1].trim();
  }

  // Contact email - detect if it's HARO reply email or direct (single line)
  const emailMatch = cleanedSection.match(/Email:\s*([^]+?)(?=\s+Media Outlet:)/i);
  if (emailMatch) {
    const email = emailMatch[1].trim();
    query.journalistEmail = email && email.includes('@') ? email : null;
    query.isDirectEmail = !email.includes('helpareporter.com');
  }

  // Media outlet name and URL (single line)
  const outletMatch = cleanedSection.match(/Media Outlet:\s*([^]+?)(?=\s+Deadline:)/i);
  if (outletMatch) {
    const outletText = outletMatch[1].trim();
    // Extract URL from parentheses if present
    const urlMatch = outletText.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (urlMatch) {
      query.publication = urlMatch[1].trim();
      if (urlMatch[2].startsWith('http')) {
        query.outletUrl = urlMatch[2].trim();
      }
    } else {
      query.publication = outletText;
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
  // For newer HARO format, we only need headline and some content
  if (!raw.headline) return null;

  // If no separate fullText, use headline as fullText
  if (!raw.fullText && raw.headline) {
    raw.fullText = raw.headline;
  }

  // If no deadline, set a default one
  if (!raw.deadline) {
    raw.deadline = 'Not specified';
  }

  let deadlineDate: Date;
  try {
    deadlineDate = parseDeadline(raw.deadline);
  } catch {
    deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);
  }

  return {
    headline: raw.headline,
    fullText: raw.fullText || raw.headline || '',
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
