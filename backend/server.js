import express from "express";
import dns from "dns";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

console.log("ENV Loaded");
console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_PORT =", process.env.DB_PORT);
console.log("DB_USER =", process.env.DB_USER);
console.log("DB_NAME =", process.env.DB_NAME);
console.log("GEMINI =", process.env.GEMINI_API_KEY ? "FOUND" : "NOT FOUND");

// Import modular micro-services
import { registerUser, loginUser, getUsers, getUserProfile, updateUserProfile } from "./services/authService.js";
import { getProducts, addProductReview, createProduct, updateProduct, deleteProduct } from "./services/productService.js";
import { verifyPromoCode, processSimulatedPayment } from "./services/paymentService.js";
import { processOrderCheckout, getOrders, getOrdersByUser, updateOrderStatus } from "./services/orderService.js";
import { sendSimulatedEmailNotification, pushSystemAlert } from "./services/notificationService.js";
import { consultAdvisor } from "./services/aiAdvisorService.js";
import { getCart, saveCart, clearCart } from "./services/cartService.js";
import { getWishlist, saveWishlist } from "./services/wishlistService.js";
import { setupDatabase, getDbConfig, reconnectDatabase } from "./db.js";

// Import Administration modular services
import { getDashboardStats } from "./admin/adminDashboardService.js";
import { getCredentialsStatus, connectNewRegistryTarget } from "./admin/adminDbService.js";
import { publishNewShowroomPiece, reviseShowroomPiece, obliterateShowroomPiece } from "./admin/adminProductService.js";
import { getFulfillmentOrders, getValuedMemberAccounts, updateFulfillmentMilestones } from "./admin/adminOrderService.js";

// Import Security Middleware
import { authenticateToken, requireAdmin } from "./middleware/authMiddleware.js";

// Polyfill dns if some environments need it or prevent slow lookups
dns.setDefaultResultOrder?.("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "aura_premium_curation_secret_vibe";

// --- Gateway Routes routing directly to corresponding Service instances ---

// AUTHENTICATION GATEWAY
app.post("/api/auth/register", async (req, res) => {
  try {
    const user = await registerUser(req.body);
    
    // Generate JWT token
    const token = jwt.sign(
      { username: user.username, email: user.email, isAdmin: false },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Trigger Welcome notification asynchronously
    sendSimulatedEmailNotification({
      recipient: user.email,
      subject: "Welcome to Aura premium vault membership",
      body: `Hello ${user.fullName}, thanks for initiating alignment with Aura curation teams.`
    });

    res.status(201).json({
      success: true,
      message: "Welcome to the Aura Vault! Your premium member account has been registered.",
      user,
      token
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const user = await loginUser(req.body);

    // Generate JWT token
    const token = jwt.sign(
      { username: user.username, email: user.email, isAdmin: user.isAdmin || false },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Secure validation approved, welcome to the Aura Vault.",
      user,
      token
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});


// CATALOG GATEWAY
app.get("/api/products", async (req, res) => {
  try {
    const products = await getProducts();
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/products/:id/review", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { review, updatedProduct } = await addProductReview(id, req.body);
    res.status(201).json({ review, updatedProduct });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// PROMO & VOUCHER BILLING GATEWAY
app.post("/api/discount", (req, res) => {
  try {
    const verification = verifyPromoCode(req.body.code);
    res.json({ valid: true, ...verification });
  } catch (error) {
    res.status(400).json({ valid: false, error: error.message });
  }
});


// ORDERING & ACQUISITION GATEWAY (Combines Order, Payment & Notification Service routines)
app.post("/api/checkout", authenticateToken, async (req, res) => {
  try {
    const { cartItems, shippingAddress, paymentDetails } = req.body;

    // 1. Transact Card simulation first to obtain authCode
    const paymentResult = processSimulatedPayment(paymentDetails);

    // 2. Process Checkout validation (writes with authCode)
    const checkoutResult = await processOrderCheckout({ 
      cartItems, 
      shippingAddress, 
      authCode: paymentResult.authCode,
      username: req.user?.username || null
    });

    // 3. Clear the saved cart for this user after successful checkout
    if (req.user?.username) {
      try { await clearCart(req.user.username); } catch (_) {}
    }

    // 3. Dispatch logistics notification 
    sendSimulatedEmailNotification({
      recipient: shippingAddress.email || "customer@auraReceipts.com",
      subject: `Fulfillment Log for receipt ${checkoutResult.orderId}`,
      body: `Your payment has been simulated successfully (${paymentResult.authCode}). Preparing logistics for ${checkoutResult.estimatedDelivery}.`
    });

    res.json({
      success: true,
      orderId: checkoutResult.orderId,
      estimatedDelivery: checkoutResult.estimatedDelivery,
      message: `${checkoutResult.message} Simulated transaction auth key: ${paymentResult.authCode}`
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// AI STYLIST CHAT GATEWAY
app.post("/api/advisor", async (req, res) => {
  try {
    const advice = await consultAdvisor(req.body);
    res.json(advice);
  } catch (error) {
    console.error("Advisor routing failure:", error);
    res.status(500).json({
      error: "Our AI styling assistant is currently experiencing high demand.",
      details: error.message
    });
  }
});

// ---------------------------------------------------------------------------
// USER-SCOPED ROUTES (authenticated, non-admin)
// ---------------------------------------------------------------------------

// CART — load and save
app.get("/api/cart", authenticateToken, async (req, res) => {
  try {
    const items = await getCart(req.user.username);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/cart", authenticateToken, async (req, res) => {
  try {
    await saveCart(req.user.username, req.body.items ?? []);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WISHLIST — load and save
app.get("/api/wishlist", authenticateToken, async (req, res) => {
  try {
    const items = await getWishlist(req.user.username);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/wishlist", authenticateToken, async (req, res) => {
  try {
    await saveWishlist(req.user.username, req.body.items ?? []);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// USER ORDERS — logged-in user's own orders
app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const orders = await getOrdersByUser(req.user.username);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// USER PROFILE — read and update
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await getUserProfile(req.user.username);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const updated = await updateUserProfile(req.user.username, req.body);
    res.json({ user: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- ADMIN GATEWAY CONTROLS ---
app.get("/api/admin/dashboard-stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/db-status", authenticateToken, requireAdmin, (req, res) => {
  try {
    res.json(getCredentialsStatus());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/db-connect", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await connectNewRegistryTarget(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/admin/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { deliveryStatus, paymentStatus } = req.body;
    const result = await updateFulfillmentMilestones(req.params.id, { deliveryStatus, paymentStatus });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await getValuedMemberAccounts();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/orders", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await getFulfillmentOrders();
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/products", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const product = await publishNewShowroomPiece(req.body);
    res.status(201).json({ product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/admin/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const product = await reviseShowroomPiece(req.params.id, req.body);
    res.json({ product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/admin/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await obliterateShowroomPiece(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// FRONTEND EMBEDDED ENGINE
async function bootstrapServer() {
  // Trigger MySQL dynamic initialization and catalog seed validation
  await setupDatabase();

  

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Aura API Gateway] Online. Relaying to internal service registries on host 0.0.0.0, port ${PORT}`);
  });
}

bootstrapServer();
