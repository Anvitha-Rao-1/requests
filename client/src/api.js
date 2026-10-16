import { getToken } from "./auth";

// A wrapper around fetch that automatically adds the auth token
// and handles JSON. Every API call in the app goes through this.
export async function api(path, options = {}) {
  const token = getToken();

  // Build headers: JSON content type + the token if we have one.
  const headers = {
    "Content-Type": "application/json",
    ...options.headers, // allow callers to add their own headers
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make the request. options may include method, body, etc.
  const response = await fetch(path, { ...options, headers });

  // Parse the JSON response.
  const data = await response.json();

  // If the server returned an error status, throw so callers can catch it.
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}