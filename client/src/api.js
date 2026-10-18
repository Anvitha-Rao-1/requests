import { getToken } from "./auth";

// In production this is set to the Render backend URL (via VITE_API_URL on Vercel).
// In local dev it's empty, so requests go to "/api/..." and Vite's proxy forwards them.
const API_BASE = "";// backend

// Wrapper around fetch that adds the auth token and handles JSON.
export async function api(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

// Upload a file (multipart/form-data). No Content-Type header — the browser
// sets it with the correct multipart boundary automatically.
export async function uploadFile(path, file, label) {
  const token = getToken();

  const formData = new FormData();
  formData.append("file", file);
  if (label) formData.append("label", label);

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { method: "POST", headers, body: formData });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Upload failed");
  }

  return data;
}