const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const getEmailValidationError = (email) => {
    if (!email) return '請輸入電子郵件'
    if (!EMAIL_PATTERN.test(email)) return '電子郵件格式不正確'
    return ''
}
