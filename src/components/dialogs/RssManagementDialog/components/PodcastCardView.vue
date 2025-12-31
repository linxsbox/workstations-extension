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
  <section
    class="podcast-card w-[174px] h-[246px] rounded-md cursor-pointer"
    :style="{ '--podcast-card': props.data.color }"
  >
    <div class="card-panel p-3">
      <div class="picture">
        <img class="m-auto rounded-md" :src="props.data.image" alt="" />
      </div>
      <div
        class="podcast-info mt-2 whitespace-nowrap overflow-hidden text-ellipsis"
      >
        <div class="podcast-title text-base font-bold">
          {{ props.data.title }}
        </div>
        <div class="podcast-author text-sm">
          {{ props.data.author }}
        </div>
        <div class="podcast-brief text-sm">
          {{ props.data.brief }}
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.podcast-card {
  background-color: var(--bg-secondary);
  transition: background-color 0.2s, color 0.2s;

  .picture {
    img {
      display: block;
      width: 150px;
      height: 150px;
    }
  }

  .podcast-title {
    color: var(--text-primary);
    text-shadow: 1px 1px 1px rgba(var(--podcast-card), 0.3);
  }
  .podcast-author,
  .podcast-brief {
    color: var(--text-secondary);
  }

  &:hover {
    background-color: rgba(var(--podcast-card), 0.2);
    .podcast-title {
      color: rgb(var(--podcast-card));
    }
  }
}
</style>
