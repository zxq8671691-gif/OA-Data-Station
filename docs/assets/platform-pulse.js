/* OA platform-specific analytics. Uses observed data only. No network, login, inference or fabricated days. */
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=n=>Number.isSafeInteger(n)?new Intl.NumberFormat('zh-CN').format(n):'待核实';
 const dateLabel=s=>String(s||'').slice(5,10).replace('-','.');
 const rounded=(s)=>{
   const m=String(s||'').trim().replace(/^约|^≈/,'').match(/^(\d+(?:\.\d+)?)(万|亿|K|M)?$/i);
   if(!m)return null;
   const factor={'万':1e4,'亿':1e8,'K':1e3,'M':1e6}[m[2]]||1;
   const decimals=(m[1].split('.')[1]||'').length;
   const step=factor*Math.pow(10,-decimals);
   return {approx:Number(m[1])*factor,lower:Number(m[1])*factor-step/2,raw:s};
 };
 const reading=(obj,key)=>{
   if(!obj)return null;
   if(Number.isSafeInteger(obj[key])&&obj[key]>=0)return {v:obj[key],precise:true,label:number(obj[key])};
   const r=rounded(obj[key+'_display']||obj.metric_display?.[key]);
   return r?{v:r.approx,lower:r.lower,precise:false,label:'约'+String(r.raw).replace(/^约|^≈/,'')}:null;
 };
 const last=(items)=>items.sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')))[0];
 const dateKey=at=>{
   const t=Date.parse(at||'');
   if(!Number.isFinite(t))return String(at||'').slice(0,10);
   return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t));
 };
 const stamp=(iso)=>{
   if(!iso)return'待核实';
   try{return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(iso));}
   catch{return String(iso).slice(0,16);}
 };
 const daySeries=(ids,history,type,key)=>{
   const values=new Map();
   const dates=new Set();
   for(const id of ids){
     const raw=history?.[type==='youtube'?id:'Bilibili:'+id]||[];
     const map=new Map();
     for(const item of raw){
       const day=type==='youtube'?(item.date||dateKey(item.at)):dateKey(item.at);
       const val=reading(type==='youtube'?item:item.metrics,key);
       if(!val)continue;
       const old=map.get(day);
       if(!old||String(old.at)<String(item.at))map.set(day,{day,at:item.at,...val});
     }
     values.set(id,map);for(const k of map.keys())dates.add(k);
   }
   return [...dates].sort().map(day=>{
     const nums=ids.map(id=>values.get(id)?.get(day));
     if(!nums.length||nums.some(x=>!x))return null;
     return {date:day,v:nums.reduce((sum,x)=>sum+x.v,0),approx:nums.some(x=>!x.precise)};
   }).filter(Boolean).slice(-14);
 };
 const barChart=(series,units,quality)=>{
   if(!series.length)return '<div class="pulse-history-empty">没有经过核实的历史快照，暂不绘制趋势。</div>';
   const items=series.slice(-10),max=Math.max(...items.map(p=>p.v),1);
   const axis=items.map(s=>{
      const h=Math.max(14,Math.round(s.v/max*90));
      const txt=s.label||((s.approx?'约':'')+(units==='条'?number(s.v):s.v>=10000?(s.v/10000).toFixed(1)+'万':number(s.v)));
      return '<div class="pulse-bar-unit" title="'+esc(s.date)+'：'+esc(txt)+'"><span class="pulse-bar-top">'+esc(txt)+'</span><div class="pulse-bar" style="height:'+h+'px"></div><span class="pulse-bar-date">'+esc(dateLabel(s.date))+'</span></div>';
   }).join('');
   const foot=series.length<2?'目前只有1个可比采样日，无法计算历史涨幅。':'按实际快照日期展示；缺失日期不补值、不连线。';
   return '<div class="pulse-chart" role="img" aria-label="真实历史柱状图，'+items.length+'个采样日"><div class="pulse-bars">'+axis+'</div><div class="pulse-chart-foot">'+foot+(quality?' '+esc(quality):'')+'</div></div>';
 };
 const card=o=>'<article class="pulse-card"><div class="pulse-card-head"><span class="pulse-tag">'+esc(o.platform)+'</span><span class="pulse-status">'+esc(o.badge||'公开数据')+'</span></div><h3>'+esc(o.title)+'</h3><div class="pulse-number">'+esc(o.primary)+'</div><div class="pulse-secondary">'+esc(o.secondary)+'</div><div class="pulse-timeline-title">'+esc(o.historyTitle||'历史快照变化')+'</div>'+o.chart+(o.extra||'')+'<div class="pulse-provenance">'+esc(o.note)+'</div><a class="pulse-source" href="'+esc(o.source)+'" target="_blank" rel="noopener noreferrer">查看原始来源 ↗</a></article>';
 function build(data){
  const hist=data.history||{},videos=data.videos||[],posts=data.social_posts||[];
  const youtube=videos.filter(v=>v.platform==='YouTube'&&v.content_scope==='solo_fancam');
  const youtubeNow=youtube.every(v=>Number.isSafeInteger(v.views))&&youtube.length?youtube.reduce((n,v)=>n+v.views,0):null;
  const youtubeLikes=youtube.every(v=>Number.isSafeInteger(v.likes))&&youtube.length?youtube.reduce((n,v)=>n+v.likes,0):null;
  const youtubeSeries=daySeries(youtube.map(v=>v.id),hist.videos,'youtube','views');
  const ytDate=youtube.map(v=>v.updated_at).filter(Boolean).sort().at(-1);
  const yout=card({
    platform:'YouTube',title:'OA官方单人直拍',badge:'官方 API',primary:youtubeNow===null?'待核实':number(youtubeNow)+' 次',
    secondary:youtubeLikes===null?'点赞待核实':number(youtubeLikes)+' 赞 · '+youtube.length+' 条单人直拍',
    historyTitle:'累计播放量 · 按日快照',chart:barChart(youtubeSeries,'次'),
    note:'截至 '+stamp(ytDate)+' 北京时间；仅官方OA一人镜头，不计双人、预告或团体内容。',
    source:'https://www.youtube.com/watch?v=p1JBFI77kWo'
  });
  // Only single-part OA focused videos. Exclude multi-P compilations and unrelated group pieces.
  const bili=posts.filter(p=>p.platform==='Bilibili'&&/OA/i.test(p.title||'')&&/个人直拍|横版直拍|怼脸/i.test(p.title||'')&&!/两分P|多P|合集|2P|分P稿件/i.test(p.title||''));
  const readings=bili.map(v=>reading(v,'video_views')).filter(Boolean);
  const biliview=bili.length&&readings.length===bili.length?readings.reduce((s,x)=>s+x.v,0):null;
  const biliExact=readings.length===bili.length&&readings.every(x=>x.precise);
  const biliLikes=bili.length&&bili.every(p=>Number.isSafeInteger(p.likes))?bili.reduce((s,v)=>s+v.likes,0):null;
  const biliSeries=daySeries(bili.map(v=>v.id),hist.browser_posts,'bilibili','video_views');
  const biliSource=bili.find(x=>x.url)?.url||'https://www.bilibili.com/';
  const btxt=biliview===null?'待核实':(biliExact?number(biliview):'约'+(biliview/10000).toFixed(1)+'万')+' 次';
  const bout=card({
   platform:'Bilibili',title:'OA单人直拍样本',badge:'公开页核验',primary:btxt,
   secondary:(biliLikes===null?'点赞待核实':number(biliLikes)+' 赞')+' · '+bili.length+' 个单人稿件',
   historyTitle:'已核实单人稿件播放量 · 日快照',chart:barChart(biliSeries,'次','含平台四舍五入约数'),
   note:'仅已核验OA单人稿件（含搬运），不把2P合集全部播放量归入OA；不是B站全量。',
   source:biliSource
  });
  const xPosts=posts.filter(p=>p.platform==='X / Twitter');
  const qualifying=xPosts.filter(p=>{
    const m=reading(p,'likes');
    return !!m && (m.precise?m.v>=10000:m.lower>=10000);
  });
  const xDays=new Map();
  for(const p of xPosts){
    for(const h of hist.posts?.[p.id]||[]){
      const l=reading(h.metrics||{},'likes')||reading({metric_display:h.metrics_display||{}},'likes');
      if(!l)continue;
      const date=dateKey(h.at);
      if(!xDays.has(date))xDays.set(date,new Set());
      if(l.precise?l.v>=10000:l.lower>=10000)xDays.get(date).add(p.id);
    }
  }
  const xSeries=[...xDays.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,ids])=>({date,v:ids.size,label:'≥'+ids.size+'篇'}));
  const xout=card({
   platform:'X / Twitter',title:'OA相关万赞帖',badge:'截图／公开帖',
   primary:'至少 '+number(qualifying.length)+' 篇',
   secondary:'已核实'+xPosts.length+'条公开帖 · 仅统计有万赞证据的帖子',
   historyTitle:'万赞帖已核实数量 · 快照',chart:barChart(xSeries,'条'),
   note:'粉丝发帖计入OA话题传播，但不当作艺人官方帖。其他帖子尚未核验的点赞数不代表未达万赞。',
   source:qualifying[0]?.url||'https://x.com/search?q=A2O%20LITE%20OA&f=live'
  });
  const wb=data.weibo_supertopic||{},wbObs=wb.observations||[];
  const fanPts=wbObs.filter(x=>x.date&&(Number.isSafeInteger(x.fans)||Number.isFinite(x.fans_approx)))
     .sort((a,b)=>a.date.localeCompare(b.date));
  const signPts=wbObs.filter(x=>x.date&&(Number.isSafeInteger(x.checkins)||Number.isFinite(x.checkins_floor)))
     .sort((a,b)=>a.date.localeCompare(b.date));
  const lastFan=fanPts.at(-1),lastSignin=signPts.at(-1);
  const latestExact=wb.latest_verified_live||[...wbObs].filter(x=>
     x.quality==='original_page'&&x.observed_at&&(Number.isSafeInteger(x.fans)||Number.isSafeInteger(x.checkins))
   ).sort((a,b)=>String(a.observed_at).localeCompare(String(b.observed_at))).at(-1);
  const lastDate=latestExact?.observed_at?.slice(0,10)||latestExact?.date;
  const wbPrimary=latestExact&&Number.isSafeInteger(latestExact.fans)
      ?'最近实测 '+number(latestExact.fans)+' 人':'当日粉丝待核实';
  const wbSecondary=latestExact&&Number.isSafeInteger(latestExact.checkins)
      ?'最近实测签到 '+number(latestExact.checkins)+' 人（'+lastDate+'）':'当日签到待核实';
  const fanSeries=fanPts.map(x=>({date:x.date,v:Number.isSafeInteger(x.fans)?x.fans:x.fans_approx,
      label:x.fans_display||(Number.isSafeInteger(x.fans)?number(x.fans):'约'+(x.fans_approx/10000).toFixed(1)+'万'),
      approx:!Number.isSafeInteger(x.fans)}));
  const signinSeries=signPts.map(x=>({date:x.date,v:Number.isSafeInteger(x.checkins)?x.checkins:x.checkins_floor,
      label:x.checkins_display||(Number.isSafeInteger(x.checkins)?number(x.checkins):'破'+number(x.checkins_floor)),
      approx:!Number.isSafeInteger(x.checkins)}));
  const wbExtra='<div class="pulse-reported">最近历史报道：'+esc(lastFan?.fans_display||'—')+' 粉丝 · '+esc(lastSignin?.checkins_display||'—')+' 日签到'+(lastFan?'（'+esc(lastFan.date)+'）':'')+'</div><div class="pulse-timeline-title">每日签到 · 历史快照</div>'+barChart(signinSeries,'人','标注“破万”仅代表下限，不是精确签到人数');
  const wout=card({
    platform:'微博 · OaAngel超话',title:'超话粉丝与当日签到',badge:latestExact?'已有原站实测':'当日数据待原页核验',
    primary:wbPrimary,secondary:wbSecondary,
    historyTitle:'超话粉丝 · 历史快照',chart:barChart(fanSeries,'人','第三方报道与后续原站实测须区分来源'),
    extra:wbExtra,
    note:'历史报道≠当前实时；更新只接受带来源与日期的超话粉丝及签到截图。不会把超话粉丝等同于艺人微博账号粉丝。',
    source:lastFan?.source||'https://weibo.com/'
  });
  return [yout,bout,xout,wout].join('');
 }
 window.renderPlatformPulse=function(d){
   const node=document.getElementById('platformPulse');
   if(!node)return;
   try{node.innerHTML=build(d);}catch(e){node.innerHTML='<p class="pulse-history-empty">平台指标模块暂时无法加载，保留原始数据源供核实。</p>';console.warn('Platform metrics display failed',e.message);}
 };
})();
