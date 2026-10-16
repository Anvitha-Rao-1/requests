// Small helpers for storing and reading the logged-in user.
// localStorage keeps data in the browser even after a refresh or tab close.

// Save token and user after a successful login.
export function saveAuth(token, user) {
  localStorage.setItem("token", token);
  // Objects must be stringified — localStorage only stores text.
  localStorage.setItem("user", JSON.stringify(user));
}

// Read the current user (or null if not logged in).
export function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null; // parse the text back into an object
}

// Read the token (used later to prove identity on API calls).
export function getToken() {
  return localStorage.getItem("token");
}

// Clear everything on logout.
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}