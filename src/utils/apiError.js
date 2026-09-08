/**
 * 解析 API 錯誤訊息。
 * 401 時由 axios 攔截器導向登入頁面，回傳 null 表示不需顯示錯誤訊息。
 */
export const resolveApiErrorMessage = (error, fallbackMessage) => {
    if (error.response?.status === 401) {
        return null
    }

    return error.response?.data?.message || fallbackMessage
}
