// Validate selectable Korean NEON chart module and official-vs-reported all-kill separation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const data=JSON.parse(fs.readFileSync('data/dashboard.json','utf8'));
const charts=data.korean_charts;
assert(charts?.platforms?.length>=9,'At least six iChart sources + Melon HOT100 + Spotify + iChart');
for(const id of ['ichart','melon','genie','bugs','flo','vibe','ytmusic','spotify']){
  assert(charts.platforms.some(x=>x.id===id),'Missing '+id);
}
for(const c of charts.platforms){
 assert(/^https:\/\//.test(c.source),'Official source needed for '+c.id);
 for(const s of c.snapshots){
  assert(/^https:\/\//.test(s.source)&&/^\d{4}-\d{2}-\d{2}$/.test(s.date),'Missing original rank evidence');
  assert(Number.isSafeInteger(s.rank)&&s.rank>0,'Only exact ranks from original chart');
 }
}
assert(charts.achievements.find(x=>x.kind==='RAK').status==='reported');
for(const id of ['AK','PAK'])assert(charts.achievements.find(x=>x.kind===id).status==='unverified');
assert(data.all_kill.ak===null&&data.all_kill.pak===null,'Do not misrepresent no-certification as zero');
const html=fs.readFileSync('cn-dist/index.html','utf8');
for(const el of ['id="koreanChartSelector"','id="koreanChartView"','id="koreanAwards"','id="koreanAwardInfo"','id="spotifyLegacyPanel"']){
 assert(html.includes(el),'Korean UI missing '+el);
}
const embedded=JSON.parse(html.match(/<script id="embedded-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert(embedded.korean_charts.platforms.length===charts.platforms.length);
assert(fs.statSync('cn-dist/assets/korean-charts.css').size>1000);
const js=fs.readFileSync('cn-dist/assets/korean-charts.js','utf8');
new vm.Script(js,{filename:'korean-charts.js'});
const els=new Map();
function el(id){if(!els.has(id))els.set(id,{innerHTML:'',hidden:false,querySelectorAll:()=>[],addEventListener:()=>{},querySelector:()=>null});return els.get(id);}
const scope={console,Intl,Map,Set,Date,Math,Number,String,document:{
 readyState:'complete',getElementById:id=>id==='embedded-data'?{textContent:JSON.stringify(data)}:el(id)
}};
vm.createContext(scope);vm.runInContext(js,scope);
assert(el('koreanChartSelector').innerHTML.includes('Genie'));
assert(el('koreanChartSelector').innerHTML.includes('Bugs'));
assert(el('koreanChartView').innerHTML.includes('iChart实时总榜'));
assert(el('koreanAwardInfo').innerHTML.includes('第三方'));
console.log('PASS selectable Korean charts, iChart evidence, status separation, legacy Spotify compatibility');
