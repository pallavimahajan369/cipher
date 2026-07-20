// Wishlist Service — persists each user's wishlist to MySQL.
import { isRealDb, query } from "../db.js";

// In-memory fallback map: username -> wishlist product[]
const wishlistsDb = {};

// ---------------------------------------------------------------------------

/**
 * Returns the saved wishlist items for a user.
 * Returns an empty array if the user has no saved wishlist.
 */
export async function getWishlist(username) {
  if (isRealDb()) {
    const rows = await query("SELECT items FROM wishlists WHERE username = ?", [username]);
    if (rows.length === 0) return [];
    const raw = rows[0].items;
    if (!raw) return [];
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  }
  return wishlistsDb[username] || [];
}

/**
 * Saves (upserts) the full wishlist items array for a user.
 */
export async function saveWishlist(username, items) {
  if (isRealDb()) {
    const itemsJson = JSON.stringify(items ?? []);
    const exists    = await query("SELECT username FROM wishlists WHERE username = ?", [username]);
    if (exists.length > 0) {
      await query("UPDATE wishlists SET items = ? WHERE username = ?", [itemsJson, username]);
    } else {
      await query("INSERT INTO wishlists (username, items) VALUES (?, ?)", [username, itemsJson]);
    }
  } else {
    wishlistsDb[username] = items ?? [];
  }
  return { success: true };
}

/**
 * Clears a user's saved wishlist.
 */
export async function clearWishlist(username) {
  return await saveWishlist(username, []);
}
