// Debug the validation step
const sampleSection = `13) Summary: Mosaic planting: the curated-meadow trend replacing wildflower mixes

Name: sarah wilson

Category: General

Email: reply+ff409bbf-2735-489e-b65e-01a44094f75c@helpareporter.com

Media Outlet: Homes & Gardens (https://www.homesandgardens.com)

Deadline: 7:00 PM ET - 21 January

No AI Pitches Considered

Query:

I am writing a feature saying that 'False Meadows' (seed mixes that flop) are OUT and managed mosaic plantings are IN. People are realising that wildflower mixes rarely create the "Instagram meadow" they expect.

Back to Top`;

function debugValidation(section: string) {
  console.log('🔍 Debugging section validation...\n');
  console.log('Section length:', section.length);

  // Check minimum length
  const hasMinLength = section.length >= 50;
  console.log('✅ Min length (50):', hasMinLength);

  // Check for Summary/Query
  const hasSummaryOrQuery = /Summary:|Query:/i.test(section);
  console.log('✅ Has Summary/Query:', hasSummaryOrQuery);

  // Check for required fields with exact patterns used in parser
  const hasName = /Name:\s*[^\s]/i.test(section);
  console.log('✅ Has Name field:', hasName);

  const hasEmail = /Email:\s*[^\s]/i.test(section);
  console.log('✅ Has Email field:', hasEmail);

  const hasDeadline = /Deadline:\s*[^\s]/i.test(section);
  console.log('✅ Has Deadline field:', hasDeadline);

  if (hasName) {
    const nameMatch = section.match(/Name:\s*([^\n]+)/i);
    console.log('📝 Name found:', nameMatch?.[1]?.trim());
  }

  if (hasEmail) {
    const emailMatch = section.match(/Email:\s*([^\n]+)/i);
    console.log('📧 Email found:', emailMatch?.[1]?.trim());
  }

  if (hasDeadline) {
    const deadlineMatch = section.match(/Deadline:\s*([^\n]+)/i);
    console.log('⏰ Deadline found:', deadlineMatch?.[1]?.trim());
  }

  // Check if it would be rejected as index content
  const isIndexContent = /^(Business and Finance|Health and Pharma|General|Technology|Lifestyle|Podcasts|INDEX)[\s\d\)]*$/im.test(section);
  console.log('❌ Is index content:', isIndexContent);

  console.log('\n🎯 Overall validation result:', hasMinLength && hasSummaryOrQuery && hasName && hasEmail && hasDeadline && !isIndexContent);
}

debugValidation(sampleSection);