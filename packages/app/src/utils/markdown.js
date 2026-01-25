import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

const mdIt = MarkdownIt({
  html: true,
  highlight: function (str, lang) {},
});

mdIt.renderer.rules.fence = function (tokens, idx, options, env, slf) {
  const token = tokens[idx];
  const content = mdIt.utils.escapeHtml(token.content);
  const lang = token.info.trim() || "plaintext";

  const codeBlockBox = `<div class="code-wrapper my-4 text-[var(--text-color)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md overflow-hidden">
  <div class="code-header flex justify-between items-center px-2 py-1 bg-[var(--bg-color)] border-b border-b-[var(--border-color)]">
    <div class="code-lang flex items-center gap-2">
      <span class="code-label text-base">Code Lang: </span>
      <span class="code-lang text-sm text-[var(--text-color-1)]">${lang}</span>
    </div>
    <div class="code-operator flex items-center gap-2">
      <span class="code-copy md-code-copy-button text-sm cursor-pointer active:text-[var(--active-green-color)]">复制</span>
    </div>
  </div>

  <pre class="p-3"><code class="language-${lang} text-ms">${content}</code></pre>
</div>`;

  return codeBlockBox;
};

export const renderMarkdown = async (text = "") => {
  return DOMPurify.sanitize(mdIt.render(text) || "");
};
