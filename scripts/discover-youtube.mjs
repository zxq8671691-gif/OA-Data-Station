// Discovery-only helper: finds candidate OA public YouTube videos.
// NEVER inserts candidates into the verified public video archive automatically.
// Run locally with YOUTUBE_API_KEY, then confirm channel, OA identity and exact video URL.
import fs from 'node:fs/promises';
const key=process.env.YOUTUBE_API_KEY;
if(!key) throw new Error('Missing YOUTUBE_API_KEY. Configure as a local environment variable, not in the repository.');
const searches=[
  {q:'A2O LITE 오아 직캠',order:'date'},
  {q:'A2O LITE OA fancam',order:'viewCount'},
  {q:'A2O LITE OA SHOW K-POP',order:'date'}
];
const found=new Map();
for(const {q,order} of searches){
 const url=new URL('https://www.googleapis.com/youtube/v3/search');
 url.search=new URLSearchParams({part:'snippet',type:'video',maxResults:'25',q,order,publishedAfter:'2026-10-01T00:00:00Z',key}).toString();
 const res=await fetch(url,{signal:AbortSignal.timeout(15000)});
 if(!res.ok) throw new Error('YouTube search API returned HTTP '+res.status);
 const json=await res.json();
 for(const x of json.items||[]){
  const id=x.id?.videoId;
  if(!id||!/^[-_A-Za-z0-9]{11}$/.test(id))continue;
  const title=x.snippet?.title||'';
  // Search can be noisy. Keep candidate list for human verification regardless of rank.
  if(!/A2O[\s_-]*LITE/i.test(title) && !/에이투오/i.test(title))continue;
  found.set(id,{id,title,channel:x.snippet?.channelTitle||'',published_at:x.snippet?.publishedAt||'',url:'https://www.youtube.com/watch?v='+id});
 }
}
const ids=[...found.keys()];
for(let i=0;i<ids.length;i+=50){
 const url=new URL('https://www.googleapis.com/youtube/v3/videos');
 url.search=new URLSearchParams({part:'statistics,snippet',id:ids.slice(i,i+50).join(','),key}).toString();
 const res=await fetch(url,{signal:AbortSignal.timeout(15000)});
 if(!res.ok)throw new Error('YouTube statistics API returned HTTP '+res.status);
 const out=await res.json();
 for(const v of out.items||[]){
  const x=found.get(v.id);
  if(!x)continue;
  const views=Number(v.statistics?.viewCount);
  x.views=Number.isSafeInteger(views)?views:null;
  x.likes=v.statistics?.likeCount==null?null:Number(v.statistics.likeCount);
  x.comments=v.statistics?.commentCount==null?null:Number(v.statistics.commentCount);
 }
}
const checked=new Set(JSON.parse(await fs.readFile(new URL('../data/dashboard.json',import.meta.url),'utf8'))
  .videos.filter(v=>v.platform==='YouTube').map(v=>v.id));
const entries=[...found.values()].map(x=>({...x,already_in_archive:checked.has(x.id)}))
 .sort((a,b)=>(b.views??-1)-(a.views??-1));
const output={collected_at:new Date().toISOString(),notice:'Keyword-search candidates only, NOT verified OA personal videos or current hottest videos. Needs manual review.',candidates:entries};
const dest=new URL('../data/youtube-candidates.json',import.meta.url);
await fs.writeFile(dest,JSON.stringify(output,null,2)+'\n');
console.log('Saved '+entries.length+' candidate videos; '+entries.filter(v=>!v.already_in_archive).length+' need review.');