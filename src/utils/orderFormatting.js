const moneyFormatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency', currency: 'TWD', maximumFractionDigits: 0,
})
const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Taipei', hourCycle: 'h23',
})

export const formatOrderMoney = value => moneyFormatter.format(value)
export const formatOrderDate = value => dateFormatter.format(new Date(value))
