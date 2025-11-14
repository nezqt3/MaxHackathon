import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchAccountRequest,
  registerAccountRequest,
} from "../methods/account/api";
import {
  getScheduleStorageKey,
  persistScheduleProfile,
} from "../methods/schedule/scheduleUtils";

const STORAGE_KEY = "max-miniapp:account-id";

const decodeBase64Url = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const remainder = normalized.length % 4;
    const padded =
      remainder === 0
        ? normalized
        : `${normalized}${"=".repeat(4 - remainder)}`;
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      return window.atob(padded);
    }
    if (typeof Buffer !== "undefined") {
      return Buffer.from(padded, "base64").toString("utf-8");
    }
    return null;
  } catch (error) {
    console.warn("Failed to decode start payload", error);
    return null;
  }
};

const parseStartPayload = (value) => {
  if (!value) {
    return null;
  }
  try {
    const decoded = decodeBase64Url(value);
    if (!decoded) {
      return null;
    }
    return JSON.parse(decoded);
  } catch (error) {
    console.warn("Failed to parse start payload", error);
    return null;
  }
};

const normalizeMaxUser = (raw) => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const userId = raw.userId ?? raw.user_id ?? raw.id ?? raw.userID ?? null;
  if (!userId) {
    return null;
  }
  const firstName = raw.firstName ?? raw.first_name ?? "";
  const lastName = raw.lastName ?? raw.last_name ?? "";
  const username = raw.username ?? raw.user_name ?? "";
  const displayName =
    raw.name ||
    `${firstName} ${lastName}`.trim() ||
    username ||
    String(userId);
  return {
    userId: String(userId),
    firstName: firstName || "",
    lastName: lastName || "",
    username: username || "",
    name: displayName,
    raw,
  };
};

const readMaxUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const initData = window.WebApp?.initDataUnsafe || {};
  const sources = [];
  if (initData.start_param) {
    sources.push(parseStartPayload(initData.start_param));
  }

  const searchParams = new URLSearchParams(window.location.search || "");
  const hashParams = new URLSearchParams(
    (window.location.hash || "").replace(/^#/, ""),
  );
  const queryStartParam =
    searchParams.get("startapp") ||
    searchParams.get("start_param") ||
    hashParams.get("startapp") ||
    hashParams.get("start_param");
  if (queryStartParam) {
    sources.push(parseStartPayload(queryStartParam));
  }

  if (initData.user) {
    sources.push(initData.user);
  }

  for (const candidate of sources) {
    const normalized = normalizeMaxUser(candidate);
    if (normalized) {
      return normalized;
    }
  }

  const fallbackUserId =
    searchParams.get("user_id") ||
    searchParams.get("mock_user_id") ||
    hashParams.get("user_id");
  if (fallbackUserId) {
    return normalizeMaxUser({
      user_id: fallbackUserId,
      first_name: searchParams.get("first_name") || hashParams.get("first_name") || undefined,
      last_name: searchParams.get("last_name") || hashParams.get("last_name") || undefined,
      name: searchParams.get("name") || hashParams.get("name") || undefined,
    });
  }

  return null;
};

const readStoredAccountId = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to read stored account id", error);
    return null;
  }
};

const AccountContext = createContext({
  account: null,
  userId: null,
  maxUser: null,
  isInitializing: true,
  isProcessing: false,
  error: "",
  registerAccount: async () => {},
  refreshAccount: async () => {},
});

export const AccountProvider = ({ children }) => {
  const identityRef = useRef(null);

  if (identityRef.current === null) {
    const storedId = readStoredAccountId();
    const seedUser =
      typeof window === "undefined" ? null : readMaxUser();
    identityRef.current = {
      storedId,
      seedUser,
    };
  }

  const [accountId, setAccountId] = useState(identityRef.current.storedId);
  const [account, setAccount] = useState(null);
  const [maxUser, setMaxUser] = useState(identityRef.current.seedUser);
  const [isInitializing, setIsInitializing] = useState(
    Boolean(
      identityRef.current.storedId ||
        identityRef.current.seedUser?.userId,
    ),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const persistAccountId = useCallback((value) => {
    if (typeof window === "undefined") {
      return;
    }
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const updateAccountId = useCallback(
    (nextId) => {
      setAccountId(nextId);
      persistAccountId(nextId);
    },
    [persistAccountId],
  );

  useEffect(() => {
    if (typeof window === "undefined" || maxUser?.userId) {
      return undefined;
    }
    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      const nextUser = readMaxUser();
      if (nextUser?.userId || attempts > 10) {
        if (nextUser?.userId) {
          setMaxUser(nextUser);
        }
        window.clearInterval(intervalId);
      }
    }, 700);
    return () => window.clearInterval(intervalId);
  }, [maxUser]);

  useEffect(() => {
    if (!maxUser?.userId) {
      return;
    }
    if (accountId !== maxUser.userId) {
      updateAccountId(maxUser.userId);
    }
  }, [accountId, maxUser, updateAccountId]);

  const resolvedAccountId = maxUser?.userId || accountId || null;

  const syncScheduleFromAccount = useCallback(
    (payload) => {
      if (typeof window === "undefined") {
        return;
      }
      if (!payload?.universityId) {
        return;
      }
      const storageKey = getScheduleStorageKey(payload.universityId);
      if (!storageKey) {
        return;
      }
      if (payload.scheduleProfile) {
        persistScheduleProfile(storageKey, payload.scheduleProfile);
      }
    },
    [],
  );

  const loadAccount = useCallback(
    async (targetId) => {
      if (!targetId) {
        setAccount(null);
        setIsInitializing(false);
        return null;
      }
      setIsInitializing(true);
      try {
        const data = await fetchAccountRequest(targetId);
        setAccount(data);
        syncScheduleFromAccount(data);
        return data;
      } catch (fetchError) {
        console.error("Failed to load account", fetchError);
        setAccount(null);
        return null;
      } finally {
        setIsInitializing(false);
      }
    },
    [syncScheduleFromAccount],
  );

  useEffect(() => {
    loadAccount(resolvedAccountId);
  }, [loadAccount, resolvedAccountId]);

  const handleSuccess = useCallback(
    (payload) => {
      setAccount(payload);
      updateAccountId(payload?.id ?? null);
      syncScheduleFromAccount(payload);
      setError("");
      return payload;
    },
    [syncScheduleFromAccount, updateAccountId],
  );

  const registerAccount = useCallback(
    async (form) => {
      const targetUserId = maxUser?.userId || accountId;
      if (!targetUserId) {
        const idError = new Error(
          "Не удалось определить MAX ID. Откройте мини-приложение из чата MAX.",
        );
        setError(idError.message);
        throw idError;
      }
      setIsProcessing(true);
      setError("");
      try {
        const result = await registerAccountRequest({
          ...form,
          userId: targetUserId,
        });
        return handleSuccess(result);
      } catch (registerError) {
        const message =
          registerError?.message || "Не удалось сохранить аккаунт";
        setError(message);
        throw registerError;
      } finally {
        setIsProcessing(false);
      }
    },
    [accountId, handleSuccess, maxUser?.userId],
  );

  const refreshAccount = useCallback(() => {
    if (!resolvedAccountId) {
      return Promise.resolve(null);
    }
    return loadAccount(resolvedAccountId);
  }, [loadAccount, resolvedAccountId]);

  const value = useMemo(
    () => ({
      account,
      userId: resolvedAccountId,
      maxUser,
      isInitializing,
      isProcessing,
      error,
      registerAccount,
      refreshAccount,
    }),
    [
      account,
      resolvedAccountId,
      maxUser,
      error,
      isProcessing,
      isInitializing,
      registerAccount,
      refreshAccount,
    ],
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => useContext(AccountContext);
