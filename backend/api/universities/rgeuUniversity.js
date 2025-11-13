const { fetchText } = require("./methods/usefulMethods");

const UNIVERSITY_ID = "rgeu-university";
const TITLE = "Ростовский государственный экономический университет (РИНХ)";
const BASE_URL = "https://rsue.ru";

const getScheduleRgeu = async ({ groupLabel, profileType, start, end }) => {
  const response = await fetch(
    `https://rasp-api.rsue.ru/api/v1/schedule/lessons/${encodeURIComponent(
      groupLabel
    )}/`
  );

  if (!response.ok) {
    throw new Error(`Ошибка загрузки расписания: ${response.status}`);
  }

  const data = await response.json();

  return data;
};

const searchSchedule = async (group) => {
  try {
    const response = await fetch(
      "https://rasp-api.rsue.ru/api/v1/schedule/search/"
    );
    const data = await response.json();

    return data
      .filter((elem) => elem.name.toLowerCase().includes(group.toLowerCase()))
      .map((item) => ({
        id: item.id,
        label: item.name,
        description: "",
        type: "schedule",
        guid: item.id,
        isCombined: item.name.includes(";"),
      }));
  } catch (error) {
    console.error("Ошибка при поиске расписания:", error);
    return [];
  }
};

const getNewsRgeu = async () => {
  const response = await fetch(`${BASE_URL}/universitet/novosti/`);
  if (!response.ok) throw new Error("Не удалось получить страницу новостей");

  const html = await response.text();

  const newsBlocks = html.split('<div class="news-item">').slice(1);

  const news = newsBlocks
    .map((block) => {
      const dateMatch = block.match(
        /<div[^>]+id="news-date"[^>]*>\s*([^<]+)\s*<\/div>/
      );
      const date = dateMatch ? dateMatch[1].trim() : null;

      const titleMatch = block.match(
        /<div[^>]+id="news-title"[^>]*>\s*<a href="([^"]+)">([\s\S]*?)<\/a>/
      );
      const url = titleMatch ? BASE_URL + titleMatch[1] : null;
      const title = titleMatch
        ? titleMatch[2].replace(/\s+/g, " ").trim()
        : null;

      const imgMatch = block.match(
        /<div[^>]+id="news-image"[^>]*>[\s\S]*?<img src="([^"]+)"/
      );
      const img = imgMatch ? BASE_URL + imgMatch[1] : null;

      if (url && title) {
        return { url, title, img, date };
      }
      return null;
    })
    .filter(Boolean);

  return news;
};

const getNewsContent = async (url) => {
  if (!url) throw new Error("Missing url");

  const html = await fetchText(url);

  const match = html.match(
    /<div[^>]+id=["']text-news["'][^>]*>([\s\S]*?)<\/div>/i
  );

  if (!match) {
    console.warn("Контент новости не найден на странице:", url);
    return "";
  }

  const sectionHtml = match[1];

  const paragraphs = Array.from(
    sectionHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)
  )
    .map((p) =>
      p[1]
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);

  return paragraphs.join("\n\n");
};

const getNewsList = async () => {
  return getNewsRgeu();
};

const getSchedule = async (params) => {
  return getScheduleRgeu(params);
};

module.exports = {
  id: UNIVERSITY_ID,
  title: TITLE,
  shortTitle: "РГЭУ (РИНХ)",
  domain: "rsue.ru",
  getNewsList,
  getSchedule,
  searchSchedule,
  getNewsContent,
  getCalendar: async () => [],
  getDeanOfficeBids: async () => [],
  getLibraryResources: async () => [],
};
