<script setup>
import {
  NDrawer,
  NDrawerContent,
  NButton,
  NInput,
  NScrollbar,
  NPopconfirm,
  NModal,
  useMessage,
} from "naive-ui";
import TabBarView from "@/components/TabBar/TabBarView.vue";
import IconClose from "@/components/Icons/IconClose.vue";
import IconExtension from "@/components/Icons/IconExtension.vue";
import { toolsList, loadGithubToolsCfg } from "./config.js";

const message = useMessage();

const showDetailPanel = ref(false);
const currentActiveTool = shallowRef(null);

// 触发打开支持的工具详情
const handleOpenToolsDetail = () => {
  showDetailPanel.value = true;
};
// 触发关闭
const handleCloseToolsDetail = () => {
  showDetailPanel.value = false;
};

// 点击触发加载组件
const handleClickToolApp = (item) => {
  if (!item) return;

  handleOpenToolsDetail();

  currentActiveTool.value = item;
};

const moduleList = reactive(toolsList);
onMounted(() => {});

const showAddCustomize = ref(false);
const loadToolsUrl = ref("");
const isLoading = ref(false);
const handleLoadSFC = async () => {
  const url = loadToolsUrl.value.trim();
  if (!url) {
    return message.error("Github 配置文件 URL 不能为空");
  }
  isLoading.value = true;
  try {
    const res = await loadGithubToolsCfg(url);

    if (res.isError) {
      return message.error(list.message);
    }

    (res.data || []).forEach((item) => {
      if (item.customize) {
        item.icon = markRaw(IconExtension);
        moduleList.push(item);
      }
    });

    handleCancel();

    message.success("加载远程组件成功");
  } catch (error) {
    message.error("加载远程组件失败", error.message || error);
  } finally {
    isLoading.value = false;
  }
};

const handleClickAddCustomize = () => {
  loadToolsUrl.value = "";
  showAddCustomize.value = true;
};

const handleCancel = () => {
  loadToolsUrl.value = "";
  showAddCustomize.value = false;
};

// 删除自定义工具
const handleDeleteItem = (name = "") => {
  const delIndex = moduleList.filter((item) => item.name !== name);
  moduleList.splice(delIndex, 1);
};
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex-none px-4 py-2 border-b">
      <TabBarView panelKey="tools" />
    </div>

    <NScrollbar
      class="flex-1 p-4"
      content-class="flex flex-wrap justify-start align-top h-[inherit] gap-3"
    >
      <div
        class="tool-app relative inline-flex gap-1 items-center w-[150px] h-[40px] p-2 rounded-md cursor-pointer"
        v-for="tool in moduleList"
        :key="tool.name"
        @click="handleClickToolApp(tool)"
      >
        <component :is="tool.icon" class="text-2xl" />
        {{ tool.name }}

        <template v-if="tool.customize">
          <NPopconfirm
            positive-text="删除"
            negative-text="取消"
            @positive-click.stop="handleDeleteItem(tool.name)"
          >
            删除此工具？
            <template #trigger>
              <IconClose
                @click.stop="() => {}"
                class="icon-delete absolute top-2 right-2 text-base cursor-pointer"
              />
            </template>
          </NPopconfirm>
        </template>
      </div>
      <div
        class="tool-app extension-add inline-flex gap-1 items-center w-[150px] h-[40px] p-2 rounded-md cursor-pointer"
        @click="handleClickAddCustomize(tool)"
      >
        <IconExtension class="text-2xl" />
        添加工具
      </div>
    </NScrollbar>

    <NDrawer
      v-model:show="showDetailPanel"
      resizable
      :default-width="886"
      :max-width="1366"
      :min-width="886"
      :mask-closable="false"
    >
      <NDrawerContent>
        <template #header>
          <header class="flex justify-between items-center">
            <h2 v-if="currentActiveTool">{{ currentActiveTool.name }}</h2>
            <NButton
              circle
              type="error"
              size="small"
              @click="handleCloseToolsDetail"
            >
              <IconClose />
            </NButton>
          </header>
        </template>

        <!-- <Transition name="fade" mode="out-in"> -->
          <component
            :is="currentActiveTool.component"
            v-if="currentActiveTool"
          />
          <div class="flex justify-center items-center h-full" v-else>
            <IconExtension class="icon-extension text-7xl" />
          </div>
        <!-- </Transition> -->

        <!-- <template #footer>
      </template> -->
      </NDrawerContent>
    </NDrawer>

    <NModal
      v-model:show="showAddCustomize"
      preset="dialog"
      title="添加自定义工具"
    >
      <NInput
        class="mb-3"
        v-model:value="loadToolsUrl"
        placeholder="Github 配置文件链接"
        :disabled="isLoading"
      ></NInput>
      <p>仅支持 Vue 3 SFC，以及 @linxs/toolkit 工具库</p>
      <p>
        参考：<a
          class="text-[var(--color-success)]"
          href="https://github.com/linxsbox/config-data/blob/main/ToolsCfg.json"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://github.com/linxsbox/config-data
        </a>
      </p>
      <div class="flex justify-end gap-4 mt-3">
        <NButton @click="handleCancel" :disabled="isLoading">取消</NButton>
        <NButton @click="handleLoadSFC" type="primary" :loading="isLoading">
          添加
        </NButton>
      </div>
    </NModal>
  </div>
</template>

<style lang="scss" scoped>
.tool-app {
  border: 1px solid var(--border-color);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-leave-to,
.fade-enter-from {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.icon-extension {
  animation: loadExtension 1.5s 0.5s alternate infinite;

  @keyframes loadExtension {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0.75;
      transform: scale(0.95);
    }
  }
}
</style>
