# NextVenue 中国优先上线方案

写于 2026-09-25。本文不是法律或税务意见。标“待确认”的内容，是我没找到官方依据的部分。全文默认你有中国大陆居民身份证，还有一个能收短信的实名 +86 手机号。标【+86】的步骤都要用到这个号码。

## 1. 结论

1. **先做小程序，把它当作国内的主入口。**
   - 个人可以注册小程序（[注册条件](https://developers.weixin.qq.com/miniprogram/introduction/)）。
   - 规则数据直接打包进小程序。bundle.json 为 406 KB，单个包上限是 2 MB（[包大小](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html)）。所以不需要服务器和域名，也不用给网站做备案。
   - 你需要办三件事：注册、认证、小程序备案，大约要 2–5 周。我在同一时间做开发。**大约 4–6 周可以上线。**
2. **网站分两步做。**
   - 现在继续用 GitHub Pages。它在大陆时好时坏：1064 个网址里有 547 个能正常打开（[GreatFire](https://en.greatfire.org/domain/github.io)）。没有备案的链接在微信里也可能打不开（[外链规范 2.18.4](https://weixin.qq.com/agreement/weixin_external_links_content_management_specification)）。
   - 小程序备案通过以后，再给网站办个人 ICP 备案，组合如下：
     - 一个 .cn 域名；
     - 一台 99 元/年的云服务器（ECS），只用来办备案；
     - 网站放在 EdgeOne Pages 的大陆可用区。它免费，但要求域名已经备案（[文档](https://pages.edgeone.ai/document/domain-overview)）。
   - 境外的用户继续用 GitHub Pages。**每月大约 ¥15–20。**
3. **个人能做的：** 免费工具、网站的非经营性备案、“工具”类目的小程序、用赞赏组件收捐助。
   **个人不能做的：**
   - 小程序里的 web-view，也就是在小程序里打开外部网页（[文档](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)）；
   - 微信支付商户号（[进件主体](https://pay.weixin.qq.com/static/applyment_guide/applyment_detail_miniapp.shtml)）；
   - “资讯”类目；
   - 网站收费。
4. **收费等以后再说，而且到时候需要注册主体。**
   - 收费提供信息属于“经营性”服务，要办许可证（[《互联网信息服务管理办法》第三、四条](https://www.cac.gov.cn/2014-08/19/c_1112138363.htm)）。实际上这个证只发给公司。
   - 课题组要发票的话，至少要注册个体户。
   - 未来 12–24 个月，比较现实的收入大约是每年 ¥2 千–5 万。

## 2. 你需要亲自办的事

| # | 事项 | 在哪办、要什么材料 | 时间 | 费用 |
|---|---|---|---|---|
| A | 用个人身份注册小程序 | 在 mp.weixin.qq.com 注册。需要本人实名的微信（要求“18 岁以上有国内身份信息”），再准备一个从没注册过公众平台的邮箱 | 1 天 | 0 |
| B | 选服务类目 | 只选 **工具 > 信息查询**，再加一个 **工具 > 日历**。这两个都不需要资质（[类目表](https://developers.weixin.qq.com/miniprogram/product/material/)）。不要选“教育信息展示”，备案指引里对它写的是“个人备案：不建议选择”（[指引](https://developers.weixin.qq.com/miniprogram/product/record/receord_category.html)） | 同上 | 0 |
| C | 微信认证 | 后台提示要认证就去做。“个人 30 元/年，不认证不能发版”这个说法只有二手来源（[蓝点网](https://www.landian.news/archives/101017.html)），先当作必须做来安排 | 几天 | 约 ¥30/年 |
| D | 小程序备案【+86】 | 在小程序后台的“备案”入口办理。<br>材料：<br>• 身份证，有效期还剩 1 个月以上<br>• 在微信里做人脸识别<br>• 本人手机号<br>• **应急联系人**：必须是另一个人、另一个手机号，建议找国内的家人<br>• 通讯地址填户籍地址<br>注意事项：<br>• **选身份证所在的省**，否则有 11 个省会要求居住证<br>• 服务内容选“工具”，不要选“学术期刊（投稿…）”<br>• 收到 12381 的短信后，要在 24 小时内完成核验<br>• 还要接听 0755 开头的回访电话<br>（[操作指引](https://developers.weixin.qq.com/miniprogram/product/record/guidelines.html)、[FAQ](https://developers.weixin.qq.com/miniprogram/product/record/record_faq.html)） | 平台初审 1–2 个工作日，通信管理局审核 1–20 个工作日 | 0 |
| E | 买域名（现在就可以买） | 在阿里云或腾讯云买 .cn 或 .com 域名。不要用 .app、.dev、.io，这几个能不能备案我没核实。域名持有人写你本人并完成实名，离到期至少还有 45 天（[域名要求](https://help.aliyun.com/zh/icp-filing/basic-icp-service/user-guide/prepare-and-check-the-domain-name)） | 几天 | 域名费 |
| F | 网站 ICP 个人备案【+86】，等 D 通过后再开始 | 在阿里云买一台中国内地的云服务器，按年或按月付费，至少买 3 个月（[可备案资源](https://help.aliyun.com/zh/icp-filing/basic-icp-service/user-guide/icp-filing-server-access-information-check)）。经济型 e 实例 99 元/年是促销价，以购买页面为准。<br>材料：身份证（有效期还剩 3 个月以上）、人脸识别、24 小时内完成 12381 短信核验、接听阿里云的回访电话（[个人备案](https://help.aliyun.com/zh/icp-filing/basic-icp-service/getting-started/quick-start-for-icp-filing-for-personal-websites)）。<br>网站名称至少 3 个汉字，不能带“导航、平台、网站、资讯、社区、论坛、博客、主页”这类词（[名称规则](https://help.aliyun.com/zh/icp-filing/basic-icp-service/user-guide/fill-in-website-information)）。多准备 2 个备选名称 | 3–22 个工作日 | ¥99/年 |
| G | 公安联网备案 | 网站开通后 30 天内，在 beian.mps.gov.cn 办理（[指引](https://help.aliyun.com/zh/icp-filing/basic-icp-service/quick-start-for-public-security-network-filing-for-personal-websites)） | — | 0 |

- **要不要回国：**
  - 按目前查到的资料，不用回国。人脸识别在手机上做，通讯地址可以填户籍地址。
  - 但通信管理局会不会因为你长期在国外而退回申请，**待确认**。
  - 备案期间，+86 号码要一直开着国际漫游，也不要换号。
- **为什么 F 要等 D 完成后再办：** 先确认人在国外也能办下来。这样两边的短信核验和回访电话也不会撞在一起。
- **小程序名称和简介：**
  - 不能出现 NeurIPS、CVPR 等别人的商标（[运营规范 1.1](https://developers.weixin.qq.com/miniprogram/product/)）。
  - 也不要出现“期刊、出版、教育、培训”。这些词在需要前置审批的关键词表里，表在上面那份 FAQ 中。

## 3. 我来做的开发工作

### 3.1 网站（现在就开始，大约 3 天）
- **隐私说明页**：半天。
- **导出和导入备份**：支持 JSON 文件和复制文本两种方式，1 天。原因是微信自带的浏览器会清掉本机保存的数据（[社区反馈](https://developers.weixin.qq.com/community/develop/doc/0008282ac7cd3064b10abcdad56c00)）。
- **在微信里打开时加提示**：提醒用户点“右上角 → 在浏览器打开”，约 2 小时。
- **构建和部署调整**：1 天，包括三件事。
  - 备案通过后，在页面底部正中显示 ICP 备案号（链接到 beian.miit.gov.cn）和公安备案号（[备案办法第十三条](https://wap.miit.gov.cn/zcfg/xxtxl/art/2024/art_7e48434c08c24131b4b7eecfca5b2b6c.html)）。
  - 同一份网站文件自动同时发布到 GitHub Pages 和 EdgeOne。
  - 域名解析按访问者在国内还是国外，分别指向两边。
- **修改 `copy.ts` 第 240、248 行的一种正则写法（lookbehind）**：约 2 小时。旧版 iOS 不支持这种写法，小程序那边也要用到这个修改。

### 3.2 小程序（大约 12–15 天）
- **做法：用原生小程序，和网站共用核心逻辑。**
  - 把 `logic.ts`、`route.ts`、`copy.ts`、`types.ts` 打包成一个 `core.js`。这些逻辑可以全部复用，测试也照旧。
  - 界面用小程序自己的写法重做，大约 15 个页面。现有的网页版不用改。
  - 不用 Taro、uni-app 这类跨端框架，因为用了它们，`main.ts` 照样要重写。也不用 kbone，它打出来的包很大，项目也没人维护。
- **需要改动的地方：**
  - 小程序的样式语言不支持属性选择器和带参数的伪类（[WXSS](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxss.html)）。`style.css` 里有 9 处属性选择器、5 处 `:not()` 要改写。
  - 小程序最多只能叠 10 层页面，层级深的跳转要改成替换当前页面。
  - 本机存储改用微信的存储接口，上限 10 MB。
  - 底部导航栏放 3 项，图标用本地图片。
  - 颜色变量迁移到小程序的主题配置里，这样可以支持深色模式。
- **“查看官网原句”，不跳转外部网页：**
  - 在小程序里显示完整的英文原句，可以长按选取；同时显示来源标题和网址文字。
  - 提供“复制链接”按钮，只在用户点击时复制，复制成功后会自动提示“内容已复制”（[setClipboardData](https://developers.weixin.qq.com/miniprogram/dev/api/device/clipboard/wx.setClipboardData.html)）。
  - “源代码”和“全部规则（桌面版）”都改成复制链接。去掉“添加到主屏幕”。
- **截止提醒用 `wx.addPhoneCalendar`，把截止日期加到手机日历（已核实可用）：**
  - 要求微信基础库 2.15.0 以上，第一次使用时需要用户授权。提前提醒的时间以秒为单位，每个事件只能设一个提醒。加进去以后，小程序不能再修改或删除这条日程（[文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/calendar/wx.addPhoneCalendar.html)）。
  - 小程序在本机记住哪些截止日期已经加过，避免重复添加。截止日期变了，就提醒用户自己去日历里改。
  - 不做“从日历跳回小程序”，这需要服务器生成签名。
  - 也不做订阅消息。它只能从服务器发送，还要记录用户的 openid，也就是用户在这个小程序里的身份标识（[概述](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message-overview.html)）。
- **分享：** 分享给朋友时，带上会议或规则的编号。分享到朋友圈后打开的是“单页模式”，只在规则详情页开放。
- **数据跟着小程序一起发布：**
  - 页面上标明“数据截至某日”。
  - 只打包数据文件，不从网上加载代码（规范 3.5.4）。

| 工作项 | 天数 | 需要 AppID 吗 |
|---|---|---|
| 打包核心逻辑、修改正则写法 | 1 | 不需要 |
| 小程序基础配置、底部导航、主题、图标、本机存储 | 1.5 | 不需要 |
| 约 15 个页面和样式 | 6–8 | 不需要 |
| 加入日历、复制链接、分享 | 1.5 | 不需要 |
| 真机测试 | 2 | 不需要，用测试号 |
| 自动上传、准备提审材料 | 0.5 | **需要** |

AppID 下来之前的做法：

- 电脑上用开发者工具的游客模式调试。
- 手机上用测试号预览（[测试号](https://developers.weixin.qq.com/miniprogram/dev/devtools/sandbox.html)）。
- 上传工具是 miniprogram-ci，要用到一个上传密钥，这个密钥不能放进公开的代码仓库（[CI](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html)）。

## 4. 合规清单

**隐私说明：网站和小程序各写一份，包含 7 项。** 依据是[《网络数据安全管理条例》第二十一条](https://www.gov.cn/zhengce/content/202409/content_6977766.htm)。

1. 运营者：个人开发者，附联系邮箱。
2. 不收集、不上传任何数据；没有账号、没有统计、没有第三方插件。
3. 偏好设置和论文列表只存在你的设备上，并写明怎么清除。
4. 保存多久：一直保存在你的设备上，直到你自己清除；删除小程序时会一起删掉。
5. 访问日志：
   - 网站要写明托管方或 CDN 会记录访问日志，其中包括 IP 地址。国内的网站要保存日志至少 6 个月（[网络安全法第二十三条](https://www.cac.gov.cn/2025-12/29/c_1768735112911946.htm)）。
   - 小程序写“由微信按其规则处理”。
6. 打开外部链接后，适用对方网站的隐私政策。复制链接、加入日历都只在你点击时才会发生。
7. 更新日期。

数据只存在用户设备上、开发者拿不到，一般不算“收集”个人信息。依据是 [GB/T 35273 第 3.5 条注 2](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=4568F276E0F8346EB0FBA097AA0CE05E)，这是推荐性国家标准。

**小程序后台的隐私保护指引**

- 只声明“剪贴板（写入）”和“日历（仅写入）”两项。本机存储不在需要声明的清单里（[清单](https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/miniprogram-intro.html)）。
- 声明的内容必须和实际用到的功能一致。否则这些功能会调用失败（报错 112），提交审核也会被拦下。
- 微信会自动弹出官方的隐私提示，不用自己做弹窗（[开发指南](https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/PrivacyAuthorize.html)）。

**内容规范**

- 界面做成“查询”的形式：用户选一个会议，就显示它的规则。不要做“动态、资讯、新闻、推荐”这类不断刷新的内容列表（[规范 5.7.3](https://developers.weixin.qq.com/miniprogram/product/)）。
- 所选类目对应的功能，从首页点两下以内就要能到达（规范 3.1.2），所以欢迎页要能跳过。
- 页面上不能留“测试版”“敬请期待”这类字样（规范 3.3.1）。
- 简介要写清楚具体有哪些功能。
- 界面用中文，英文原句作为引文展示。
- 对外介绍时不要说“投稿服务”，这类说法可能要求网络出版许可。

**不要做的事**

- 评论、用户发帖、注册账号、统计插件。
- 在小程序里放爱发电链接或收款码（规范 5.13）。
- 让小程序连接我们自己的服务器，因为服务器域名必须备案（[网络](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html)）。
- 在个人备案的网站上放广告或收费。

## 5. 盈利

| 阶段 | 做法 | 用什么身份 | 现实收入（元/年） |
|---|---|---|---|
| 上线开始 | 全部免费。<br>• 网站和 GitHub 上放爱发电链接，平台抽成 6%（[FAQ](https://guide.afdian.com/faq/faq-for-creators)）。捐了钱也不解锁任何功能。<br>• 小程序里用官方的**赞赏组件**，只有个人小程序能开通。要绑定你本人的公众号或贴图号，并发一篇介绍小程序的贴图。这个功能还在分批开放中（[文档](https://developers.weixin.qq.com/miniprogram/dev/framework/reward-component.html)）。 | 个人 | 0–5,000 |
| 用户量稳定以后 | 接赞助。<br>• 只接算力、工具类厂商，明确写下拒绝论文润色、代写、代投。<br>• 赞助内容标注“广告”。<br>• 以个人身份按劳务报酬去税务部门代开发票（[上海税务](https://shanghai.chinatax.gov.cn/zcfw/spjd/202512/t478583.html)）。 | 个人 | 0–30,000 |
| 有 3 个以上课题组明确要发票时 | 注册个体户，开通微信支付，推出课题组方案，每个组 1–3 千元 | 个体户 | 0–30,000，要扣掉记账费 |
| 暂时不做 | 付费高级版、多设备同步、课题组共享 | — | — |

**为什么暂时不做付费高级版：**

- 微信已经允许个人在小程序里卖虚拟商品（个人虚拟支付），但要有服务器来生成订单、处理发货通知，还要保存用户的 openid 和订单记录。这会打破“不收集数据”的承诺。
- 微信的文档还写明，这个功能不支持“信息搜索查询”类服务，而这正好是本产品的类目（[个人虚拟支付](https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/business-capabilities/virtual-payment/person.html)）。
- 网站收费要办经营许可证，也就是要有公司。
- 等月活跃用户超过 5 千，并请律师确认法律边界之后，再讨论。

**永远不做：**

- 出售数据。
- 微信流量主广告：广告插件会收集用户数据，广告内容也控制不了。
- 知识星球这类付费社群：和“不做评论”的决定冲突。

**开始收钱之前，先确认这几件事：**

- 你在欧洲的居留许可是否允许自雇，雇主有没有限制，你的税务居民身份在哪个国家。
- 个人一年的交易额不超过 10 万元，可以不办登记。但要在主页上长期公示一份自我声明和联系方式（[《网络交易监督管理办法》第八、十二条](https://www.moj.gov.cn/pub/sfbgw/flfggz/flfggzbmgz/202104/t20210423_357848.html)）。
- 收款平台会把你的收入报给税务部门（[国务院令第 810 号](https://fgk.chinatax.gov.cn/zcfgk/c100010/c5241238/content.html)）。
- 增值税：
  - 办了登记的，每月销售额达到 10 万元开始交税。
  - 没登记的个人一般按次计算，每次（或每天）达到 1000 元开始交税。通过互联网平台取得的服务收入，可以改成按月计算（[2026 年第 10 号](https://fgk.chinatax.gov.cn/zcfgk/c102416/c5247434/content.html)、[第 4 号](https://fgk.chinatax.gov.cn/zcfgk/c100012/c5247426/content.html)）。
  - 具体请税务师确认。

## 6. 风险和待确认事项

- **关于身份证的假设：**
  - 如果你没有中国大陆居民身份证，就不能用个人身份注册小程序和办备案，只能找国内的合作者，或者用公司的身份。
  - 反过来，如果你回国居住，按条文规定，放在国外服务器上的网站也要备案（[备案办法第五条](https://wap.miit.gov.cn/zcfg/xxtxl/art/2024/art_7e48434c08c24131b4b7eecfca5b2b6c.html)）。
- **人在国外办理（待确认）：** 通信管理局会不会因为你长期在国外而退回申请；开着国际漫游能不能及时收到 12381 的短信。
- **类目被判错：** 已经有个人开发的“信息查询”小程序被认定为资讯类而被下架。应对办法是界面只做查询功能。
- **名称里的“投稿”二字（待确认）：** 它不在前置审批关键词表里，但那张表只是“参考”，不保证不会被卡。
- **认证费用和是否必须认证（待确认）：** 以后台的提示为准。
- **审核要多久（待确认，一般 1–3 天）：** 每次更新规则数据都要重新提交审核。
- **在微信里打开网页（待确认）：**
  - 没备案的域名在微信里被拦截的比例不清楚。查到的 github.io 被屏蔽的案例是 2021 年的。
  - 在 iOS 版微信里，离线缓存功能很可能用不了。
- **网站备案的尺度（待确认）：** 个人网站的名称和内容能不能通过，各省的标准不一样。
- **需要律师或税务师确认的：**
  - 小程序个人虚拟支付和经营许可证之间的边界；
  - 个人收入按哪个税目申报；
  - 人在国外能不能注册个体户；
  - 个人小程序能不能转到个体户名下（最坏的情况是重新注册一个小程序）；
  - 中国和你所在国家之间的双重征税怎么处理。