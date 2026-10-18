import { describe, expect, it } from 'vitest'
import { getEmailValidationError } from '@/utils/emailValidation'

describe('共用 Email 驗證', () => {
    it('未輸入時沿用必填提示', () => {
        expect(getEmailValidationError('')).toBe('請輸入電子郵件')
    })

    it.each([
        'member@example.com',
        'member+orders@example.com',
        'first.last@example.com.tw',
        'MEMBER@EXAMPLE.COM',
    ])('接受原有規則支援的 Email：%s', (email) => {
        expect(getEmailValidationError(email)).toBe('')
    })

    it.each([
        'member',
        'member@example',
        '@example.com',
        'member@',
        'member@@example.com',
        'member example@test.com',
        ' member@example.com',
        'member@example.com ',
        'member@example.com\n',
    ])('拒絕格式錯誤，不在驗證工具內改變輸入：%s', (email) => {
        expect(getEmailValidationError(email)).toBe('電子郵件格式不正確')
    })
})
