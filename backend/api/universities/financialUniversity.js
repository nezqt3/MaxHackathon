const UNIVERSITY_ID = "financial-university";
const TITLE = "Финансовый университет при Правительстве РФ";

const ensureAbsoluteUrl = (url, base = "https://www.fa.ru") => {
  if (!url) {
    return "";
  }
  if (/^https?:/i.test(url)) {
    return url;
  }
  return `${base}${url}`;
};

const sanitizeText = (value) =>
  (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const joinByStartTime = (data) =>
  Object.values(
    data.reduce((acc, item) => {
      const key = item.beginLesson;
      if (!acc[key]) {
        acc[key] = {
          beginLesson: item.beginLesson,
          endLesson: item.endLesson,
          dayOfWeek: item.dayOfWeek,
          dayOfWeekString: item.dayOfWeekString,
          auditoriums: [],
          disciplines: [],
          kindOfWorks: [],
          lecturers: [],
          lecturerTitles: [],
          lecturerEmails: [],
          streams: [],
          groups: [],
          urls: [],
        };
      }

      acc[key].auditoriums.push(item.auditorium || "none");
      acc[key].disciplines.push(item.discipline || "none");
      acc[key].kindOfWorks.push(item.kindOfWork || "none");
      acc[key].lecturers.push(item.lecturer || "none");
      acc[key].lecturerTitles.push(item.lecturer_title || "none");
      acc[key].lecturerEmails.push(item.lecturerEmail || "none");
      acc[key].streams.push(item.stream || "none");
      acc[key].groups.push(item.group || "none");

      const urls = [];
      urls.push({
        url: item.url1 || "none",
        description: item.url1_description || "none",
      });
      urls.push({
        url: item.url2 || "none",
        description: item.url2_description || "none",
      });
      acc[key].urls.push(...urls.filter((entry) => entry.url !== "none"));

      return acc;
    }, {})
  );

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

const fetchText = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
};

const searchSchedule = async (term) => {
  const data = await fetchJson(`https://ruz.fa.ru/api/search?term=${encodeURIComponent(term)}`);
  return data
    .filter((elem) => elem.type !== "lecturer")
    .map((item) => ({
      id: item.id,
      label: item.label,
      type: item.type,
      description: item.description || "",
      guid: item.guid,
      isCombined: item.label.includes(";"),
    }));
};

const getSchedule = async (id, type, startTime, endTime) => {
  const data = await fetchJson(
    `https://ruz.fa.ru/api/schedule/${type}/${id}?start=${startTime}&finish=${endTime}&lng=1`
  );
  const prepared = data.map((item) => ({
    auditorium: item.auditorium,
    beginLesson: item.beginLesson,
    discipline: item.discipline,
    dayOfWeek: item.dayOfWeek,
    dayOfWeekString: item.dayOfWeekString,
    endLesson: item.endLesson,
    kindOfWork: item.kindOfWork,
    lecturer: item.lecturer,
    lecturer_title: item.lecturer_title,
    lecturerEmail: item.lecturerEmail,
    stream: item.stream,
    group: item.group,
    url1: item.url1,
    url1_description: item.url1_description,
    url2: item.url2,
    url2_description: item.url2_description,
  }));
  return joinByStartTime(prepared);
};

const getCalendar = async (from, to) => {
  const html = await fetchText(
    `https://www.fa.ru/ajax/events-all.php?iblock=2&block=29137&date-from=${from}&date-to=${to}`
  );

  const eventRegex = /<article class="event-card">([\s\S]*?)<\/article>/g;
  const titleRegex = /<h4 class="event-card__title">([\s\S]*?)<\/h4>/;
  const dateRegex =
    /<div class="ui-links__label">Дата проведения<\/div>\s*<time[^>]*>([\s\S]*?)<\/time>/;
  const timeRegex =
    /<div class="ui-links__label">Время проведения<\/div>\s*<time[^>]*>([\s\S]*?)<\/time>/;
  const placeRegex = /<address class="ui-links__link">([\s\S]*?)<\/address>/;

  const events = [];
  let match;
  while ((match = eventRegex.exec(html)) !== null) {
    const block = match[1];
    events.push({
      title: sanitizeText(titleRegex.exec(block)?.[1]),
      date: sanitizeText(dateRegex.exec(block)?.[1]),
      time: sanitizeText(timeRegex.exec(block)?.[1]),
      place: sanitizeText(placeRegex.exec(block)?.[1]),
    });
  }

  return events;
};

const getDeanOfficeBids = async () => {
  const html = await fetchText("https://www.fa.ru/university/services/ez/");
  const cardRegex = /<article[^>]*class="page-card-link app-card"[^>]*>([\s\S]*?)<\/article>/g;
  const titleRegex = /<h4[^>]*class="page-card-link__title"[^>]*>([\s\S]*?)<\/h4>/i;
  const urlRegex = /<a[^>]*class="ui-icon-button[^"']*?_primary[^"']*"[^>]*href="([^"]+)"/i;

  const bids = [];
  let match;
  while ((match = cardRegex.exec(html)) !== null) {
    const block = match[1];
    const title = sanitizeText(titleRegex.exec(block)?.[1]);
    const url = ensureAbsoluteUrl(urlRegex.exec(block)?.[1]);
    if (title && url) {
      bids.push({ title, url });
    }
  }

  return bids;
};

const NEWS_FEED_URL = "https://www.fa.ru/university/press-center/";

const getNewsList = async () => {
  const html = await fetchText(NEWS_FEED_URL);
  const newsRegex =
    /<a[^>]*class="news-card__link"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<h[1-6][^>]*class="news-card__title"[^>]*>([\s\S]*?)<\/h[1-6]>/g;

  const news = [];
  let match;
  while ((match = newsRegex.exec(html)) !== null) {
    const href = ensureAbsoluteUrl(match[1]);
    const img = ensureAbsoluteUrl(match[2]);
    const title = sanitizeText(match[3]);
    if (title && href) {
      news.push({ title, url: href, img });
    }
  }
  return news;
};

const getNewsContent = async (url) => {
  if (!url) {
    throw new Error("Missing url");
  }
  const html = await fetchText(url);
  const sectionRegex =
    /<section[^>]*class="app-section _is-slim _gutter-md"[^>]*>([\s\S]*?)<\/section>/i;
  const match = html.match(sectionRegex);
  if (!match) {
    return "";
  }
  const sectionHtml = match[1];
  const normalized = sectionHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|section|article|h[1-6]|li)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  return normalized
    .split("\n")
    .map((line) => sanitizeText(line))
    .filter(Boolean)
    .join("\n\n");
};

const getLibraryResources = async (language = "rus") => {
  const html = await fetchText(`https://library.fa.ru/res_mainres.asp?cat=${language}`);
  return html;
};

module.exports = {
  id: UNIVERSITY_ID,
  title: TITLE,
  shortTitle: "Финуниверситет",
  domain: "fa.ru",
  searchSchedule,
  getSchedule,
  getCalendar,
  getDeanOfficeBids,
  getNewsList,
  getNewsContent,
  getLibraryResources,
};
