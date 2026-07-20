import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "aura_premium_curation_secret_vibe";

/**
 * Middleware to verify that the request has a valid JWT token
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
}

/**
 * Middleware to check if the authenticated user has admin privileges
 */
export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied. Administrator privileges required." });
  }
  next();
}
