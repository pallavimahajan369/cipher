// Auth Service handles user data persistence, registration processing, and login verification.
import bcrypt from "bcryptjs";
import { isRealDb, query } from "../db.js";

// In-Memory database for users
const usersDb = [
  {
    username: "admin",
    passwordHash: "admin",
    email: "admin@aura.com",
    fullName: "Aura Vault Administrator",
    preferredVibe: "All",
    isAdmin: true
  },
  {
    username: "demo",
    passwordHash: "demo",
    email: "explorer@aura.com",
    fullName: "Serene Explorer",
    preferredVibe: "Minimalist Tech"
  },
  {
    username: "curator",
    passwordHash: "curator",
    email: "curator@aura.com",
    fullName: "Aura Curator",
    preferredVibe: "Curated Home",
    isAdmin: true
  }
];

/**
 * Registers a new member account
 */
export async function registerUser({ username, password, email, fullName, preferredVibe }) {
  if (!username || !password || !email || !fullName) {
    throw new Error("Please fill in all required fields: username, password, email, and full name.");
  }

  const cleanUsername = String(username).toLowerCase().trim();
  const cleanEmail = String(email).toLowerCase().trim();

  // Secure pathway: Do not allow standard registration to claim administrator or curator handles
  if (
    cleanUsername === "admin" || 
    cleanUsername === "curator" || 
    cleanEmail === "admin@aura.com" || 
    cleanEmail === "curator@aura.com" ||
    cleanEmail.startsWith("admin@") ||
    cleanEmail.startsWith("curator@")
  ) {
    throw new Error("Registration of administrator or curator accounts is strictly restricted for system security.");
  }

  if (cleanUsername.length < 3) {
    throw new Error("Username must be at least 3 characters long.");
  }
  if (password.length < 4) {
    throw new Error("Password must be at least 4 characters long.");
  }
  if (!cleanEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  const avatarUrl = `https://api.dicebear.com/7.x/micah/svg?seed=${cleanUsername}`;
  const vibe = preferredVibe ? String(preferredVibe) : "All";
  const finalFullName = String(fullName).trim();

  if (isRealDb()) {
    const existing = await query(
      "SELECT username, email FROM users WHERE username = ? OR email = ?",
      [cleanUsername, cleanEmail]
    );

    if (existing.length > 0) {
      throw new Error("A member account with that username or email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

      await query(
        "INSERT INTO users (username, passwordHash, email, fullName, preferredVibe, avatarUrl) VALUES (?, ?, ?, ?, ?, ?)",
        [
          cleanUsername,
          hashedPassword,
          cleanEmail,
          finalFullName,
          vibe,
          avatarUrl
        ]
      );

    return {
      username: cleanUsername,
      email: cleanEmail,
      fullName: finalFullName,
      preferredVibe: vibe,
      avatarUrl
    };
  } else {
    const userExists = usersDb.find(u => u.username === cleanUsername || u.email === cleanEmail);
    if (userExists) {
      throw new Error("A member account with that username or email already exists.");
    }

    const newUser = {
      username: cleanUsername,
      passwordHash: password, // Simulated plain hash
      email: cleanEmail,
      fullName: finalFullName,
      preferredVibe: vibe
    };

    usersDb.push(newUser);

    return {
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.fullName,
      preferredVibe: newUser.preferredVibe,
      avatarUrl
    };
  }
}

/**
 * Validates credentials and logs the user in
 */
export async function loginUser({ usernameOrEmail, password }) {
  if (!usernameOrEmail || !password) {
    throw new Error("Please enter your username/email and password.");
  }

  const cleanQuery = String(usernameOrEmail).toLowerCase().trim();

  // Backend secure interceptor for administrative accounts:
  // This allows admin and curator to log in seamlessly with environment-configured credentials
  // even on a newly connected or clean external relational database.
  const secureAdminPass = process.env.ADMIN_PASSWORD || "admin";
  const secureCuratorPass = process.env.CURATOR_PASSWORD || "curator";

  const isSigningAsAdmin = cleanQuery === "admin" || cleanQuery === "admin@aura.com";
  const isSigningAsCurator = cleanQuery === "curator" || cleanQuery === "curator@aura.com";

  if (isSigningAsAdmin || isSigningAsCurator) {
    const targetPassword = isSigningAsAdmin ? secureAdminPass : secureCuratorPass;
    if (password !== targetPassword) {
      throw new Error("Invalid administrator or curator credentials. Authentication rejected.");
    }

    // Return the authorized administrative identity
    return {
      username: isSigningAsAdmin ? "admin" : "curator",
      email: isSigningAsAdmin ? "admin@aura.com" : "curator@aura.com",
      fullName: isSigningAsAdmin ? "Aura Vault Administrator" : "Aura Curator",
      preferredVibe: "All",
      avatarUrl: `https://api.dicebear.com/7.x/micah/svg?seed=${isSigningAsAdmin ? "admin" : "curator"}`,
      isAdmin: true
    };
  }

  if (isRealDb()) {
    const users = await query(
      `SELECT *
      FROM users
      WHERE username = ?
      OR email = ?`,
      [cleanQuery, cleanQuery]
    );
    

    if (users.length === 0) {
      throw new Error("Invalid username/email or password comparison. Please check credentials.");
    }

    const user = users[0];
    // Respect the DB flag, but keep the 'Secure Interceptor' logic as a secondary layer
    const isSystemAdmin = user.username === "admin" || user.username === "curator";
    const isAdmin       = !!(user.isAdmin || isSystemAdmin);

    const isMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isMatch) {
      throw new Error("Invalid credentials");
    }
        return {
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      preferredVibe: user.preferredVibe,
      avatarUrl: user.avatarUrl,
      isAdmin: isAdmin
    };
  } else {
    const user = usersDb.find(u => 
      (u.username === cleanQuery || u.email === cleanQuery) && 
      u.passwordHash === password
    );

    if (!user) {
      throw new Error("Invalid username/email or password comparison. Please check credentials.");
    }

    const isAdmin = user.username === "admin" || user.username === "curator" || user.email === "admin@aura.com" || user.email === "curator@aura.com" || !!user.isAdmin;
    return {
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      preferredVibe: user.preferredVibe,
      avatarUrl: `https://api.dicebear.com/7.x/micah/svg?seed=${user.username}`,
      isAdmin: isAdmin
    };
  }
}

/**
 * Retrieves all registered users
 */
export async function getUsers() {
  if (isRealDb()) {
    return await query("SELECT username, email, fullName, preferredVibe, avatarUrl FROM users");
  } else {
    return usersDb.map(u => ({
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      preferredVibe: u.preferredVibe,
      avatarUrl: `https://api.dicebear.com/7.x/micah/svg?seed=${u.username}`
    }));
  }
}

/**
 * Fetches a single user's profile from the database
 */
export async function getUserProfile(username) {
  if (isRealDb()) {
    const rows = await query(
      "SELECT username, email, fullName, preferredVibe, avatarUrl FROM users WHERE username = ?",
      [username]
    );
    if (rows.length === 0) throw new Error("User profile not found.");
    return rows[0];
  }
  const user = usersDb.find(u => u.username === username);
  if (!user) throw new Error("User profile not found.");
  return {
    username:      user.username,
    email:         user.email,
    fullName:      user.fullName,
    preferredVibe: user.preferredVibe,
    avatarUrl:     user.avatarUrl || `https://api.dicebear.com/7.x/micah/svg?seed=${user.username}`
  };
}

/**
 * Updates a user's editable profile fields (fullName, preferredVibe, avatarUrl)
 */
export async function updateUserProfile(username, { fullName, preferredVibe, avatarUrl }) {
  const sets   = [];
  const params = [];

  if (fullName      !== undefined) { sets.push("fullName = ?");      params.push(String(fullName).trim()); }
  if (preferredVibe !== undefined) { sets.push("preferredVibe = ?"); params.push(String(preferredVibe)); }
  if (avatarUrl     !== undefined) { sets.push("avatarUrl = ?");     params.push(String(avatarUrl)); }

  if (sets.length === 0) throw new Error("No profile fields provided to update.");

  if (isRealDb()) {
    params.push(username);
    await query(`UPDATE users SET ${sets.join(", ")} WHERE username = ?`, params);
  } else {
    const user = usersDb.find(u => u.username === username);
    if (!user) throw new Error("User not found.");
    if (fullName      !== undefined) user.fullName      = String(fullName).trim();
    if (preferredVibe !== undefined) user.preferredVibe = String(preferredVibe);
    if (avatarUrl     !== undefined) user.avatarUrl     = String(avatarUrl);
  }

  return await getUserProfile(username);
}
