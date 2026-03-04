const Papa = require('papaparse');
const fs = require('fs');

const text = fs.readFileSync('prisma/fra_cleaned.csv', 'utf-8');
const firstLine = text.split('\n')[0];
console.log('Header (first 150 chars):', firstLine.substring(0, 150));
console.log('');

// PapaParse auto-detect
const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, preview: 3 });
console.log('Delimiter detected:', JSON.stringify(parsed.meta.delimiter));
console.log('Fields:', parsed.meta.fields.filter(f => f.trim()).join(' | '));
console.log('');

const row = parsed.data[0];
console.log('=== ROW 1 ===');
console.log('Perfume:', row['Perfume']);
console.log('Brand:', row['Brand']);
console.log('Country:', row['Country']);
console.log('Gender:', row['Gender']);
console.log('Rating Value:', row['Rating Value']);
console.log('Year:', row['Year']);
console.log('Top:', row['Top']);
console.log('Middle:', row['Middle']);
console.log('Base:', row['Base']);
console.log('Perfumer1:', row['Perfumer1']);
console.log('Perfumer2:', row['Perfumer2']);
console.log('mainaccord1:', row['mainaccord1']);
console.log('mainaccord2:', row['mainaccord2']);
console.log('mainaccord3:', row['mainaccord3']);
console.log('url:', row['url']);

// Total count
const full = Papa.parse(text, { header: true, skipEmptyLines: true });
console.log('\nTotal rows:', full.data.length);
console.log('Parse errors:', full.errors.length);
if (full.errors.length > 0) {
  console.log('First error:', full.errors[0]);
}
