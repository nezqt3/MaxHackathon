// Получение актуальных новостей с fa.ru

export const getNews = async () => {
  try {
    const response = await fetch("https://www.fa.ru/university/press-center/");
    const html = await response.text();

    const regex =
      /<a[^>]*class="news-card__link"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<h[1-9][^>]*class="news-card__title"[^>]*>([\s\S]*?)<\/h[1-9]>/g;

    const news = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      const href = match[1].startsWith("http")
        ? match[1]
        : `https://www.fa.ru${match[1]}`;
      const img = match[2].startsWith("http")
        ? match[2]
        : `https://www.fa.ru${match[2]}`;
      const title = match[3].replace(/<[^>]+>/g, "").trim();

      news.push({ title, url: href, img });
    }

    return news;
  } catch (e) {
    return e;
  }
};

export const getNewsContent = async (url) => {
  try {
    const response = await fetch(url);
    const html = await response.text();

    const regex =
      /<section[^>]*class="app-section _is-slim _gutter-md"[^>]*>([\s\S]*?)<\/section>/i;

    const match = html.match(regex);

    if (!match) return null;

    const sectionHtml = match[1];

    const text = sectionHtml
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return text;
  } catch (e) {
    console.error("Ошибка при парсинге контента:", e);
    return null;
  }
};
