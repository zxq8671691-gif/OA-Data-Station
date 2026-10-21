// Read-only YouTube Data API v3 collector. No Google/TikTok/Weibo user login required.
// Public video metrics only; no credential ever goes in logs or published JSON.
import fs from 'node:fs/promises';

const dataPath = new URL('../data/dashboard.json', import.meta.url);
const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
  console.log('No YOUTUBE_API_KEY repository secret configured; keeping previously verified data unchanged.');
  process.exit(0);
}
const now = new Date();
const at = now.toISOString();
const fmt = new Intl.DateTimeFormat('en-US', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'});
const parts = Object.fromEntries(fmt.formatToParts(now).filter(x => x.type !== 'literal').map(x => [x.type,x.value]));
const bjDate = parts.year+'-'+parts.month+'-'+parts.day;
const data = JSON.parse(await fs.readFile(dataPath,'utf8'));
data.history ??= {};
data.history.videos ??= {};
const videos = data.videos.filter(v => v.verified && v.platform === 'YouTube' && /^[A-Za-z0-9_-]{11}$/.test(v.id));
const uniqueIds = [...new Set(videos.map(v => v.id))];
const byId = new Map(videos.map(v=>[v.id,v]));
let verifiedCount = 0;

for (let offset = 0; offset < uniqueIds.length; offset += 50) {
  const params = new URLSearchParams({
    part:'statistics,snippet',
    id:uniqueIds.slice(offset,offset+50).join(','),
    key:apiKey
  });
  const res = await fetch('https://www.googleapis.com/youtube/v3/videos?'+params, {signal:AbortSignal.timeout(15000)});
  if (!res.ok) {
    const body = await res.text();
    // Deliberately avoid logging the request URL, which contains the API key.
    throw new Error('YouTube Data API returned HTTP '+res.status+': '+body.slice(0,180));
  }
  const reply = await res.json();
  for (const item of reply.items || []) {
    const video = byId.get(item.id);
    if (!video) continue;
    const stats = item.statistics || {};
    const views = Number(stats.viewCount);
    if (!Number.isSafeInteger(views) || views < 0) continue;
    const likes = stats.likeCount == null ? null : Number(stats.likeCount);
    const comments = stats.commentCount == null ? null : Number(stats.commentCount);
    video.views = views;
    video.likes = Number.isSafeInteger(likes) && likes >= 0 ? likes : null;
    video.comments = Number.isSafeInteger(comments) && comments >= 0 ? comments : null;
    video.updated_at = at;
    video.metric_source = 'YouTube Data API v3 / videos.list';
    const history = data.history.videos[item.id] ??= [];
    // Snapshot EVERY run rather than replacing previous readings from the same day.
    const previous = history.filter(x => x.at && Number.isSafeInteger(x.views)).map(x => ({
      snap:x, age:now.valueOf()-Date.parse(x.at)
    })).filter(x => x.age >= 20*3600000 && x.age <= 28*3600000)
      .sort((a,b)=>Math.abs(a.age-86400000)-Math.abs(b.age-86400000))[0];
    video.views_24h = previous && views >= previous.snap.views ? views-previous.snap.views : null;
    history.push({at,date:bjDate,views:video.views,likes:video.likes,comments:video.comments});
    // Keep at most 29 days of 4x daily snapshots, with room for occasional manual runs.
    const cutoff = now.valueOf() - 29*86400000;
    data.history.videos[item.id] = history.filter(x => x.at && Date.parse(x.at) >= cutoff).slice(-250);
    verifiedCount += 1;
  }
}
if (!verifiedCount) {
  throw new Error('YouTube returned no verifiable videos; not overwriting old data.');
}
const oaFancams = videos.filter(v=>v.oa && /直拍|Fancam|FanCam/i.test([v.title,v.type].join(' ')));
const complete = oaFancams.length > 0 && oaFancams.every(v=>Number.isSafeInteger(v.views));
const oaLikesComplete = complete && oaFancams.every(v=>Number.isSafeInteger(v.likes));
const oaViewsKpi = data.kpis.find(x=>x.id === 'oa_views');
const oaLikesKpi = data.kpis.find(x=>x.id === 'oa_likes');
if (oaViewsKpi) {
  oaViewsKpi.value = complete ? oaFancams.reduce((s,v)=>s+v.views,0) : null;
  oaViewsKpi.description = '仅已核验OA个人直拍；首次快照没有24小时增量';
}
if (oaLikesKpi) oaLikesKpi.value = oaLikesComplete ? oaFancams.reduce((s,v)=>s+v.likes,0) : null;
const platform = data.platforms.find(x=>x.name === 'YouTube');
if (platform) {
  const oaItems=videos.filter(v=>v.oa);
  platform.value=oaItems.length && oaItems.every(v=>Number.isSafeInteger(v.views))?
    oaItems.reduce((s,v)=>s+v.views,0):null;
  platform.scope='已收录OA个人视频累计观看（不代表全网）';
  platform.status='已核验 '+oaItems.filter(v=>Number.isSafeInteger(v.views)).length+'/'+oaItems.length+' 条';
  platform.last_updated=at;
}
data.meta.updated_at=at;
data.meta.verified_at=at;
data.meta.edition=bjDate;
const tmp=new URL('../data/dashboard.json.tmp',import.meta.url);
await fs.writeFile(tmp,JSON.stringify(data,null,2)+'\n');
await fs.rename(tmp,dataPath);
console.log('Verified '+verifiedCount+' YouTube video snapshots at '+at+'; 24-hour growth needs matching historical snapshots.');