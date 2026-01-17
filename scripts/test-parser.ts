/**
 * Test script for HARO email parser
 * Usage: npx tsx scripts/test-parser.ts
 */

import { parseHaroEmail } from '../lib/email/parser';

// Sample HARO email body
const sampleEmailBody = `
HARO: Business & Finance Queries - December 15, 2023

Here are today's queries for Business & Finance:

Query: Expert Insights on Remote Work Productivity
Summary: I'm writing an article for Forbes about how remote work has impacted productivity in tech companies. Looking for insights from CTOs, engineering managers, or productivity experts who can share data-driven insights about remote work trends in 2023.
Requirements: Must have managed remote teams of 10+ people, preferably in tech industry. Please include specific metrics or case studies.
Deadline: December 20, 2023 at 5:00 PM EST
Contact: john.smith@forbes.com

---

Query: Financial Planning Tips for Gen Z
Summary: Working on a piece for CNBC about financial planning strategies specifically tailored for Generation Z. Seeking certified financial planners who specialize in working with younger clients (ages 18-27). Topics include student loan management, investing basics, and building emergency funds.
Requirements: Must be a CFP with at least 3 years experience. Please provide 2-3 actionable tips that are relevant to Gen Z.
Deadline: December 18, 2023 at 2:00 PM EST
Contact: sarah.jones@cnbc.com

---

Query: Startup Funding Trends 2024
Summary: I'm researching venture capital trends for TechCrunch. Looking for VCs or startup founders who can discuss funding climate, emerging sectors, and predictions for 2024. Particularly interested in AI, climate tech, and healthcare startups.
Requirements: Must be actively involved in venture capital (either as investor or founder who has raised funding in 2023). Please share specific data or examples.
Deadline: December 22, 2023 at 11:59 PM EST
Contact: Not provided

---

Query: Small Business Success Stories
Summary: Feature article for Entrepreneur Magazine highlighting small businesses that thrived during economic uncertainty. Looking for small business owners (under 50 employees) who achieved significant growth in 2023 despite challenges.
Requirements: Revenue growth of at least 20% in 2023, willing to share specific numbers and strategies. Prefer diverse industries.
Deadline: January 5, 2024 at 9:00 AM EST
Contact: editor@entrepreneur.com
`;

const sampleEmailSubject = 'HARO: Business & Finance Queries - December 15, 2023';
const sampleEmailId = 'test-email-123';
const sampleReceivedAt = new Date('2023-12-15T10:00:00Z');

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
