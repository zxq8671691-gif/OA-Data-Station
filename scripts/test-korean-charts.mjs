// Regression: compact Korea NEON board, truthful overview, sourced insights, interactive history, AK status.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const data=JSON.parse(fs.readFileSync('data/dashboard.json','utf8'));
const charts=data.korean_charts;
assert(charts?.platforms?.length>=9);
for(const id of ['ichart','melon','genie','bugs','flo','vibe','ytmusic','spotify'])
 assert(charts.platforms.some(x=>x.id===id),'Missing Korea chart '+id);
for(const c of charts.platforms){
 assert(/^https:\/\//.test(c.source),'Missing original source');
 for(const o of c.snapshots){
  assert(/^https:\/\//.test(o.source)&&/^\d{4}-\d{2}-\d{2}$/.test(o.date));
  assert(Number.isSafeInteger(o.rank)&&o.rank>0);
 }
}
assert(charts.achievements.find(x=>x.kind==='RAK').status==='reported');
assert(charts.achievements.find(x=>x.kind==='AK').status==='unverified');
assert(charts.achievements.find(x=>x.kind==='PAK').status==='unverified');
assert(data.all_kill.ak===null && data.all_kill.pak===null);
const page=fs.readFileSync('cn-dist/index.html','utf8');
for(const id of ['koreanSnapshotRow','koreanInsights','koreanChartSelector','koreanChartMore','koreanChartView','koreanAwards','koreanAwardInfo','spotifyLegacyPanel'])
 assert(page.includes('id="'+id+'"'),'Missing new Korea board element: '+id);
assert(fs.statSync('cn-dist/assets/korean-charts.css').size>2000);
const embed=JSON.parse(page.match(/<script id="embedded-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.equal(embed.korean_charts.platforms.length,charts.platforms.length);
const source=fs.readFileSync('cn-dist/assets/korean-charts.js','utf8');
new vm.Script(source,{filename:'korean-charts.js'});
const nodes=new Map();
function node(id){
 if(!nodes.has(id))nodes.set(id,{
  innerHTML:'',textContent:'',hidden:(id==='koreanAwardInfo'||id==='spotifyLegacyPanel'),value:'',listeners:{},
  addEventListener(type,fn){this.listeners[type]=fn;},
  querySelectorAll(){return[];}
 });
 return nodes.get(id);
}
const mockDoc={readyState:'complete',getElementById:id=>id==='embedded-data'?{textContent:JSON.stringify(data)}:node(id)};
vm.runInNewContext(source,{document:mockDoc,Intl,Map,Set,Math,Date,Number,String,console});
assert(node('koreanSnapshotRow').innerHTML.includes('iChart'));
assert(node('koreanSnapshotRow').innerHTML.includes('Genie'));
assert(node('koreanSnapshotRow').innerHTML.includes('#1'));
assert(node('koreanInsights').innerHTML.includes('4/4'));
assert(node('koreanInsights').innerHTML.includes('仅代表两次'));
assert(node('koreanChartSelector').innerHTML.includes('Bugs'));
assert(!node('koreanChartSelector').innerHTML.includes('YouTube Music'));
assert(node('koreanChartMore').innerHTML.includes('YouTube Music'));
assert(node('koreanChartView').innerHTML.includes('Melon TOP100'));
assert(node('koreanChartView').innerHTML.includes('10.14'));
assert(node('koreanChartView').innerHTML.includes('10.21'));
assert(node('koreanAwardInfo').hidden,'Award explanation should be collapsed');
assert(node('koreanAwards').innerHTML.includes('报道达成'));
function activate(id){
 node('koreanChartSelector').listeners.click({target:{closest:()=>({dataset:{key:id}})}});
}
activate('genie');
assert(node('koreanChartView').innerHTML.includes('Genie实时榜'));
assert(node('koreanChartView').innerHTML.includes('目前仅有'));
node('koreanChartMore').listeners.change({target:{value:'flo'}});
assert(node('koreanChartView').innerHTML.includes('非')||node('koreanChartView').innerHTML.includes('媒体'));
assert(node('koreanChartView').innerHTML.includes('尚未核验'));
node('koreanChartMore').listeners.change({target:{value:'spotify'}});
assert(node('koreanChartView').innerHTML.includes('次播放'));
assert(node('spotifyLegacyPanel').hidden,'Old Spotify graph should never appear alongside new graph');
node('koreanAwards').listeners.click({target:{closest:()=>({dataset:{award:'AK'}})}});
assert(!node('koreanAwardInfo').hidden);
assert(node('koreanAwardInfo').innerHTML.includes('尚无iChart官方认证记录'));
node('koreanAwards').listeners.click({target:{closest:()=>({dataset:{award:'AK'}})}});
assert(node('koreanAwardInfo').hidden);
console.log('PASS compact 4-card NEON summary, two insights, collapsed All-Kill proof, single true history, optional extra charts.');
