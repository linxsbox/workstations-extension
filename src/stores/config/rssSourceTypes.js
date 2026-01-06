import { rmSecAndZone, timeBefore } from "@/utils/time";
import {
  hex2rgb,
  image2Base64,
  getNodeTextContent,
  parseXML,
} from "@linxs/toolkit";
import { storageManager, STORAGE_KEYS } from "../storage";

const dataType = ["播客", "IT资讯", "新闻资讯"];
export const rssGroupType = Object.freeze({
  xiaoyuzhoufm: "xiaoyuzhoufm",
  ITinfo: "ITinfo",
});

const setCacheImage = async (id, url) => {
  let imgData = storageManager.get(STORAGE_KEYS.CACHE_IMAGE) || {};

  if (!imgData[id]) {
    const imgBase64 = await image2Base64(url);
    imgData[id] = imgBase64;
    storageManager.set(STORAGE_KEYS.CACHE_IMAGE, imgData);
  }

  return imgData[id];
};

export default [
  {
    id: "xiaoyuzhoufm",
    label: "小宇宙",
    isRss: false,
    type: dataType[0],
    group: rssGroupType.xiaoyuzhoufm,
    interval: { min: 10 },
    home: "https://www.xiaoyuzhoufm.com/",
    apis: {
      list: "https://www.xiaoyuzhoufm.com/podcast/",
      details: "https://www.xiaoyuzhoufm.com/episode/",
      media: "https://media.xyzcdn.net/",
    },
    recommend: [
      { title: "肥话连篇", id: "61d50d72ee197a3aac3dac42" },
      { title: "高能量", id: "62c6ae08c4eaa82b112b9c84" },
      { title: "GQ Talk", id: "5e280faa418a84a0461f9e09" },
      { title: "商业WHY酱", id: "61315abc73105e8f15080b8a" },
      { title: "纵横四海", id: "62694abdb221dd5908417d1e" },
      { title: "乱翻书", id: "61358d971c5d56efe5bcb5d2" },
    ],
    dataMatch: async (data) => {
      const jsonMathc =
        /<script\s+id="__NEXT_DATA__"\s+type="application\/json">\s*([\s\S]+)\s*<\/script>/;

      const dataList = data.recommend;

      let serverTime = 0;
      const tmpList = [];

      try {
        for (let index = 0; index < dataList.length; index++) {
          const item = dataList[index];

          const res = await fetch(`${data.apis.list}${item.id}`);
          if (res.status !== 200) return;

          if (!serverTime) serverTime = new Date(res.headers.get("Date"));

          const matchTxt = jsonMathc.exec(await res.text());
          if (matchTxt.length < 2) return;

          const dataJSON = JSON.parse(matchTxt[1]);

          const { title, brief, episodes, image, color, podcasters } =
            dataJSON.props?.pageProps?.podcast || {};

          const list = (episodes || []).map((item) => ({
            title: item.title,
            description: item.description,
            mediaUrl: item.enclosure.url,
            link: `${data.apis.details}${item.eid}`,
            duration: item.duration, // 存储原始秒数
            timeAgo: timeBefore(+serverTime, item.pubDate),
          }));

          const author = podcasters.map((item) => item.nickname).join("、");

          const { r, g, b } = hex2rgb(color.original);

          const imgBase64 = await setCacheImage(item.id, image.smallPicUrl);

          tmpList.push({
            title,
            author,
            brief,
            list,
            image: imgBase64,
            id: item.id,
            color: {
              ...color,
              themeRGB: `${[r, g, b]}`,
            },
          });
        }

        return tmpList;
      } catch (error) {
        console.log(error);
        return [];
      }
    },
  },
  {
    id: "36kr",
    label: "36 氪",
    isRss: true,
    type: dataType[1],
    group: rssGroupType.ITinfo,
    interval: { min: 10 },
    home: "https://36kr.com/",
    apis: {
      list: "https://36kr.com/feed-article",
    },
    recommend: [],
    dataMatch: async (xmlData, data) => {
      const res = parseXML(xmlData);
      if (!res) return {};

      const tempList = [];

      (res.list || []).forEach((item) => {
        const title = getNodeTextContent(item, "title");
        const description = getNodeTextContent(item, "summary");
        const author = getNodeTextContent(item, "author");
        const pubDate = rmSecAndZone(getNodeTextContent(item, "pubDate"));
        const link = getNodeTextContent(item, "link");

        tempList.push({ title, description, author, pubDate, link });
      });

      res.image = "";
      res.home = data.home;
      return { ...res, list: tempList };
    },
  },
  {
    isRss: true,
    id: "itjuzi",
    label: "IT 桔子",
    isRss: true,
    type: dataType[1],
    group: rssGroupType.ITinfo,
    interval: { min: 30 },
    home: "https://www.itjuzi.com/",
    apis: {
      list: "https://www.itjuzi.com/api/telegraph.xml",
    },
    recommend: [],
    dataMatch: async (xmlData, data) => {
      const res = parseXML(xmlData);
      if (!res) return {};

      const tempList = [];

      (res.list || []).forEach((item) => {
        const title = getNodeTextContent(item, "title");
        const txt = getNodeTextContent(item, "description");
        const end = txt.indexOf("。");
        const str = txt.substring(0, end + 1);
        const description =
          end != -1 && str.length < 32 ? str : txt.substring(0, 32);
        const author = res.title;
        const pubDate = rmSecAndZone(getNodeTextContent(item, "pubDate"));
        const link = getNodeTextContent(item, "link");

        tempList.push({ title, description, author, pubDate, link });
      });

      const imgBase64 = await setCacheImage(data.id, res.image);

      res.image = imgBase64;
      return { ...res, list: tempList };
    },
  },
];


  // fetch(`https://getpodcast.xyz/`).then(async (res) => {
  //   console.log();

  //   const parser = new DOMParser();
  //   const xmlDoc = parser.parseFromString(await res.text(), "text/html");
  //   console.log(xmlDoc);
  //   xmlDoc.querySelectorAll(".pic_list").forEach((item) => {
  //     item.querySelectorAll("li").forEach((liItem) => {
  //       try {
  //         console.log(
  //         liItem.querySelector(".title").textContent,
  //         liItem.querySelector("a").href,
  //         liItem.querySelector("img").src
  //       );
  //       }catch (error) {
  //         console.log(liItem);
  //       }
  //     });
  //   });
  // });
  // fetch(`  https://ask.xiaoyuzhoufm.com/api/keyword/search`,{
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ query: "1" }),
  // }).then(async (res) => {
  //   console.log(await res.json());
  // })