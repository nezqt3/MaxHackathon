import { useMemo, useState } from "react";
import { getCalendar } from "../../methods/parse/calendar";
import { useUniversity } from "../../context/UniversityContext.jsx";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAY_IN_MS = 1000 * 60 * 60 * 24;

const formatDateForApi = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
};

const formatHumanDate = (date) => {
  const raw = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(
    date,
  );
  const normalized = raw.replace(/\u00A0/g, " ");
  const [dayPart, monthPart, ...rest] = normalized.split(" ");
  if (monthPart) {
    return `${dayPart} ${monthPart.charAt(0).toUpperCase() + monthPart.slice(1)}${
      rest.length ? ` ${rest.join(" ")}` : ""
    }`.trim();
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getDayDeclension = (count) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if ([2, 3, 4].includes(mod10) && !(mod100 >= 12 && mod100 <= 14)) return "дня";
  return "дней";
};

const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const sanitizeField = (value) =>
  (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const ActivitiesService = () => {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { university } = useUniversity();
  const universityId = university?.apiId || university?.id || null;

  const monthLabel = useMemo(() => {
    const label = new Intl.DateTimeFormat("ru-RU", {
      month: "long",
      year: "numeric",
    })
      .format(viewDate)
      .replace(/\u00A0/g, " ")
      .replace(/\s?г\.$/, "");
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [viewDate]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingDays = (firstDay.getDay() + 6) % 7;
    const result = [];

    for (let i = leadingDays; i > 0; i -= 1) {
      const date = new Date(year, month, 1 - i);
      result.push({ date, isCurrentMonth: false });
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const date = new Date(year, month, day);
      result.push({ date, isCurrentMonth: true });
    }

    const trailingDays = (7 - (result.length % 7)) % 7;
    for (let day = 1; day <= trailingDays; day += 1) {
      const date = new Date(year, month + 1, day);
      result.push({ date, isCurrentMonth: false });
    }

    return result;
  }, [viewDate]);

  const rangeLabel = useMemo(() => {
    if (rangeStart && rangeEnd) {
      return `${formatHumanDate(rangeStart)} — ${formatHumanDate(rangeEnd)}`;
    }

    if (rangeStart && !rangeEnd) {
      return `${formatHumanDate(rangeStart)} · выберите дату окончания`;
    }

    return "Выберите первую дату";
  }, [rangeStart, rangeEnd]);

  const rangeDurationLabel = useMemo(() => {
    if (!rangeStart || !rangeEnd) {
      return null;
    }
    const diff = Math.abs(rangeEnd - rangeStart);
    const days = Math.floor(diff / DAY_IN_MS) + 1;
    return `${days} ${getDayDeclension(days)}`;
  }, [rangeStart, rangeEnd]);

  const handleMonthShift = (shift) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + shift, 1));
  };

  const handleDaySelect = (day) => {
    if (!day.isCurrentMonth) {
      return;
    }

    const pickedDate = new Date(
      day.date.getFullYear(),
      day.date.getMonth(),
      day.date.getDate(),
    );

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(pickedDate);
      setRangeEnd(null);
      return;
    }

    if (!rangeEnd) {
      if (pickedDate < rangeStart) {
        setRangeStart(pickedDate);
      } else if (isSameDay(pickedDate, rangeStart)) {
        setRangeEnd(pickedDate);
      } else {
        setRangeEnd(pickedDate);
      }
    }
  };

  const resetSelection = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setError(null);
    setHasSearched(false);
    setEvents([]);
  };

  const handleSearch = async () => {
    if (!rangeStart || !rangeEnd) {
      return;
    }

    const [fromDate, toDate] =
      rangeStart <= rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart];

    if (!universityId) {
      setError("Выберите вуз, чтобы получить календарь мероприятий.");
      setHasSearched(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await getCalendar(
        universityId,
        formatDateForApi(fromDate),
        formatDateForApi(toDate),
      );

      if (!Array.isArray(response)) {
        throw new Error("Empty response");
      }

      const normalizedEvents = response.map((event) => ({
        ...event,
        title: sanitizeField(event.title),
        date: sanitizeField(event.date),
        time: sanitizeField(event.time),
        place: sanitizeField(event.place),
      }));

      setEvents(normalizedEvents);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить события. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const isDayInRange = (date) => {
    if (!rangeStart || !rangeEnd) {
      return false;
    }
    return date > rangeStart && date < rangeEnd;
  };

  return (
      <div className="activities-service">
        <div className="activities-service__intro">
          <p>
            Выберите месяц и диапазон дат, чтобы увидеть мероприятия кампуса. Мы подсказываем, что
            происходит в выбранный период, чтобы вы могли заранее спланировать визиты.
          </p>
          <div className="activities-service__tags">
            <span>Афиша науки и творчества</span>
            <span>Клубы и кружки</span>
            <span>Регистрация на участие</span>
          </div>
        </div>

        <div className="activities-service__content">
          <div className="activities-calendar">
            <div className="activities-calendar__header">
              <div>
                <p className="activities-calendar__eyebrow">Месяц</p>
                <h4 className="activities-calendar__title">{monthLabel}</h4>
              </div>
              <div className="activities-calendar__nav" aria-label="Навигация по месяцам">
                <button type="button" onClick={() => handleMonthShift(-1)} aria-label="Предыдущий месяц">
                  ←
                </button>
                <button type="button" onClick={() => handleMonthShift(1)} aria-label="Следующий месяц">
                  →
                </button>
              </div>
            </div>

            <div className="activities-calendar__weekdays">
              {WEEKDAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="activities-calendar__grid">
              {calendarDays.map(({ date, isCurrentMonth }) => {
                const isStart = rangeStart && isSameDay(date, rangeStart);
                const isEnd = rangeEnd && isSameDay(date, rangeEnd);
                return (
                  <button
                    type="button"
                    key={`${date.toISOString()}-${isCurrentMonth}`}
                    className={`activities-calendar__day${isCurrentMonth ? "" : " activities-calendar__day--muted"}${
                      isStart ? " activities-calendar__day--start" : ""
                    }${isEnd ? " activities-calendar__day--end" : ""}${
                      isDayInRange(date) ? " activities-calendar__day--in-range" : ""
                    }`}
                    onClick={() => handleDaySelect({ date, isCurrentMonth })}
                    disabled={!isCurrentMonth}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="activities-calendar__footer">
              <div>
                <p className="activities-calendar__selection">{rangeLabel}</p>
                {rangeDurationLabel && (
                  <p className="activities-calendar__duration">{rangeDurationLabel}</p>
                )}
              </div>
              <div className="activities-calendar__actions">
                <button
                  type="button"
                  className="activities-calendar__reset"
                  onClick={resetSelection}
                  disabled={!rangeStart && !rangeEnd && !events.length}
                >
                  Сбросить
                </button>
                <button
                  type="button"
                  className="activities-calendar__submit"
                  onClick={handleSearch}
                  disabled={!rangeStart || !rangeEnd || isLoading}
                >
                  {isLoading ? "Поиск..." : "Найти мероприятия"}
                </button>
              </div>
            </div>
          </div>

          <div className="activities-results">
            <div className="activities-results__header">
              <p className="activities-results__eyebrow">Подборка</p>
              <h4 className="activities-results__title">
                {hasSearched ? `Найдено ${events.length}` : "Ожидаем диапазон"}
              </h4>
              {rangeStart && rangeEnd && (
                <p className="activities-results__subtitle">
                  {formatHumanDate(rangeStart)} — {formatHumanDate(rangeEnd)}
                </p>
              )}
            </div>

            {isLoading && (
              <div className="activities-results__state">
                <span className="activities-spinner" aria-hidden="true" />
                <p>Загружаем события...</p>
              </div>
            )}

            {!isLoading && error && (
              <div className="activities-results__state activities-results__state--error">
                <p>{error}</p>
                <button type="button" onClick={handleSearch}>
                  Повторить запрос
                </button>
              </div>
            )}

            {!isLoading && !error && events.length > 0 && (
              <ul className="activities-results__list">
                {events.map(({ title, date, time, place }, index) => (
                  <li key={`${title}-${date}-${index}`}>
                    <article className="activities-results__item">
                      <h5>{title || "Мероприятие"}</h5>
                      <div className="activities-results__meta">
                        <span>{date || "Дата уточняется"}</span>
                        {time && <span>{time}</span>}
                        {place && <span>{place}</span>}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}

            {!isLoading && !error && hasSearched && events.length === 0 && (
              <div className="activities-results__state">
                <p>В выбранный период событий не нашлось. Попробуйте расширить диапазон.</p>
              </div>
            )}

            {!isLoading && !error && !hasSearched && (
              <div className="activities-results__state">
                <p>Выберите даты на календаре, чтобы увидеть афишу кампуса.</p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default ActivitiesService;
