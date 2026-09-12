export const CONVENIENCE_STORE_SHIPPING_METHOD_CODE = 'CONVENIENCE_STORE'

export const normalizeOrderOptions = (data = {}) => ({
    paymentMethods: Array.isArray(data.payment_methods) ? data.payment_methods : [],
    shippingMethods: Array.isArray(data.shipping_methods) ? data.shipping_methods : [],
    storeTypes: Array.isArray(data.store_types) ? data.store_types : [],
    defaults: data.defaults ?? {},
})

export const findOptionValueByCode = (options, code) => (
    options.find(option => option.code === code)?.value ?? null
)