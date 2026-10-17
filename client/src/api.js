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
// Upload a file (multipart/form-data). Separate from api() because files
// aren't JSON — we send FormData and must NOT set Content-Type (the browser
// sets it with the correct multipart boundary automatically).
export async function uploadFile(path, file, label) {
  const token = getToken();

  const formData = new FormData();
  formData.append("file", file);       // must match upload.single("file") on the backend
  if (label) formData.append("label", label);

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  // Note: NO Content-Type header — the browser adds it with the boundary.

  const response = await fetch(path, { method: "POST", headers, body: formData });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Upload failed");
  return data;
}