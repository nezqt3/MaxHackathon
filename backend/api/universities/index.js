const financialUniversity = require("./financialUniversity");

const UNIVERSITIES = {
  [financialUniversity.id]: financialUniversity,
};

const DEFAULT_UNIVERSITY_ID = financialUniversity.id;

const getUniversityById = (id) => {
  if (!id) {
    return UNIVERSITIES[DEFAULT_UNIVERSITY_ID] ?? null;
  }
  return UNIVERSITIES[id] ?? null;
};

module.exports = {
  UNIVERSITIES,
  DEFAULT_UNIVERSITY_ID,
  getUniversityById,
};
