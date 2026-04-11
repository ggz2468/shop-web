<template>
    <nav>
        <router-link to="/">首頁</router-link>
        <router-link to="/products">產品列表</router-link>
    </nav>

    <router-view />
</template>

<style scoped>
nav .router-link-active {
  color: #42b983;
  border-bottom: 2px solid #42b983;
}
</style>
