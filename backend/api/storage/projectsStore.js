const { randomUUID } = require("node:crypto");
const { getFirestore } = require("./firebaseClient");

const COLLECTION_NAME = "projects";

const withTimestamps = (payload) => {
  const now = new Date().toISOString();
  return {
    ...payload,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  };
};

const getCollection = () => getFirestore().collection(COLLECTION_NAME);

const normalizeProjectPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Project payload is required");
  }
  const id = payload.id || randomUUID();
  return withTimestamps({
    ...payload,
    id,
  });
};

const listProjects = async () => {
  const snapshot = await getCollection()
    .orderBy("updatedAt", "desc")
    .get();
  return snapshot.docs.map((doc) => doc.data());
};

const getProjectById = async (projectId) => {
  if (!projectId) {
    return null;
  }
  const doc = await getCollection().doc(projectId).get();
  return doc.exists ? doc.data() : null;
};

const saveProject = async (payload) => {
  const record = normalizeProjectPayload(payload);
  await getCollection().doc(record.id).set(record);
  return record;
};

const deleteProject = async (projectId) => {
  if (!projectId) {
    return;
  }
  await getCollection().doc(projectId).delete();
};

module.exports = {
  listProjects,
  saveProject,
  getProjectById,
  deleteProject,
};
