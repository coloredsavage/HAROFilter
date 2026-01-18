const sampleEmail = `
13) Summary: Mosaic planting: the curated-meadow trend replacing wildflower mixes

Name: sarah wilson

Category: General

Email: reply+ff409bbf-2735-489e-b65e-01a44094f75c@helpareporter.com

Media Outlet: Homes & Gardens (https://www.homesandgardens.com)

Deadline: 7:00 PM ET - 21 January

Query:

I am writing a feature saying that 'False Meadows' (seed mixes that flop) are OUT and managed mosaic plantings are IN.
`;

function stepByStepCleaning(body: string) {
  console.log('🧹 Step-by-step email cleaning debug...\n');
  console.log('Original:', body.substring(0, 100));

  let cleaned = body.replace(/<[^>]*>/g, ' ');
  console.log('1. HTML removal:', cleaned.substring(0, 100));

  cleaned = cleaned.replace(/[a-z-]+\s*:\s*[^;}]+[;}]/gi, ' ');
  console.log('2. CSS removal 1:', cleaned.substring(0, 100));

  cleaned = cleaned.replace(/@media[^}]+}/gi, ' ');
  console.log('3. CSS removal 2:', cleaned.substring(0, 100));

  cleaned = cleaned.replace(/unsubscribe[\s\S]*?$/gi, ' ');
  console.log('4. Unsubscribe removal:', cleaned.substring(0, 100));

  cleaned = cleaned.replace(/\*+\s*INDEX\s*\*+[\s\S]*?\*{4,}\s*/gi, '');
  console.log('5. INDEX removal:', cleaned.substring(0, 100));

  cleaned = cleaned.replace(/back to top/gi, ' ');
  console.log('6. Back to Top removal:', cleaned.substring(0, 100));

  cleaned = cleaned.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  console.log('7. Entity cleanup:', cleaned.substring(0, 100));

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  console.log('8. Whitespace cleanup:', cleaned.substring(0, 100));

  return cleaned;
}

stepByStepCleaning(sampleEmail);