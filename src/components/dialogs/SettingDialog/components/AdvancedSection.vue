<script setup>
import APIKeyForm from "./Children/APIKeyForm.vue";
</script>

<template>
  <section class="setting-section">
    <h2 class="mb-4 text-lg font-bold text-[var(--text-primary)]">高级设置</h2>

    <div class="setting-item mb-6">
      <h3 class="setting-label text-base font-medium mb-3">缓存管理</h3>
      <div class="px-5">
        <div class="text-sm text-gray-400">设置项待实现</div>
      </div>
    </div>
    <div class="setting-item mb-6">
      <h3 class="setting-label text-base font-medium mb-3">数据同步</h3>
      <div class="px-5">
        <div class="text-sm text-gray-400">设置项待实现</div>
      </div>
    </div>
    <div class="setting-item mb-6">
      <h3 class="setting-label text-base font-medium mb-3">快捷键</h3>
      <div class="px-5">
        <div class="text-sm text-gray-400">设置项待实现</div>
      </div>
    </div>
    <div class="setting-item mb-6">
      <h3 class="setting-label text-base font-medium mb-3">API Key</h3>
      <div class="px-5">
        <APIKeyForm />
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped></style>
