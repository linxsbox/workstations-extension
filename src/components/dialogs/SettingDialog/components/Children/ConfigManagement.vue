<script setup>
import { ref } from "vue";
import {
  NButton,
  NRadioGroup,
  NRadio,
  NModal,
  NUpload,
  NUploadDragger,
  NText,
  NP,
  NIcon,
  useMessage,
} from "naive-ui";
import DataImportExport from "@/components/widgets/DataImportExport/DataImportExport.vue";
import {
  storageManager,
  EXTENSION_STORAGE_KEYS,
  WEB_STORAGE_KEYS,
} from "@/stores/storage";

const message = useMessage();

// 导出范围枚举
const ExportScope = {
  ALL: "all",
  EXTENSION: "extension",
  WEB: "web",
};

// 导入策略枚举
const ImportStrategy = {
  MERGE: "merge",
  OVERWRITE: "overwrite",
};

// 导出相关
const showExportConfirm = ref(false); // 导出确认对话框
const showExportDialog = ref(false);
const exportScope = ref(ExportScope.ALL);
const exportData = ref("");

// 导入相关
const showImportDialog = ref(false);
const importData = ref("");
const importStrategy = ref(ImportStrategy.MERGE);
const importLoading = ref(false);
const uploadFileList = ref([]);

// 导出配置选项
const exportOptions = [
  { label: "全部", value: ExportScope.ALL },
  { label: "扩展配置", value: ExportScope.EXTENSION },
  { label: "网页配置", value: ExportScope.WEB },
];

// 导入策略选项
const importStrategyOptions = [
  { label: "合并配置", value: ImportStrategy.MERGE },
  { label: "覆盖配置", value: ImportStrategy.OVERWRITE },
];

// ========== 导出相关函数 ==========

// 打开导出确认对话框
const openExportDialog = () => {
  exportScope.value = ExportScope.ALL;
  showExportConfirm.value = true;
};

// 确认导出
const confirmExport = async () => {
  showExportConfirm.value = false;
  await generateExportData();
  showExportDialog.value = true;
};

// 生成导出数据
const generateExportData = async () => {
  try {
    let configData = {};

    // 导出扩展配置
    if (
      exportScope.value === ExportScope.ALL ||
      exportScope.value === ExportScope.EXTENSION
    ) {
      const extensionConfig = {};
      for (const [key, value] of Object.entries(EXTENSION_STORAGE_KEYS)) {
        const data = await storageManager.get(value);
        if (data !== undefined && data !== null) {
          extensionConfig[value] = data;
        }
      }
      configData.extension = extensionConfig;
    }

    // 导出网页配置
    if (
      exportScope.value === ExportScope.ALL ||
      exportScope.value === ExportScope.WEB
    ) {
      const webConfig = {};
      for (const [key, value] of Object.entries(WEB_STORAGE_KEYS)) {
        const data = storageManager.get(value);
        if (data !== undefined && data !== null) {
          webConfig[value] = data;
        }
      }
      configData.web = webConfig;
    }

    // 添加元数据
    configData.meta = {
      exportTime: new Date().toISOString(),
      version: "1.0.0",
      scope: exportScope.value,
    };

    exportData.value = JSON.stringify(configData, null, 2);
  } catch (error) {
    console.error("生成导出数据失败:", error);
    message.error(`生成失败: ${error.message}`);
  }
};

// 导出范围变化时重新生成数据
const handleExportScopeChange = async () => {
  await generateExportData();
};

// 下载导出文件
const handleDownload = () => {
  if (!exportData.value) {
    message.warning("没有可下载的配置数据");
    return;
  }

  try {
    const blob = new Blob([exportData.value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `config-${exportScope.value}-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success("配置文件下载成功");
  } catch (error) {
    console.error("下载失败:", error);
    message.error(`下载失败: ${error.message}`);
  }
};

// ========== 导入相关函数 ==========

// 打开导入对话框
const openImportDialog = () => {
  importStrategy.value = ImportStrategy.MERGE;
  importData.value = "";
  uploadFileList.value = [];
  showImportDialog.value = true;
};

// 处理文件上传
const handleUploadChange = ({ fileList }) => {
  uploadFileList.value = fileList;

  if (fileList.length > 0) {
    const file = fileList[0].file;
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        importData.value = e.target.result;
      } catch (error) {
        console.error("读取文件失败:", error);
        message.error(`读取失败: ${error.message}`);
      }
    };

    reader.readAsText(file);
  } else {
    importData.value = "";
  }
};

// 自定义上传请求（阻止默认上传行为）
const customRequest = ({ file, onFinish }) => {
  onFinish();
};

// 处理导入
const handleImport = async () => {
  if (!importData.value) {
    message.warning("请先上传配置文件");
    return;
  }

  importLoading.value = true;
  try {
    const configData = JSON.parse(importData.value);

    // 验证配置格式
    if (!configData.meta || !configData.meta.version) {
      throw new Error("无效的配置文件格式");
    }

    let importCount = 0;

    // 导入扩展配置
    if (configData.extension) {
      for (const [key, value] of Object.entries(configData.extension)) {
        if (importStrategy.value === ImportStrategy.OVERWRITE) {
          // 覆盖模式：直接设置
          await storageManager.set(key, value);
          importCount++;
        } else {
          // 合并模式：检查是否存在
          const existing = await storageManager.get(key);
          if (!existing) {
            await storageManager.set(key, value);
            importCount++;
          }
        }
      }
    }

    // 导入网页配置
    if (configData.web) {
      for (const [key, value] of Object.entries(configData.web)) {
        if (importStrategy.value === ImportStrategy.OVERWRITE) {
          storageManager.set(key, value);
          importCount++;
        } else {
          const existing = storageManager.get(key);
          if (!existing) {
            storageManager.set(key, value);
            importCount++;
          }
        }
      }
    }

    message.success(`配置导入成功，共导入 ${importCount} 项配置`);
    showImportDialog.value = false;

    // 提示用户刷新页面
    setTimeout(() => {
      if (confirm("配置已导入，是否刷新页面以应用新配置？")) {
        window.location.reload();
      }
    }, 500);
  } catch (error) {
    console.error("导入配置失败:", error);
    message.error(`导入失败: ${error.message}`);
  } finally {
    importLoading.value = false;
  }
};
</script>

<template>
  <div class="config-management">
    <div class="flex gap-3">
      <NButton type="primary" @click="openExportDialog"> 导出配置 </NButton>
      <NButton @click="openImportDialog"> 导入配置 </NButton>
    </div>

    <!-- 导出确认对话框 -->
    <NModal
      v-model:show="showExportConfirm"
      preset="dialog"
      title="选择导出范围"
      positive-text="确认"
      negative-text="取消"
      @positive-click="confirmExport"
    >
      <NRadioGroup v-model:value="exportScope" class="pt-3">
        <div class="flex gap-3">
          <NRadio
            v-for="option in exportOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </NRadio>
        </div>
      </NRadioGroup>
    </NModal>

    <!-- 导出对话框 -->
    <DataImportExport
      v-model:show="showExportDialog"
      :import-type="0"
      :export-data="exportData"
      title="导出配置"
    >
      <template #export-actions>
        <NButton size="small" @click="handleDownload"> 下载 </NButton>
      </template>
    </DataImportExport>

    <!-- 导入对话框 -->
    <DataImportExport
      v-model:show="showImportDialog"
      :import-type="1"
      :loading="importLoading"
      title="导入配置"
      @import="handleImport"
    >
      <template #import-content>
        <div class="flex flex-col gap-4 pt-3">
          <!-- 导入策略选择 -->
          <NRadioGroup v-model:value="importStrategy">
            <div class="flex gap-3">
              <NRadio
                v-for="option in importStrategyOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </NRadio>
            </div>
          </NRadioGroup>

          <div class="text-xs text-[var(--text-tertiary)]">
            <p v-if="importStrategy === ImportStrategy.MERGE">
              合并模式：仅导入不存在的配置项，已有配置将保持不变
            </p>
            <p v-else>覆盖模式：导入的配置将覆盖现有配置</p>
          </div>

          <!-- 文件上传 -->
          <NUpload
            v-model:file-list="uploadFileList"
            accept=".json"
            :max="1"
            :custom-request="customRequest"
            @change="handleUploadChange"
          >
            <NUploadDragger v-if="!importData">
              <div>点击或者拖动文件到该区域来上传</div>
              <div>请选择 JSON 格式的配置文件</div>
            </NUploadDragger>
          </NUpload>
        </div>
      </template>
    </DataImportExport>
  </div>
</template>
