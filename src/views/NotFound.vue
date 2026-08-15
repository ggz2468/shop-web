<script setup>
import CenteredState from '@/components/layout/CenteredState.vue'
</script>

<template>
    <CenteredState
        code="404"
        title="Not Found"
        message="找不到此頁面或資料不存在。"
        action-text="回到首頁"
        :action-to="{ name: 'Home' }"
    />
</template>