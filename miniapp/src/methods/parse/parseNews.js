// Получение актуальных новостей с fa.ru

const getNews = async () => {
  try {
    const response = await fetch("https://www.fa.ru/university/press-center/");
    const html = await response.text();

    const regex = /<h[1-9] class="news-card__title">([\s\S]*?)<\/h[1-9]>/g;
    const titles = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      titles.push(match[1].replace(/<[^>]+>/g, "").trim());
    }

    return titles;
  } catch (e) {
    return e;
  }
};

const res = await getNews();
