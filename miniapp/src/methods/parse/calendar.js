export async function getCalendar(from, to) {
  try {
    const res = await fetch(
      `http://localhost:4000/api/calendar?from=${from}&to=${to}`,
      {
        method: "GET",
        headers: {
          Accept: "*/*",
          "HX-Request": "true",
          "HX-Target": "event-block",
          Referer: "https://www.fa.ru/for-students/student-science/events/",
        },
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // --- Разбор HTML регулярками ---
    const eventRegex = /<article class="event-card">([\s\S]*?)<\/article>/g;
    const titleRegex = /<h4 class="event-card__title">(.*?)<\/h4>/;
    const dateRegex =
      /<div class="ui-links__label">Дата проведения<\/div>\s*<time[^>]*>(.*?)<\/time>/;
    const timeRegex =
      /<div class="ui-links__label">Время проведения<\/div>\s*<time[^>]*>(.*?)<\/time>/;
    const placeRegex = /<address class="ui-links__link">(.*?)<\/address>/;

    const events = [];
    let match;
    while ((match = eventRegex.exec(html)) !== null) {
      const block = match[1];
      const title = (titleRegex.exec(block)?.[1] || "").trim();
      const date = (dateRegex.exec(block)?.[1] || "").trim();
      const time = (timeRegex.exec(block)?.[1] || "").trim();
      const place = (placeRegex.exec(block)?.[1] || "").trim();
      events.push({ title, date, time, place });
    }

    console.log(events);
    return events;
  } catch (err) {
    console.error("Ошибка запроса или парсинга:", err);
  }
}
