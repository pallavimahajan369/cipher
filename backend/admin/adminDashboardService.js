import { getOrders } from "../services/orderService.js";
import { getProducts } from "../services/productService.js";
import { getUsers } from "../services/authService.js";

/**
 * Computes deep sales intelligence, revenue logs, and item breakdowns.
 */
export async function getDashboardStats() {
  const orders = await getOrders();
  const products = await getProducts();
  const users = await getUsers();

  // 1. Core aggregates
  let totalRevenue = 0;
  const deliveryBreakdown = {
    "Processing": 0,
    "Dispatched": 0,
    "In Transit": 0,
    "Out for Delivery": 0,
    "Delivered": 0
  };
  const paymentBreakdown = {
    "Completed": 0,
    "Pending": 0,
    "Refunded": 0
  };

  const categoryRevenue = {};
  const hotProducts = {};

  for (const ord of orders) {
    const items = Array.isArray(ord.cartItems)
      ? ord.cartItems
      : (typeof ord.cartItems === 'string' ? JSON.parse(ord.cartItems) : []);

    const subtotal = items.reduce((sum, it) => sum + (Number(it.price || it.product?.price || 0) * Number(it.quantity || 1)), 0);
    const orderTotal = ord.total || subtotal;

    // Sum revenue except refunded ones
    if (ord.paymentStatus !== "Refunded") {
      totalRevenue += orderTotal;
    }

    // Tally Statuses
    const delStatus = ord.deliveryStatus || "Processing";
    if (deliveryBreakdown[delStatus] !== undefined) {
      deliveryBreakdown[delStatus]++;
    } else {
      deliveryBreakdown[delStatus] = 1;
    }

    const payStatus = ord.paymentStatus || "Completed";
    if (paymentBreakdown[payStatus] !== undefined) {
      paymentBreakdown[payStatus]++;
    } else {
      paymentBreakdown[payStatus] = 1;
    }

    // Category Sales and Product Hot-list
    for (const item of items) {
      const quantity = Number(item.quantity || 1);
      const category = item.category || item.product?.category || "Other";
      const itemPrice = Number(item.price || item.product?.price || 0);
      const itemRevenue = itemPrice * quantity;

      categoryRevenue[category] = (categoryRevenue[category] || 0) + itemRevenue;

      const pId = item.productId || item.product?.id || "unknown";
      const pName = item.productName || item.product?.name || "Premium Asset";
      
      if (!hotProducts[pId]) {
        hotProducts[pId] = { id: pId, name: pName, quantity: 0, revenue: 0 };
      }
      hotProducts[pId].quantity += quantity;
      hotProducts[pId].revenue += itemRevenue;
    }
  }

  // Formatting Sales By Category for graphs
  const salesByCategory = Object.entries(categoryRevenue).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2))
  }));

  // Hot Selling Products
  const bestSellers = Object.values(hotProducts)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Time Series Revenue Data for timeline graphs
  // Group by date
  const dailyRev = {};
  for (const ord of orders) {
    if (ord.paymentStatus === "Refunded") continue;
    const items = Array.isArray(ord.cartItems)
      ? ord.cartItems
      : (typeof ord.cartItems === 'string' ? JSON.parse(ord.cartItems) : []);
    
    const subtotal = items.reduce((sum, it) => sum + (Number(it.price || it.product?.price || 0) * Number(it.quantity || 1)), 0);
    const total = ord.total || subtotal;

    const dateStr = ord.date ? new Date(ord.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    dailyRev[dateStr] = (dailyRev[dateStr] || 0) + total;
  }

  const revenueTimeline = Object.entries(dailyRev)
    .map(([date, revenue]) => ({ date, amount: Number(revenue.toFixed(2)) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    aggregates: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders: orders.length,
      totalProducts: products.length,
      totalUsers: users.length
    },
    deliveryBreakdown,
    paymentBreakdown,
    salesByCategory,
    bestSellers,
    revenueTimeline
  };
}
