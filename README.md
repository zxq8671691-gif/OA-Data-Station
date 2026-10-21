# OA 数据总览

A2O LITE 成员 OA 的独立中文粉丝数据与视频档案（非官方）。

## 中国大陆生产站部署

**[点击导入 GitHub 仓库到 EdgeOne Pages](https://console.cloud.tencent.com/edgeone/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fzxq8671691-gif%2FOA-Data-Station&project-name=oadatastation&build-command=npm%20run%20build%3Acn&output-directory=cn-dist&root-directory=.)**

仓库 `main`，项目 `oadatastation`，构建命令 `npm run build:cn`，输出目录 `cn-dist`，节点选择中国大陆可用区。

> 此处是“部署准备完成”，不代表ICP备案或域名上线完成。国内节点绑定正式自定义域名前需ICP备案，请按照 [中国大陆正式部署操作说明](CHINA_DEPLOYMENT.md) 登录腾讯云执行域名实名、备案、EdgeOne GitHub 授权、域名绑定和HTTPS配置。不要把密码、支付信息、证件或密钥贴在聊天里。

## 数据采集状态

- YouTube Data API v3：GitHub Actions 每6小时读取已收录的公开直拍和节目视频，记录真实播放、点赞、评论及采样时间。持续采样后展示约24小时播放量变化；非秒级实时。
- GitHub Actions 成功后会更新 `data/dashboard.json` 并同步 `docs/index.html`；EdgeOne 关联 `main` 后将随每次代码提交自动部署最新版。
- `scripts/build-cn.mjs` 会把当前源数据注入 HTML，缓存公开 YouTube 封面，并以站内 OA 本地图片作失败回退。已完成生产构建验证。
- Bilibili、微博、抖音、TikTok等指标仅在获得平台授权或可核实的公开值后展示；不会用模拟值填充。

详见 [采集权限和平台来源](DATA_COLLECTION.md)。

## 目录说明

`docs/`：GitHub Pages 的历史兼容静态网站；`cn-dist/`：腾讯云 EdgeOne 构建产物（由 `npm run build:cn` 自动生成）；`data/dashboard.json`：最新的核验数据；`scripts/build-cn.mjs`：中国大陆站点构建。

作品及肖像版权归原权利人，网站内容均为非官方独立粉丝档案。
