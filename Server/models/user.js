import mongoose from "mongoose";

// A schema defines the structure of documents in a collection.
// Think of it as the "shape" every user must follow.
const userSchema = new mongoose.Schema(
  {
    // Full name of the person.
    name: {
      type: String,
      required: true,   // can't create a user without a name
      trim: true,       // removes accidental spaces around the value
    },

    // Login email. Must be unique so two users can't share one.
    email: {
      type: String,
      required: true,
      unique: true,      // database rejects a duplicate email
      lowercase: true,   // stores "A@x.com" as "a@x.com" for consistent matching
      trim: true,
    },

    // The hashed password — never the plain text. We'll hash before saving.
    password: {
      type: String,
      required: true,
    },

    // Which role this user has. enum restricts it to exactly these three values.
    role: {
      type: String,
      enum: ["requester", "coordinator", "specialist"],
      required: true,
    },

    // Campus only matters for requesters, but we store it on every user.
    // Restricted to the three valid campuses from the brief.
    campus: {
      type: String,
      enum: ["main", "north", "city"],
      // not required — a coordinator/specialist may not belong to one campus
    },

    // Department (e.g. "Procurement"). Optional free text.
    department: {
      type: String,
      trim: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps to every user.
    timestamps: true,
  }
);

// A model is the tool we use to create, read, update and delete documents
// of this shape. "User" becomes the "users" collection in MongoDB automatically.
const User = mongoose.model("User", userSchema);

export default User;