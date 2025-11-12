const express = require("express");
const cors = require("cors");
const {
  UNIVERSITIES,
  DEFAULT_UNIVERSITY_ID,
  getUniversityById,
} = require("./universities");

const app = express();
app.use(cors());
app.use(express.json());

const resolveUniversity = (req) =>
  req.params.universityId || req.query.universityId || DEFAULT_UNIVERSITY_ID;

const withUniversity = (handler) => async (req, res) => {
  const universityId = resolveUniversity(req);
  const university = getUniversityById(universityId);

  if (!university) {
    return res.status(404).json({ error: "Вуз не найден" });
  }

  try {
    await handler(req, res, university, universityId);
  } catch (error) {
    console.error(`University handler failed for ${universityId}`, error);
    res
      .status(500)
      .json({ error: error.message || "Не удалось обработать запрос" });
  }
};

app.get("/api/universities", (req, res) => {
  const list = Object.values(UNIVERSITIES).map(
    ({ id, title, shortTitle, domain }) => ({
      id,
      title,
      shortTitle,
      domain,
    })
  );
  res.json(list);
});

const scheduleSearchHandler = withUniversity(async (req, res, university) => {
  const { term } = req.query;

  if (!term) {
    return res.status(400).json({ error: "Параметр term обязателен" });
  }

  const results = await university.searchSchedule(term);
  res.json(results);
});

app.get("/api/:universityId/schedule/search", scheduleSearchHandler);
app.get("/api/schedule/search", scheduleSearchHandler);

const scheduleHandler = withUniversity(async (req, res, university) => {
  const profileId = req.params.profileId || req.query.profileId;
  const profileType = req.params.profileType || req.query.profileType;
  const start = req.query.start || req.query.startTime;
  const end = req.query.finish || req.query.end || req.query.endTime;

  if (!profileId || !profileType || !start || !end) {
    return res.status(400).json({
      error:
        "Параметры profileId, profileType и даты (start & end) обязательны",
    });
  }

  const schedule = await university.getSchedule(profileId, profileType, start, end);
  res.json(schedule);
});

app.get("/api/:universityId/schedule", scheduleHandler);
app.get("/api/schedule", scheduleHandler);
app.get("/api/:universityId/schedule/:profileType/:profileId", scheduleHandler);

const newsListHandler = withUniversity(async (req, res, university) => {
  const items = await university.getNewsList();
  res.json(items);
});

app.get("/api/:universityId/news", newsListHandler);
app.get("/api/news", newsListHandler);

const newsContentHandler = withUniversity(async (req, res, university) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Параметр url обязателен" });
  }
  const content = await university.getNewsContent(url);
  res.json({ content });
});

app.get("/api/:universityId/news/content", newsContentHandler);
app.get("/api/news/content", newsContentHandler);

const calendarHandler = withUniversity(async (req, res, university) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: "Параметры from и to обязательны" });
  }
  const events = await university.getCalendar(from, to);
  res.json(events);
});

app.get("/api/:universityId/calendar", calendarHandler);
app.get("/api/calendar", calendarHandler);

const deanOfficeHandler = withUniversity(async (req, res, university) => {
  const bids = await university.getDeanOfficeBids();
  res.json(bids);
});

app.get(
  "/api/:universityId/services/dean-office/bids",
  deanOfficeHandler
);
app.get("/api/services/dean-office/bids", deanOfficeHandler);

const libraryHandler = withUniversity(async (req, res, university) => {
  const language = req.query.lang || req.query.language || "rus";
  const resources = await university.getLibraryResources(language);
  res.send(resources);
});

app.get("/api/:universityId/library", libraryHandler);
app.get("/api/library", libraryHandler);

app.listen(4000, () => console.log("Server running on port 4000"));
