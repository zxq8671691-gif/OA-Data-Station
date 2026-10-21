# OA 数据总览 / OA Daily

A2O LITE 成员 OA 的独立中文粉丝资料、个人直拍、行程和公开视频数据总览。非官方账号。

## 数据采集状态

- 官网前端：数据与图片按原始来源标注，公开网站的国内迁移仍在推进中。
- YouTube：已实现官方 Data API v3 的每6小时只读采集、累计播放/点赞/评论、具有连续快照后的约24小时增长统计。运行需要本人在 GitHub Actions 仓库 Secrets 中配置 `YOUTUBE_API_KEY`。
- GitHub Pages：`scripts/sync-pages.mjs` 会在采集后同步静态网站内嵌数据；之前的“JSON更新但页面不更新”问题已修复。
- 跨平台：微博官方 CLI 列为优先候选；Bilibili、抖音、TikTok、小红书等不绕过访问控制，优先用户授权的官方接口和人工核实公开数据。
- YouTube 搜索辅助：`node scripts/discover-youtube.mjs` 生成待人工审核候选视频，不会自动把搜索结果当成OA个人直拍。

**操作与来源说明**：[DATA_COLLECTION.md](./DATA_COLLECTION.md)

注意：未配置密钥时不会虚构任何视频统计，也不会把模拟测试的数字写入公开网站。中国大陆生产域名与托管待域名实名认证、ICP备案完成后部署。
