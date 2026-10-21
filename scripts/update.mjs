/* Automated, truthful collector. Runs each morning via GitHub Actions.
   Uses only the official YouTube Data API. Every other platform remains unverified
   until a sanctioned API or manual editorial review is connected. */
import fs from 'node:fs/promises';
const DATA_PATH=new URL('../data/dashboard.json',import.meta.url);
let data=JSON.parse(await fs.readFile(DATA_PATH,'utf8'));
const key=process.env.YOUTUBE_API_KEY;
const beijingDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const snapshotTime=new Date().toISOString();
async function youtube(){if(!key){console.log('YOUTUBE_API_KEY unavailable: preserve all existing values; no fabricated update.');return 0;}
 const ids=[...new Set(data.videos.filter(v=>v.verified&&v.platform==='YouTube'&&v.id).map(v=>v.id))];if(!ids.length)return 0;
 let count=0;for(let i=0;i<ids.length;i+=50){const params=new URLSearchParams({part:'statistics,snippet',id:ids.slice(i,i+50).join(','),key});const resp=await fetch('https://www.googleapis.com/youtube/v3/videos?'+params);if(!resp.ok)throw new Error('YouTube API '+resp.status+' '+(await resp.text()).slice(0,300));const body=await resp.json();for(const item of body.items??[]){const video=data.videos.find(v=>v.id===item.id);if(!video)continue;const s=item.statistics||{};for(const [field,api] of [['views','viewCount'],['likes','likeCount'],['comments','commentCount']]){if(s[api]!==undefined){const n=Number(s[api]);if(Number.isSafeInteger(n)&&n>=0)video[field]=n;}}
 video.updated_at=snapshotTime;data.history.videos[item.id]??=[];const hist=data.history.videos[item.id];const entry={date:beijingDate,views:video.views,likes:video.likes,comments:video.comments,at:snapshotTime};const ix=hist.findIndex(e=>e.date===beijingDate);if(ix>=0)hist[ix]=entry;else hist.push(entry);hist.sort((a,b)=>a.date.localeCompare(b.date));count++;}}return count;}
try{const count=await youtube();if(count>0){data.meta.updated_at=snapshotTime;data.meta.edition=beijingDate;data.meta.verified_at=snapshotTime;await fs.writeFile(DATA_PATH,JSON.stringify(data,null,2)+'\n');console.log('Verified YouTube entries updated:',count)}else console.log('No verified numeric data collected; dashboard date remains unchanged.')}catch(err){console.error('Collection failed without writing stale numbers as new:',err.message);process.exitCode=1;}
