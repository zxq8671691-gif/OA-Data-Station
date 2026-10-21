/* X / Twitter read-only collector for OA Data Overview.
   OFF by default because the X API may require paid developer access.
   User must explicitly opt in: repository variable ENABLE_X_API_READS=yes,
   and store the X developer bearer token as GitHub secret X_BEARER_TOKEN.
   Never logs bearer token or request headers; does not scrape web pages.
   Stores only IDs, public counters and timestamps, not copyrighted post text. */
import fs from 'node:fs/promises';
if(process.env.ENABLE_X_API_READS!=='yes'){
 console.log('X API collector is disabled until separately approved; no billable requests.');
 process.exit(0);
}
const token=process.env.X_BEARER_TOKEN;
if(!token) throw Error('X API was enabled, but X_BEARER_TOKEN secret is unavailable.');
const source='https://api.x.com';
async function get(endpoint,params={}){
 const url=new URL(endpoint,source);
 for(const [k,v]of Object.entries(params))url.searchParams.set(k,String(v));
 const res=await fetch(url,{headers:{Authorization:'Bearer '+token,'Accept':'application/json'},signal:AbortSignal.timeout(14000)});
 if(!res.ok){throw Error('X public API '+endpoint+' HTTP '+res.status+' (stopping without retries)');}
 return res.json();
}
const userInfo=await get('/2/users/by/username/A2O_LITE',{'user.fields':'public_metrics'});
if(!userInfo.data?.id) throw Error('X account lookup returned no official user id.');
const user=userInfo.data;
const feed=await get('/2/users/'+encodeURIComponent(user.id)+'/tweets',{
 max_results:15,
 'tweet.fields':'created_at,public_metrics',
 exclude:'retweets,replies'
});
const iso=new Date().toISOString();
const parseMetric=(v)=>{
 const n=Number(v);
 return Number.isSafeInteger(n)&&n>=0?n:null;
};
const data=JSON.parse(await fs.readFile(new URL('../data/dashboard.json',import.meta.url),'utf8'));
const platform=data.platforms.find(p=>p.name==='X / Twitter');
if(!platform) throw Error('Missing X platform in source data.');
const followerCount=parseMetric(user.public_metrics?.followers_count);
platform.value=followerCount;
platform.last_updated=iso;
platform.metric='followers';
platform.scope='A2O LITE团体官方账号粉丝（非OA个人）';
platform.status='X API官方公开账号指标，已核验';
platform.metric_source='X API v2 users/by/username';
const oaNamed=/\bOA\b|오아/i;
const posts=(feed.data||[]).filter(p=>oaNamed.test(p.text||'')).slice(0,12);
data.social_posts=posts.map(p=>({
 platform:'X / Twitter',
 scope:'OA相关官方帖子',
 id:String(p.id),
 date:p.created_at?.slice(0,10)||null,
 url:'https://x.com/A2O_LITE/status/'+encodeURIComponent(p.id),
 likes:parseMetric(p.public_metrics?.like_count),
 reposts:parseMetric(p.public_metrics?.retweet_count),
 comments:parseMetric(p.public_metrics?.reply_count),
 quotes:parseMetric(p.public_metrics?.quote_count),
 impressions:parseMetric(p.public_metrics?.impression_count),
 updated_at:iso,
 metric_source:'X API v2 / public_metrics'
}));
const reg=data.source_registry.find(s=>s.id==='x');
if(reg){reg.status='api';reg.status_text='X API官方公开数据，最近采集 '+iso.slice(0,16).replace('T',' ')+' UTC';}
data.meta.updated_at=iso;
await fs.writeFile(new URL('../data/dashboard.json',import.meta.url),JSON.stringify(data,null,2)+'\n');
console.log('X official account public metrics verified. OA-related public post IDs:',data.social_posts.length);
