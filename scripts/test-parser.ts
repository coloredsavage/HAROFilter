/**
 * Test script for HARO email parser
 * Usage: npx tsx scripts/test-parser.ts
 */

import { parseHaroEmail } from '../lib/email/parser';

// Sample HARO email body for testing
const sampleEmailBody = `
HARO: Test Category Queries

Query: Sample Query Title
Summary: This is a sample query for testing the parser functionality.
Requirements: Sample requirements for testing.
Deadline: January 1, 2024 at 12:00 PM EST
Contact: test@example.com

---

Query: Second Test Query
Summary: Another sample query to test multi-query parsing.
Requirements: More test requirements.
Deadline: January 2, 2024 at 5:00 PM EST
Contact: test2@example.com
`;

const sampleEmailSubject = 'HARO: Test Category Queries';
const sampleEmailId = 'test-email-123';
const sampleReceivedAt = new Date('2024-01-01T10:00:00Z');

// Test the parser
console.log('🧪 Testing HARO Email Parser\n');
console.log('=' .repeat(60));

const result = parseHaroEmail(
  sampleEmailBody,
  sampleEmailId,
  sampleEmailSubject,
  sampleReceivedAt
);

console.log('\n📧 Email Metadata:');
console.log(`  Email ID: ${result.emailId}`);
console.log(`  Category: ${result.category}`);
console.log(`  Received At: ${result.receivedAt.toISOString()}`);
console.log(`  Queries Extracted: ${result.queries.length}`);
console.log(`  Parse Errors: ${result.parseErrors.length}`);

if (result.parseErrors.length > 0) {
  console.log('\n⚠️  Parse Errors:');
  result.parseErrors.forEach((error, i) => {
    console.log(`  ${i + 1}. ${error}`);
  });
}

console.log('\n' + '='.repeat(60));
console.log('\n📝 Extracted Queries:\n');

result.queries.forEach((query, index) => {
  console.log(`Query ${index + 1}:`);
  console.log(`  Headline: ${query.headline}`);
  console.log(`  Publication: ${query.publication}`);
  console.log(`  Category: ${query.category}`);
  console.log(`  Deadline: ${query.deadline.toISOString()}`);
  console.log(`  Journalist: ${query.journalistEmail || 'Not provided'}`);
  console.log(`  Full Text Length: ${query.fullText.length} chars`);
  console.log(`  Requirements Length: ${query.requirements.length} chars`);
  console.log(`  HARO Email ID: ${query.haroEmailId}`);
  console.log('');
});

console.log('='.repeat(60));
console.log('\n✅ Parser test complete!\n');

// Test edge cases
console.log('🔬 Testing Edge Cases:\n');

// Test 1: Empty email
const emptyResult = parseHaroEmail('', 'empty-test', 'HARO: Test', new Date());
console.log(`Empty email - Queries: ${emptyResult.queries.length}, Errors: ${emptyResult.parseErrors.length}`);

// Test 2: Malformed email
const malformedBody = `
Query: Only a headline
Some random text without proper structure
`;
const malformedResult = parseHaroEmail(malformedBody, 'malformed-test', 'HARO: Test', new Date());
console.log(`Malformed email - Queries: ${malformedResult.queries.length}, Errors: ${malformedResult.parseErrors.length}`);

// Test 3: Email with HTML tags
const htmlBody = `
<html>
<body>
<p>Query: Test Query with HTML</p>
<p>Summary: This has &lt;HTML&gt; tags and &nbsp; entities</p>
<p>Requirements: None</p>
<p>Deadline: December 20, 2023 at 5:00 PM</p>
<p>Contact: test@example.com</p>
</body>
</html>
`;
const htmlResult = parseHaroEmail(htmlBody, 'html-test', 'HARO: Test', new Date());
console.log(`HTML email - Queries: ${htmlResult.queries.length}, Errors: ${htmlResult.parseErrors.length}`);

console.log('\n✨ All tests complete!\n');
