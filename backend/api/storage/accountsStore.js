const { execute, query } = require("./sqliteClient");

let isInitialized = false;

const ensureSchema = () => {
  if (isInitialized) {
    return;
  }

  execute("PRAGMA journal_mode=WAL;");
  execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      max_user_id TEXT UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      university_id TEXT NOT NULL,
      university_title TEXT NOT NULL,
      course TEXT NOT NULL,
      group_label TEXT NOT NULL,
      schedule_profile_id TEXT,
      schedule_profile_type TEXT,
      schedule_profile_label TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  execute(
    `CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);`,
  );
  execute(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_public_id ON accounts(public_id);`,
  );

  const columns = query(`PRAGMA table_info(accounts);`);
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("password_hash")) {
    execute(`ALTER TABLE accounts ADD COLUMN password_hash TEXT;`);
  }
  if (!columnNames.has("password_salt")) {
    execute(`ALTER TABLE accounts ADD COLUMN password_salt TEXT;`);
  }
  if (!columnNames.has("max_user_id")) {
    execute(`ALTER TABLE accounts ADD COLUMN max_user_id TEXT;`);
  }
  execute(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(max_user_id);`,
  );

  isInitialized = true;
};

const mapRow = (row) => {
  if (!row) {
    return null;
  }

  const scheduleProfile = row.schedule_profile_id
    ? {
        id: row.schedule_profile_id,
        type: row.schedule_profile_type,
        label: row.schedule_profile_label || row.group_label,
      }
    : null;

  const userId = row.max_user_id || row.public_id;

  return {
    id: userId,
    userId,
    fullName: row.full_name,
    email: row.email,
    universityId: row.university_id,
    universityTitle: row.university_title,
    course: row.course,
    groupLabel: row.group_label,
    scheduleProfile,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const getAccountByPublicId = (publicId) => {
  ensureSchema();
  if (!publicId) {
    return null;
  }

  const rowByUserId = query(
    `SELECT * FROM accounts WHERE max_user_id = :publicId LIMIT 1;`,
    {
      publicId,
    },
  );
  if (rowByUserId[0]) {
    return mapRow(rowByUserId[0]);
  }

  const rows = query(
    `SELECT * FROM accounts WHERE public_id = :publicId LIMIT 1;`,
    {
      publicId,
    },
  );
  return mapRow(rows[0]);
};

const getAccountByUserId = (userId) => {
  ensureSchema();
  if (!userId) {
    return null;
  }
  const rows = query(
    `SELECT * FROM accounts WHERE max_user_id = :userId LIMIT 1;`,
    {
      userId: String(userId),
    },
  );
  return mapRow(rows[0]);
};

const prepareScheduleParams = (scheduleProfile) => {
  if (!scheduleProfile) {
    return {
      scheduleProfileId: null,
      scheduleProfileType: null,
      scheduleProfileLabel: null,
    };
  }
  return {
    scheduleProfileId: scheduleProfile.id ?? null,
    scheduleProfileType: scheduleProfile.type ?? null,
    scheduleProfileLabel: scheduleProfile.label ?? null,
  };
};

const saveAccount = (payload) => {
  ensureSchema();
  const {
    userId,
    fullName,
    course,
    groupLabel,
    universityId,
    universityTitle,
    scheduleProfile,
  } = payload;

  if (!userId) {
    throw new Error("userId is required to save an account");
  }

  const normalizedUserId = String(userId);
  const normalizedFullName = String(fullName).trim();
  const normalizedGroup = String(groupLabel).trim();
  const normalizedCourse = String(course ?? "").trim();
  const fallbackEmail = `${normalizedUserId}@max-user.local`;

  const scheduleParams = prepareScheduleParams(scheduleProfile);

  const existing =
    getAccountByUserId(normalizedUserId) ||
    getAccountByPublicId(normalizedUserId);
  if (existing) {
    execute(
      `
        UPDATE accounts
        SET
          full_name = :fullName,
          course = :course,
          group_label = :groupLabel,
          university_id = :universityId,
          university_title = :universityTitle,
          schedule_profile_id = :scheduleProfileId,
          schedule_profile_type = :scheduleProfileType,
          schedule_profile_label = :scheduleProfileLabel,
          email = :email,
          max_user_id = :userId,
          password_hash = NULL,
          password_salt = NULL,
          updated_at = datetime('now')
        WHERE public_id = :publicId OR max_user_id = :userId;
      `,
      {
        publicId: existing.id,
        userId: normalizedUserId,
        email: fallbackEmail,
        fullName: normalizedFullName,
        course: normalizedCourse,
        groupLabel: normalizedGroup,
        universityId,
        universityTitle,
        ...scheduleParams,
      },
    );
    return getAccountByUserId(normalizedUserId);
  }

  const publicId = normalizedUserId;

  execute(
    `
      INSERT INTO accounts (
        public_id,
        max_user_id,
        full_name,
        email,
        university_id,
        university_title,
        course,
        group_label,
        schedule_profile_id,
        schedule_profile_type,
        schedule_profile_label,
        password_hash,
        password_salt
      )
      VALUES (
        :publicId,
        :userId,
        :fullName,
        :email,
        :universityId,
        :universityTitle,
        :course,
        :groupLabel,
        :scheduleProfileId,
        :scheduleProfileType,
        :scheduleProfileLabel,
        NULL,
        NULL
      );
    `,
    {
      publicId,
      userId: normalizedUserId,
      fullName: normalizedFullName,
      email: fallbackEmail,
      universityId,
      universityTitle,
      course: normalizedCourse,
      groupLabel: normalizedGroup,
      ...scheduleParams,
    },
  );

  return getAccountByUserId(normalizedUserId);
};

module.exports = {
  saveAccount,
  getAccountByPublicId,
  getAccountByUserId,
};
