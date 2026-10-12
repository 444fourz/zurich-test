/**
 * API client for communicating with the backend.
 * 
 * All health data is sent over HTTPS in production.
 * No sensitive data is logged to the console (GDPR compliance).
 */

// Falls back to the backend's default address (not the Vite dev server's port).
// Any trailing slash is removed so paths like "/applications" join cleanly.
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

// The token lives in sessionStorage, so it is cleared when the tab is closed.
const TOKEN_KEY = 'uw_access_token';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

interface TokenResponse {
  accessToken: string;
  user: AuthUser;
}

interface ApplicationData {
  personal: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    postcode: string;
  };
  lifestyle: {
    smoker: string;
    alcoholConsumption: string;
    exerciseFrequency: string;
    occupation: string;
    hazardousActivities: string;
  };
  medical: {
    height: string;
    weight: string;
    existingConditions: string[];
    medications: string;
    familyHistory: string;
    recentHospitalisation: string;
  };
}

interface ApplicationResponse {
  id: number;
  reference: string;
  status: string;
  message: string;
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Turn an error response into an Error with a readable message.
 * FastAPI sends a string for most errors and a list for validation errors.
 */
async function errorFromResponse(response: Response, fallback: string): Promise<Error> {
  let detail: unknown;
  try {
    detail = (await response.json()).detail;
  } catch {
    // Response was not JSON; use the fallback message.
  }

  if (typeof detail === 'string') {
    return new Error(detail);
  }
  if (Array.isArray(detail) && detail.length > 0 && typeof detail[0]?.msg === 'string') {
    return new Error(detail[0].msg);
  }
  return new Error(fallback);
}

async function postAuth(path: string, body: unknown, fallback: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await errorFromResponse(response, fallback);
  }

  const result: TokenResponse = await response.json();
  sessionStorage.setItem(TOKEN_KEY, result.accessToken);
  return result.user;
}

/** Create an account and log in. */
export function registerUser(input: RegisterInput): Promise<AuthUser> {
  return postAuth('/auth/register', input, 'Registration failed');
}

/** Log in with an email and password. */
export function loginUser(email: string, password: string): Promise<AuthUser> {
  return postAuth('/auth/login', { email, password }, 'Login failed');
}

/** Log out. The local token is removed even if the server can't be reached. */
export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
  } catch {
    // Ignore network errors; the token is discarded below regardless.
  } finally {
    clearToken();
  }
}

/** Fetch the logged-in user, or null if there is no valid session. */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (!getToken()) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: authHeaders(),
  });

  if (response.status === 401) {
    clearToken();
    return null;
  }
  if (!response.ok) {
    throw await errorFromResponse(response, 'Could not load your account');
  }
  return response.json();
}

/**
 * Submit a new application to the backend. The user must be logged in.
 * 
 * @param data - Complete application data from the form
 * @returns Application reference and ID
 */
export async function submitApplication(data: ApplicationData): Promise<ApplicationResponse> {
  const response = await fetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    clearToken();
    throw new Error('Your session has expired. Please log in again.');
  }
  if (!response.ok) {
    throw await errorFromResponse(response, 'Failed to submit application');
  }

  return response.json();
}

/**
 * Health check to verify backend connectivity.
 */
export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}
