const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const joinByStartTime = (data) => {
  const grouped = Object.values(
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
      acc[key].urls.push(...urls);

      return acc;
    }, {})
  );

  return grouped;
};

// Поиск по ключу
const parseIdSchedule = async (string) => {
  try {
    const response = await fetch(`https://ruz.fa.ru/api/search?term=${string}`);
    const data = await response.json();
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
  } catch (e) {
    throw e;
  }
};

// Получение расписания
const parseSchedule = async (id, type, startTime, endTime) => {
  try {
    const response = await fetch(
      `https://ruz.fa.ru/api/schedule/${type}/${id}?start=${startTime}&finish=${endTime}&lng=1`
    );
    const data = await response.json();

    const neededData = data.map((item) => ({
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
    return joinByStartTime(neededData);
  } catch (e) {
    throw e;
  }
};

// Proxy endpoint for search to avoid CORS issues on the client
app.get("/api/schedule/search", async (req, res) => {
  const { term } = req.query;

  if (!term) {
    return res.status(400).send({ error: "Параметр term обязателен" });
  }

  try {
    const searchResponse = await parseIdSchedule(term);
    res.json(searchResponse);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Alias endpoint compatible with RUZ: /api/search?term=...&type=...
app.get("/api/search", async (req, res) => {
  const { term, type } = req.query;

  if (!term) {
    return res.status(400).send({ error: "Параметр term обязателен" });
  }

  try {
    let results = await parseIdSchedule(term);

    if (type) {
      const requestedTypes = type
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      if (requestedTypes.length > 0) {
        results = results.filter((item) =>
          requestedTypes.includes((item.type || "").toLowerCase())
        );
      }
    }

    res.json(results);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Endpoint to fetch schedule by a specific profile ID/type (query params)
app.get("/api/schedule", async (req, res) => {
  const { profileId, profileType } = req.query;
  const start = req.query.start || req.query.startTime;
  const end = req.query.end || req.query.finish || req.query.endTime;

  if (!profileId || !profileType || !start || !end) {
    return res.status(400).send({
      error:
        "Параметры profileId, profileType и даты (start/end или startTime/endTime или start/finish) обязательны",
    });
  }

  try {
    const schedule = await parseSchedule(profileId, profileType, start, end);
    res.json(schedule);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Endpoint compatible with original RUZ path style: /api/schedule/group/:id?start&finish
app.get("/api/schedule/:profileType/:profileId", async (req, res) => {
  const { profileId, profileType } = req.params;
  const start = req.query.start || req.query.startTime;
  const end = req.query.finish || req.query.end || req.query.endTime;

  if (!profileId || !profileType || !start || !end) {
    return res.status(400).send({
      error:
        "Параметры profileId, profileType и даты (start & finish) обязательны",
    });
  }

  try {
    const schedule = await parseSchedule(profileId, profileType, start, end);
    res.json(schedule);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.get("/api/news", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send({ error: "Параметр url обязателен" });
  }

  try {
    const response = await fetch(url);
    const html = await response.text();
    res.send({ html });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.get("/api/calendar", async (req, res) => {
  const { from, to } = req.query;

  try {
    const response = await fetch(
      `https://www.fa.ru/ajax/events-all.php?iblock=2&block=29137&date-from=${from}&date-to=${to}`
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .send({ error: "Ошибка загрузки данных" });
    }

    const html = await response.text();
    res.send(html); // верни просто HTML, не { html }
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.listen(4000, () => console.log("Server running on port 4000"));
