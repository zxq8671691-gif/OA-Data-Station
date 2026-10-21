# 给当前已登录微博的 ChatGPT Work 会话的直接任务

**目标：不重新登录、不绕过风控，核实 OaAngel 超话今日粉丝与签到数字，并将快照写入现有 OA 数据站仓库。**

请在这个已经登录微博的 Work 云浏览器会话里执行：
1. 正常打开微博，搜索 `OaAngel` 超话（仅该超话；不要错用 A2O LITE 团体超话或 OA 粉丝账号）。
2. 进入 OaAngel 超话首页，查看“粉丝人数”和“今日签到人数”；二者同时记录最好，若只显示一项则只记录该项。
3. 只读取公开页面实际显示的数字。准确整数写 `fans` / `checkins`；若页面只显示“2.5万”等保留字符串于 `fans_display` / `checkins_display`，绝对不能当成25000的精确值。超话签到是每日重置，不是累计签到。
4. 记录包含时区的实际观察时间 `observed_at`（如 `2026-10-21T20:00:00+08:00`；示例时间不要复制为真实观察时点）、当日日期 `date` 和真实的微博超话原始链接 `source`，及 `reviewed_by`、`evidence_type`。
5. 将新增一条 `quality: "original_page"` 的快照追加到 `data/weibo-supertopic.json` 的 `observations`，**保留历史记录**，不要覆盖旧日期。GitHub: `zxq8671691-gif/OA-Data-Station` / `main`。
6. 仅将新快照文件提交到 GitHub。自动工作流 `OA Daily Public Review Merge` 将读取它、更新 `data/dashboard.json` 和静态网站，EdgeOne Pages 随 `main` 发布。
7. 如果微博要求验证码、访问被拦或数据不显示就停止，说明实际可见状态，**不填写猜测数据，不导出 Cookie、密码，不增加抓取频率**。现有登录会话应按用户之前确定的低频核验政策执行。

追加快照的数据结构（所有数字只是字段名称，不是让你填样例数值）：
```json
{
  "date":"核验日期YYYY-MM-DD",
  "observed_at":"本次核验时区明确的ISO时间",
  "quality":"original_page",
  "source":"https://weibo.com/真实超话入口",
  "source_type":"微博OaAngel超话主页",
  "reviewed_by":"Work云浏览器公开页核验",
  "evidence_type":"original_public_page_browser",
  "fans":null,
  "fans_display":null,
  "checkins":null,
  "checkins_display":null,
  "note":"页面显示的真实口径或备注"
}
```

`fans`/`checkins` 必须是精确非负整数或null；`fans_display`/`checkins_display` 只能填原站可见的「约2.5万」「破1万」等数值标签或null。一次快照至少有一个真实可见指标。

**其他任务不要改变：X仍保持暂停，B站/微博/抖音普通帖沿用原有每日最多1次、每个平台最多3条的安全上限。**
