import { isArray } from "@linxs/toolkit";
import http from '@/utils/http';

// GitHub JSON 文件链接的正则表达式
const githubJsonUrlRegex =
  /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w-]+\/blob\/[\w-]+\/.*\.json$/i;
const githubVueUrlRegex =
  /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w-]+\/blob\/[\w-]+\/.*\.vue$/i;

// 验证函数
function isValidGitHubJsonUrl(url) {
  return githubJsonUrlRegex.test(url);
}

/**
 * 导入分组数据 - 从 GitHub 导入
 * @param {string} url github 文件链接
 * @returns
 */
export const importDataForGithub = async function (url, isJson = true) {
  if (isJson && !isValidGitHubJsonUrl(url)) {
    return { isError: true, message: "无效的 GitHub JSON 文件链接" };
  } else if (!isJson && !githubVueUrlRegex.test(url)) {
    return { isError: true, message: "无效的 GitHub Vue 文件链接" };
  }

  try {
    const scriptRegex =
      /<script\s+type="application\/json" data-target="react-app.embeddedData">\s*([\s\S]+?)\s*<\/script>/;

    const text = await http.get(url);

    const matchTxt = text.match(scriptRegex);
    if (matchTxt.length < 2) {
      return { isError: true, message: "不是有效的数据格式，无法进行解析" };
    }

    const dataJSON = JSON.parse(matchTxt[1]);
    const isContent =
      dataJSON.payload &&
      dataJSON.payload.blob &&
      dataJSON.payload.blob.rawLines;

    if (!(isContent && isArray(dataJSON.payload.blob.rawLines))) {
      return { isError: true, message: "不是有效的数据格式，无法进行解析" };
    }

    const jsonContent = dataJSON.payload.blob.rawLines.join("\n");
    return { isError: false, message: jsonContent };
  } catch (error) {
    console.error("数据导入失败:", error);
    return { isError: true, message: "数据导入失败，请检查链接或数据格式问题" };
  }
};
