import { API_BASE_URL } from "../../config/api";

export async function getBids(universityId) {
  if (!universityId) {
    return [];
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/${universityId}/services/dean-office/bids`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Ошибка запроса заявлений деканата:", err);
    return [];
  }
}
