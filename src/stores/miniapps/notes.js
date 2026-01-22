import { defineStore } from "pinia";
import { storageManager, WEB_STORAGE_KEYS } from "@/stores/storage";

/**
 * 笔记管理 Store
 * 统一管理所有笔记数据，供各个组件使用
 */
export const storeNotes = defineStore("notes", {
  state: () => ({
    notes: [],
    // UI 状态
    selectedNoteId: null,
    searchKeyword: "",
    // 分享对话框状态
    showShareDialog: false,
    shareNoteId: null,
    shareContentElement: null, // 待渲染的 DOM 元素
    shareType: "", // 'full' 整篇文章, 'selected' 选中内容
  }),

  getters: {
    /**
     * 获取所有笔记
     */
    allNotes: (state) => state.notes,

    /**
     * 按更新时间排序的笔记列表
     */
    sortedNotes: (state) => {
      return [...state.notes].sort((a, b) => {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
    },

    /**
     * 获取近期笔记（按更新时间排序，最多3个）
     */
    recentNotes: (state) => {
      return [...state.notes]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 3);
    },

    /**
     * 根据 ID 获取笔记
     */
    getNoteById: (state) => (id) => {
      return state.notes.find((n) => n.id === id);
    },

    /**
     * 搜索笔记
     */
    searchNotes: (state) => (keyword) => {
      if (!keyword.trim()) {
        return state.notes;
      }
      const lowerKeyword = keyword.toLowerCase();
      return state.notes.filter((note) => {
        return (
          note.title.toLowerCase().includes(lowerKeyword) ||
          note.content.toLowerCase().includes(lowerKeyword)
        );
      });
    },

    /**
     * 获取当前选中的笔记
     */
    selectedNote: (state) => {
      if (!state.selectedNoteId) return null;
      return state.notes.find((n) => n.id === state.selectedNoteId);
    },

    /**
     * 过滤后的笔记列表（支持搜索）
     */
    filteredNotes: (state) => {
      if (!state.searchKeyword.trim()) {
        return [...state.notes].sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
      }
      const lowerKeyword = state.searchKeyword.toLowerCase();
      return state.notes.filter((note) => {
        return (
          note.title.toLowerCase().includes(lowerKeyword) ||
          note.content.toLowerCase().includes(lowerKeyword)
        );
      });
    },
  },

  actions: {
    /**
     * 初始化笔记数据
     */
    init() {
      const savedNotes = storageManager.get(WEB_STORAGE_KEYS.NOTES) || [];
      this.notes = savedNotes;
    },

    /**
     * 保存笔记到存储
     */
    saveNotes() {
      storageManager.set(WEB_STORAGE_KEYS.NOTES, this.notes);
    },

    /**
     * 添加笔记
     */
    addNote(note) {
      this.notes.push(note);
      this.saveNotes();
    },

    /**
     * 更新笔记
     */
    updateNote(noteId, updates) {
      const note = this.notes.find((n) => n.id === noteId);
      if (note) {
        Object.assign(note, updates);
        note.updatedAt = new Date().toISOString();
        this.saveNotes();
      }
    },

    /**
     * 删除笔记
     */
    deleteNote(noteId) {
      const index = this.notes.findIndex((n) => n.id === noteId);
      if (index > -1) {
        this.notes.splice(index, 1);
        this.saveNotes();
        // 如果删除的是当前选中的笔记，清除选中状态
        if (this.selectedNoteId === noteId) {
          this.selectedNoteId = null;
        }
      }
    },

    /**
     * 选择笔记
     */
    selectNote(noteId) {
      this.selectedNoteId = noteId;
    },

    /**
     * 取消选择
     */
    clearSelection() {
      this.selectedNoteId = null;
    },

    /**
     * 设置搜索关键词
     */
    setSearchKeyword(keyword) {
      this.searchKeyword = keyword;
    },

    /**
     * 打开分享对话框
     */
    openShareDialog(noteId, contentElement, type = 'full') {
      this.shareNoteId = noteId;
      this.shareContentElement = contentElement;
      this.shareType = type;
      this.showShareDialog = true;
    },

    /**
     * 关闭分享对话框
     */
    closeShareDialog() {
      this.showShareDialog = false;
      this.shareNoteId = null;
      this.shareContentElement = null;
      this.shareType = "";
    },
  },
});
