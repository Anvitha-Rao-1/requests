import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Any request starting with /api gets forwarded to the backend on :5000.
    // This avoids CORS issues and keeps API paths clean in our code.
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});