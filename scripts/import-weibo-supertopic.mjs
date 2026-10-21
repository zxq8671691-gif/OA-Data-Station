// Import explicitly sourced OaAngel Weibo supertopic observation reports and on-page counts.
// Does not connect to Weibo or use any login; never infers a current figure from historical reports.
import fs from 'node:fs/promises';
const p=new URL('../data/weibo-supertopic.json',import.meta.url);
const file=new URL('../data/dashboard.json',import.meta.url);
const source=JSON.parse(await fs.readFile(p,'utf8'));
if(source.schema_version!==1||source.topic!=='OaAngel'||!Array.isArray(source.observations)){
 throw Error('OaAngel supertopic schema mismatch');
}
const num=n=>Number.isSafeInteger(n)&&n>=0;
const parseDisplay=v=>{
 const m=String(v||'').trim().match(/^(约|≈|破)?(\d+(?:\.\d+)?)(万|亿|K|M)?$/i);
 if(!m)return null;
 const factor={万:1e4,亿:1e8,K:1e3,M:1e6}[m[3]]||1;
 return {value:Number(m[2])*factor,lowerBound:m[1]==='破'};
};
for(const obs of source.observations){
 if(!/^20\d\d-\d\d-\d\d$/.test(obs.date)||!/^https:\/\/(?:m\.)?weibo\.com\//.test(obs.source)){
   throw Error('Supertopic data must provide a date and original Weibo source URL');
 }
 if(obs.quality==='reported_approx'){
   if(!obs.fans_display&&!obs.checkins_display)throw Error('Report must have publicly quoted displayed figures');
   if(obs.fans!=null||obs.checkins!=null)throw Error('Third-party rounded reports cannot be exact live data');
 }else if(obs.quality==='original_page'){
   if(!obs.observed_at||!Number.isFinite(Date.parse(obs.observed_at))||!/(Z|[+-]\d\d:\d\d)$/.test(obs.observed_at)){
     throw Error('Actual supertopic page observations require a precise timestamp');
   }
   const fansReported=parseDisplay(obs.fans_display);
   const checkinsReported=parseDisplay(obs.checkins_display);
   if(!num(obs.fans)&&!num(obs.checkins)&&!fansReported&&!checkinsReported)
     throw Error('Need at least one exact or clearly labeled original-page public count');
   if(!num(obs.fans)&&fansReported){obs.fans_approx=fansReported.value; }
   if(!num(obs.checkins)&&checkinsReported){
     if(checkinsReported.lowerBound)obs.checkins_floor=checkinsReported.value;
     else obs.checkins_approx=checkinsReported.value;
   }
   if(!obs.reviewed_by||!obs.evidence_type)throw Error('Original supertopic verification evidence is required');
 }else throw Error('Unknown evidence quality');
}
const dashboard=JSON.parse(await fs.readFile(file,'utf8'));
const verified=[...source.observations].filter(x=>x.quality==='original_page'&&(num(x.fans)||num(x.checkins)||x.fans_display||x.checkins_display))
 .sort((a,b)=>Date.parse(a.observed_at)-Date.parse(b.observed_at));
const last=verified.at(-1)||null;
const replacement={...source,latest_verified_live:last?{...last,quality:'original_page'}:null};
if(JSON.stringify(dashboard.weibo_supertopic)!==JSON.stringify(replacement)){
 dashboard.weibo_supertopic=replacement;
 const newest=last?.observed_at;
 if(newest && (!dashboard.meta.updated_at||Date.parse(newest)>Date.parse(dashboard.meta.updated_at)))dashboard.meta.updated_at=newest;
 await fs.writeFile(file,JSON.stringify(dashboard,null,2)+'\n');
 console.log('Updated OaAngel supertopic evidence in dashboard. Original observations:',verified.length);
}else console.log('OaAngel supertopic evidence already synchronized.');
