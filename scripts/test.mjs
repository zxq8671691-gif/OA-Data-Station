import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const data=JSON.parse(await fs.readFile(new URL('../data/dashboard.json',import.meta.url),'utf8'));
assert(data.videos.length>=5 && data.articles.length>0 && data.platforms.length>=6);
assert(data.videos.every(v=>/^https:\/\//.test(v.url)&&v.platform));
assert(data.articles.every(a=>/^https:\/\//.test(a.url)));
assert(data.group_charts.every(c=>Number.isFinite(c.streams)&&c.date));
assert(data.videos.some(v=>v.platform==='Bilibili') && data.videos.some(v=>v.platform==='YouTube'));
assert(data.videos.every(v=>v.views===null||Number.isSafeInteger(v.views)));
console.log('OA 数据总览 v4 passes JSON/source/platform checks.');

assert.equal(data.kpis.find(k=>k.id==='official_fancams').value,data.videos.filter(v=>v.platform==='YouTube'&&v.content_scope==='solo_fancam').length,'OA single fancam count must exclude duo and teaser');
assert(data.source_registry?.length>=13,'X, audio, video and domestic/social sources must be visible');
assert(data.source_registry.some(s=>s.id==='x'&&/^https:\/\/x\.com\//.test(s.url)),'Official X source required');
assert(data.links.some(l=>/^https:\/\/x\.com\//.test(l.url)),'Official X link required');
assert(data.videos.every(v=>typeof v.content_scope==='string'),'Video ownership labels required');
assert(data.videos.filter(v=>v.content_scope==='solo_fancam').every(v=>v.oa),'Solo content must be OA');
assert(data.source_registry.filter(s=>s.status==='api'&&s.id!=='youtube').every(s=>s.method),'Authorized API evidence required');
assert(Array.isArray(data.social_posts),'X social-post feed should be a truthful empty array until authorized');
console.log('OA source audit passes: '+data.source_registry.length+' sources including X/Twitter, verified fan-cam scope and source links.');

assert(data.social_posts.filter(p=>p.platform==='X / Twitter').length>=5,'At least five OA public X post links should be source-confirmed');
assert(data.social_posts.every(p=>!p.metric_source || Boolean(p.updated_at)),'Never show claimed X metrics without snapshot time');
assert(data.social_posts.every(p=>p.platform!=='X / Twitter' || /^https:\/\/x\.com\/[^/]+\/status\/\d+$/.test(p.url)),'X public post links must be original posts');
console.log('OA public X engagement registry checked. Metrics without original evidence stay null.');
