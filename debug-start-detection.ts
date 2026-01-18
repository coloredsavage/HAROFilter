const sampleEmail = `
Want more chances to get featured in the media? Right now, there are 1,081 live opportunities on Featured.com — with top publishers actively looking for expert insights. Share your knowledge, grow your credibility, and land media coverage. See what's live now at Featured.com.

Sponsored

Queries from The i Paper, The Guardian, Homes & Gardens, and more!

********* INDEX ***********
General
13) Mosaic planting: the curated-meadow trend replacing wildflower mixes (Homes & Gardens)
****************************

13) Summary: Mosaic planting: the curated-meadow trend replacing wildflower mixes

Name: sarah wilson

Category: General

Email: reply+ff409bbf-2735-489e-b65e-01a44094f75c@helpareporter.com

Media Outlet: Homes & Gardens (https://www.homesandgardens.com)

Deadline: 7:00 PM ET - 21 January

No AI Pitches Considered

Query:

I am writing a feature saying that 'False Meadows' (seed mixes that flop) are OUT and managed mosaic plantings are IN.

Back to Top
`;

function debugStartDetection(body: string) {
  console.log('🔍 Testing query start detection patterns...\n');

  const patterns = [
    { name: 'Numbered Summary', pattern: /\d+\s*\)\s*Summary:/i },
    { name: 'Summary with content', pattern: /Summary:\s*\w/i },
    { name: 'Index end', pattern: /\*{4,}\s*$/m }
  ];

  patterns.forEach((p, index) => {
    const match = body.search(p.pattern);
    console.log(`${index + 1}. ${p.name}: ${match !== -1 ? `Found at index ${match}` : 'Not found'}`);

    if (match !== -1) {
      const context = body.substring(Math.max(0, match - 20), match + 50);
      console.log(`   Context: "...${context}..."`);
    }
  });

  // Test the actual content around position 13) Summary:
  const summaryMatch = body.search(/13\)\s*Summary:/i);
  console.log(`\n🎯 Looking specifically for "13) Summary:": ${summaryMatch !== -1 ? `Found at ${summaryMatch}` : 'Not found'}`);

  if (summaryMatch !== -1) {
    const context = body.substring(summaryMatch - 10, summaryMatch + 100);
    console.log(`   Full context: "${context}"`);
  }
}

debugStartDetection(sampleEmail);