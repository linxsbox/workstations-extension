<script setup>
const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({
      title: "",
      author: "",
      brief: "",
      image: "",
      color: "",
    }),
  },
});
</script>

<template>
  <article
    class="podcast-card w-[174px] rounded-lg cursor-pointer transition-all duration-200"
  >
    <div class="card-panel p-3 h-full flex flex-col gap-2">
      <!-- 封面图片 -->
      <div class="picture flex-none">
        <img
          class="w-full h-[150px] object-cover rounded-md"
          :src="props.data.image"
          :alt="props.data.title"
          loading="lazy"
        />
      </div>

      <!-- 播客信息 -->
      <div class="podcast-info flex-1 flex flex-col gap-1 min-h-0">
        <h3
          class="podcast-title text-sm font-bold m-0 line-clamp-2"
          :title="props.data.title"
        >
          {{ props.data.title }}
        </h3>
        <p
          v-if="props.data.author"
          class="podcast-author text-xs m-0 line-clamp-1"
          :title="props.data.author"
        >
          {{ props.data.author }}
        </p>
        <p
          v-if="props.data.brief"
          class="podcast-brief text-xs m-0 line-clamp-2"
          :title="props.data.brief"
        >
          {{ props.data.brief }}
        </p>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.podcast-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: var(--interactive-bg-hover);
    border-color: var(--interactive-border-hover, var(--border-color));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);

    .podcast-title {
      color: var(--interactive-hover);
    }
  }

  &:active {
    transform: translateY(0);
  }

  .picture {
    img {
      background-color: var(--bg-tertiary);
    }
  }

  .podcast-title {
    color: var(--text-primary);
    transition: color 0.2s;
  }

  .podcast-author,
  .podcast-brief {
    color: var(--text-secondary);
  }
}

// 多行文本溢出省略
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
</style>
