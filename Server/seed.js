// This script runs on its own (not part of the web server).
// It wipes the users collection and inserts fresh demo users.

import "dotenv/config";          // load MONGODB_URI from .env
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/user.js";

// The four demo users the assignment requires.
// Passwords here are plain text ONLY so we can hash them below — they are
// never stored as-is, and this file holds demo logins, not real credentials.
const demoUsers = [
  {
    name: "Cora Coordinator",
    email: "coordinator@christuniversity.in",
    password: "coord123",
    role: "coordinator",
    department: "Requests Office",
  },
  {
    name: "Sam Specialist",
    email: "specialist@christuniversity.in",
    password: "spec123",
    role: "specialist",
    department: "Expert Review",
  },
  {
    name: "Rita Requester",
    email: "requester.main@christuniversity.in",
    password: "req123",
    role: "requester",
    campus: "main",
    department: "Chemistry",
  },
  {
    name: "Nina Requester",
    email: "requester.north@christuniversity.in",
    password: "req123",
    role: "requester",
    campus: "north",
    department: "Commerce",
  },
];

// An async function so we can await the database operations in order.
async function seed() {
  try {
    // 1. Connect to the database.
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected for seeding");

    // 2. Clear existing users so re-running gives a clean, predictable state.
    await User.deleteMany({});
    console.log("Cleared existing users");

    // 3. Hash each user's password, then build the final objects to insert.
    // Promise.all runs all the hashing in parallel and waits for all to finish.
    const usersToInsert = await Promise.all(
      demoUsers.map(async (user) => {
        // bcrypt.hash(plainText, saltRounds). 10 rounds = standard strength.
        const hashedPassword = await bcrypt.hash(user.password, 10);
        // Return a copy of the user with password replaced by its hash.
        return { ...user, password: hashedPassword };
      })
    );

    // 4. Insert all four users at once.
    await User.insertMany(usersToInsert);
    console.log("Inserted demo users:");
    demoUsers.forEach((u) => console.log(`  ${u.role}: ${u.email}`));

    // 5. Close the connection and exit cleanly.
    await mongoose.connection.close();
    console.log("Done. Connection closed.");
    process.exit(0); // exit code 0 = success
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
}

seed(); // run it