export const PRODUCT_SIZE_LABELS = {
    1: 'XS',
    2: 'S',
    3: 'M',
    4: 'L',
    5: 'XL',
}

export const getProductVariants = (product) => Array.isArray(product?.variants) ? product.variants : []

export const formatVariantName = (variant) => {
    const color = variant?.spec?.color ?? '未標示顏色'
    const size = PRODUCT_SIZE_LABELS[variant?.spec?.size] ?? variant?.spec?.size ?? '未標示尺寸'

    return `${color} / ${size}`
}