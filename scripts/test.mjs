import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const data=JSON.parse(await fs.readFile(new URL('../data/dashboard.json',import.meta.url),'utf8'));
assert(data.videos.length>=5 && data.articles.length>0 && data.platforms.length>=6);
assert(data.videos.every(v=>/^https:\/\//.test(v.url)&&v.platform));
assert(data.articles.every(a=>/^https:\/\//.test(a.url)));
assert(data.group_charts.every(c=>Number.isFinite(c.streams)&&c.date));
assert(data.videos.some(v=>v.platform==='Bilibili') && data.videos.some(v=>v.platform==='YouTube'));
assert(data.videos.every(v=>v.views===null||Number.isSafeInteger(v.views)));
console.log('OA 数据总览 v4 passes JSON/source/platform checks.');
