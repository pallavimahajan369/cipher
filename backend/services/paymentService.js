// Payment Service processes mock card authorizations and handles designer promo code verification.

const VALID_CODES = {
  "SAVE10": 10,
  "WELCOME15": 15,
  "AURA25": 25
};

/**
 * Checks and verifies if a promotional voucher code is valid
 */
export function verifyPromoCode(code) {
  if (!code) {
    throw new Error("Voucher discount code is required.");
  }

  const normalized = String(code).toUpperCase().trim();
  const discountPercent = VALID_CODES[normalized];

  if (discountPercent === undefined) {
    throw new Error("Invalid or expired promotional coupon code.");
  }

  return {
    code: normalized,
    discountPercent
  };
}

/**
 * Simulates a cryptographic transaction with a payment gateway provider
 */
export function processSimulatedPayment(paymentDetails) {
  if (!paymentDetails || !paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv) {
    throw new Error("Invalid or incomplete credit card details.");
  }

  const cleanCardNumber = String(paymentDetails.cardNumber).replace(/\s+/g, "");
  if (cleanCardNumber.length < 15) {
    throw new Error("Insufficient digits on simulated Credit Card string identifier.");
  }

  // Generate mock authorization code
  const authCode = `TXN-AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return {
    success: true,
    authCode
  };
}
