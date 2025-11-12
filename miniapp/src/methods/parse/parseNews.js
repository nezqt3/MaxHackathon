import { API_BASE_URL } from "../../config/api";

export const getNews = async (universityId) => {
  if (!universityId) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/${universityId}/news`);
    if (!response.ok) throw new Error("news request failed");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("getNews error:", e);
    return [];
  }
};

export const getNewsContent = async (universityId, url) => {
  if (!universityId || !url) {
    return "";
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/${universityId}/news/content?url=${encodeURIComponent(url)}`
    );
    if (!response.ok) throw new Error("news content request failed");
    const { content } = await response.json();
    return content || "";
  } catch (e) {
    console.error("Ошибка при загрузке контента новости:", e);
    return "";
  }
};
