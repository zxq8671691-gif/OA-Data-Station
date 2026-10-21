# OA 数据总览｜官方平台数据采集与授权（2026-10-21）

## 状态
- GitHub Actions：每6小时触发一次；只读官方 YouTube Data API。没有 API key 时跳过，不伪造数字。
- `scripts/update.mjs`：读取所有已登记的 YouTube 视频ID，每最多50条请求一次，记录每次实际读取时点，并比较约24小时前历史快照。
- `scripts/sync-pages.mjs`：把更新后的 JSON 写回 GitHub Pages 的独立首页，避免网页一直展示旧数字。
- 没有 `YOUTUBE_API_KEY` 时，累计观看、点赞、评论仍是待核实。**不要把密钥贴入聊天、源码、README或公开评论。**

## YouTube：你只需自行创建和存储只读 API Key
1. 打开 https://console.cloud.google.com/ ，登录自己的 Google Cloud 账号，创建一个独立项目（如 OA-Data-Overview）。
2. 在「API 和服务 → 库」启用 **YouTube Data API v3**。
3. 在「API 和服务 → 凭据」选择「创建凭据 → API 密钥」。建议在 **API 限制**中仅允许 YouTube Data API v3，设置配额提醒。因 GitHub Hosted Runner 没有固定出口IP，不能简单设置单个固定IP白名单；不要把密钥写在前端。
4. 在 GitHub 仓库 https://github.com/zxq8671691-gif/OA-Data-Station/settings/secrets/actions 中选择 **New repository secret**，名称必须是 `YOUTUBE_API_KEY`，Value 填入刚创建的密钥并保存。
5. 到 https://github.com/zxq8671691-gif/OA-Data-Station/actions/workflows/daily-update.yml ，选择「Run workflow」手动执行一次，核查日志“Verified N YouTube video snapshots”。成功后在 `data/dashboard.json` 和 `docs/index.html` 中能见到最新数值。
6. 第一次只能得出累计观看、点赞、评论；**24小时新增播放必须等到至少两次相隔约24小时的真实快照**。GitHub Actions 定时任务可能延迟，并非秒级实时。

官方：https://developers.google.com/youtube/data/reference/rest/v3/videos/list ，https://developers.google.com/youtube/registering_an_application

## 按平台可行性和安全红线
| 平台 | 可持续正式途径 | 第三方OA视频可用性 | 可报告的指标 |
|---|---|---|---|
| YouTube | YouTube Data API v3, videos.list | **可**，无需视频上传者授权，仅需要本站 API Key | 公开视频累计观看、点赞、评论。增长由本站快照计算 |
| 微博 | 官方微博 CLI，开发者实名认证、扫码设备 OAuth + 开通相应服务 | **可申请公开账号/帖子读取**，但需要核对实际套餐接口与字段 | 帖子点赞/评论/转发；视频播放量不保证能读到 |
| B站 | 官方 Bilibili Open Platform，开发者审核+视频作者授权；公开页面人工可见指标 | 官方数据开放主要面对已授权UP主；不把粉丝的B站登录等同于官方UP主授权 | 公共页面显示的播放/点赞/评论等；无可靠授权不承诺自动全量 |
| 抖音 | 官方抖音开放平台，账号本人 OAuth + 已审核 video.data 权限 | **不能**通过站长自己的粉丝账号授权拉取官方艺人账号作品的数据 | 授权账号的公开视频观看、点赞等 |
| TikTok | TikTok Display API, `video.list` scope + 创作者本人OAuth | **不能**通过站长自己账号授权读取 A2O 的后台 | 授权创作者自己的作品观看/点赞/评论/分享 |
| Instagram | Meta 官方 Instagram API，通常要求创作者或商业账号授权 | 不通用；公开帖可按原帖链接索引 | 账号本人授权情况下才可稳定读取Insights |
| 小红书 | 2026年公开的小红书登录接口首期只开放 `basic_info` | **不能**指望现有公开API返回任意OA笔记浏览量 | 手工核验原帖可见的点赞/收藏/评论，无官方通用播放接口 |

### 安全
- 不接受用户账号密码；优先平台 **OAuth/扫码设备授权**，授权作用于自己的数据时不得冒充官方创作者。
- 不保存浏览器 Cookie、验证码、session token、不用代理池、IP轮换、验证码绕过或绕过风控。
- 遇到 401/403/412/429 停止自动重试并记录失败；人工访问仅按平台允许的操作进行。
- 只把同一发布链接/同一指标的独立快照进行日增量比较，不得把点赞或独立听众当播放数。
- 排行同时展示「今日增量（有连续快照）」「累计观看」「最近发布」；无数据不排假名次。
- 当前的 GitHub Pages / Vercel 免费海外域名不能作为中国大陆正式访问保证，ICP备案完成后迁入国内托管。

## 原始文档索引
- YouTube Data API：https://developers.google.com/youtube/data/reference/rest/v3/videos/list
- 抖音查询授权账号视频数据：https://open.douyin.com/platform/resource/docs/openapi/video-management/douyin/search-video/video-data/
- TikTok Display API：https://developers.tiktok.com/docs/en/display-api-overview
- Bilibili开放平台：https://open.bilibili.com/doc
- 微博官方CLI：https://open.weibo.com/cli
- 小红书scope：https://openaccount.xiaohongshu.com/docs/scope

## 2026-10-21 平台覆盖改造执行结果

- 已提交源码的 13 个来源：YouTube、X、微博、Bilibili、抖音、TikTok、Instagram、小红书、Spotify、Melon、QQ音乐、iChart、Hanteo。
- 外网首页增设「X 社媒追踪」区，且可直接查看 `@A2O_LITE`、官方 Linktree 和 X 上的 OA 相关关键词检索。未核验帖子不自动进入作品列表。
- 「跨平台数据源中心」不再隐藏；公开标记每个平台的可比指标、原始来源、认证方式与获取状态。
- 新增 `content_scope`，将 3 条 OA 官方单人直拍、1 条双人、1 条预告、团体作品、粉丝转载分开处理。个人直拍 KPI 已改为严格三条。
- 现有 YouTube 12 个视频的累计观看、点赞和评论基于已成功采集的官方API快照。约24h增量需要两次匹配快照；未产生时显示未知。
- Bilibili 的单次公开视频读取测试返回 HTTP 412 风控，此后**停止**自动请求，不更换IP、不用账号密码、不绕过验证码。等正式授权或人工核验。
- `scripts/import-manual.mjs` 与 `data/manual-verifications.json` 为准确的人工核验记录提供可追溯导入机制，初始清单空，不代表已取得任一平台未授权指标。
- `scripts/update-x.mjs` 已开发并加入GitHub工作流，但默认不执行 X API 请求。启用前须有用户明确确认潜在资费，并在GitHub配置 `X_BEARER_TOKEN` Secret及变量 `ENABLE_X_API_READS=yes`。只有阅读公开帖子与账号数据，不调用写接口。
- 除 X 之外的微博官方CLI仍需开发者身份核验、开户服务/积分与OAuth；抖音/TikTok创作者统计需要作品发布者账户OAuth，站主个人粉丝账号授权不能代替。
- 不接受任何第三方平台账号密码、Cookie 或验证码。未核实数据保留 null，并提供直达原帖入口。

### 剩余缺口（必须诚实披露）
1. X 帖文互动与官方账号粉丝：等待付费开发者 API 授权确认，未启用、不计费。
2. 微博：等待开发者验证和官方 CLI 授权；未获得稳定视频观看接口。
3. Bilibili：官方UP主授权不可用，测试出现412风控；由人工查看原视频页面并以准确数字、时间戳录入。
4. 抖音、TikTok、Instagram、小红书：官方账号主体与普通粉丝不同，不能用站主登录自行读取他人Insights。待原帖/原渠道授权。
5. 音源与实体销售：Spotify/Melon/QQ音乐/iChart/Hanteo已经收录官方源入口；还缺经过独立核验的完整日序列，不能把独立听众当成播放量、把团体销售当作OA个人成绩。
6. 外网 GitHub Pages 已确认新UI和13源完整可访问；中国大陆 EdgeOne Pages 项目是否已完成此次Git提交后的自动更新，需要腾讯云控制台的最新部署记录核对。正式域名 `oadaily.com` 仍等待备案通过及生产域名绑定。

平台文档：
- X 官方API： https://docs.x.com/
- 微博官方CLI： https://open.weibo.com/cli/quickstart
- YouTube API： https://developers.google.com/youtube/v3/docs/videos/list
- 哔哩哔哩开放平台： https://open.bilibili.com/doc
- TikTok Display API： https://developers.tiktok.com/docs/en/display-api-overview

## 2026-10-21：X 改为免费公开帖转评赞与浏览计数

用户明确选择**只使用公开帖原站可见的互动数字、不购买 X API**。因此，网站的定时工作流已取消 X 付费开发者 API 调用，不需要 X 密钥或任何社交账号登录。

### 已核对原帖入口（不是互动数已核验）
使用 X 官方公开嵌入元信息 `publish.x.com/oembed` 一次性确认来源／作者／原帖：
- https://x.com/oao2o/status/2109592401421705508 —— 粉丝 @oao2o，OA相关影像
- https://x.com/mademoiS2elle/status/2109568327656026150 —— 粉丝 @mademoiS2elle，OA出道相关视频
- https://x.com/oaspics/status/2110665172343775630 —— OA粉丝图片账号
- https://x.com/mademoiS2elle/status/2110664769493783034 —— OA相关舞台讨论
- https://x.com/OmyAngel_/status/2109569383664333283 —— OA相关粉丝帖

**所有上述帖子的点赞、评论、转发、引用、浏览次数仍是null**，直到从X原帖明确核对。第三方韩国论坛上的浏览次数是论坛的，不可混充X帖子的观看量。

### 公共帖核验与更新
需要在原 X 帖子页面（可以由审核者自己正常打开）记录一张可看清数字的截图、原帖完整URL和观察时点，然后由编辑写入 `data/x-public-metrics.json` 的 `snapshots`，格式示例（字段值仅表示结构，**不要复制示例的任何数字作为实际统计**）：

```json
{
  "post_id": "原帖ID",
  "evidence_url": "https://x.com/作者/status/原帖ID",
  "observed_at": "带时区的ISO8601时间",
  "reviewed_by": "编辑",
  "evidence_type": "original_public_post_screenshot",
  "views": null,
  "views_display": "约N万",
  "reposts": null,
  "comments": null,
  "likes": null,
  "quotes": null,
  "video_views": null
}
```

- 若页面显示精确整数，就在对应 `views`、`reposts`、`comments`、`likes`、`quotes` 或 `video_views` 字段录入整数。
- 若只显示“3.2万”，则只在 `views_display` 之类字段填写页面原文字样（可保留约数）；**不能写成精确32000**。
- `views` 指**X帖子被看到多少次**，可能同一人多次；`video_views` 专指若原帖明确单独显示的**视频播放量**。两个不同口径不得混加。
- 每次经过核验后，GitHub Actions `scripts/import-x-public.mjs` 都会校验原始URL及采样时间，更新网站卡片；数字仍不可用则显示“待核实”。
- 有 X 登录状态的编辑可人工正常核验公开帖子，但不需要交出密码、session、Cookie；不做未授权抓取、风控绕过或批量账号操作。
