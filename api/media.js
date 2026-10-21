// All proxy targets are allowlisted; never forward arbitrary URLs.
const portrait='https://0.soompi.io/wp-content/uploads/2026/10/15034831/Oa.jpg';
const ytIDs=new Set(["pbmb_TsEugU", "eB6vt-ne3A4", "-TGCURaf8f8", "p1JBFI77kWo", "iXQsuYOyvos", "zzFt3QY6kC4", "BkaGqUxvN6w", "c7REvlMKFro", "d2TTCQsHZfY", "n9HYtcN6W4w", "29Bn6d82Qgc", "4LSlCfqF7Sc"]);
export default async function handler(req,res){
 const kind=String(req.query.kind||'');const id=String(req.query.id||'');
 let url=null;
 if(kind==='portrait')url=portrait;
 else if(kind==='youtube'&&ytIDs.has(id))url=`https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
 if(!url){res.status(404).send('Not found');return;}
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(12500),headers:{'User-Agent':'Mozilla/5.0'}});
  if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw new Error('upstream '+r.status);
  const buf=Buffer.from(await r.arrayBuffer());
  if(buf.length<1400||buf.length>12000000)throw new Error('invalid size');
  res.setHeader('Content-Type',r.headers.get('content-type'));
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=1209600');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.status(200).send(buf);
 }catch(e){res.status(503).setHeader('Cache-Control','no-store').send('image source temporarily unavailable');}
}
