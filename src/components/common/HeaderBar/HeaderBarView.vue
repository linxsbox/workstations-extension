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
    0: "var(--color-warning)",    // 明亮：黄色
    50: "var(--link-color)",       // 自动：主题蓝色
    100: "var(--color-black)",     // 深色：黑色
  };
  return colorMap[sliderValue.value];
});

// 根据当前值获取按钮背景样式
const thumbBackgroundStyle = computed(() => {
  if (sliderValue.value === 50) {
    // 自动模式：使用主题色背景，图标白色
    return {
      backgroundColor: 'var(--link-color)',
      color: 'var(--color-white)',
    };
  }
  // 其他模式：白色背景，图标使用对应颜色
  return {
    backgroundColor: 'var(--slider-thumb-bg)',
    color: currentThemeColor.value,
  };
});
</script>

<template>
  <header class="header-bar-box flex gap-4 justify-center">
    <div class="search-box flex-auto">
      <SearchBox></SearchBox>
    </div>
    <div class="setting-box inline-flex justify-end items-center gap-4 w-1/4">
      <!-- 主题模式滑块 -->
      <div class="theme-slider-wrapper flex items-center px-2 w-[80px]">
        <NSlider
          v-model:value="sliderValue"
          :min="0"
          :max="100"
          :step="50"
          :tooltip="false"
        >
          <template #thumb>
            <div
              class="theme-thumb flex items-center justify-center w-5 h-5 rounded-full shadow-md cursor-pointer transition-all duration-200"
              :style="thumbBackgroundStyle"
            >
              <component
                :is="currentThemeIcon"
                style="font-size: 16px"
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
.theme-slider-wrapper {
  // 修改滑块轨道背景色（使用主题变量）
  :deep(.n-slider-rail) {
    background-color: var(--slider-rail-bg);
  }

  // 将进度填充色设置为透明（只显示轨道底色）
  :deep(.n-slider-rail__fill) {
    background-color: transparent !important;
  }
}

.theme-thumb {
  // 背景色和图标颜色通过 :style 动态设置

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }
}
</style>
