/* Offline-only importer of X public post figures manually verified from original page.
   Does NOT call X, log in, scrape, or run a paid API. Exact values only.
   Source: data/x-public-metrics.json. Post URLs must already be vetted in dashboard.
*/
import fs from 'node:fs/promises';
const input=new URL('../data/x-public-metrics.json',import.meta.url);
const dPath=new URL('../data/dashboard.json',import.meta.url);
const ledger=JSON.parse(await fs.readFile(input,'utf8'));
if(ledger.schema_version!==1||!Array.isArray(ledger.snapshots))throw Error('Invalid X public snapshots schema');
const d=JSON.parse(await fs.readFile(dPath,'utf8'));
const exact=n=>Number.isSafeInteger(n)&&n>=0;
const props=['views','reposts','comments','likes','quotes','video_views'];
const displayProps=Object.fromEntries(props.map(key=>[key,key+'_display']));
const validDisplay=x=>typeof x==='string' && /^(?:约|≈)?\d+(?:\.\d+)?(?:万|亿|K|M)?$/i.test(x.trim());
let changes=0;
d.history??={};d.history.posts??={};
for(const snapshot of ledger.snapshots){
 if(!/^\d{15,21}$/.test(String(snapshot.post_id||'')))throw Error('Malformed X post id');
 if(!/^https:\/\/x\.com\/[^/]+\/status\/\d{15,21}$/.test(snapshot.evidence_url||''))throw Error('Evidence must be an exact public X post URL');
 if(!snapshot.observed_at||!Number.isFinite(Date.parse(snapshot.observed_at))||!/(Z|[+-]\d\d:\d\d)$/.test(snapshot.observed_at))
    throw Error('Observation requires timezone-aware exact timestamp');
 if(!snapshot.reviewed_by||!snapshot.evidence_type)throw Error('Missing reviewer or evidence type');
 const post=d.social_posts.find(x=>x.platform==='X / Twitter'&&x.id===String(snapshot.post_id));
 if(!post||post.url!==snapshot.evidence_url)throw Error('X post must be verified in archive, and its original URL must match evidence');
 if(props.every(key=>snapshot[key]===null||snapshot[key]===undefined) &&
   props.every(key=>!snapshot[displayProps[key]]))throw Error('No observed public numbers supplied');
 for(const key of props){
  if(snapshot[key]!=null&&!exact(snapshot[key]))throw Error('Inexact or negative X numeric metric '+key);
  if(snapshot[displayProps[key]]!=null&&!validDisplay(snapshot[displayProps[key]]))
    throw Error('Invalid public display string '+displayProps[key]);
}
 if(post.updated_at&&Date.parse(snapshot.observed_at)<=Date.parse(post.updated_at))continue;
 for(const key of props)if(exact(snapshot[key]))post[key]=snapshot[key];
 post.metric_display??={};
 for(const key of props)if(validDisplay(snapshot[displayProps[key]]) && !exact(snapshot[key]))
    post.metric_display[key]=snapshot[displayProps[key]].trim();
 post.updated_at=snapshot.observed_at;
 post.metric_source='X原帖公开显示值（精确或带约数标识），人工核验';
 post.metric_status='人工核验公开计数（非API实时）';
 d.history.posts[post.id]??=[];
 if(!d.history.posts[post.id].some(x=>x.at===snapshot.observed_at)){
   d.history.posts[post.id].push({at:snapshot.observed_at,metrics:Object.fromEntries(props.filter(k=>exact(snapshot[k])).map(k=>[k,snapshot[k]])),reviewed_by:snapshot.reviewed_by,evidence_url:post.url});
 }
 d.history.posts[post.id].sort((a,b)=>a.at.localeCompare(b.at));
 changes++;
}
if(changes){
 const p=d.platforms.find(x=>x.name==='X / Twitter');
 if(p)p.status='已核实 '+d.social_posts.filter(x=>x.metric_source).length+' 条原帖公开互动统计';
 const src=d.source_registry.find(x=>x.id==='x');
 if(src)src.status_text='已收录OA公开帖子，并按有来源与时间戳的原帖可见数值核验';
 d.meta.updated_at=new Date().toISOString();
 await fs.writeFile(dPath,JSON.stringify(d,null,2)+'\n');
}
console.log('X public manual snapshot updates:',changes,'(0 is expected until screenshots/original counts are verified).');
