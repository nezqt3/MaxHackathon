const { getFirestore } = require("./firebaseClient");

const COLLECTION_NAME = "accounts";

const getCollection = () => getFirestore().collection(COLLECTION_NAME);

const normalizeScheduleProfile = (profile) => {
  if (!profile || typeof profile !== "object") {
    return null;
  }
  if (!profile.id || !profile.type) {
    return null;
  }
  return {
    id: String(profile.id),
    type: String(profile.type),
    label: profile.label ? String(profile.label) : null,
  };
};

const mapScheduleProfile = (data = {}, fallbackLabel) => {
  if (!data) {
    return null;
  }
  if (data.id && data.type) {
    return {
      id: String(data.id),
      type: String(data.type),
      label: data.label ? String(data.label) : fallbackLabel || null,
    };
  }
  if (data.scheduleProfileId && data.scheduleProfileType) {
    return {
      id: String(data.scheduleProfileId),
      type: String(data.scheduleProfileType),
      label: data.scheduleProfileLabel
        ? String(data.scheduleProfileLabel)
        : fallbackLabel || null,
    };
  }
  return null;
};

const mapAccountRecord = (record) => {
  if (!record) {
    return null;
  }

  const scheduleProfile = mapScheduleProfile(
    record.scheduleProfile || record,
    record.groupLabel,
  );

  const accountId =
    record.userId || record.publicId || record.id || record.max_user_id;

  if (!accountId) {
    return null;
  }

  return {
    id: accountId,
    userId: accountId,
    fullName: record.fullName,
    email: record.email,
    universityId: record.universityId,
    universityTitle: record.universityTitle,
    course: record.course,
    groupLabel: record.groupLabel,
    scheduleProfile,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

const findAccountByField = async (field, value) => {
  if (!value) {
    return null;
  }
  const snapshot = await getCollection()
    .where(field, "==", String(value))
    .limit(1)
    .get();
  if (snapshot.empty) {
    return null;
  }
  return mapAccountRecord(snapshot.docs[0].data());
};

const getAccountDocument = async (docId) => {
  if (!docId) {
    return null;
  }
  const doc = await getCollection().doc(String(docId)).get();
  if (!doc.exists) {
    return null;
  }
  return mapAccountRecord(doc.data());
};

const getAccountByPublicId = async (publicId) => {
  return (await getAccountDocument(publicId))
    || (await findAccountByField("publicId", publicId));
};

const getAccountByUserId = async (userId) => {
  return (await getAccountDocument(userId))
    || (await findAccountByField("userId", userId))
    || (await findAccountByField("max_user_id", userId));
};

const saveAccount = async (payload = {}) => {
  const userId = String(payload.userId || "").trim();
  if (!userId) {
    throw new Error("userId is required to save an account");
  }

  const normalizedFullName = String(payload.fullName || "").trim();
  const normalizedGroup = String(payload.groupLabel || "").trim();
  const normalizedCourse = String(payload.course ?? "").trim();
  const scheduleProfile = normalizeScheduleProfile(payload.scheduleProfile);
  const now = new Date().toISOString();

  const existing = await getAccountByUserId(userId);
  const createdAt = existing?.createdAt || now;
  const email = payload.email
    ? String(payload.email).trim()
    : existing?.email || `${userId}@max-user.local`;

  const record = {
    id: userId,
    userId,
    publicId: existing?.id || userId,
    fullName: normalizedFullName,
    email,
    universityId: payload.universityId,
    universityTitle: payload.universityTitle,
    course: normalizedCourse,
    groupLabel: normalizedGroup,
    scheduleProfile: scheduleProfile || existing?.scheduleProfile || null,
    createdAt,
    updatedAt: now,
  };

  await getCollection().doc(userId).set(record);

  return mapAccountRecord(record);
};

module.exports = {
  saveAccount,
  getAccountByPublicId,
  getAccountByUserId,
};
