# C2C 二手交易平台移动端

使用 Vue 3 和 uni-app 开发的 C2C 二手交易客户端，可通过 HBuilderX 运行到 H5、App 和微信小程序等目标平台。

后端项目位于 [c2c-platform-backend](https://github.com/ppp110888/c2c-platform-backend)。

## 主要功能

- 用户注册、登录和个人资料编辑
- 首页商品列表、搜索和商品详情
- 发布、编辑及删除自己的商品
- 商品图片上传和 AI 标题/描述生成
- 关注卖家、查看粉丝和个人主页
- 浏览历史和购物车
- 收货地址管理
- 下单、支付宝支付、订单列表和订单详情
- 买家与卖家互评
- 消息会话、历史消息和 WebSocket 实时聊天

## 页面结构

```text
pages/
├── index/              # 首页和商品搜索
├── detail/             # 商品详情与立即购买
├── publish/            # 发布商品和 AI 描述
├── cart/               # 购物车与结算
├── order/              # 订单列表、详情和评价
├── message/            # 会话列表和实时聊天
├── profile/            # 其他用户主页
├── login/              # 登录与注册
└── my/                 # 个人中心、地址、关注、粉丝和浏览记录
```

底部导航包含首页、购物车、发布、消息和我的五个主要入口。

## 技术说明

- Vue 3 Composition API
- uni-app 页面与跨端 API
- JWT Bearer Token 身份认证
- HTTP API 统一请求封装
- WebSocket 实时聊天
- 通过 Vite 环境变量区分本地、测试和生产地址

## 环境要求

- HBuilderX
- 微信开发者工具，构建微信小程序时需要
- 已启动的 C2C 后端网关和消息服务

当前目录没有独立的 `package.json`，项目按 HBuilderX 工程管理，不能直接使用 `npm run dev`。

## 环境配置

所有服务地址集中在 `utils/config.js`，可通过以下变量覆盖：

| 变量 | 用途 | 本地默认值 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 后端网关地址 | `http://localhost:8080` |
| `VITE_MEDIA_BASE_URL` | MinIO 图片访问地址 | `http://127.0.0.1:9000` |
| `VITE_WS_URL` | WebSocket 聊天地址 | `ws://127.0.0.1:9090/ws` |

参考 `.env.example` 创建目标环境配置：

```env
VITE_API_BASE_URL=https://api.example.com
VITE_MEDIA_BASE_URL=https://media.example.com
VITE_WS_URL=wss://ws.example.com/ws
```

本地 H5 可以使用默认地址。手机、模拟器和小程序中的 `localhost` 指向设备自身，因此真机调试必须改成开发电脑的局域网 IP 或可访问的测试域名。

## 运行方式

1. 确认后端网关 `8080` 和消息服务 WebSocket `9090` 已启动。
2. 使用 HBuilderX 打开项目根目录。
3. 选择“运行到浏览器”“运行到 App”或“运行到小程序模拟器”。
4. 真机运行前更新 API、媒体和 WebSocket 地址。

## 微信小程序配置

1. 在 `manifest.json` 的 `mp-weixin.appid` 中填写真实 AppID。
2. 在微信公众平台配置 request、uploadFile 和 socket 合法域名。
3. 生产环境必须使用 HTTPS 和 WSS，不能使用 `localhost`、局域网 IP 或明文 HTTP。
4. 图片域名需要允许访问 MinIO 或对象存储的公开地址。
5. 发布前恢复微信开发者工具的域名校验，不要依赖 `urlCheck: false`。

## 与旧版本的差异

- API、图片和 WebSocket 地址不再分散硬编码在各个页面中。
- 下单请求只提交 `itemId` 和 `addressId`，价格与卖家由后端确定。
- HTTP 401/403 会统一提示登录失效。
- 支付同步跳转不再代表支付完成，最终状态以后端收到的支付宝异步通知为准。
- 上传图片受后端 5 MB 和图片格式限制。

## 常见问题

### 浏览器可以访问，手机无法连接

手机无法访问电脑自身的 `localhost`。将三个环境变量改成电脑的局域网地址，并确认防火墙允许对应端口。

### 登录后仍提示未登录

检查网关地址是否正确、Token 是否过期，以及后端 `JWT_SECRET` 是否在所有相关服务中保持一致。

### 图片上传后无法显示

确认 `VITE_MEDIA_BASE_URL`、MinIO Bucket 访问策略和小程序下载域名配置一致。

### 支付后订单仍显示待支付

检查支付宝异步通知地址是否公网可访问、验签公钥是否正确，以及通知中的应用 ID 和金额是否与订单匹配。

### 聊天连接失败

确认消息服务的 `9090` 端口可访问；生产环境应通过反向代理提供 WSS 地址。

## 安全建议

- 不要在前端代码或环境文件中保存后端密钥、支付宝私钥或数据库密码。
- `.env` 已被 Git 忽略，只提交不含真实凭据的 `.env.example`。
- 生产环境必须使用 HTTPS/WSS，并限制后端允许的跨域来源。
- 用户身份以服务端解析 Token 的结果为准，前端缓存中的用户 ID 只能用于界面展示。

## 相关仓库

- 移动端：https://github.com/ppp110888/c2c-mobile
- 后端：https://github.com/ppp110888/c2c-platform-backend
