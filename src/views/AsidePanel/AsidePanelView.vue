<script setup>
import { version } from "../../../package.json";
import HeaderView from "./HeaderView.vue";
import MenuView from "./MenuView.vue";
import ExtendView from "./ExtendView.vue";
</script>

<template>
  <aside class="aside-panel flex flex-col justify-between w-64 border-r p-4">
    <section class="panel-main">
      <HeaderView />
      <div class="panel-content">
        <MenuView />
      </div>
      <div class="dividing-line shrink-0 h-[1px] w-full my-4"></div>
      <div class="panel-extend">
        <ExtendView />
      </div>
    </section>
    <section class="panel-footer">
      <div class="version-info">v{{ version }}</div>
    </section>
  </aside>
</template>

<style lang="scss" scoped>
.aside-panel {
  background-color: var(--bg-primary);

  .dividing-line {
    background-color: var(--border-color);
  }

  .panel-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);

    .version-info {
      font-size: 12px;
      color: var(--text-color-3);
    }
  }
}
</style>
