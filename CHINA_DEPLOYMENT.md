# OA 数据总览｜中国大陆 EdgeOne Pages 正式部署（2026-10-21）

> 站点代码和自动更新已准备好。**当前尚未拥有经认证的中国大陆正式生产站点**，不要把 GitHub Pages / Vercel 的 HTTP 200 当作国内上线。

## 已完成：静态站部署准备

- 源码仓库：`zxq8671691-gif/OA-Data-Station`，使用 `main` 分支。
- 根目录：`./`。构建命令：`npm run build:cn`。输出目录：`cn-dist`，Node.js 22。
- 项目名：`oa-data-overview`。根目录 `edgeone.json` 已声明构建命令与输出。
- `scripts/build-cn.mjs` 自动把当下 `data/dashboard.json` 写入静态网站的公开首页，避免数据旧版本。OA 本地图像 `docs/assets/oa-portrait.webp` 必须存在；部署时尽量获取公开 YouTube 视频封面并在同一次构建中缓存，无法获取则回退OA本地图片。
- 已在隔离环境真实运行 `npm run build:cn`：检查通过，15个视频、12个YouTube封面、OA图像、最新数据时间，全部进入 `cn-dist/`。
- 现有 GitHub Actions 每6小时调用 Google YouTube Data API 获取公开视频统计，成功则提交 `data/dashboard.json` 和 `docs/index.html` 到 main。将 EdgeOne Pages 项目 Git 连接到 main 后，每次提交自动部署（前提是构建没有被暂停）。

## 你需要在腾讯云网页上完成的操作

### A. 立即建立项目（**不需要等待备案**）
1. 打开 **[一键带入仓库与构建参数](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fzxq8671691-gif%2FOA-Data-Station&project-name=oa-data-overview&build-command=npm%20run%20build%3Acn&output-directory=cn-dist&root-directory=.)**。需要腾讯云登录时使用购买域名的账号。
2. 选择**导入 Git 仓库**，授权 `EO Makers / EdgeOne Pages` 访问 GitHub；只授权你自己的 `OA-Data-Station` 仓库即可。
3. 按下表检查：
   | 参数 | 值 |
   |---|---|
   | 仓库 | `zxq8671691-gif/OA-Data-Station` |
   | Branch | `main` |
   | 项目名称 | `oa-data-overview` |
   | 项目根目录 | `./` |
   | 构建命令 | `npm run build:cn` |
   | 输出目录 | `cn-dist` |
   | Node | `22` |
   | 加速区域 | **中国大陆可用区**（或包含中国大陆的全球区，备案通过后才能绑定长期自定义域名） |
4. 开始部署。确认生成的生产构建有 `index.html`、`assets/oa-portrait.webp`、`assets/yt_*.jpg`；若没有，在构建日志中查看具体错误。
5. 此时可以用 EdgeOne 控制台短时预览，但正式长久公开 URL 仍须等待备案和自定义域名接入。

官方进口：
- 中国站：https://console.cloud.tencent.com/edgeone/pages
- GitHub 导入：https://edgeone.ai/zh/document/70404
- Build / root / output：https://edgeone.cloud.tencent.com/pages/document/162936788693114880

### B. 域名实名和ICP备案
1. 确认域名实名审核**已通过**（不是只提交），并确保域名注册人真实姓名与备案主体一致。
2. **腾讯云注册的域名实名通过后等3个自然日**再发起备案（若不是腾讯云购买，则按腾讯云官方条款）。
3. 打开 https://console.cloud.tencent.com/beian ，按所在地备案。注意可能需要符合条件的腾讯云内地服务器/备案云资源；不要未经提示就购买不匹配的套餐。腾讯云轻量应用服务器通常要求大陆地域、包月累计3个月及以上等。
4. ICP 网站名称、内容和个人备案类型以当地通信管理局审查为准。OA粉丝媒体资讯以链接索引为主；不设置无资质的新闻发布平台、收费内容或开放式论坛。
5. 等待审核批准取得ICP备案号。**未获批前不要把域名绑到大陆正式网站发布。**

官方：https://cloud.tencent.com/document/product/243/19627

### C. 备案通过后：正式域名与DNS
1. 进入 EdgeOne Pages 项目 → 域名管理 → 添加域名：`www.<实际购买的域名>`。
2. 平台会显示验证 TXT（如需）和目标 CNAME；进入腾讯云 DNSPod / 域名解析按**页面给出的具体值**填写，不要猜测。
3. 开启/申请 HTTPS 免费证书。要启用裸域名 `<实际购买的域名>` 时，再依照平台支持的根域名解析与跳转方式另行配置。
4. 根域名/WWW 真实中国大陆手机访问通过以后，在网站页脚显示获批 ICP 备案号并核对所在省份的其他要求。
5. 用移动、联通、电信三种真实大陆网络分别验证：首页 HTTP 200、OA图片、视频封面、数据时间、跳转原始视频链接的可用性。注意 YouTube 原始链接本身在中国大陆不一定可打开，这不应被当成网站首页故障。

官方：https://edgeone.cloud.tencent.com/pages/document/162936836982489088

## 当前阻塞点
- 你已经购入域名，但聊天尚未给出**准确的域名字符串**；不能猜测域名并直接改 DNS。
- 尚未确认该域名的实名认证已通过及ICP备案已获批准。
- ChatGPT 本次连接拥有 GitHub 与 Vercel，但**没有腾讯云管理账号的直接操作权限**；腾讯云 GitHub App OAuth 和自定义域名绑定必须由账号持有人在腾讯云控制台授权完成，之后提供项目公开ID/预览URL供核验。
- 不要把身份证、验证码、密钥或域名控制台账号密码发送到聊天。
