import { API_BASE_URL } from "../../config/api";

export const getLibraryResources = async (universityId, language = "rus") => {
  if (!universityId) {
    return "";
  }
  const response = await fetch(
    `${API_BASE_URL}/api/${universityId}/library?lang=${language}`
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
};
