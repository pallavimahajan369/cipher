// Order Service handles checking out baskets, confirming address parameters, and spawning orders.
import { isRealDb, query } from "../db.js";

// In-memory fallback — only used when MySQL is unavailable (isRealDb() === false)
const ordersDb = [];

// ---------------------------------------------------------------------------
// processOrderCheckout
// ---------------------------------------------------------------------------

/**
 * Validates cart items and shipping parameters to issue an order receipt with stock verification.
 */
export async function processOrderCheckout({ cartItems, shippingAddress, authCode, username }) {
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Your checkout basket is empty.");
  }

  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.addressLine ||
    !shippingAddress.city ||
    !shippingAddress.postalCode
  ) {
    throw new Error("Incomplete or invalid delivery destination address parameter.");
  }

  const code = authCode || "TXN-SIM-APPROVED";

  // --- STEP 1: STOCK VERIFICATION & DECREMENT ---
  if (isRealDb()) {
    // Verify all items first, then decrement (avoids partial failures)
    for (const item of cartItems) {
      const prodId        = item.product?.id || item.productId;
      const quantityToBuy = item.quantity || 1;

      const rows = await query(
        "SELECT id, name, stockCount, inStock FROM products WHERE id = ?",
        [prodId]
      );
      if (rows.length === 0) {
        throw new Error(`Checkout halted: Product ${prodId} not found in catalog listing.`);
      }

      const dbProd        = rows[0];
      const stockAvailable = dbProd.stockCount !== undefined ? Number(dbProd.stockCount) : 15;

      if (dbProd.inStock === 0 || stockAvailable < quantityToBuy) {
        throw new Error(
          `Fulfillment Denied: "${dbProd.name}" only has ${stockAvailable} item(s) in stock, but your cart requests ${quantityToBuy}.`
        );
      }
    }

    // All items verified — now decrement
    for (const item of cartItems) {
      const prodId        = item.product?.id || item.productId;
      const quantityToBuy = item.quantity || 1;

      await query(`
        UPDATE products
        SET stockCount = GREATEST(0, stockCount - ?),
            inStock    = CASE WHEN (stockCount - ?) <= 0 THEN 0 ELSE 1 END
        WHERE id = ?
      `, [quantityToBuy, quantityToBuy, prodId]);
    }

  } else {
    // In-memory fallback
    const { getProducts } = await import("./productService.js");
    const products = await getProducts();

    for (const item of cartItems) {
      const prodId        = item.product?.id || item.productId;
      const quantityToBuy = item.quantity || 1;
      const cachedProd    = products.find(p => p.id === prodId);

      if (!cachedProd) {
        throw new Error(`Checkout halted: Product archive ${prodId} is missing.`);
      }

      const stockAvailable = cachedProd.stockCount !== undefined ? Number(cachedProd.stockCount) : 15;

      if (!cachedProd.inStock || stockAvailable < quantityToBuy) {
        throw new Error(
          `Fulfillment Denied: "${cachedProd.name}" only has ${stockAvailable} item(s) left in the showroom, but you requested ${quantityToBuy}.`
        );
      }
    }

    // Decrement in-memory
    for (const item of cartItems) {
      const prodId        = item.product?.id || item.productId;
      const quantityToBuy = item.quantity || 1;
      const cachedProd    = products.find(p => p.id === prodId);
      if (cachedProd) {
        cachedProd.stockCount = Math.max(0, (cachedProd.stockCount || 15) - quantityToBuy);
        if (cachedProd.stockCount === 0) cachedProd.inStock = false;
      }
    }
  }

  // --- STEP 2: ORDER CREATION ---
  const orderId            = `AURA-${Math.floor(100000 + Math.random() * 900000)}`;
  const deliveryDays       = 3 + Math.floor(Math.random() * 3);
  const estimatedDelivery  = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000).toDateString();
  const initDeliveryStatus = "Processing";
  const initPaymentStatus  = "Completed";

  if (isRealDb()) {
    await query(
      `INSERT INTO orders
         (orderId, cartItems, shippingFullName, shippingAddressLine, shippingCity,
          shippingPostalCode, estimatedDelivery, authCode, deliveryStatus, paymentStatus, username)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        JSON.stringify(cartItems),
        shippingAddress.fullName,
        shippingAddress.addressLine,
        shippingAddress.city,
        shippingAddress.postalCode,
        estimatedDelivery,
        code,
        initDeliveryStatus,
        initPaymentStatus,
        username || null
      ]
    );
  } else {
    // In-memory fallback — only push when MySQL is not available
    ordersDb.push({
      orderId,
      cartItems,
      shippingFullName:    shippingAddress.fullName,
      shippingAddressLine: shippingAddress.addressLine,
      shippingCity:        shippingAddress.city,
      shippingPostalCode:  shippingAddress.postalCode,
      estimatedDelivery,
      authCode:            code,
      deliveryStatus:      initDeliveryStatus,
      paymentStatus:       initPaymentStatus,
      username:            username || null,
      date:                new Date().toISOString()
    });
  }

  return {
    success:          true,
    orderId,
    estimatedDelivery,
    deliveryStatus:   initDeliveryStatus,
    paymentStatus:    initPaymentStatus,
    message:          "Aura fulfillment center verified your stock reservation. Preparing curated shipment logistics."
  };
}

// ---------------------------------------------------------------------------
// getOrders
// ---------------------------------------------------------------------------

/**
 * Retrieves all registered orders.
 */
export async function getOrders() {
  if (isRealDb()) {
    const orders = await query("SELECT * FROM orders ORDER BY date DESC");
    return orders.map(mapDbOrder);
  }
  return ordersDb.map(o => ({
    ...o,
    deliveryStatus: o.deliveryStatus || "Processing",
    paymentStatus:  o.paymentStatus  || "Completed"
  }));
}

/**
 * Retrieves orders belonging to a specific user.
 */
export async function getOrdersByUser(username) {
  if (isRealDb()) {
    const orders = await query(
      "SELECT * FROM orders WHERE username = ? ORDER BY date DESC",
      [username]
    );
    return orders.map(mapDbOrder);
  }
  return ordersDb
    .filter(o => o.username === username)
    .map(o => ({
      ...o,
      deliveryStatus: o.deliveryStatus || "Processing",
      paymentStatus:  o.paymentStatus  || "Completed"
    }));
}

/** Maps a raw DB row to the standard order shape. */
function mapDbOrder(o) {
  return {
    orderId:             o.orderId,
    cartItems:           typeof o.cartItems === "string" ? JSON.parse(o.cartItems) : o.cartItems,
    shippingFullName:    o.shippingFullName,
    shippingAddressLine: o.shippingAddressLine,
    shippingCity:        o.shippingCity,
    shippingPostalCode:  o.shippingPostalCode,
    estimatedDelivery:   o.estimatedDelivery,
    authCode:            o.authCode,
    deliveryStatus:      o.deliveryStatus  || "Processing",
    paymentStatus:       o.paymentStatus   || "Completed",
    username:            o.username        || null,
    date:                o.date
  };
}

// ---------------------------------------------------------------------------
// updateOrderStatus
// ---------------------------------------------------------------------------

/**
 * Updates an existing order's delivery and payment status.
 */
export async function updateOrderStatus(orderId, { deliveryStatus, paymentStatus }) {
  if (isRealDb()) {
    const sets   = [];
    const params = [];

    if (deliveryStatus !== undefined) {
      sets.push("deliveryStatus = ?");
      params.push(deliveryStatus);
    }
    if (paymentStatus !== undefined) {
      sets.push("paymentStatus = ?");
      params.push(paymentStatus);
    }

    if (sets.length > 0) {
      params.push(orderId);
      await query(`UPDATE orders SET ${sets.join(", ")} WHERE orderId = ?`, params);
    }

    return { orderId, success: true, deliveryStatus, paymentStatus };
  }

  // In-memory fallback
  const idx = ordersDb.findIndex(o => o.orderId === orderId);
  if (idx !== -1) {
    if (deliveryStatus !== undefined) ordersDb[idx].deliveryStatus = deliveryStatus;
    if (paymentStatus  !== undefined) ordersDb[idx].paymentStatus  = paymentStatus;
  }

  return { orderId, success: true, deliveryStatus, paymentStatus };
}
