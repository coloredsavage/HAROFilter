import { parseHaroEmail } from './lib/email/parser';

// Simplified email with just the essential query content
const simpleQueryEmail = `
13) Summary: Mosaic planting: the curated-meadow trend replacing wildflower mixes

Name: sarah wilson

Category: General

Email: reply+ff409bbf-2735-489e-b65e-01a44094f75c@helpareporter.com

Media Outlet: Homes & Gardens (https://www.homesandgardens.com)

Deadline: 7:00 PM ET - 21 January

No AI Pitches Considered

Query:

I am writing a feature saying that 'False Meadows' (seed mixes that flop) are OUT and managed mosaic plantings are IN. People are realising that wildflower mixes rarely create the "Instagram meadow" they expect. The 2026 shift is moving towards designed meadows; grasses and perennials in planned mosaics; seasonal maintenance built in; all inspired by High Line/Lurie Garden naturalism but scaled down.

I want to tell readers about the shift and how they can get the look.

I am looking for contributions from garden designers and landscaping experts with their thoughts on this trend and how to get the look, which flowers/plants/grasses etc to use, which to avoid (if any).

Please also share your headshot and bio, plus links to website/social media accounts.

Back to Top
`;

async function testSimpleParser() {
  console.log('🧪 Testing simplified HARO query parsing...\n');

  const result = parseHaroEmail(
    simpleQueryEmail,
    'test-simple-123',
    'HARO: General Queries - Monday, January 17, 2026',
    new Date()
  );

  console.log('📊 Parse Results:');
  console.log(`Found ${result.queries.length} queries`);
  console.log(`Parse errors: ${result.parseErrors.length}`);

  if (result.parseErrors.length > 0) {
    console.log('\n❌ Parse errors:');
    result.parseErrors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  if (result.queries.length > 0) {
    console.log('\n✅ Successfully parsed queries:');
    result.queries.forEach((query, index) => {
      console.log(`\n📝 Query ${index + 1}:`);
      console.log(`   Headline: "${query.headline}"`);
      console.log(`   Full Text Length: ${query.fullText?.length || 0} characters`);
      console.log(`   Full Text: "${query.fullText?.substring(0, 200)}..."`);
      console.log(`   Requirements Length: ${query.requirements?.length || 0} characters`);
      console.log(`   Reporter: ${query.reporterName || 'N/A'}`);
      console.log(`   Publication: ${query.publication}`);
      console.log(`   Email: ${query.journalistEmail}`);
      console.log(`   Deadline: ${query.deadline}`);
    });

    // Test that the content is properly extracted
    const query = result.queries[0];
    if (query && query.fullText && query.fullText.includes('False Meadows')) {
      console.log('\n🎉 SUCCESS: Full query content correctly extracted!');
    } else {
      console.log('\n⚠️  WARNING: Full content may not be correctly extracted');
    }
  }

  return result;
}

testSimpleParser().catch(console.error);