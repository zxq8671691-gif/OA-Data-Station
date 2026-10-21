/**
 * OA 数据总览 · 中国大陆静态发布构建
 * Produces cn-dist/ for Tencent EdgeOne Pages.
 * Does not require Google/Tencent credentials: data is collected by GitHub Actions.
 * Public video thumbnails are refreshed from their official URLs at build time,
 * without changing imagery; all actual videos open at their original publisher.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'cn-dist');
const original=path.join(root,'docs');
const data=JSON.parse(await fs.readFile(path.join(root,'data/dashboard.json'),'utf8'));

if(!Array.isArray(data.videos) || data.videos.length<5 || !data.meta?.updated_at)
  throw new Error('OA data not validated or missing. Refusing empty production deploy.');
await fs.rm(output,{recursive:true,force:true});
await fs.cp(original,output,{recursive:true,force:true});
const imgs=path.join(output,'assets');
await fs.mkdir(imgs,{recursive:true});
const portrait=path.join(imgs,'oa-portrait.webp');
const stat=await fs.stat(portrait).catch(()=>null);
if(!stat || stat.size<2500) throw new Error('OA portrait asset is missing; do not deploy broken photo layout.');

const ids=[...new Set(data.videos.filter(x=>x.platform==='YouTube' && /^[a-zA-Z0-9_-]{11}$/.test(x.id)).map(x=>x.id))];
let downloaded=0;
if(process.env.SKIP_REMOTE_MEDIA!=='1'){
 const workers=Array.from({length:Math.min(4,ids.length)},async (_,index)=>{
  for(let i=index;i<ids.length;i+=4){
    const id=ids[i];
    const imageUrl='https://i.ytimg.com/vi/'+encodeURIComponent(id)+'/hqdefault.jpg';
    try{
      const res=await fetch(imageUrl,{signal:AbortSignal.timeout(10000)});
      if(!res.ok || !(res.headers.get('content-type')||'').startsWith('image/'))continue;
      const bytes=Buffer.from(await res.arrayBuffer());
      if(bytes.length<1500 || bytes.length>1200000)continue;
      await fs.writeFile(path.join(imgs,'yt_'+id+'.jpg'),bytes);
      downloaded++;
    }catch(e){console.warn('Video thumbnail not reachable for '+id+': '+e.message);}
  }
 });
 await Promise.all(workers);
}
for(const video of data.videos){
 if(video.platform!=='YouTube')continue;
 const dest=path.join(imgs,'yt_'+video.id+'.jpg');
 const exists=await fs.stat(dest).catch(()=>null);
 video.thumbnail=exists && exists.size>1500 ? './assets/yt_'+video.id+'.jpg' : './assets/oa-portrait.webp';
}
const page=path.join(output,'index.html');
const html=await fs.readFile(page,'utf8');
const marker=/(<script\s+id="embedded-data"\s+type="application\/json">)([\s\S]*?)(<\/script>)/;
if(!marker.test(html))throw new Error('Cannot find embedded-data marker in docs/index.html');
const clean=JSON.stringify(data,null,2).replace(/</g,'\\u003c');
const published=html.replace(marker,(_,start,old,end)=>start+clean+end)
  .replaceAll('/assets/oa-portrait.jpg','./assets/oa-portrait.webp');
await fs.writeFile(page,published,'utf8');
// Do not copy source video images from old docs unknowingly; build-time downloads are refreshed each deploy.
const built=await fs.readFile(page,'utf8');
if(!built.includes(data.meta.updated_at)) throw new Error('Missing actual data verification time in static output');
if(!built.includes('id="videoGrid"')) throw new Error('Video area missing from generated page');
console.log('China static output prepared:',output,'videos:',ids.length,'new original thumbnails:',downloaded,'latest:',data.meta.updated_at);
