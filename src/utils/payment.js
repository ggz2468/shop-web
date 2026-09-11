export const PAYMENT_METHODS = [
    { value: 1, label: '信用卡' },
    { value: 2, label: 'ATM 轉帳' },
    { value: 3, label: '超商代碼' },
    { value: 4, label: '超商條碼' },
]

export const DEFAULT_PAYMENT_METHOD = PAYMENT_METHODS[0].value

export const SHIPPING_METHODS = [
    { value: 1, label: '宅配' },
    { value: 2, label: '超商取貨' },
]

export const STORE_TYPES = [
    { value: 'UNIMART', label: '7-ELEVEN' },
    { value: 'FAMI', label: '全家便利商店' },
    { value: 'HILIFE', label: '萊爾富' },
]

export const DEFAULT_SHIPPING_METHOD = SHIPPING_METHODS[0].value
export const CONVENIENCE_STORE_SHIPPING_METHOD = 2
