import { getOrders, updateOrderStatus } from "../services/orderService.js";
import { getUsers } from "../services/authService.js";

/**
 * Lists all checked-out transaction records
 */
export async function getFulfillmentOrders() {
  return await getOrders();
}

/**
 * Returns list of registered customer accounts
 */
export async function getValuedMemberAccounts() {
  return await getUsers();
}

/**
 * Updates order's shipment and payment tracking properties
 */
export async function updateFulfillmentMilestones(orderId, { deliveryStatus, paymentStatus }) {
  if (!orderId) {
    throw new Error("Target order identity parameter is missing.");
  }
  return await updateOrderStatus(orderId, { deliveryStatus, paymentStatus });
}
