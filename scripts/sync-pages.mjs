// Sync the data JSON into the standalone /docs/index.html used by GitHub Pages.
// The previous workflow updated data/dashboard.json but never updated the actual public page.
import fs from 'node:fs/promises';
const page = new URL('../docs/index.html',import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('../data/dashboard.json',import.meta.url),'utf8'));
const before = await fs.readFile(page,'utf8');
const pattern = /(<script\s+id="embedded-data"\s+type="application\/json">)([\s\S]*?)(<\/script>)/;
if (!pattern.test(before)) throw new Error('Could not locate embedded-data in docs/index.html');
const safe = JSON.stringify(data,null,2).replace(/</g,'\\u003c');
const after = before.replace(pattern,(_,open,old,close)=>open+safe+close);
if (after === before) {
  console.log('GitHub Pages public data already in sync.');
} else {
  const tmp = new URL('../docs/index.html.tmp',import.meta.url);
  await fs.writeFile(tmp,after);
  await fs.rename(tmp,page);
  console.log('Updated GitHub Pages embedded metrics for '+data.meta.edition+'.');
}