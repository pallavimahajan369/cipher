import { createProduct, updateProduct, deleteProduct, getProducts } from "../services/productService.js";

/**
 * Gets all current items in register
 */
export async function collectCurrentShowroom() {
  return await getProducts();
}

/**
 * Commits a brand new design to database schemas
 */
export async function publishNewShowroomPiece(productData) {
  return await createProduct(productData);
}

/**
 * Updates an existing catalog entry
 */
export async function reviseShowroomPiece(id, productData) {
  return await updateProduct(id, productData);
}

/**
 * Destroys a product register reference permanently
 */
export async function obliterateShowroomPiece(id) {
  return await deleteProduct(id);
}
