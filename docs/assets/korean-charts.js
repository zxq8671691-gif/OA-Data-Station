// NEON Korean charts selector. Offline, deterministic, no external credentials or fabricated ranks.
// Official iChart AK and PAK remain unverified until official source evidence is imported.
(()=>{
  'use strict';
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&#39;'}[c]));
  const select=(id)=>document.getElementById(id);
  const timeLabel=s=>{
    const date=String(s?.date||'').replaceAll('-','.');
    const hour=s?.clock_kst?' '+s.clock_kst+' KST':'';
    return date+hour;
  };
  const field=x=>Number.isSafeInteger(x)&&x>=0?new Intl.NumberFormat('zh-CN').format(x):'待核实';
  function launch(){
    const el=select('koreanChartSelector'),view=select('koreanChartView'),awards=select('koreanAwards'),old=select('spotifyLegacyPanel');
    if(!el||!view||!awards)return;
    let data;
    try{data=JSON.parse(select('embedded-data').textContent).korean_charts;}catch{}
    if(!data?.platforms?.length){view.textContent='榜单数据尚未载入。';return;}
    const tabs=data.platforms;
    const history=platform=>{
      const arr=(platform.snapshots||[]).filter(s=>Number.isSafeInteger(s.rank)&&s.rank>0);
      if(!arr.length)return '<div class="korean-graph-empty">该平台尚无可追溯的 NEON 原榜名次，本页仅提供原始榜单入口。不填假排名。</div>';
      const top=Math.min(...arr.map(s=>s.rank));
      const scoremax=Math.max(...arr.map(s=>s.streams||0),1);
      const bars=arr.slice(-12).map(s=>{
        const isPlay=platform.id==='spotify';
        const size=isPlay?Math.max(14,Math.round((s.streams||0)/scoremax*116))
          :Math.max(22,Math.round(116/Math.sqrt(Math.max(1,s.rank))));
        const v=isPlay?field(s.streams):'#'+field(s.rank);
        const hint=isPlay?'次播放':'（名次越小越好）';
        return '<a class="korean-observation" href="'+esc(s.source)+'" target="_blank" rel="noopener noreferrer" title="'+esc(timeLabel(s))+'：'+esc(v)+' '+hint+'">'+
          '<span class="korean-rank">'+esc(isPlay&&s.streams>=10000?(s.streams/10000).toFixed(1)+'万':v)+'</span>'+
          '<span class="korean-bar" style="height:'+size+'px"></span>'+
          '<small>'+esc(s.date.slice(5).replace('-','.'))+'</small></a>';
      }).join('');
      return '<div class="korean-bars" role="group" aria-label="已核实日期的韩国音源成绩柱状图">'+bars+'</div><div class="korean-chart-foot">每根柱仅为已核验的独立日期快照；点击可打开原榜。'+(arr.length<2?'目前只有1次样本，不能展示变化趋势。':'缺失日期不补值。')+(platform.id==='spotify'?'高度反映日播放次数。':'排名采用示意高度，不代表名次比例。')+'</div>';
    };
    function draw(id){
      const p=tabs.find(x=>x.id===id)||tabs[0];
      el.querySelectorAll('button').forEach(b=>{
        const active=b.dataset.key===p.id;
        b.classList.toggle('active',active);
        b.setAttribute('aria-selected',String(active));
        b.tabIndex=active?0:-1;
      });
      const snaps=(p.snapshots||[]).filter(s=>Number.isSafeInteger(s.rank)&&s.rank>0);
      const latest=snaps.at(-1)||null;
      const heading=p.id==='spotify'
       ?(latest?field(latest.streams)+' 次':'尚待核实')
       :(latest?'#'+field(latest.rank):'待核实');
      const subtitle=latest?(p.id==='spotify'?'韩国日榜结算':'最近一次可追溯名次'):'暂无可靠原榜数值';
      const extra=latest&&Number.isSafeInteger(latest.score)?' · iChart '+field(latest.score)+'分':'';
      view.innerHTML='<div class="korean-feature-head"><div><span class="korean-small">NEON · A2O / A2O LITE · 团体成绩</span><h3>'+esc(p.name)+'</h3></div><span class="korean-observation-tag">'+esc(p.cadence||'依原始平台')+'</span></div>'+
       '<div class="korean-highlight"><strong>'+esc(heading)+'</strong><div>'+esc(subtitle)+esc(extra)+(latest?'<small>'+esc(timeLabel(latest))+'</small>':'')+'</div></div>'+
       history(p)+'<p class="korean-info">'+esc(p.notes||'')+'</p>'+((p.media_reports||[]).length?'<div class="korean-media-reports">'+p.media_reports.map(r=>'<div><span>'+esc(r.date)+'</span> · '+esc(r.label)+'（非原榜核验） <a href="'+esc(r.source)+'" target="_blank" rel="noopener noreferrer">报道 ↗</a><p>'+esc(r.detail)+'</p></div>').join('')+'</div>':'')+
       (latest?'<p class="korean-provenance">最近证据：'+esc(latest.source_name||'原始榜')+' · '+esc(timeLabel(latest))+(latest.time_precision==='date_only'?'（无精确时分）':'')+'</p>':'')+
       '<a class="korean-origin" href="'+esc(latest?.source||p.source)+'" target="_blank" rel="noopener noreferrer">打开原始榜单 ↗</a>';
      if(old)old.hidden=p.id!=='spotify';
    }
    el.innerHTML=tabs.map((p,i)=>'<button type="button" role="tab" data-key="'+esc(p.id)+'" aria-selected="'+(i===0?'true':'false')+'" class="korean-tab'+(i===0?' active':'')+'">'+esc(p.label)+'</button>').join('');
    el.addEventListener('click',e=>{const b=e.target.closest('button[data-key]');if(b)draw(b.dataset.key);});
    function awardsDisplay(id){
      const achievements=data.achievements||[];
      const t=achievements.find(x=>x.kind===id)||achievements[0];
      if(!t)return;
      awards.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.award===t.kind)));
      const info=select('koreanAwardInfo');
      if(info)info.innerHTML='<span class="korean-award-status">'+esc(t.label)+'</span><p>'+esc(t.note)+'</p>'+(t.date?'<small>事件日期：'+esc(t.date)+'</small>':'')+
       '<a href="'+esc(t.source)+'" target="_blank" rel="noopener noreferrer">查看核验依据 ↗</a>';
    }
    const achievements=data.achievements||[];
    awards.innerHTML=achievements.map(a=>'<button type="button" role="tab" data-award="'+esc(a.kind)+'" aria-selected="false">'+esc(a.kind)+'</button>').join('');
    awards.addEventListener('click',e=>{const b=e.target.closest('button[data-award]');if(b)awardsDisplay(b.dataset.award);});
    draw('ichart');awardsDisplay('RAK');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',launch);
  else launch();
})();
