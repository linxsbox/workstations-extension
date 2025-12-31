<script setup>
import { NRadioGroup, NRadio } from "naive-ui";
import IconBrightnessAuto from "@/components/common/Icons/IconBrightnessAuto.vue";
import IconBrightnessDark from "@/components/common/Icons/IconBrightnessDark.vue";
import IconBrightnessLight from "@/components/common/Icons/IconBrightnessLight.vue";
import { storeSettings } from "@/stores/modules/settings";
import {
  SettingSectionEnum,
  settingChildKeys,
  getSettingChildItems,
} from "@/stores/modules/settings/config";

const store = storeSettings();

const fontSizeOptions = getSettingChildItems(
  SettingSectionEnum.GENERAL,
  settingChildKeys.FONTSIZEOPTIONS
);
</script>

<template>
  <section class="setting-section">
    <h2 class="mb-4 text-lg font-bold text-[var(--text-primary)]">常规设置</h2>

    <!-- 主题设置 -->
    <div class="setting-item mb-6">
      <h3 class="setting-label text-base font-medium mb-3">主题模式</h3>
      <div class="px-5">
        <NRadioGroup v-model:value="store.themeMode" @update:value="store.setThemeMode">
          <div class="inline-flex gap-4">
            <NRadio value="system">
              <div class="inline-flex flex-wrap items-center gap-1">
                <IconBrightnessAuto class="text-xl" /> 跟随系统
              </div>
            </NRadio>
            <NRadio value="light">
              <div class="inline-flex flex-wrap items-center gap-1">
                <IconBrightnessDark class="text-xl" />明亮
              </div>
            </NRadio>
            <NRadio value="dark">
              <div class="inline-flex flex-wrap items-center gap-1">
                <IconBrightnessLight class="text-xl" /> 深色
              </div>
            </NRadio>
          </div>
        </NRadioGroup>
      </div>
    </div>

    <!-- 字体习惯设置 -->
    <div class="setting-item mb-6">
      <h3 class="setting-label text-base font-medium mb-3">字体大小</h3>
      <div class="px-5">
        <NRadioGroup v-model:value="store.fontSize" @update:value="store.setFontSize">
          <div class="inline-flex flex-wrap gap-4">
            <NRadio v-for="option in fontSizeOptions" :key="option.value" :value="option.value">
              <span class="mr-2">{{ option.label }}</span>
              <span class="text-xs gray">({{ option.value }}px)</span>
            </NRadio>
          </div>
        </NRadioGroup>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped></style>
