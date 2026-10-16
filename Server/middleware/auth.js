import jwt from "jsonwebtoken";
import User from "../models/user.js";

// requireAuth: runs before a protected route. It verifies the token and,
// if valid, attaches the user to req so the route knows who's asking.
export async function requireAuth(req, res, next) {
  try {
    // The frontend sends the token in the Authorization header as "Bearer <token>".
    const header = req.headers.authorization;

    // No header, or wrong format → not logged in.
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Split "Bearer <token>" and take the token part.
    const token = header.split(" ")[1];

    // Verify the token's signature using our secret.
    // If it's forged or expired, jwt.verify throws → caught below.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load the user from the database (minus the password field).
    // We re-fetch rather than trust the token blindly, so a deleted user can't act.
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // Attach the user to the request. Every route after this can read req.user.
    req.user = user;

    // next() passes control to the next middleware or the route handler.
    next();
  } catch (error) {
    // Covers invalid/expired tokens.
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// requireRole: a factory that returns middleware restricting a route to
// specific roles. Usage: requireRole("coordinator") or requireRole("coordinator", "specialist")
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // requireAuth must run first, so req.user exists here.
    if (!allowedRoles.includes(req.user.role)) {
      // 403 Forbidden = "we know who you are, but you're not allowed."
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}