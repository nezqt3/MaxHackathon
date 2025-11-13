import { API_BASE_URL } from "../../config/api";

export const parseIdSchedule = async (term, universityId) => {
  if (!term || !universityId) return [];
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/${universityId}/schedule/search?term=${encodeURIComponent(
        term
      )}`
    );
    if (!response.ok) throw new Error("Ошибка поиска расписания");
    const data = await response.json();
    return data || [];
  } catch (e) {
    console.error("parseIdSchedule error:", e);
    return [];
  }
};

export const parseSchedule = async (
  profileId,
  profileType,
  startIso,
  endIso,
  universityId,
  groupLabel
) => {
  if (!profileId || !profileType || !startIso || !endIso || !universityId)
    return [];
  try {
    let response = "";
    if (profileType === "schedule") {
      response = await fetch(
        `${API_BASE_URL}/api/${universityId}/schedule?groupLabel=${encodeURIComponent(
          groupLabel
        )}`
      );
    } else {
      response = await fetch(
        `${API_BASE_URL}/api/${universityId}/schedule?profileId=${profileId}&profileType=${profileType}&start=${startIso}&end=${endIso}`
      );
    }
    if (!response.ok) throw new Error("Ошибка загрузки расписания");
    const data = await response.json();
    console.log(data);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("parseSchedule error:", e);
    return [];
  }
};
