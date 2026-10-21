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
