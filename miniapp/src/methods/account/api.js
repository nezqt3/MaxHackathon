import { API_BASE_URL } from "../../config/api";

const handleResponse = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const error = payload?.error || "Произошла ошибка";
    throw new Error(error);
  }
  return payload;
};

export const registerAccountRequest = async (data) => {
  const response = await fetch(`${API_BASE_URL}/api/accounts/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const fetchAccountRequest = async (accountId) => {
  const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}`);
  if (response.status === 404) {
    return null;
  }
  return handleResponse(response);
};

export const fetchAccountByUserIdRequest = async (userId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/accounts?userId=${encodeURIComponent(userId)}`,
  );
  if (response.status === 404) {
    return null;
  }
  return handleResponse(response);
};
