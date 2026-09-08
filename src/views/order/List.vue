<script setup>
import CenteredState from '@/components/layout/CenteredState.vue'
</script>

<template>
    <div class="container-fluid p-3">
        <div class="content-header">
            <h2 class="title">訂單列表</h2>
            <hr class="divider">
        </div>

        <div class="content-body">
            <!-- 後端尚未提供 GET /orders API，暫以提示畫面呈現 -->
            <CenteredState
                title="訂單查詢功能準備中"
                message="您的付款已送出，訂單查詢功能即將開放，敬請期待。"
                action-text="繼續選購"
                :action-to="{ name: 'ProductList' }"
            />
        </div>
    </div>
</template>
