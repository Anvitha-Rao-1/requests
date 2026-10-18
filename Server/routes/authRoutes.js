import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";


// A router is a mini-app that groups related routes.
// We'll attach it under "/api/auth" in index.js.
const router = express.Router();

// POST /api/auth/login
// Receives { email, password } in the request body.
router.post("/login", async (req, res) => {
  try {
    // Pull email and password out of the JSON the frontend sent.
    const { email, password } = req.body;

    // Basic guard: both fields must be present.
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the user by email. .toLowerCase() matches our lowercase storage.
    const user = await User.findOne({ email: email.toLowerCase() });

    // If no user, reject. We say "Invalid credentials" (not "no such email")
    // on purpose — telling attackers which emails exist is a security leak.
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the entered password against the stored hash.
    // bcrypt hashes the attempt and checks if it matches — no un-hashing needed.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Credentials are valid. Create a token carrying the user's id and role.
    // This token is signed with our secret, so it can't be tampered with.
    const token = jwt.sign(
      { id: user._id, role: user.role }, // payload — what's inside the token
      process.env.JWT_SECRET,            // secret used to sign it
      { expiresIn: "7d" }                // token valid for 7 days
    );

    // Send back the token plus safe user info (NEVER the password hash).
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        campus: user.campus,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});
// POST /api/auth/register — a new requester signs up.
// The org-email rule is ENFORCED here: only @christuniversity.in is accepted.
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, campus, department } = req.body;

    // 1. Required fields.
    if (!name || !email || !password || !campus) {
      return res.status(400).json({ message: "Name, email, password and campus are required" });
    }

    // 2. Organisation-email check. Normalise to lowercase, then verify the domain.
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.endsWith("@christuniversity.in")) {
      return res.status(400).json({ message: "Please use your organisation email (@christuniversity.in)" });
    }

    // 3. Password length — a minimal safety check.
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // 4. Campus must be one of the three valid campuses.
    if (!["main", "north", "city"].includes(campus)) {
      return res.status(400).json({ message: "Campus must be main, north or city" });
    }

    // 5. No duplicate accounts.
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    // 6. Hash the password — never store it in plain text.
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Create the user. New sign-ups are always requesters;
    //    coordinator and specialist accounts are created only by the seed script.
    const user = await User.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: "requester",
      campus,
      department: department || "",
    });

    // 8. Issue a token so they're logged in immediately (same shape as login).
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        campus: user.campus,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;