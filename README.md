# 自製電子商務網站專案

### 成果網站
<a href="https://chun-hung.idv.tw" target="_blank">自製電子商務網站</a>

### 開發環境
1. Node.js 25.6.0
2. npm 11.8.0
3. Vue.js 3.5.32
4. Vite 8.0.4
5. Vue Router 5.0.4
6. Pinia 3.0.4
7. Axios 1.15.0
8. Bootstrap 5.3.8

### 安裝步驟
1. 下載專案與進入目錄
```bash
git clone git@github.com:ggz2468/shop-web.git
cd shop-web
```
2. 安裝必要套件
```bash
npm install
```
3. 設定環境變數
```bash
cp .env.example .env
```
4. 啟動開發伺服器
```bash
npm run dev
```
5. 本地開發網址: http://localhost:5173

### 會員訂單列表
- 登入會員可點擊導覽列的會員選單，透過「歷史訂單」進入列表；訪客僅顯示登入入口。
- `/orders` 透過 `GET /api/orders` 顯示會員自己的歷史訂單，每頁 10 筆。
- 狀態與付款／配送方式中文由 `GET /api/orders/options` 提供；後端須包含 `order_statuses` 與 `payment_statuses` 字典。
- 支援載入提示、空列表、錯誤重試與分頁；未登入時沿用 API 攔截器導向登入頁。
- 金額以新台幣呈現，下單時間以台灣時間顯示；目前不提供訂單詳情、取消或付款操作。

### 前端共用模組
- 會員相關表單共用 `src/utils/emailValidation.js` 的 Email 驗證規則與提示，輸入 trim 仍由各表單處理。
- 登入與註冊共用 `AuthSuccessOverlay` 呈現成功提示；請求、三秒等待與導頁仍由各表單管理。
