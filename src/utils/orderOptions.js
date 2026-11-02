export const HOME_DELIVERY_SHIPPING_METHOD_CODE = 'HOME_DELIVERY'
export const CONVENIENCE_STORE_SHIPPING_METHOD_CODE = 'CONVENIENCE_STORE'

const ORDER_DISPLAY_OPTION_KEYS = ['order_statuses', 'payment_statuses', 'payment_methods', 'shipping_methods']

export const hasOrderDisplayOptions = data => ORDER_DISPLAY_OPTION_KEYS.every(
    key => Array.isArray(data?.[key]) && data[key].length > 0,
)

export const findOptionLabelByValue = (options, value) => (
    options?.find(option => option.value === value)?.label ?? `未知（${value}）`
)

export const normalizeOrderOptions = (data = {}) => ({
    paymentMethods: Array.isArray(data.payment_methods) ? data.payment_methods : [],
    shippingMethods: Array.isArray(data.shipping_methods) ? data.shipping_methods : [],
    storeTypes: Array.isArray(data.store_types) ? data.store_types : [],
    defaults: data.defaults ?? {},
})

export const findOptionValueByCode = (options, code) => (
    options.find(option => option.code === code)?.value ?? null
)