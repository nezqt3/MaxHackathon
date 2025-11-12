import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_UNIVERSITY_ID, UNIVERSITIES, UNIVERSITY_MAP } from "../config/universities";

const STORAGE_KEY = "selected-university-id";

const UniversityContext = createContext({
  universities: UNIVERSITIES,
  university: null,
  selectUniversity: () => {},
  clearUniversity: () => {},
});

export const UniversityProvider = ({ children }) => {
  const [selectedId, setSelectedId] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_UNIVERSITY_ID ?? null;
    }
    return window.localStorage.getItem(STORAGE_KEY) || null;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (selectedId) {
      window.localStorage.setItem(STORAGE_KEY, selectedId);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedId]);

  const selectUniversity = useCallback((value) => {
    if (!value) {
      setSelectedId(null);
      return;
    }
    if (typeof value === "string") {
      setSelectedId(value);
      return;
    }
    setSelectedId(value.id);
  }, []);

  const clearUniversity = useCallback(() => {
    setSelectedId(null);
  }, []);

  const university = useMemo(() => {
    if (!selectedId) {
      return null;
    }
    return UNIVERSITY_MAP[selectedId] ?? null;
  }, [selectedId]);

  const value = useMemo(
    () => ({
      universities: UNIVERSITIES,
      university,
      selectUniversity,
      clearUniversity,
    }),
    [clearUniversity, selectUniversity, university]
  );

  return <UniversityContext.Provider value={value}>{children}</UniversityContext.Provider>;
};

export const useUniversity = () => useContext(UniversityContext);
