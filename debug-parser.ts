// Debug the parser step by step
const sampleEmail = `
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

I am writing a feature saying that 'False Meadows' (seed mixes that flop) are OUT and managed mosaic plantings are IN. People are realising that wildflower mixes rarely create the "Instagram meadow" they expect.

Back to Top
`;

function debugCleanEmailBody(body: string): string {
  console.log('📧 Original email length:', body.length);

  // Remove HTML tags first
  let cleaned = body.replace(/<[^>]*>/g, ' ');
  console.log('🏷️ After HTML removal:', cleaned.length);

  // Clean step by step to see where content disappears
  cleaned = cleaned
    .replace(/[a-z-]+\s*:\s*[^;}]+[;}]/gi, ' ') // CSS
    .replace(/@media[^}]+}/gi, ' ')
    .replace(/\.[a-z-]+\s*\{[^}]*\}/gi, ' ')
    .replace(/#[a-z-]+\s*\{[^}]*\}/gi, ' ')
    .replace(/[a-z]+\s*\{[^}]*\}/gi, ' ');

  console.log('🎨 After CSS removal:', cleaned.length);

  // INDEX removal - let's see what this does
  const beforeIndex = cleaned.length;
  cleaned = cleaned.replace(/\*+\s*INDEX\s*\*+[\s\S]*?(?=\*{4,}|^\d+\)\s*Summary:)/gi, ' ');
  console.log('📚 After INDEX removal:', cleaned.length, '(removed:', beforeIndex - cleaned.length, 'chars)');

  console.log('📝 Cleaned content preview:');
  console.log(cleaned.substring(0, 500));
  console.log('...');

  return cleaned;
}

function debugSplitIntoQueries(body: string): string[] {
  console.log('\n🔍 Debugging query splitting...');
  console.log('Body length:', body.length);
  console.log('First 300 chars:', body.substring(0, 300));

  // Try different split patterns
  const patterns = [
    /(?=\d+\s*\)\s*Summary:)/i,
    /(?=Name:\s*[^Name]+?Category:)/i,
    /(?=Summary:[^Summary]+?Name:)/i,
  ];

  patterns.forEach((pattern, index) => {
    const testSplit = body.split(pattern);
    console.log(`Pattern ${index + 1}: Found ${testSplit.length} sections`);
    if (testSplit.length > 1) {
      console.log(`  First section: "${testSplit[0].substring(0, 100)}..."`);
      console.log(`  Second section: "${testSplit[1].substring(0, 100)}..."`);
    }
  });

  return [];
}

console.log('🐛 Debugging email parsing...\n');

const cleaned = debugCleanEmailBody(sampleEmail);
debugSplitIntoQueries(cleaned);