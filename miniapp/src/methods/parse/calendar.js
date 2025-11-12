import { API_BASE_URL } from "../../config/api";

export async function getCalendar(universityId, from, to) {
  if (!universityId) {
    return [];
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/${universityId}/calendar?from=${from}&to=${to}`
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Ошибка загрузки календаря:", err);
    return [];
  }
}
