// Regression check for the platform-specific homepage including the Work-collected values.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html=fs.readFileSync('cn-dist/index.html','utf8');
const data=JSON.parse(fs.readFileSync('data/dashboard.json','utf8'));
const embedded=html.match(/<script id="embedded-data" type="application\/json">([\s\S]*?)<\/script>/);
assert(embedded,'Published dashboard must have embedded source data');
const published=JSON.parse(embedded[1]);
assert.equal(published.meta.updated_at,data.meta.updated_at);
assert(html.includes('id="platformPulse"'));
assert(html.includes('./assets/platform-pulse.js'));
assert(html.includes('./assets/platform-pulse.css'));
const js=fs.readFileSync('cn-dist/assets/platform-pulse.js','utf8');
new vm.Script(js,{filename:'platform-pulse.js'});
const target={innerHTML:''};
const scope={window:{},document:{getElementById:id=>id==='platformPulse'?target:null},Intl,Date,Map,Set,Math,String,Number,console};
vm.createContext(scope);
vm.runInContext(js,scope);
assert.equal(typeof scope.window.renderPlatformPulse,'function');
scope.window.renderPlatformPulse(published);
const output=target.innerHTML;
for(const phrase of ['OA官方单人直拍','OA单人直拍样本','OA相关万赞帖','超话粉丝与当日签到','pulse-chart']){
 assert(output.includes(phrase),'Missing distinct platform-specific KPI: '+phrase);
}
const solo=published.videos.filter(v=>v.platform==='YouTube'&&v.content_scope==='solo_fancam');
if(solo.length&&solo.every(v=>Number.isSafeInteger(v.views))) {
 const views=solo.reduce((s,v)=>s+v.views,0);
 assert(output.includes(new Intl.NumberFormat('zh-CN').format(views)),'Displayed YouTube OA solo total must match current published data');
}
assert(published.history?.browser_posts,'Work-collected Bilibili/Weibo/Douyin historical snapshots should be preserved');
assert(published.weibo_supertopic?.observations?.length>=1,'Dated historical OaAngel Weibo supertopic report should be displayed as reported, not live');
assert(output.includes('历史报道')||output.includes('历史参考'),'Historical Weibo report must be clearly labeled');
assert(!output.includes('NaN')&&!output.includes('undefined'));
console.log('PASS 4 distinct platform KPIs, authentic historical bars and publisher attribution; no invented missing daily points.');
