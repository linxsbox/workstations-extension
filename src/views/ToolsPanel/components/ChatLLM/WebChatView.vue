<script setup>
import { NInput, NScrollbar, NPopconfirm, useMessage } from "naive-ui";
import DOMPurify from "dompurify";
import { defaultStorage, clipboard, eventListener } from "@linxs/toolkit";
import IconArrowCircleUp from "@/components/Icons/IconArrowCircleUp.vue";
import IconDelete from "@/components/Icons/IconDelete.vue";
import { renderMarkdown } from "@/utils/markdown";

const message = useMessage();
const { localStorage } = defaultStorage();

const messages = ref([]);
const chatInput = ref("");
const chatInputRef = ref(null);
const scrollRef = ref(null);
const messagesRef = ref(null);
const isLoading = ref(false);
const isDisabled = ref(false);

const chatInputTrimmed = computed(() => chatInput.value.trim());

// 发送消息
const sendMessage = async () => {
  // 阻止默认的换行行为
  event.preventDefault();
  if (!chatInput.value.trim()) {
    return;
  }
  messages.value.push({ role: "user", content: chatInput.value.trim() });
  chatInput.value = ""; // Clear input after sending

  await fetchModelApi();
};

// 处理换行 shift + enter
const handleNewline = (event) => {
  // // 在光标处插入换行符
  // const textarea = event.target;
  // const start = textarea.selectionStart;
  // const end = textarea.selectionEnd;
  // const value = textarea.value;

  // textarea.value = value.substring(0, start) + "\n" + value.substring(end);

  // // 移动光标到换行符之后
  // textarea.selectionStart = textarea.selectionEnd = start + 1;

  // 阻止默认的换行行为
  event.preventDefault();
};

const handleFocus = () => {
  chatInputRef.value.focus();
};

const toScrollBottom = () => {
  scrollRef.value.scrollTo({
    top: document.querySelector(".chat-history-container").offsetHeight,
    behavior: "smooth",
  });
};
// 请求模型
const fetchModelApi = async (initRole) => {
  const msg = initRole ? [initRole] : messages.value;

  isLoading.value = true;
  toScrollBottom();
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.get("APIKEYS")?.DeepSeekAPIKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: msg,
        stream: false,
      }),
    });

    const completion = await res.json();

    messages.value.push({
      role: "assistant",
      content: completion.choices[0].message.content,
    });

    localStorage.set("SpongeBobChat", messages.value);

    nextTick(() => {
      toScrollBottom();
    });
  } catch (error) {
    message.error(error.message);
  } finally {
    isLoading.value = false;
  }
};

// 初始化
const initChat = async () => {
  await fetchModelApi({
    role: "system",
    content: `You will play the role of SpongeBob SquarePants, a helpful and enthusiastic friend. Your responses should:
1. Reflect SpongeBob's cheerful and optimistic personality.
2. Be written in Chinese.
3. Embody his caring and eager-to-help nature.
4. Use language that is energetic, positive, and slightly naive.
5. Respond as if you're always excited to assist and make the conversation fun and engaging.`,
  });
};

// 新的神奇海螺
const handleNewChat = () => {
  isDisabled.value = true;
  chatInput.value = "";
  localStorage.set("SpongeBobChat", "");
  message.warning("神奇海螺正在消失！");

  const timer = setTimeout(async () => {
    messages.value = [];
    await initChat();
    isDisabled.value = false;
    message.success("新的神奇海螺出现啦！");
    clearTimeout(timer);
  }, 2000);
};

const initCodeCopyHandler = () => {
  eventListener(document.querySelector(".chat-history"), "click", (event) => {
    // 使用 closest 方法精确找到目标元素
    const copyButton = event.target.closest(".code-copy.md-code-copy-button");

    if (copyButton) {
      // 找到对应的代码块
      const codeBlock = copyButton.closest(".code-wrapper");

      // 获取代码内容
      const codeElement = codeBlock.querySelector("pre code");
      const code = codeElement.textContent;

      // 复制代码
      clipboard({
        data: code,
        success: () => message.success("代码已复制"),
        error: () => message.error("复制失败"),
      });
    }
  });
};

onMounted(() => {
  if (!localStorage.get("APIKEYS")?.DeepSeekAPIKey) {
    message.error(
      "请先设置 DeepSeek API Key，设置 -> 高级设置 -> DeepSeek API Key"
    );
    isDisabled.value = true;
    return;
  }
  isDisabled.value = false;
  initCodeCopyHandler();
  const isChat = localStorage.get("SpongeBobChat");
  if (isChat && isChat.length) {
    messages.value = isChat;
    return;
  }
  initChat();
});

const AsyncRenderHtml = (content) =>
  defineAsyncComponent({
    loader: () =>
      new Promise(async (resolve) => {
        const md = await renderMarkdown(content || "");

        resolve({
          render: () =>
            h("div", {
              class: "we-markdown",
              innerHTML: DOMPurify.sanitize(md),
            }),
        });
      }),
    onError(error, retry, fail, attempts) {
      if (attempts < 3) {
        retry(); // 重试加载
      } else {
        fail(); // 放弃加载
      }
    },
  });
</script>

<template>
  <div class="chat-container">
    <NScrollbar
      ref="scrollRef"
      class="chat-history"
      content-class="chat-history-container flex flex-col gap-4"
    >
      <div
        ref="messagesRef"
        :class="[
          'chat-message flex w-full',
          msg.role === 'user' ? 'justify-end' : '',
        ]"
        :key="index"
        v-for="(msg, index) in messages"
      >
        <div
          class="user-message max-w-3/4 p-2 text-[var(--text-color-3)] rounded-md bg-[var(--interactive-bg-active-1)] whitespace-pre-line"
          v-if="msg.role === 'user'"
        >
          {{ msg.content }}
        </div>

        <template v-else>
          <component
            :is="AsyncRenderHtml(msg.content)"
            class="bot-message w-3/4 p-2"
          ></component>
        </template>
      </div>

      <div class="loading-container px-2" v-if="isLoading">
        <div class="loader">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </NScrollbar>

    <div
      :class="[
        'input-container m-2 rounded-md',
        isDisabled ? 'opacity-85 cursor-not-allowed' : '',
      ]"
    >
      <NInput
        v-model:value="chatInput"
        ref="chatInputRef"
        class="chat-input"
        type="textarea"
        maxlength="2048"
        :autosize="{ minRows: 3, maxRows: 6 }"
        :placeholder="
          isDisabled ? '正在寻找新的神奇海螺...' : '让我们问问神奇海螺吧...'
        "
        :disabled="isDisabled"
        :resize="false"
        @keyup.enter.exact="sendMessage"
        @keyup.shift.enter="handleNewline"
      />
      <div class="flex justify-between items-center gap-2 px-2 py-1">
        <div class="flex items-center gap-2">
          <NPopconfirm
            positive-text="确定"
            negative-text="取消"
            @positive-click.stop="handleNewChat"
          >
            和新的神奇海螺聊聊？
            <template #trigger>
              <IconDelete class="text-xl cursor-pointer" />
            </template>
          </NPopconfirm>
        </div>
        <div class="flex items-center gap-2">
          <IconArrowCircleUp
            :class="[
              'send-icon text-2xl cursor-pointer',
              chatInputTrimmed.length > 0
                ? 'text-[var(--text-secondary)] hover:text-[var(--color-success)]'
                : 'text-[var(--interactive-bg-active-1)] cursor-not-allowed',
            ]"
            @click="sendMessage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #ccc;
}

.input-container {
  background-color: var(--ui-common-bg);
  box-shadow: 0px 0px 6px 3px rgb(137, 137, 137, 0.35);

  .chat-input {
    --n-color: transparent !important;
    --n-color-focus: transparent !important;
    --n-color-disabled: transparent !important;
    --n-box-shadow-focus: none !important;
    --n-border: 1ps solid transparent !important;
    --n-border-hover: 1px solid transparent !important;
    --n-border-focus: 1px solid transparent !important;
    --n-border-disabled: 1px solid transparent !important;
  }

  .send-icon {
    transition: color 0.2s;
  }
}

.loading-container {
  .loader {
    display: flex;
    gap: 10px;

    & > div {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: var(--text-secondary);
      animation: breathe 1.75s ease-in-out infinite;
    }

    & > div:nth-child(1) {
      animation-delay: 0s;
    }

    & > div:nth-child(2) {
      animation-delay: 0.25s;
    }

    & > div:nth-child(3) {
      animation-delay: 0.45s;
    }
  }

  @keyframes breathe {
    0%,
    100% {
      opacity: 0.5;
      transform: scale(0.85);
    }

    50% {
      opacity: 1;
      transform: scale(1);
    }
  }
}
</style>

<style lang="scss" scoped src="@/assets/markdown.scss"></style>
