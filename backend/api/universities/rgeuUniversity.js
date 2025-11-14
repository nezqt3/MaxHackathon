const {
  fetchText,
  parseDMY,
  convertNameOfDay,
} = require("./methods/usefulMethods");

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

  const weeks = data.weeks;
  const pairs = [];

  for (let w = 0; w < weeks.length; w++) {
    const days = weeks[w].days;

    for (let d = 0; d < days.length; d++) {
      const currentDay = days[d];
      const datePair = parseDMY(currentDay.date);

      if (datePair < new Date(start) || datePair > new Date(end)) {
        continue;
      }

      const dayPairs = currentDay.pairs;

      for (let p = 0; p < dayPairs.length; p++) {
        const pair = dayPairs[p];

        console.log(pair.lessons);

        if (pair.lessons.length !== 0) {
          pairs.push({
            auditoriums: [pair.lessons[0].audience],
            beginLesson: pair.startTime,
            endLesson: pair.endTime,
            disciplines: [pair.lessons[0].subject],
            kindOfWorks: [pair.lessons[0].kind.name],
            lecturers: [pair.lessons[0].teacher.name],
            lecturerEmails: ["none"],
            streams: [pair.lessons[0].group],
            groups: [pair.lessons[0].group],
            dayOfWeek: convertNameOfDay(currentDay.name),
            dayOfWeekString: currentDay.name,
            urls: [],
          });
        }
      }
    }
  }

  return pairs;
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
