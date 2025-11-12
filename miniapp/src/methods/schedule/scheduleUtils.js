export const STORAGE_KEY = "max-miniapp:schedule-profile";
export const getScheduleStorageKey = (universityId) =>
  universityId ? `${STORAGE_KEY}:${universityId}` : STORAGE_KEY;

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const WEEKDAY_SHORT_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
});

const WEEKDAY_LONG_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
});

const WEEKDAY_FULL_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export const toISODate = (date) => {
  if (!(date instanceof Date)) {
    return "";
  }
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  const localTime = date.getTime() - tzOffsetMs;
  return new Date(localTime).toISOString().split("T")[0];
};

export const buildWeekDays = (offset = 0) => {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const diffToMonday = (base.getDay() + 6) % 7;
  const monday = new Date(base);
  monday.setDate(monday.getDate() - diffToMonday + offset * 7);

  const todayIsoString = toISODate(new Date());

  return Array.from({ length: 7 }).map((_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    const iso = toISODate(current);

    return {
      iso,
      labelShort: WEEKDAY_SHORT_FORMAT.format(current).replace(".", ""),
      labelLong: WEEKDAY_LONG_FORMAT.format(current),
      dayNumber: current.getDate(),
      monthNumber: current.getMonth(),
      fullLabel: WEEKDAY_FULL_FORMAT.format(current),
      isToday: iso === todayIsoString,
    };
  });
};

export const formatWeekRange = (days) => {
  if (!days?.length) {
    return "";
  }

  const firstDate = new Date(days[0].iso);
  const lastDate = new Date(days[days.length - 1].iso);
  const firstDay = firstDate.getDate();
  const lastDay = lastDate.getDate();
  const firstMonth = MONTHS_GENITIVE[firstDate.getMonth()];
  const lastMonth = MONTHS_GENITIVE[lastDate.getMonth()];

  if (firstDate.getMonth() === lastDate.getMonth()) {
    return `${firstDay}–${lastDay} ${firstMonth}`;
  }

  return `${firstDay} ${firstMonth} — ${lastDay} ${lastMonth}`;
};

const formatKindLabel = (kind) => {
  const normalized = (kind ?? "").trim();
  if (!normalized) {
    return "";
  }
  if (/лекц/i.test(normalized)) {
    return "Лекция";
  }
  if (/(практ|семинар)/i.test(normalized)) {
    return "Семинар";
  }
  return normalized;
};

const getCommonStreamLabel = (labels = []) => {
  const clean = labels
    .map((label) => (label ?? "").trim())
    .filter(Boolean);
  if (clean.length < 2) {
    return null;
  }
  const sorted = [...clean].sort((a, b) => a.localeCompare(b, "ru"));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  let index = 0;
  while (index < first.length && first[index] === last[index]) {
    index += 1;
  }
  const prefix = first.slice(0, index).trim().replace(/[-_.:/\\]+$/, "");
  if (prefix.length < 3) {
    return null;
  }
  return prefix;
};

const splitLabels = (labels = []) =>
  labels
    .flatMap((label) =>
      (label ?? "")
        .split(/[,;•]/)
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .filter(Boolean);

const buildStreamDisplay = (streamLabels = [], groupLabels = []) => {
  const expandedStreams = splitLabels(streamLabels);
  const expandedGroups = splitLabels(groupLabels);
  const primary = expandedStreams.length > 0 ? expandedStreams : expandedGroups;
  if (primary.length <= 1) {
    return [];
  }
  const common = getCommonStreamLabel(primary);
  if (common) {
    return [common];
  }
  return primary;
};

export const formatCountdownLabel = (msDiff) => {
  if (!Number.isFinite(msDiff) || msDiff <= 0) {
    return "";
  }
  const totalMinutes = Math.max(Math.round(msDiff / 60000), 1);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) {
    return `Через ${hours}ч ${minutes}м`;
  }
  if (hours) {
    return `Через ${hours}ч`;
  }
  return `Через ${minutes}м`;
};

const uniqueValues = (values = []) => {
  const seen = new Set();
  return values
    .map((value) => (value ?? "").toString().trim())
    .filter((value) => value && value.toLowerCase() !== "none")
    .filter((value) => {
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
};

const parseLessonDate = (iso, time) => {
  if (!iso || !time) {
    return null;
  }
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  const date = new Date(`${iso}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const normalizeLesson = (lesson, iso, index) => {
  const uniqueDisciplines = uniqueValues(lesson.disciplines);
  const uniqueKinds = uniqueValues(lesson.kindOfWorks);
  const lecturers = uniqueValues(lesson.lecturers);
  const lecturerTitles = uniqueValues(lesson.lecturerTitles);
  const rooms = uniqueValues(lesson.auditoriums);
  const streamLabels = uniqueValues(lesson.streams);
  const groupLabels = uniqueValues(lesson.groups);
  const urls = (lesson.urls || []).filter(
    (link) => link?.url && link.url !== "none",
  );

  const startDate = parseLessonDate(iso, lesson.beginLesson);
  const endDate = parseLessonDate(iso, lesson.endLesson);
  const startTimestamp = startDate?.getTime() ?? null;
  const endTimestamp = endDate?.getTime() ?? null;

  return {
    id: `${iso}-${lesson.beginLesson}-${lesson.endLesson}-${index}`,
    beginLesson: lesson.beginLesson,
    endLesson: lesson.endLesson,
    title: uniqueDisciplines[0] || "Неизвестный предмет",
    extraDisciplines: uniqueDisciplines.slice(1),
    kindOfWork: formatKindLabel(uniqueKinds[0]),
    lecturers,
    lecturerTitles,
    rooms,
    groups: groupLabels,
    streams: buildStreamDisplay(streamLabels, groupLabels),
    urls,
    isCurrent: false,
    isPast: false,
    countdownLabel: "",
    startTimestamp,
    endTimestamp,
    iso,
  };
};
