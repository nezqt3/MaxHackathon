export const getLibraryResources = async (language = "rus") => {
  const response = await fetch(
    `http://localhost:4000/api/library?=${language}`
  );
  if (!response.ok) throw new Error(`HTTP ${res.status}`);
  const html = await response.text();
};
