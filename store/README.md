# 上架材料包（Microsoft Edge Add-ons）· 滚动按钮 v1.1.0

本目录包含提交 Microsoft Edge 商店所需的全部素材与文案。**提交操作需由你本人完成**（涉及你的微软账号），以下为清单与逐步指引。

## 1. 文件清单

| 文件 | 用途 | 规格 | 状态 |
|---|---|---|---|
| `edge-scroll-buttons-v1.1.0.zip` | 上传包（必需，当前版；v1.0.0 为历史版本） | manifest 在根目录，MV3 | ✅ |
| `logo-300.png` | 商店 logo（必需） | 300×300 PNG | ✅ |
| `screenshot-1-hero.png` | 截图 1：主视觉 | 1280×800 PNG | ✅ |
| `screenshot-2-styles.png` | 截图 2：36 款样式 · 6 大分类 | 1280×800 PNG | ✅ |
| `screenshot-3-menu.png` | 截图 3：菜单 + 网站排除 | 1280×800 PNG | ✅ |
| `screenshot-4-gestures.png` | 截图 4：四种手势 | 1280×800 PNG | ✅ |
| `screenshot-5-customize.png` | 截图 5：细节可调 + 备份恢复 | 1280×800 PNG | ✅ |
| `tile-440x280.png` | 小宣传磁贴（可选） | 440×280 PNG | ✅ |
| `tile-1400x560.png` | 大宣传磁贴（可选） | 1400×560 PNG | ✅ |
| `icon-1024.png` | 备用大图 | 1024×1024 PNG | ✅ |
| `listing-zh-CN.md` | 中文文案 | — | ✅ |
| `listing-en-US.md` | 英文文案 | — | ✅ |
| `build/` | 素材源码（图标/截图模板，**不要上传**） | — | — |

## 2. 提交流程（Partner Center，共 8 步）

1. **注册开发者账号（免费）**
   打开 Partner Center（partner.microsoft.com）→ 用**微软个人账号**登录（Outlook / Hotmail / Live 邮箱；Gmail 可先注册一个微软账号；注意：**工作/学校账号不行**）→ 注册 Microsoft Edge program。官方说明：注册与提交**完全免费**。
2. **上传安装包**
   Partner Center → Edge 工作区 → "Create new extension" → 上传 `edge-scroll-buttons-v1.0.0.zip`，等待校验通过。
3. **Availability（上架范围）**
   Visibility 选 **Public**；Markets 默认全部市场即可。
4. **Properties（属性）**
   类别选 **高效工作**（英文界面为 Productivity；不是"开发人员工具"）；隐私政策见下方第 4 节（如必填 URL，可先按要求提供，或填 `weiaisuyansjd@gmail.com` 作为联系渠道并在描述中说明不收集数据）；支持邮箱填 `weiaisuyansjd@gmail.com`。
5. **Privacy（隐私问卷）**
   - 是否收集个人数据 → **否**；
   - 权限用途按第 3 节填写；
   - 远程代码 → **无**。
6. **Store listings（商店信息，逐语言填写）**
   名称/描述直接复制 `listing-zh-CN.md`；上传 logo + 5 张截图 + 两个磁贴；搜索关键词见文案末尾。若要加英文列表，复制 `listing-en-US.md`，素材用 "Duplicate" 一键复制到所有语言。
7. **提交审核**
   认证测试备注建议写：*"安装后任意网页右侧即出现两个悬浮按钮；点击工具栏图标弹出菜单，可打开设置页、可对当前网站一键禁用/启用；设置页含 36 款样式、网站排除与备份导入导出。无账号、无网络请求。"* 审核一般 1~7 个工作日。
8. **上架与更新**
   通过后自动公开上架；后续更新 = 改 `manifest.json` 版本号 → 重新打包 zip → Partner Center 上传新包 → 提交。

## 3. 权限用途说明（提交时填写）

| 权限 | 用途 |
|---|---|
| `storage` | 保存用户的样式 / 位置 / 速度等设置和网站排除名单，仅存本机。 |
| `activeTab` | 用户点击扩展图标打开菜单时，读取当前标签页网址，用于显示/切换"当前网站"的排除开关。 |
| 站点访问（内容脚本） | 在网页上绘制上/下悬浮按钮——这是扩展的核心功能，仅在页面内绘制 UI，不读取页面内容。 |

## 4. 隐私声明（如商店要求提供，可直接粘贴）

「滚动按钮」不收集、不存储、不传输任何个人信息或浏览数据。扩展的全部设置（样式、位置、速度、网站排除名单）仅保存在您浏览器的本地存储中，不会离开您的设备。扩展不发起任何网络请求，不包含分析、广告或任何远程代码。反馈邮件中的内容仅用于改进产品。

## 5. 发布前自检清单

- [ ] 在真实浏览器（edge://extensions 加载解压文件夹）完整过一遍：点图标弹菜单 / 教程页正常 / 设置页 36 款样式 / 排除网站 / 导入导出备份
- [ ] 用 zip 内容等价于已测试版本（打 zip 后无文件遗漏）
- [ ] 文案中不含"最好用""第一"等违规绝对化用语（已检查）
- [ ] 商店描述与应用实际功能一致（已对齐）

## 6. 免费说明

Microsoft Edge Add-ons 注册与提交**免费**（官方原文："It's free to register and submit extensions to the Microsoft Edge program"），无 Chrome Web Store 那样的一次性注册费。

## 7. 提交记录

### 2026-09-20 · v1.1.0 更新提交（当前 · In review）

- **状态：Partner Center 实查「UPDATE - 滚动按钮（上/下） Version 1.1.0 · In review」**——预计 7 个工作日
- 变更：新增「中键关闭标签页」（鼠标中键单击按钮 → 关闭当前标签）；教程页第 5 张手势卡；按钮悬停提示更新；商店描述「四种→五种手势」（中英）；截图 3/4 更新；zip 重打（20 文件 / 71,904 字节 / sha256 `d2280983…`）
- 提交操作：Update → Packages 传 zip → Availability / Properties / Privacy 继承确认 → Store listings 中英两行（旧截删除、新截上传 + 描述更新 + 保存草稿）→ Submit 页（tester=No、认证备注 1223 字符）→ Publish

### 2026-09-19 · v1.0.0 首次提交（已上架公开）

- **状态：审核通过，已上架公开（Live）**
- 上传包：`edge-scroll-buttons-v1.0.0.zip`（20 文件 / 70,722 字节 / sha256 `3843b1b3…`，含 `_locales/` 中英文语言包与 `guide.js`；替换了此前的无多语言旧包）
- Store 一览：**英语 + 中文(中国) 两行均「已完成」**——描述（英 1939 字符 / 中 693 字符）、logo 300×300、每语言 5 张对应语言截图、双磁贴、各 5 个搜索词
- 认证说明：1166 字符审核指引（无账号 / 无网络请求 + 审核操作步骤 + 双语界面说明）
- 商店标识：Store ID `0RDCKCBN318W` · 产品 ID `b4a99319-a202-4349-94c0-930c3dbfc119`
- 素材补充：英文行使用 `en-US/` 目录下 2026-09-19 补制的英文版截图与磁贴（`store/en-US/`）
- 后续更新流程：改 `manifest.json` 版本号 → 重打包（含 `_locales/**`）→ Partner Center 上传新包 → 提交
