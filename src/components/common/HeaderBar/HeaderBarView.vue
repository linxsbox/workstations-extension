<script setup>
import SearchBox from "./SearchBox.vue";
import IconSettings from "@/components/common/Icons/IconSettings.vue";
import { storeSettings } from "@/stores/modules/settings";
import { SettingSectionEnum } from "@/stores/modules/settings/config";

const store = storeSettings();
</script>

<template>
  <header class="header-bar-box flex gap-4 justify-center">
    <div class="search-box flex-auto">
      <SearchBox></SearchBox>
    </div>
    <div class="setting-box inline-flex justify-end gap-4 w-1/4">
      <button
        class="flex justify-center items-center gap-1 bg-transparent px-2 rounded-md"
        type="button"
      >
        笔记
      </button>
      <button
        class="flex justify-center items-center gap-1 bg-transparent px-2 rounded-md"
        type="button"
      >
        深色
      </button>
      <button
        class="flex justify-center items-center gap-1 bg-transparent px-2 rounded-md"
        type="button"
        @click="store.openSetting(SettingSectionEnum.GENERAL)"
      >
        <IconSettings />
        <span>设置</span>
      </button>
    </div>
  </header>
</template>

<style lang="scss" scoped></style>
