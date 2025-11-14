const { randomUUID } = require("node:crypto");
const { getFirestore, isFirebaseConfigured } = require("./firebaseClient");
const { execute, query } = require("./sqliteClient");

const COLLECTION_NAME = "projects";
const FIRESTORE_FATAL_CODES = new Set([
  5,
  7,
  16,
  403,
  404,
  "NOT_FOUND",
  "PERMISSION_DENIED",
]);

let firestoreDisabled = false;
let sqliteInitialized = false;

const withTimestamps = (payload) => {
  const now = new Date().toISOString();
  return {
    ...payload,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  };
};

const shouldUseFirestore = () => isFirebaseConfigured() && !firestoreDisabled;

const isFatalFirestoreError = (error) => {
  if (!error) {
    return true;
  }
  if (FIRESTORE_FATAL_CODES.has(error.code) || FIRESTORE_FATAL_CODES.has(Number(error.code))) {
    return true;
  }
  const message = String(error.message || "");
  return message.includes("Firebase credentials are not configured");
};

const handleFirestoreError = (error, context) => {
  if (!error) {
    return;
  }
  const fatal = isFatalFirestoreError(error);
  if (fatal) {
    firestoreDisabled = true;
  }
  console.warn(
    `Firestore ${context} failed (${fatal ? "disabled" : "degraded"}): ${
      error.message || error
    }`,
    { code: error.code },
  );
};

const tryFirestore = async (executor, context) => {
  if (!shouldUseFirestore()) {
    return null;
  }
  try {
    const firestore = getFirestore();
    return await executor(firestore);
  } catch (error) {
    handleFirestoreError(error, context);
    return null;
  }
};

const ensureSqliteSchema = () => {
  if (sqliteInitialized) {
    return;
  }
  execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  execute(
    `CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);`,
  );
  sqliteInitialized = true;
};

const parseProjectRow = (row) => {
  if (!row) {
    return null;
  }
  try {
    return JSON.parse(row.payload);
  } catch (error) {
    console.warn("Failed to parse project payload", {
      id: row.id,
      message: error.message,
    });
    return null;
  }
};

const listProjectsFromSqlite = () => {
  ensureSqliteSchema();
  const rows = query(
    `SELECT id, payload FROM projects ORDER BY datetime(updated_at) DESC;`,
  );
  return rows.map(parseProjectRow).filter(Boolean);
};

const getProjectFromSqlite = (projectId) => {
  if (!projectId) {
    return null;
  }
  ensureSqliteSchema();
  const rows = query(
    `SELECT id, payload FROM projects WHERE id = :id LIMIT 1;`,
    { id: projectId },
  );
  return parseProjectRow(rows[0]);
};

const saveProjectToSqlite = (record) => {
  if (!record?.id) {
    throw new Error("Project record must have an id");
  }
  ensureSqliteSchema();
  const createdAt = record.createdAt || new Date().toISOString();
  const updatedAt = record.updatedAt || createdAt;
  execute(
    `
      INSERT INTO projects (id, payload, created_at, updated_at)
      VALUES (:id, :payload, :createdAt, :updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at,
        created_at = COALESCE(projects.created_at, excluded.created_at);
    `,
    {
      id: record.id,
      payload: JSON.stringify(record),
      createdAt,
      updatedAt,
    },
  );
  return record;
};

const deleteProjectFromSqlite = (projectId) => {
  if (!projectId) {
    return;
  }
  ensureSqliteSchema();
  execute(`DELETE FROM projects WHERE id = :id;`, { id: projectId });
};

const syncLocalCache = (projects) => {
  if (!Array.isArray(projects)) {
    return;
  }
  ensureSqliteSchema();
  const existingRows = query(`SELECT id FROM projects;`);
  const remainingIds = new Set(existingRows.map((row) => row.id));

  projects.forEach((project) => {
    if (!project?.id) {
      return;
    }
    remainingIds.delete(project.id);
    saveProjectToSqlite(project);
  });

  remainingIds.forEach((id) => deleteProjectFromSqlite(id));
};

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
  const snapshot = await tryFirestore(
    (firestore) =>
      firestore.collection(COLLECTION_NAME).orderBy("updatedAt", "desc").get(),
    "list",
  );
  if (snapshot) {
    const projects = snapshot.docs.map((doc) => doc.data());
    syncLocalCache(projects);
    return projects;
  }
  return listProjectsFromSqlite();
};

const getProjectById = async (projectId) => {
  if (!projectId) {
    return null;
  }
  const doc = await tryFirestore(
    (firestore) => firestore.collection(COLLECTION_NAME).doc(projectId).get(),
    "get",
  );
  if (doc?.exists) {
    const data = doc.data();
    if (data) {
      saveProjectToSqlite(data);
      return data;
    }
  }
  return getProjectFromSqlite(projectId);
};

const saveProject = async (payload) => {
  const record = normalizeProjectPayload(payload);
  saveProjectToSqlite(record);
  await tryFirestore(
    (firestore) =>
      firestore.collection(COLLECTION_NAME).doc(record.id).set(record),
    "save",
  );
  return record;
};

const deleteProject = async (projectId) => {
  if (!projectId) {
    return;
  }
  deleteProjectFromSqlite(projectId);
  await tryFirestore(
    (firestore) => firestore.collection(COLLECTION_NAME).doc(projectId).delete(),
    "delete",
  );
};

module.exports = {
  listProjects,
  saveProject,
  getProjectById,
  deleteProject,
};
