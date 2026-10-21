import fs from 'node:fs/promises';
const src=new URL('../',import.meta.url);
const dest=new URL('../public/',import.meta.url);
await fs.rm(dest,{recursive:true,force:true});await fs.mkdir(dest,{recursive:true});
for(const name of ['index.html','style.css','app.js'])await fs.copyFile(new URL(name,src),new URL(name,dest));
for(const name of ['data','assets'])await fs.cp(new URL(name,src),new URL(name,dest),{recursive:true});
const media=[
 ['https://0.soompi.io/wp-content/uploads/2026/10/15034831/Oa.jpg','assets/oa-portrait.jpg','official OA publicity portrait'],
 ...["pbmb_TsEugU", "eB6vt-ne3A4", "-TGCURaf8f8", "p1JBFI77kWo", "iXQsuYOyvos", "zzFt3QY6kC4", "BkaGqUxvN6w", "c7REvlMKFro", "d2TTCQsHZfY", "n9HYtcN6W4w", "29Bn6d82Qgc", "4LSlCfqF7Sc"].map(id=>[`https://i.ytimg.com/vi/${id}/hqdefault.jpg`,`assets/yt_${id}.jpg`,id])
];
const fetchImage=async ([url,relative,label])=>{
  let response;
  try{response=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'Mozilla/5.0 (OA DATA STATION independent fan archive)'}});
    if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw new Error('HTTP '+response.status);
    const buf=Buffer.from(await response.arrayBuffer());if(buf.length<1500||buf.length>12000000)throw new Error('Invalid image size '+buf.length);
    await fs.writeFile(new URL(relative,dest),buf); console.log('Cached image',label,buf.length,'bytes');return true;
  }catch(err){console.warn('Image fetch unavailable',label,err.message);return false;}
};
const results=await Promise.all(media.map(fetchImage));
if(!results[0]){console.warn('OA photo unavailable at build; runtime proxy remains as fallback.');}
console.log('Built OA fan-site frontend into public/.');
