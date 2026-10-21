/* Editorial verification ledger for platforms without approved public APIs.
   Import only original public metrics observed by a human editor.
   Exact numeric values only; never infer from rounded "万" displays.
   Does not log in, scrape, or contact any social media server. */
import fs from 'node:fs/promises';
const ledger=JSON.parse(await fs.readFile(new URL('../data/manual-verifications.json',import.meta.url),'utf8'));
if(!Array.isArray(ledger.snapshots))throw Error('Invalid manual metrics schema: expected snapshots array.');
if(!ledger.snapshots.length){console.log('No verified manual metrics yet. Nothing to apply.');process.exit(0);}
const path=new URL('../data/dashboard.json',import.meta.url);
const d=JSON.parse(await fs.readFile(path,'utf8'));
const exact=n=>Number.isSafeInteger(n)&&n>=0;
let changed=0;
for(const s of ledger.snapshots){
 if(!s.video_id||!s.platform||!s.measured_at||!s.evidence_url||!s.reviewed_by)throw Error('Incomplete editorial evidence entry.');
 if(!/^https:\/\//.test(s.evidence_url)||!/^20\d\d-\d\d-\d\dT/.test(s.measured_at)||!Number.isFinite(Date.parse(s.measured_at)))throw Error('Invalid evidence URL or timestamp.');
 if(s.platform==='YouTube')throw Error('Do not overwrite official YouTube Data API stats with manual entries.');
 const fields=['views','likes','comments'];
 if(!fields.some(key=>exact(s[key])))throw Error('No exact numeric metric in editorial evidence entry.');
 for(const k of fields)if(s[k]!=null&&!exact(s[k]))throw Error('Inexact or negative metric '+k+'; do not write guessed amounts.');
 const v=d.videos.find(x=>x.id===s.video_id&&x.platform===s.platform);
 if(!v)throw Error('Video not in approved archive: '+s.video_id);
 if(v.url!==s.evidence_url)throw Error('Evidence URL must match the original recorded video URL.');
 if(v.updated_at&&Date.parse(s.measured_at)<Date.parse(v.updated_at))continue;
 for(const k of fields)if(exact(s[k]))v[k]=s[k];
 v.updated_at=s.measured_at;
 v.metric_source='原视频页面，人工核验（'+s.reviewed_by+'）';
 v.source_tier='视频原始页面＋人工核验';
 d.history.videos[s.video_id]??=[];
 const h=d.history.videos[s.video_id];
 if(!h.some(x=>x.at===s.measured_at))h.push({
  at:s.measured_at,date:s.measured_at.slice(0,10),
  views:exact(s.views)?s.views:v.views,
  likes:exact(s.likes)?s.likes:v.likes,
  comments:exact(s.comments)?s.comments:v.comments,
  source:'manual-review'
 });
 h.sort((a,b)=>a.at.localeCompare(b.at));
 changed++;
}
if(changed){
 d.meta.updated_at=new Date().toISOString();
 await fs.writeFile(path,JSON.stringify(d,null,2)+'\n');
}
console.log('Editorial exact-value entries applied:',changed);
