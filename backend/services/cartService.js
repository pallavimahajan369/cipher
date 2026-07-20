// Cart Service — persists each user's shopping cart to MySQL.
import { isRealDb, query } from "../db.js";

// In-memory fallback map: username -> cart items[]
const cartsDb = {};

// ---------------------------------------------------------------------------

/**
 * Returns the saved cart items for a user.
 * Returns an empty array if the user has no saved cart.
 */
export async function getCart(username) {
  if (isRealDb()) {
    const rows = await query("SELECT items FROM carts WHERE username = ?", [username]);
    if (rows.length === 0) return [];
    const raw = rows[0].items;
    if (!raw) return [];
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  }
  return cartsDb[username] || [];
}

/**
 * Saves (upserts) the full cart items array for a user.
 */
export async function saveCart(username, items) {
  if (isRealDb()) {
    const itemsJson = JSON.stringify(items ?? []);
    const exists    = await query("SELECT username FROM carts WHERE username = ?", [username]);
    if (exists.length > 0) {
      await query("UPDATE carts SET items = ? WHERE username = ?", [itemsJson, username]);
    } else {
      await query("INSERT INTO carts (username, items) VALUES (?, ?)", [username, itemsJson]);
    }
  } else {
    cartsDb[username] = items ?? [];
  }
  return { success: true };
}

/**
 * Clears a user's saved cart (called on logout or after checkout).
 */
export async function clearCart(username) {
  return await saveCart(username, []);
}
