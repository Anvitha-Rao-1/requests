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

export default router;