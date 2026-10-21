/* NEON Korea / compact "C" layout.
 * Only recorded original chart snapshots are shown. No fabricated live ranks or AK/PAK.
 * Works as a standalone static component on GitHub Pages and Tencent EdgeOne.
 */
(()=>{
'use strict';
const byId=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat('zh-CN').format(n):'待核实';
const md=s=>String(s||'').slice(5).replace('-','.');
const clock=s=>(s?.date?md(s.date):'未知日期')+(s?.clock_kst?' · '+s.clock_kst:'');
const link=s=>/^https:\/\//.test(String(s||''))?s:'#';
const latest=p=>[...(p?.snapshots||[])].filter(s=>Number.isSafeInteger(s.rank)&&s.rank>0).sort((a,b)=>(a.date+(a.clock_kst||'')).localeCompare(b.date+(b.clock_kst||''))).at(-1);
const core=['ichart','melon','genie','bugs'];
const extra=['melonhot','bugsdaily','flo','vibe','ytmusic','spotify'];
function init(){
 const overview=byId('koreanSnapshotRow'),insight=byId('koreanInsights'),tabs=byId('koreanChartSelector'),
       more=byId('koreanChartMore'),view=byId('koreanChartView'),awards=byId('koreanAwards'),
       info=byId('koreanAwardInfo'),legacy=byId('spotifyLegacyPanel');
 if(!overview||!tabs||!more||!view||!awards)return;
 let data;
 try{data=JSON.parse(byId('embedded-data').textContent).korean_charts;}catch{}
 if(!data?.platforms?.length){view.textContent='榜单资料暂未载入';return;}
 const platforms=data.platforms;
 const find=id=>platforms.find(p=>p.id===id);
 const title=p=>({ichart:'iChart',melon:'Melon',genie:'Genie',bugs:'Bugs'})[p.id]||p.label;
 const coreData=core.map(find).filter(Boolean);
 let selected='melon';
 let expandedAward=null;
 function summary(){
   overview.innerHTML=coreData.map(p=>{
     const one=latest(p);
     return '<button type="button" class="korea-snapshot" data-pick="'+safe(p.id)+'" aria-label="查看'+safe(title(p))+'历史名次">'+
       '<span>'+safe(title(p))+'</span><strong>'+(one?'#'+fmt(one.rank):'—')+'</strong>'+
       '<small>'+(one?safe(clock(one)):'未核验')+'</small></button>';
   }).join('');
   const ranks=coreData.map(p=>latest(p)).filter(Boolean);
   const leader=ranks.filter(s=>s.rank===1).length;
   const m=find('melon'),ms=[...(m?.snapshots||[])].filter(x=>Number.isSafeInteger(x.rank)).sort((a,b)=>a.date.localeCompare(b.date));
   let bits=[];
   if(ranks.length){
     bits.push('<span class="korea-insight-tag">观察</span><p>最近存档中，<b>'+leader+'/'+ranks.length+' 个核心榜单</b>位列第1；记录时间不同，不能据此认定同期 All-Kill。</p>');
   }
   if(ms.length>=2 && ms[0].rank!==ms.at(-1).rank){
     const first=ms[0],end=ms.at(-1);
     bits.push('<span class="korea-insight-tag">变化</span><p>Melon TOP100 从 <b>'+safe(md(first.date))+' #'+fmt(first.rank)+'</b> 到 <b>'+safe(md(end.date))+' #'+fmt(end.rank)+'</b>；仅代表两次可核验记录。</p>');
   }else{
     bits.push('<span class="korea-insight-tag">趋势</span><p>部分榜单只有一个历史采样点；证据不足时不绘制虚假的连续走势。</p>');
   }
   if(insight)insight.innerHTML=bits.map((v,i)=>'<div class="korea-insight-line">'+v+'</div>').join('');
 }
 function history(p){
   const snaps=[...(p.snapshots||[])].filter(x=>Number.isSafeInteger(x.rank)&&x.rank>0)
      .sort((a,b)=>(a.date+(a.clock_kst||'')).localeCompare(b.date+(b.clock_kst||''))).slice(-8);
   if(!snaps.length)return '<div class="korea-no-history">暂未取得可核验的原榜名次。'+
     ((p.media_reports||[]).length?'<small>有二手榜首报道，但未确认准确榜单类别和时点。</small>':'')+'</div>';
   if(snaps.length===1)return '<div class="korea-no-history">目前仅有 <b>1次</b> 原榜记录（'+safe(clock(snaps[0]))+'），暂时无法计算排名变化。</div>';
   const spotify=p.id==='spotify';
   const scores=snaps.map(s=>spotify?(s.streams||0):s.rank);
   const maximum=Math.max(...scores,1),worst=Math.max(...scores),best=Math.min(...scores);
   const bars=snaps.map((s,i)=>{
     const val=spotify?s.streams:s.rank;
     let height;
     if(spotify)height=Math.max(22,Math.round(90*(val/maximum)));
     else height=best===worst?72:Math.round(35+65*(worst-val)/(worst-best));
     const label=spotify?(val>=10000?(val/10000).toFixed(1)+'万':fmt(val)):'#'+fmt(val);
     return '<a class="korea-mini-bar" href="'+safe(link(s.source))+'" target="_blank" rel="noopener noreferrer" title="'+safe(s.date+(s.clock_kst?' '+s.clock_kst+' KST':''))+': '+safe(label)+'"><b>'+safe(label)+'</b><span style="height:'+height+'px"></span><small>'+safe(md(s.date))+'</small></a>';
   }).join('');
   return '<div class="korea-chart-graph" role="group" aria-label="真实采样日排名记录">'+bars+'</div>'+
          '<p class="korea-chart-note">'+(spotify?'柱高表示每日播放次数':'柱高仅示意相对名次（越高排名越靠前）')+' · 点击柱子查看原榜；缺失日期不补值</p>';
 }
 function draw(id){
   const p=find(id)||find('melon')||platforms[0];
   selected=p.id;
   tabs.querySelectorAll('button').forEach(b=>{
     const on=b.dataset.key===selected;
     b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));
   });
   overview.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.pick===selected));
   more.value=extra.includes(selected)?selected:'';
   const one=latest(p),isSpotify=p.id==='spotify';
   const head=one?(isSpotify?fmt(one.streams)+' 次播放':'#'+fmt(one.rank)):'—';
   const snapshots=p.snapshots||[];
   let report='';
   if(!one&&(p.media_reports||[]).length){
     const r=p.media_reports.at(-1);
     report='<p class="korea-media-note">历史媒体整理：'+safe(r.date)+' 曾报道登顶，但榜单类别尚未核验。 <a href="'+safe(link(r.source))+'" target="_blank" rel="noopener noreferrer">报道 ↗</a></p>';
   }
   view.innerHTML='<div class="korea-detail-summary"><div><span>当前查看</span><h4>'+safe(p.name)+'</h4>'+
     '<small>'+(one?'最近记录：'+safe(clock(one))+(one.clock_kst?' KST':'（无准确时分）'):'尚无官方原榜样本')+'</small></div>'+
     '<strong>'+safe(head)+'</strong></div>'+
     history(p)+report+
     '<div class="korea-chart-bottom"><span>'+(one?'已收录 '+snapshots.length+' 次可追溯样本':'暂无可核实名次')+'</span>'+
     '<a href="'+safe(link(one?.source||p.source))+'" target="_blank" rel="noopener noreferrer">原始榜单 ↗</a></div>';
   if(legacy)legacy.hidden=true; // Old Spotify graph is retained only for old app data compatibility.
 }
 function showAward(kind){
   if(expandedAward===kind){expandedAward=null;info.hidden=true;}
   else{
     expandedAward=kind;info.hidden=false;
     const a=(data.achievements||[]).find(x=>x.kind===kind);
     if(a)info.innerHTML='<strong>'+safe(a.kind)+' · '+safe(a.label)+'</strong><p>'+safe(a.note)+'</p>'+
       '<a href="'+safe(link(a.source))+'" target="_blank" rel="noopener noreferrer">核验来源 ↗</a>';
   }
   awards.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.award===expandedAward)));
 }
 summary();
 tabs.innerHTML=coreData.map(p=>'<button type="button" role="tab" data-key="'+safe(p.id)+'" aria-selected="false">'+safe(title(p))+'</button>').join('');
 more.innerHTML='<option value="">其他榜单</option>'+extra.map(id=>find(id)).filter(Boolean)
  .map(p=>'<option value="'+safe(p.id)+'">'+safe(p.label)+'</option>').join('');
 awards.innerHTML=(data.achievements||[]).map(a=>{
   const label=a.status==='reported'?'报道达成':a.status==='verified'?'已认证':'待核实';
   return '<button type="button" role="tab" data-award="'+safe(a.kind)+'" aria-selected="false"><b>'+safe(a.kind)+'</b><span>'+safe(label)+'</span></button>';
 }).join('');
 overview.addEventListener('click',e=>{const b=e.target.closest('button[data-pick]');if(b)draw(b.dataset.pick);});
 tabs.addEventListener('click',e=>{const b=e.target.closest('button[data-key]');if(b)draw(b.dataset.key);});
 more.addEventListener('change',e=>{if(e.target.value)draw(e.target.value);});
 awards.addEventListener('click',e=>{const b=e.target.closest('button[data-award]');if(b)showAward(b.dataset.award);});
 draw('melon');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
