// Offline import of public UI observations. This script never contacts a platform.
import fs from 'node:fs/promises';
const read = p => fs.readFile(new URL(p, import.meta.url), 'utf8').then(JSON.parse);
const ledger = await read('../data/browser-verifications.json');
const d = await read('../data/dashboard.json');
const keys = ['views','video_views','likes','comments','reposts','shares','bookmarks','quotes','coins','danmaku'];
const exact = n => Number.isSafeInteger(n) && n >= 0;
const rounded = s => typeof s === 'string' && /^\d+(?:\.\d+)?(?:K|M|万|亿)$/i.test(s);
const routes = {
  Bilibili: /^https:\/\/www\.bilibili\.com\/(?:en\/)?video\/(BV[\w]+)\/$/,
  '微博': /^https:\/\/weibo\.com\/\d+\/([\w]+)$/,
  '抖音': /^https:\/\/www\.douyin\.com\/video\/(\d+)$/
};
if (ledger.schema_version !== 1 || !Array.isArray(ledger.snapshots)) throw Error('Invalid browser ledger');
// Validate the entire ledger before applying anything.
for (const s of ledger.snapshots) {
  if (s.url?.match(routes[s.platform] || /$^/)?.[1] !== s.id) throw Error('Original platform URL/id mismatch');
  if (!s.author || !s.reviewed_by || !s.evidence_excerpt || s.evidence_type !== 'original_public_page_browser') throw Error('Missing UI evidence');
  if (!/(Z|[+-]\d\d:\d\d)$/.test(s.observed_at) || !Number.isFinite(Date.parse(s.observed_at))) throw Error('Timezone required');
  if (Object.keys(s.metrics).some(k => !keys.includes(k) && !keys.some(p => k === p+'_display'))) throw Error('Unknown metric');
  for (const k of keys) {
    if (s.metrics[k] != null && !exact(s.metrics[k])) throw Error('Inexact numeric count: '+k);
    if (s.metrics[k+'_display'] != null && (!rounded(s.metrics[k+'_display']) || s.metrics[k] != null)) throw Error('Invalid rounded display: '+k);
  }
  if (!keys.some(k => exact(s.metrics[k]) || rounded(s.metrics[k+'_display']))) throw Error('No public observations');
}
d.history.browser_posts ??= {};
let changed = 0;
for (const s of ledger.snapshots) {
  let post = d.social_posts.find(p => p.platform === s.platform && p.id === s.id);
  if (post?.updated_at && Date.parse(post.updated_at) >= Date.parse(s.observed_at)) continue;
  if (!post) { post = {id:s.id,platform:s.platform}; d.social_posts.push(post); }
  Object.assign(post, {url:s.url,title:s.title,author_handle:s.author,author_scope:s.author_scope,
    content_scope:s.content_scope,updated_at:s.observed_at,metric_source:'云浏览器原站公开页面核验（非API）',
    metric_status:'已核验可见指标；未显示指标为空',evidence_type:s.evidence_type,
    evidence_excerpt:s.evidence_excerpt,metric_display:{}});
  // Replace all metrics so a new rounded/hidden count never retains an old exact value.
  for (const k of keys) {
    post[k] = s.metrics[k] ?? null;
    if (s.metrics[k+'_display']) post.metric_display[k] = s.metrics[k+'_display'];
  }
  const history = d.history.browser_posts[s.platform+':'+s.id] ??= [];
  if (!history.some(h => h.at === s.observed_at)) history.push({at:s.observed_at,metrics:s.metrics,evidence_url:s.url,evidence_excerpt:s.evidence_excerpt});
  history.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  // Also refresh an already approved Bilibili archive entry without changing ownership.
  const v = d.videos.find(v => v.platform === s.platform && v.id === s.id);
  if (v && (!v.updated_at || Date.parse(v.updated_at) < Date.parse(s.observed_at))) {
    v.views = s.metrics.video_views ?? null;
    v.views_approx = s.metrics.video_views_display ? '约'+s.metrics.video_views_display : null;
    v.likes = s.metrics.likes ?? null;
    v.likes_display = s.metrics.likes_display ?? null;
    v.comments = s.metrics.comments ?? null;
    v.updated_at = s.observed_at;
    v.metric_source = post.metric_source;
    v.approx_note = s.evidence_excerpt;
  }
  changed++;
}
for (const platform of ledger.policy.platforms) {
  const samples = d.social_posts.filter(p=>p.platform===platform && p.evidence_type==='original_public_page_browser');
  const p = d.platforms.find(p=>p.name===platform);
  if (p && samples.length) {
    p.status = '原站核验 '+samples.length+' 条公开内容 · 每日一轮';
    p.last_updated = samples.map(s=>s.updated_at).sort((a,b)=>Date.parse(b)-Date.parse(a))[0];
  }
  const source = d.source_registry.find(s=>s.platform===platform);
  if (source) Object.assign(source,{status:'manual',status_text:'已核验3条原站公开内容；每日最多一轮，登录失效或风控即停止',method:'用户登录的云浏览器只读公开页面（非后台／非API）'});
}
// Report the latest attempted round without advancing the last successful observation.
for (const platform of ledger.policy.platforms) {
  const latest = (ledger.runs || []).filter(r => r.platform === platform)
    .sort((a,b) => (b.observed_at || b.date).localeCompare(a.observed_at || a.date))[0];
  if (latest && latest.status !== 'completed') {
    const p = d.platforms.find(p=>p.name===platform);
    const source = d.source_registry.find(s=>s.platform===platform);
    const status = latest.date + ' 本轮未更新：' + (latest.reason || latest.status);
    if (p) { p.status = status; p.last_attempt_at = latest.observed_at || null; }
    if (source) source.status_text = status;
  }
}
const x = d.source_registry.find(s=>s.id==='x');
if (x) x.status_text = '采集暂停（用户暂未成功登录）；保留既有来源和历史截图，不尝试登录';
const xp = d.platforms.find(p=>p.name==='X / Twitter');
if (xp) xp.status = '采集暂停 · 保留既有历史记录';
d.meta.collection_policy = ledger.policy;
if (changed) {
  d.meta.updated_at = new Date().toISOString();
  d.meta.verified_at = ledger.snapshots.map(s=>s.observed_at).sort((a,b)=>Date.parse(b)-Date.parse(a))[0];
  d.meta.notice = '每日一轮公开数据核验；X暂停。播放、帖文浏览及互动分开；K/M/万保留约数，未显示指标为空。快照不代表全网总量。';
}
await fs.writeFile(new URL('../data/dashboard.json',import.meta.url), JSON.stringify(d,null,2)+'\n');
console.log('Browser public observations applied:', changed);

