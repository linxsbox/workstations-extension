<script setup>
import { computed, h } from "vue";
import { NSlider } from "naive-ui";
import SearchBox from "./SearchBox.vue";
import IconSettings from "@/components/common/Icons/IconSettings.vue";
import IconBrightnessLight from "@/components/common/Icons/IconBrightnessLight.vue";
import IconBrightnessAuto from "@/components/common/Icons/IconBrightnessAuto.vue";
import IconBrightnessDark from "@/components/common/Icons/IconBrightnessDark.vue";
import { storeSettings } from "@/stores/modules/settings";
import { SettingSectionEnum } from "@/stores/modules/settings/config";

const store = storeSettings();

// 主题模式映射
const themeValueMap = {
  light: 0,
  system: 50,
  dark: 100,
};

const valueThemeMap = {
  0: "light",
  50: "system",
  100: "dark",
};

// 滑块值的双向绑定
const sliderValue = computed({
  get: () => themeValueMap[store.themeMode],
  set: (value) => {
    const theme = valueThemeMap[value];
    if (theme) {
      store.setThemeMode(theme);
    }
  },
});

// 根据当前值获取对应的图标组件
const currentThemeIcon = computed(() => {
  const iconMap = {
    0: IconBrightnessLight,
    50: IconBrightnessAuto,
    100: IconBrightnessDark,
  };
  return iconMap[sliderValue.value];
});

// 根据当前值获取对应的图标颜色
const currentThemeColor = computed(() => {
  const colorMap = {
    0: "var(--color-warning)",
    50: "var(--link-color)",
    100: "var(--color-black)", // 深色图标用黑色
  };
  return colorMap[sliderValue.value];
});
</script>

<template>
  <header class="header-bar-box flex gap-4 justify-center">
    <div class="search-box flex-auto">
      <SearchBox></SearchBox>
    </div>
    <div class="setting-box inline-flex justify-end items-center gap-4 w-1/4">
      <button
        class="flex justify-center items-center gap-1 bg-transparent px-2 rounded-md"
        type="button"
      >
        笔记
      </button>

      <!-- 主题模式滑块 -->
      <div class="flex items-center px-2 min-w-[120px]">
        <NSlider
          v-model:value="sliderValue"
          :min="0"
          :max="100"
          :step="50"
          :tooltip="false"
          :rail-style="{ backgroundColor: 'var(--border-color)' }"
          :fill-style="{ backgroundColor: 'var(--link-color)' }"
          style="width: 120px"
        >
          <template #thumb>
            <div class="theme-thumb flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-white)] shadow-md cursor-pointer transition-shadow duration-200">
              <component
                :is="currentThemeIcon"
                :style="{ fontSize: '20px', color: currentThemeColor }"
              />
            </div>
          </template>
        </NSlider>
      </div>

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

<style lang="scss" scoped>
.theme-thumb {
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
