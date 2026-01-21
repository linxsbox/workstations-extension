<script setup>
import { ref, computed, watch } from "vue";
import {
  NButton,
  NCheckbox,
  NCheckboxGroup,
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
  SYSTEM_STORAGE_KEYS,
  PLAYER_STORAGE_KEYS,
  RSS_STORAGE_KEYS,
  NOTES_STORAGE_KEYS,
  TASKS_STORAGE_KEYS,
} from "@/stores/storage";

const message = useMessage();

// 导出模块枚举
const ExportModule = {
  SYSTEM: "system",       // 系统配置（主题、字体等）
  ALL: "all",            // 全部
  PLAYER: "player",      // 播放器
  RSS: "rss",           // RSS
  NOTES: "notes",       // 笔记
  TASKS: "tasks",       // 任务
};

// 导入策略枚举
const ImportStrategy = {
  MERGE: "merge",
  OVERWRITE: "overwrite",
};

// 导出相关
const showExportConfirm = ref(false); // 导出确认对话框
const showExportDialog = ref(false);
const exportModules = ref([ExportModule.SYSTEM]); // 默认选中系统配置
const exportData = ref("");

// 导入相关
const showImportDialog = ref(false);
const importData = ref("");
const importStrategy = ref(ImportStrategy.MERGE);
const importLoading = ref(false);
const uploadFileList = ref([]);

// 导出模块选项
const exportModuleOptions = [
  { label: "系统配置", value: ExportModule.SYSTEM, disabled: true, description: "主题、字体等系统设置" },
  { label: "全部", value: ExportModule.ALL, description: "导出所有数据" },
  { label: "播放器", value: ExportModule.PLAYER, description: "播放队列、播放模式等" },
  { label: "RSS", value: ExportModule.RSS, description: "RSS 订阅源" },
  { label: "笔记", value: ExportModule.NOTES, description: "笔记数据" },
  { label: "任务", value: ExportModule.TASKS, description: "待办事项" },
];

// 计算是否选中了"全部"
const isAllSelected = computed(() => exportModules.value.includes(ExportModule.ALL));

// 计算可选的模块（除了系统配置和全部）
const selectableModules = computed(() =>
  exportModuleOptions
    .filter(opt => opt.value !== ExportModule.SYSTEM && opt.value !== ExportModule.ALL)
    .map(opt => opt.value)
);

// 监听"全部"选项的变化
watch(exportModules, (newValue, oldValue) => {
  // 如果新选中了"全部"
  if (newValue.includes(ExportModule.ALL) && !oldValue.includes(ExportModule.ALL)) {
    // 选中所有模块
    exportModules.value = [
      ExportModule.SYSTEM,
      ExportModule.ALL,
      ...selectableModules.value
    ];
  }
  // 如果取消了"全部"
  else if (!newValue.includes(ExportModule.ALL) && oldValue.includes(ExportModule.ALL)) {
    // 只保留系统配置
    exportModules.value = [ExportModule.SYSTEM];
  }
  // 如果手动取消了某个模块（且"全部"已选中）
  else if (oldValue.includes(ExportModule.ALL) && newValue.length < oldValue.length) {
    // 自动取消"全部"
    exportModules.value = newValue.filter(v => v !== ExportModule.ALL);
  }
  // 如果手动选中了所有可选模块
  else if (!newValue.includes(ExportModule.ALL)) {
    const selectedCount = newValue.filter(v => v !== ExportModule.SYSTEM).length;
    if (selectedCount === selectableModules.value.length) {
      // 自动选中"全部"
      exportModules.value = [
        ExportModule.SYSTEM,
        ExportModule.ALL,
        ...selectableModules.value
      ];
    }
  }
});

// ========== 导出相关函数 ==========

// 打开导出确认对话框
const openExportDialog = () => {
  exportModules.value = [ExportModule.SYSTEM];
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

    // 系统配置（必选）
    if (exportModules.value.includes(ExportModule.SYSTEM)) {
      configData.system = {};
      for (const key of Object.values(SYSTEM_STORAGE_KEYS)) {
        const value = await storageManager.get(key);
        if (value !== undefined && value !== null) {
          configData.system[key] = value;
        }
      }
    }

    // 播放器
    if (exportModules.value.includes(ExportModule.PLAYER) || exportModules.value.includes(ExportModule.ALL)) {
      configData.player = {};
      for (const key of Object.values(PLAYER_STORAGE_KEYS)) {
        const value = await storageManager.get(key);
        if (value !== undefined && value !== null) {
          configData.player[key] = value;
        }
      }
    }

    // RSS
    if (exportModules.value.includes(ExportModule.RSS) || exportModules.value.includes(ExportModule.ALL)) {
      configData.rss = {};
      for (const key of Object.values(RSS_STORAGE_KEYS)) {
        const value = await storageManager.get(key);
        if (value !== undefined && value !== null) {
          configData.rss[key] = value;
        }
      }
    }

    // 笔记
    if (exportModules.value.includes(ExportModule.NOTES) || exportModules.value.includes(ExportModule.ALL)) {
      configData.notes = {};
      for (const key of Object.values(NOTES_STORAGE_KEYS)) {
        const value = storageManager.get(key);
        if (value !== undefined && value !== null) {
          configData.notes[key] = value;
        }
      }
    }

    // 任务
    if (exportModules.value.includes(ExportModule.TASKS) || exportModules.value.includes(ExportModule.ALL)) {
      configData.tasks = {};
      for (const key of Object.values(TASKS_STORAGE_KEYS)) {
        const value = storageManager.get(key);
        if (value !== undefined && value !== null) {
          configData.tasks[key] = value;
        }
      }
    }

    // 添加元数据
    configData.meta = {
      exportTime: new Date().toISOString(),
      version: "2.0.0",
      modules: exportModules.value,
    };

    exportData.value = JSON.stringify(configData, null, 2);
  } catch (error) {
    console.error("生成导出数据失败:", error);
    message.error(`生成失败: ${error.message}`);
  }
};

// 导出模块变化时重新生成数据
const handleExportModulesChange = async () => {
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
    const modulesStr = exportModules.value.includes(ExportModule.ALL)
      ? "all"
      : exportModules.value.filter(m => m !== ExportModule.SYSTEM).join("-") || "system";
    a.download = `config-${modulesStr}-${new Date().getTime()}.json`;
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

// 导入策略选项
const importStrategyOptions = [
  { label: "合并配置", value: ImportStrategy.MERGE },
  { label: "覆盖配置", value: ImportStrategy.OVERWRITE },
];

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

    // 导入系统配置
    if (configData.system) {
      for (const [key, value] of Object.entries(configData.system)) {
        if (value !== undefined && value !== null) {
          if (importStrategy.value === ImportStrategy.OVERWRITE) {
            await storageManager.set(key, value);
            importCount++;
          } else {
            const existing = await storageManager.get(key);
            if (!existing) {
              await storageManager.set(key, value);
              importCount++;
            }
          }
        }
      }
    }

    // 导入播放器配置
    if (configData.player) {
      for (const [key, value] of Object.entries(configData.player)) {
        if (value !== undefined && value !== null) {
          if (importStrategy.value === ImportStrategy.OVERWRITE) {
            await storageManager.set(key, value);
            importCount++;
          } else {
            const existing = await storageManager.get(key);
            if (!existing) {
              await storageManager.set(key, value);
              importCount++;
            }
          }
        }
      }
    }

    // 导入 RSS 配置
    if (configData.rss) {
      for (const [key, value] of Object.entries(configData.rss)) {
        if (value !== undefined && value !== null) {
          if (importStrategy.value === ImportStrategy.OVERWRITE) {
            await storageManager.set(key, value);
            importCount++;
          } else {
            const existing = await storageManager.get(key);
            if (!existing) {
              await storageManager.set(key, value);
              importCount++;
            }
          }
        }
      }
    }

    // 导入笔记
    if (configData.notes) {
      for (const [key, value] of Object.entries(configData.notes)) {
        if (value !== undefined && value !== null) {
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
    }

    // 导入任务
    if (configData.tasks) {
      for (const [key, value] of Object.entries(configData.tasks)) {
        if (value !== undefined && value !== null) {
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
    }

    // 兼容旧版本格式（v1.0.0）
    if (configData.extension) {
      for (const [key, value] of Object.entries(configData.extension)) {
        if (value !== undefined && value !== null) {
          if (importStrategy.value === ImportStrategy.OVERWRITE) {
            await storageManager.set(key, value);
            importCount++;
          } else {
            const existing = await storageManager.get(key);
            if (!existing) {
              await storageManager.set(key, value);
              importCount++;
            }
          }
        }
      }
    }

    if (configData.web) {
      for (const [key, value] of Object.entries(configData.web)) {
        if (value !== undefined && value !== null) {
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
      title="选择导出模块"
      positive-text="确认"
      negative-text="取消"
      @positive-click="confirmExport"
    >
      <div class="pt-3">
        <NCheckboxGroup v-model:value="exportModules" @update:value="handleExportModulesChange">
          <div class="flex flex-col gap-3">
            <NCheckbox
              v-for="option in exportModuleOptions"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled || (option.value !== ExportModule.ALL && option.value !== ExportModule.SYSTEM && isAllSelected)"
            >
              <div class="flex flex-col">
                <span>{{ option.label }}</span>
                <span class="text-xs text-[var(--text-tertiary)]">{{ option.description }}</span>
              </div>
            </NCheckbox>
          </div>
        </NCheckboxGroup>
      </div>
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
