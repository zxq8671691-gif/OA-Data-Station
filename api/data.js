import fs from 'node:fs/promises';
const remote='https://raw.githubusercontent.com/zxq8671691-gif/OA-Data-Station/main/data/dashboard.json';
export default async function handler(req,res){
 let data=null;let origin='bundled';
 try{
  const r=await fetch(remote,{signal:AbortSignal.timeout(7000),headers:{Accept:'application/json','User-Agent':'OA-data-station/1.0'}});
  if(r.ok){const x=await r.json();if(x?.meta?.edition&&x.profile&&Array.isArray(x.videos)){data=x;origin='github';}}
 }catch{}
 if(!data){try{data=JSON.parse(await fs.readFile(new URL('../data/dashboard.json',import.meta.url),'utf8'))}catch{}
 }
 if(!data){res.status(503).json({error:'No valid dashboard data'});return}
 res.setHeader('Cache-Control','public, max-age=0, s-maxage=180, stale-while-revalidate=600');
 res.setHeader('X-Data-Origin',origin);
 res.status(200).json(data);
}
