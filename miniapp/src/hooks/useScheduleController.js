import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseIdSchedule, parseSchedule } from "../methods/parse/parseSchedule";
import {
  STORAGE_KEY,
  buildWeekDays,
  formatCountdownLabel,
  formatWeekRange,
  normalizeLesson,
  toISODate,
} from "../methods/schedule/scheduleUtils";

const SEARCH_DEBOUNCE_MS = 250;

const useScheduleController = () => {
  const todayWeek = useMemo(() => buildWeekDays(0), []);
  const todayIso = useMemo(() => toISODate(new Date()), []);
  const initialIndex = useMemo(() => {
    const idx = todayWeek.findIndex((day) => day.iso === todayIso);
    return idx === -1 ? 0 : idx;
  }, [todayWeek, todayIso]);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(initialIndex);
  const weekDays = useMemo(() => buildWeekDays(weekOffset), [weekOffset]);

  useEffect(() => {
    setSelectedDayIndex((prev) =>
      Math.min(Math.max(prev, 0), weekDays.length - 1)
    );
  }, [weekDays]);

  const activeDay = weekDays[selectedDayIndex] ?? weekDays[0];
  const activeIso = activeDay?.iso;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSubmittingSearch, setIsSubmittingSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [lessonsCache, setLessonsCache] = useState({});
  const searchInputRef = useRef(null);
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
  const isUnmountedRef = useRef(false);
  const isSearchBusy = isSuggesting || isSubmittingSearch;
  const shouldExpandSearch =
    isEditingProfile ||
    isSearchFocused ||
    Boolean(searchQuery.trim()) ||
    searchResults.length > 0;

  const [selectedProfile, setSelectedProfile] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!selectedProfile) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedProfile));
  }, [selectedProfile]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 60000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (isEditingProfile && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isEditingProfile]);

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedProfile) {
      setIsEditingProfile(false);
    }
  }, [selectedProfile]);

  useEffect(() => {
    const query = searchQuery.trim();
    setSearchError("");
    if (query.length < 3) {
      setSearchResults([]);
      setIsSuggesting(false);
      return;
    }
    if (selectedProfile && !isEditingProfile) {
      setSearchResults([]);
      setIsSuggesting(false);
      return;
    }

    let aborted = false;
    const debounceId = setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const results = await parseIdSchedule(query);
        if (aborted) {
          return;
        }
        setSearchResults(results.slice(0, 6));
      } catch (error) {
        if (!aborted) {
          console.error("Schedule suggestion search failed", error);
          setSearchError("Ошибка при поиске расписания");
        }
      } finally {
        if (!aborted) {
          setIsSuggesting(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      aborted = true;
      clearTimeout(debounceId);
    };
  }, [isEditingProfile, searchQuery, selectedProfile]);

  const cacheKey =
    selectedProfile && activeIso
      ? `${selectedProfile.id}:${selectedProfile.type}:${activeIso}`
      : null;

  const cacheEntry = cacheKey ? lessonsCache[cacheKey] : undefined;

  useEffect(() => {
    if (!selectedProfile || !activeIso || !cacheKey) {
      return;
    }
    if (cacheEntry?.status === "ready" || cacheEntry?.status === "loading") {
      return;
    }

    setLessonsCache((prev) => ({
      ...prev,
      [cacheKey]: { status: "loading", data: prev[cacheKey]?.data ?? [] },
    }));

    const load = async () => {
      try {
        const lessonsData = await parseSchedule(
          selectedProfile.id,
          selectedProfile.type,
          activeIso,
          activeIso
        );

        if (isUnmountedRef.current) return;

        if (!Array.isArray(lessonsData)) {
          throw new Error("Неверный ответ от сервиса расписания");
        }

        const normalized = lessonsData
          .map((lesson, index) => normalizeLesson(lesson, activeIso, index))
          .sort((a, b) => (a.startTimestamp ?? 0) - (b.startTimestamp ?? 0));

        if (isUnmountedRef.current) return;

        setLessonsCache((prev) => ({
          ...prev,
          [cacheKey]: { status: "ready", data: normalized },
        }));
      } catch (error) {
        console.error("Schedule request failed", error);
        if (!isUnmountedRef.current) {
          setLessonsCache((prev) => ({
            ...prev,
            [cacheKey]: { status: "error", error },
          }));
        }
      }
    };

    load();
  }, [cacheKey, cacheEntry?.status, selectedProfile, activeIso]);

  const handleSelectProfile = useCallback((profile) => {
    setSelectedProfile(profile);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    setIsSearchFocused(false);
    setIsSuggesting(false);
    setIsSubmittingSearch(false);
    setIsEditingProfile(false);
    setLessonsCache({});
  }, []);

  const handleSearch = useCallback(
    async (event) => {
      event.preventDefault();
      const query = searchQuery.trim();
      if (selectedProfile && !isEditingProfile) {
        return;
      }
      if (query.length < 3) {
        setSearchError("Введите минимум 3 символа");
        return;
      }

      try {
        setIsSubmittingSearch(true);
        setSearchError("");
        const results = await parseIdSchedule(query);
        setSearchResults(results.slice(0, 6));
        if (!results.length) {
          setSearchError("Ничего не найдено");
          return;
        }

        const exactMatch =
          results.find(
            (result) => result.label.toLowerCase() === query.toLowerCase()
          ) || results[0];

        handleSelectProfile(exactMatch);
      } catch (error) {
        console.error("Schedule search failed", error);
        setSearchError("Ошибка при поиске расписания");
      } finally {
        setIsSubmittingSearch(false);
      }
    },
    [handleSelectProfile, isEditingProfile, searchQuery, selectedProfile]
  );

  const handleEnterEditMode = useCallback(() => {
    setIsEditingProfile(true);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    setIsSearchFocused(false);
  }, []);

  const handleWeekChange = useCallback((step) => {
    setWeekOffset((prev) => prev + step);
  }, []);

  const handleDaySelect = useCallback((index) => {
    setSelectedDayIndex(index);
  }, []);

  const handleQueryChange = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  const handleSearchFocusChange = useCallback((isFocused) => {
    setIsSearchFocused(isFocused);
  }, []);

  const hasProfile = Boolean(selectedProfile);
  const isLoadingLessons = cacheEntry?.status === "loading";
  const lessons = useMemo(() => cacheEntry?.data ?? [], [cacheEntry]);

  const nextLessonInfo = useMemo(() => {
    if (!lessonsCache) {
      return null;
    }

    let candidate = null;
    Object.entries(lessonsCache).forEach(([key, entry]) => {
      if (!entry || entry.status !== "ready" || !Array.isArray(entry.data)) {
        return;
      }

      entry.data.forEach((lesson) => {
        const startTs =
          typeof lesson.startTimestamp === "number" &&
          Number.isFinite(lesson.startTimestamp)
            ? lesson.startTimestamp
            : null;
        const endTs =
          typeof lesson.endTimestamp === "number" &&
          Number.isFinite(lesson.endTimestamp)
            ? lesson.endTimestamp
            : null;
        if (startTs === null) {
          return;
        }
        const isCurrent =
          endTs !== null && nowTimestamp >= startTs && nowTimestamp <= endTs;
        const isPast = !isCurrent && endTs !== null && nowTimestamp > endTs;
        if (isCurrent || isPast) {
          return;
        }
        if (!candidate || startTs < candidate.startTimestamp) {
          candidate = {
            cacheKey: key,
            lessonId: lesson.id,
            startTimestamp: startTs,
          };
        }
      });
    });

    return candidate;
  }, [lessonsCache, nowTimestamp]);

  const preparedLessons = useMemo(() => {
    if (!lessons.length) {
      return [];
    }

    const annotated = lessons.map((lesson) => {
      const startTs =
        typeof lesson.startTimestamp === "number" &&
        Number.isFinite(lesson.startTimestamp)
          ? lesson.startTimestamp
          : null;
      const endTs =
        typeof lesson.endTimestamp === "number" &&
        Number.isFinite(lesson.endTimestamp)
          ? lesson.endTimestamp
          : null;

      const isCurrent =
        startTs !== null &&
        endTs !== null &&
        nowTimestamp >= startTs &&
        nowTimestamp <= endTs;
      const isPast =
        !isCurrent && endTs !== null && nowTimestamp > endTs ? true : false;

      return {
        ...lesson,
        isCurrent,
        isPast,
        countdownLabel: "",
      };
    });

    const upcomingIndex = annotated.findIndex(
      (lesson) =>
        nextLessonInfo &&
        cacheKey &&
        nextLessonInfo.cacheKey === cacheKey &&
        nextLessonInfo.lessonId === lesson.id
    );

    if (upcomingIndex === -1) {
      return annotated;
    }

    return annotated.map((lesson, index) =>
      index === upcomingIndex
        ? {
            ...lesson,
            countdownLabel: formatCountdownLabel(
              (lesson.startTimestamp ?? 0) - nowTimestamp
            ),
          }
        : lesson
    );
  }, [cacheKey, lessons, nextLessonInfo, nowTimestamp]);

  const weekRangeLabel = useMemo(() => formatWeekRange(weekDays), [weekDays]);

  return {
    weekDays,
    weekOffset,
    selectedDayIndex,
    handleDaySelect,
    handleWeekChange,
    weekRangeLabel,
    selectedProfile,
    isEditingProfile,
    handleEnterEditMode,
    shouldExpandSearch,
    searchInputRef,
    searchQuery,
    handleQueryChange,
    isSearchBusy,
    handleSearch,
    searchError,
    searchResults,
    handleSelectProfile,
    handleSearchFocusChange,
    hasProfile,
    isLoadingLessons,
    hasError: cacheEntry?.status === "error",
    isReady: cacheEntry?.status === "ready",
    lessons,
    preparedLessons,
  };
};

export default useScheduleController;
