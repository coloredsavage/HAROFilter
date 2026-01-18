// Test the raw parsing logic without email cleaning

// Import parsing functions directly
function testRawSplitIntoQueries(body: string): string[] {
  console.log('🔍 Testing raw query splitting...\n');
  console.log('Input length:', body.length);
  console.log('Input preview:', body.substring(0, 200));

  // Test the split patterns directly
  const splitPatterns = [
    /(?=\d+\s*\)\s*Summary:)/i,
    /(?=Name:\s*[^Name]+?Category:)/i,
    /(?=Summary:[^Summary]+?Name:)/i,
    /(?=Query:[^Query]+?Name:)/i,
  ];

  let sections: string[] = [];

  for (const pattern of splitPatterns) {
    const testSplit = body.split(pattern);
    console.log(`🔄 Pattern ${pattern} found ${testSplit.length} sections`);
    if (testSplit.length > 1) {
      sections = testSplit;
      console.log(`✅ Using pattern ${pattern} - found ${sections.length} sections`);
      sections.forEach((section, index) => {
        console.log(`  Section ${index + 1}: "${section.substring(0, 100)}..."`);
      });
      break;
    }
  }

  return sections;
}

const rawQuery = `
13) Summary: Mosaic planting: the curated-meadow trend replacing wildflower mixes

Name: sarah wilson

Category: General

Email: reply+ff409bbf-2735-489e-b65e-01a44094f75c@helpareporter.com

Media Outlet: Homes & Gardens (https://www.homesandgardens.com)

Deadline: 7:00 PM ET - 21 January

Query:

I am writing a feature saying that 'False Meadows' (seed mixes that flop) are OUT and managed mosaic plantings are IN.
`;

const sections = testRawSplitIntoQueries(rawQuery);

// Test field extraction on the first section if found
if (sections.length > 1) {
  const firstSection = sections[1]; // Skip the empty first section
  console.log('\n📝 Testing field extraction on first real section:');
  console.log('Section:', firstSection.substring(0, 200));

  // Test field patterns
  const nameMatch = firstSection.match(/Name:\s*([^]+?)\s+Category:/i);
  const emailMatch = firstSection.match(/Email:\s*([^]+?)\s+Media Outlet:/i);
  const deadlineMatch = firstSection.match(/Deadline:\s*([^]+?)(?:\s+Query:|$)/i);

  console.log('Name match:', nameMatch?.[1]?.trim());
  console.log('Email match:', emailMatch?.[1]?.trim());
  console.log('Deadline match:', deadlineMatch?.[1]?.trim());
}