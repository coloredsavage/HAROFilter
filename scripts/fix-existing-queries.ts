/**
 * Fix existing malformed queries in the database
 * Usage: npx tsx scripts/fix-existing-queries.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseHaroEmail } from '../lib/email/parser';

// Load environment variables
config({ path: '.env.local' });

// Use service role client for bulk operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface MalformedQuery {
  id: string;
  headline: string;
  full_text: string;
  requirements: string;
  publication: string;
  haro_email_id: string;
  posted_at: string;
}

async function fixExistingQueries() {
  console.log('🔧 Starting database query cleanup...\n');

  // First, get all queries that look malformed
  const { data: allQueries, error } = await supabase
    .from('queries')
    .select(`
      id, headline, full_text, requirements, publication,
      haro_email_id, posted_at, reporter_name, journalist_contact
    `)
    .order('posted_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching queries:', error);
    return;
  }

  if (!allQueries || allQueries.length === 0) {
    console.log('✅ No queries found in database.');
    return;
  }

  console.log(`📊 Found ${allQueries.length} total queries`);

  // Identify malformed queries (those with field names bleeding into content)
  const malformedQueries = allQueries.filter(query => {
    const textToCheck = `${query.headline || ''} ${query.full_text || ''} ${query.requirements || ''}`.toLowerCase();

    // Check for field names bleeding into content
    const hasFieldBleed = /\b(category|email|media outlet|deadline|requirements?|name):/i.test(textToCheck);

    // Check for excessively long single fields (likely multiple queries mashed together)
    const tooLong = (query.headline?.length || 0) > 300 ||
                    (query.full_text?.length || 0) > 2000 ||
                    (query.requirements?.length || 0) > 1500;

    // Check for duplicate email patterns (sign of mashed queries)
    const multipleEmails = (textToCheck.match(/@/g) || []).length > 2;

    return hasFieldBleed || tooLong || multipleEmails;
  });

  console.log(`🔍 Found ${malformedQueries.length} malformed queries that need fixing\n`);

  if (malformedQueries.length === 0) {
    console.log('✅ All queries look properly formatted!');
    return;
  }

  // Group queries by haro_email_id to reprocess entire emails
  const emailGroups = new Map<string, MalformedQuery[]>();

  malformedQueries.forEach(query => {
    const emailId = query.haro_email_id;
    if (!emailGroups.has(emailId)) {
      emailGroups.set(emailId, []);
    }
    emailGroups.get(emailId)!.push(query);
  });

  console.log(`📧 Need to reprocess ${emailGroups.size} email(s)`);

  let fixedCount = 0;
  let emailsProcessed = 0;

  for (const [emailId, queries] of emailGroups) {
    try {
      console.log(`\n🔄 Processing email ${emailId} (${queries.length} malformed queries)`);

      // Try to reconstruct the original email body from the malformed queries
      const reconstructedBody = queries.map(q =>
        `${q.headline || ''} ${q.full_text || ''} ${q.requirements || ''}`
      ).join(' ');

      console.log(`📝 Reconstructed body length: ${reconstructedBody.length} chars`);

      // Parse with our enhanced parser
      const parsedResult = parseHaroEmail(
        reconstructedBody,
        emailId,
        'HARO: General Queries', // Default subject
        new Date(queries[0].posted_at)
      );

      if (parsedResult.queries.length === 0) {
        console.log(`❌ No valid queries parsed from email ${emailId}`);
        continue;
      }

      console.log(`✅ Successfully parsed ${parsedResult.queries.length} clean queries`);

      // Delete old malformed queries
      const queryIds = queries.map(q => q.id);
      const { error: deleteError } = await supabase
        .from('queries')
        .delete()
        .in('id', queryIds);

      if (deleteError) {
        console.error(`❌ Error deleting malformed queries:`, deleteError);
        continue;
      }

      // Insert new clean queries
      const newQueryRecords = parsedResult.queries.map(query => ({
        headline: query.headline,
        full_text: query.fullText,
        requirements: query.requirements || '',
        deadline: query.deadline.toISOString(),
        publication: query.publication,
        journalist_contact: query.journalistEmail,
        haro_email_id: query.haroEmailId,
        posted_at: new Date(queries[0].posted_at).toISOString(),
        // Enhanced fields
        reporter_name: query.reporterName,
        outlet_url: query.outletUrl,
        haro_query_number: query.haroQueryNumber,
        special_flags: query.specialFlags,
        is_direct_email: query.isDirectEmail,
        has_ai_detection: query.hasAiDetection,
        trigger_words: query.triggerWords,
        decoded_instructions: query.decodedInstructions,
        extracted_urls: query.extractedUrls,
        haro_article_url: query.haroArticleUrl,
      }));

      const { error: insertError } = await supabase
        .from('queries')
        .insert(newQueryRecords);

      if (insertError) {
        console.error(`❌ Error inserting clean queries:`, insertError);
        continue;
      }

      console.log(`✅ Replaced ${queries.length} malformed queries with ${parsedResult.queries.length} clean queries`);

      fixedCount += queries.length;
      emailsProcessed++;

    } catch (error) {
      console.error(`❌ Error processing email ${emailId}:`, error);
    }
  }

  console.log(`\n🎉 Database cleanup complete!`);
  console.log(`📧 Emails processed: ${emailsProcessed}`);
  console.log(`🔧 Malformed queries fixed: ${fixedCount}`);
  console.log(`\n✅ Your database should now show clean, properly formatted HARO queries!`);
}

fixExistingQueries().catch(console.error);