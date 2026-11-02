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
- 金額以新台幣呈現，下單時間以台灣時間顯示。
- 每筆訂單整張卡片均為詳情連結，滑鼠移入或鍵盤聚焦時變色，按 Enter 可進入詳情。
- `/orders/:id` 透過 `GET /api/orders/{order}` 顯示訂單狀態、收件／超商資訊、商品快照與保存的金額；稅額為內含稅額，不重複加總。
- 詳情支援直接開啟、切換訂單、載入提示、404 提示、錯誤重試與返回列表；目前不提供取消操作。
- 詳情須包含布林欄位 `actions.can_create_payment_transaction`；僅為 `true` 時提供「新增付款交易」，串接 `POST /api/orders/{order}/payment-transactions`，後端仍會重新驗證資格。
- 成功建立交易後重新取得訂單，透過既有 `GET /api/orders/{order}/payment-checkout` 取得付款資料；`202` 每秒重試，最多十次，未就緒或失敗可再次取得，不重新 POST。
- 已有交易、仍為備貨中且未付款的訂單可透過「取得付款資料／繼續付款」取得既有交易資料；已付款等不適用狀態不顯示此入口，實際可否付款以後端為準。
- `409` 顯示衝突並更新訂單；網路或伺服器錯誤視為新增結果尚未確認，必須明確重新整理訂單才可能再次新增，不自動重送 POST。
- 「前往付款」使用後端提供的金流網址與簽署欄位送出 POST 表單；導向金流頁不代表付款成功。頁面重新開啟或從瀏覽器快取返回時重新查詢訂單狀態，切換訂單或離開頁面會停止付款資料輪詢。

### 前端共用模組
- 會員相關表單共用 `src/utils/emailValidation.js` 的 Email 驗證規則與提示，輸入 trim 仍由各表單處理。
- 登入與註冊共用 `AuthSuccessOverlay` 呈現成功提示；請求、三秒等待與導頁仍由各表單管理。
- 訂單列表與詳情共用 `src/utils/orderOptions.js` 的顯示字典檢查及標籤查找，保留嚴格型別比對與未知值提示；各頁請求與快取仍獨立管理。
- 商品規格與歷史訂單詳情共用 `src/utils/productVariant.js` 的 `PRODUCT_SIZE_LABELS` 尺寸表；缺值及未知尺寸的文字依各畫面既有規則呈現。
- 訂單列表與詳情共用 `src/utils/orderFormatting.js` 的新台幣金額與台灣時間格式。
- 結帳頁與訂單詳情共用 `src/utils/paymentCheckout.js` 的有限次付款資料輪詢與回應驗證；詳情頁透過 `useOrderPayment` 管理新增交易、衝突、重試及請求取消。
- 結帳頁與訂單詳情共用 `PaymentCheckoutForm`，原樣帶入後端提供的金流送出網址、HTTP method 與隱藏簽署欄位；金額、按鈕文字與付款狀態仍由各頁管理。
