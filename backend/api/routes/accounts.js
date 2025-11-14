const express = require("express");
const { saveAccount, getAccountByPublicId } = require("../storage/accountsStore");
const {
  DEFAULT_UNIVERSITY_ID,
  getUniversityById,
} = require("../universities");

const router = express.Router();

const normalizeCourse = (value) => {
  const number = Number(String(value).replace(/[^\d]/g, ""));
  if (Number.isNaN(number) || number <= 0) {
    return null;
  }
  return Math.min(Math.max(number, 1), 10);
};

const resolveUniversity = (universityId) => {
  if (universityId) {
    const found = getUniversityById(universityId);
    if (found) {
      return found;
    }
  }
  return getUniversityById(DEFAULT_UNIVERSITY_ID);
};

const sanitizeScheduleProfile = (profile) => {
  if (
    !profile ||
    typeof profile !== "object" ||
    !profile.id ||
    !profile.type ||
    !profile.label
  ) {
    return null;
  }
  return {
    id: String(profile.id),
    type: String(profile.type),
    label: String(profile.label),
  };
};

router.post("/register", (req, res) => {
  const {
    userId,
    fullName,
    course,
    groupLabel,
    universityId,
    scheduleProfile,
  } = req.body || {};

  const resolvedUniversity = resolveUniversity(universityId);
  if (!resolvedUniversity) {
    return res.status(400).json({ error: "Не выбран вуз" });
  }

  if (!userId) {
    return res.status(400).json({ error: "MAX ID не передан" });
  }

  if (!fullName || String(fullName).trim().length < 5) {
    return res.status(400).json({ error: "Укажите полное ФИО" });
  }

  const normalizedCourse = normalizeCourse(course);
  if (!normalizedCourse) {
    return res
      .status(400)
      .json({ error: "Укажите курс (числом от 1 до 10)" });
  }

  if (!groupLabel || String(groupLabel).trim().length < 2) {
    return res.status(400).json({ error: "Укажите вашу группу" });
  }

  const prepared = {
    userId: String(userId),
    fullName,
    course: String(normalizedCourse),
    groupLabel,
    universityId: resolvedUniversity.id,
    universityTitle: resolvedUniversity.title,
    scheduleProfile: sanitizeScheduleProfile(scheduleProfile),
  };

  try {
    const account = saveAccount(prepared);
    return res.json(account);
  } catch (error) {
    console.error("Register account failed", error);
    return res.status(500).json({ error: "Не удалось создать аккаунт" });
  }
});

router.get("/:accountId", (req, res) => {
  const accountId = req.params.accountId;
  if (!accountId) {
    return res.status(400).json({ error: "Не передан идентификатор" });
  }
  try {
    const account = getAccountByPublicId(accountId);
    if (!account) {
      return res.status(404).json({ error: "Аккаунт не найден" });
    }
    return res.json(account);
  } catch (error) {
    console.error("Fetch account failed", error);
    return res.status(500).json({ error: "Не удалось получить данные" });
  }
});

module.exports = router;
