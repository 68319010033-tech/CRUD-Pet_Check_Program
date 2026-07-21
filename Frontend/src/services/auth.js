export const API_BASE_URL = 'http://localhost:5000';

const ACCESS_TOKEN_KEY = 'petcheck_access_token';
const REFRESH_TOKEN_KEY = 'petcheck_refresh_token';
const USER_KEY = 'petcheck_user';

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setAuthSession = ({ accessToken, refreshToken, user }) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => Boolean(getAccessToken());

const parseErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data.message || 'Request failed';
  } catch {
    return response.statusText || 'Request failed';
  }
};

const authRequest = async (path, body) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
};

export const login = async (email, password) => {
  const data = await authRequest('/api/auth/login', { email, password });
  setAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  });
  return data;
};

export const register = async (email, password, display_name) => {
  const data = await authRequest('/api/auth/register', { email, password, display_name });
  setAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  });
  return data;
};

export const logout = async () => {
  const accessToken = getAccessToken();

  if (accessToken) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // Ignore network errors during logout cleanup.
    }
  }

  clearAuthSession();
};

export const getAuthHeaders = () => {
  const accessToken = getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};
