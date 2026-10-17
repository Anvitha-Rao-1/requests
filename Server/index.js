import authRoutes from "./routes/authRoutes.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js"; // ← this is the line that was missing
import requestRoutes from "./routes/requestRoutes.js";

connectDB();
// Create the Express application instance — this is our server.
const app = express();

// Middleware: a function that runs on every incoming request.
// cors() adds headers that tell the browser "requests from other origins are OK."
// Allow the frontend (and local dev) to call this API, including preflight.
app.use(cors({
  origin: true,          // reflect the request origin (allows any)
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
}));

// Lets Express read JSON in request bodies (used later for login, forms, etc.).
app.use(express.json());
// Any request starting with /api/auth goes to our auth router.
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
// A test route. When the browser sends GET to /api/health,
// this function runs and sends back a small JSON object.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running fine" });
});

// The port the server listens on. 5000 is a common choice for dev backends.
const PORT = 5000;
// Catch multer/upload errors and return a clear message instead of a 500.
app.use((err, req, res, next) => {
  if (err.message && (err.message.includes("Only PDF") || err.message.includes("File too large"))) {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File must be under 10 MB" });
  }
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Server error" });
});
// Start the server and print a confirmation once it's listening.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});