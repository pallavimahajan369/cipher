// Product Service manages product data records and user rating feedback logs.
import { CURATED_PRODUCTS } from "../../shared/data.ts";
import { isRealDb, query } from "../db.js";

// In-memory fallback — only used when MySQL is unavailable (isRealDb() === false)
let productsDb = CURATED_PRODUCTS.map(p => ({
  ...p,
  stockCount: p.id === "prod-6" ? 0 : (p.inStock === false ? 0 : 15)
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses a raw MySQL product row into the shape the frontend expects.
 */
function parseDbProduct(p, reviews = []) {
  const stockCount = p.stockCount !== undefined ? Number(p.stockCount) : 15;
  return {
    id:           p.id,
    name:         p.name,
    description:  p.description,
    price:        Number(p.price),
    category:     p.category,
    rating:       Number(p.rating),
    reviewsCount: Number(p.reviewsCount),
    image:        p.image,
    badge:        p.badge,
    inStock:      (p.inStock === 1 || p.inStock === true) && stockCount > 0,
    stockCount,
    featured:     p.featured === 1 || p.featured === true,
    colors:       p.colors ? (typeof p.colors === "string" ? JSON.parse(p.colors) : p.colors) : [],
    sizes:        p.sizes  ? (typeof p.sizes  === "string" ? JSON.parse(p.sizes)  : p.sizes)  : [],
    reviews
  };
}

// ---------------------------------------------------------------------------
// getProducts
// ---------------------------------------------------------------------------

/**
 * Retrieves the catalog collection.
 */
export async function getProducts() {
  if (isRealDb()) {
    const products = await query("SELECT * FROM products");
    const reviews  = await query("SELECT * FROM reviews ORDER BY date DESC");

    const reviewsByProduct = {};
    for (const r of reviews) {
      if (!reviewsByProduct[r.productId]) reviewsByProduct[r.productId] = [];
      reviewsByProduct[r.productId].push({
        id:      r.id,
        author:  r.author,
        rating:  r.rating,
        comment: r.comment,
        date:    r.date
      });
    }

    return products.map(p => parseDbProduct(p, reviewsByProduct[p.id] || []));
  }

  // In-memory fallback
  return productsDb.map(p => ({
    ...p,
    inStock: (p.inStock === true || p.inStock === 1) && (p.stockCount || 0) > 0
  }));
}

// ---------------------------------------------------------------------------
// addProductReview
// ---------------------------------------------------------------------------

/**
 * Appends a verified review to a product.
 */
export async function addProductReview(id, { author, rating, comment }) {
  if (!author || !rating || !comment) {
    throw new Error("Missing required review fields (author, rating, comment).");
  }

  const reviewRating = Number(rating);

  if (isRealDb()) {
    const products = await query("SELECT * FROM products WHERE id = ?", [id]);
    if (products.length === 0) throw new Error("Product with the given ID cannot be found.");

    const reviewId = `rev-${id}-${Date.now()}`;
    const todayStr = new Date().toISOString().split("T")[0];

    await query(
      "INSERT INTO reviews (id, productId, author, rating, comment, date) VALUES (?, ?, ?, ?, ?, ?)",
      [reviewId, id, String(author), reviewRating, String(comment), todayStr]
    );

    const currentReviews = await query("SELECT rating FROM reviews WHERE productId = ?", [id]);
    const reviewsCount   = currentReviews.length;
    const totalStars     = currentReviews.reduce((acc, r) => acc + r.rating, 0);
    const newRating      = Number((totalStars / reviewsCount).toFixed(1));

    await query(
      "UPDATE products SET rating = ?, reviewsCount = ? WHERE id = ?",
      [newRating, reviewsCount, id]
    );

    const updatedProductList = await getProducts();
    const updatedProduct     = updatedProductList.find(p => p.id === id);

    return {
      review: { id: reviewId, author, rating: reviewRating, comment, date: todayStr },
      updatedProduct
    };
  }

  // In-memory fallback
  const productIndex = productsDb.findIndex(p => p.id === id);
  if (productIndex === -1) throw new Error("Product with the given ID cannot be found.");

  const newReview = {
    id:      `rev-${id}-${Date.now()}`,
    author:  String(author),
    rating:  reviewRating,
    comment: String(comment),
    date:    new Date().toISOString().split("T")[0]
  };

  productsDb[productIndex].reviews = [newReview, ...(productsDb[productIndex].reviews || [])];

  const total = productsDb[productIndex].reviews.reduce((acc, r) => acc + r.rating, 0);
  productsDb[productIndex].rating       = Number((total / productsDb[productIndex].reviews.length).toFixed(1));
  productsDb[productIndex].reviewsCount = productsDb[productIndex].reviews.length;

  return { review: newReview, updatedProduct: productsDb[productIndex] };
}

// ---------------------------------------------------------------------------
// createProduct
// ---------------------------------------------------------------------------

/**
 * Creates a new product.
 */
export async function createProduct(productData) {
  const { name, description, price, category, image, badge, inStock, stockCount, featured, colors, sizes } = productData;
  if (!name || isNaN(Number(price)) || !category) {
    throw new Error("Missing required product fields: name, price, category");
  }

  const id             = `prod-${Date.now()}`;
  const finalPrice     = Number(price);
  const finalColors    = colors    || [];
  const finalSizes     = sizes     || [];
  const finalBadge     = badge     || null;
  const finalStockCount = stockCount !== undefined ? Number(stockCount) : 15;
  const finalInStock   = (inStock === true || inStock === 1) && finalStockCount > 0 ? 1 : 0;
  const finalFeatured  = featured  === true || featured  === 1 ? 1 : 0;
  const dummyImage     = image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600";

  if (isRealDb()) {
    await query(`
      INSERT INTO products (id, name, description, price, category, rating, reviewsCount, image, badge, inStock, stockCount, featured, colors, sizes)
      VALUES (?, ?, ?, ?, ?, 0.0, 0, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, name, description || "", finalPrice, category,
      dummyImage, finalBadge, finalInStock, finalStockCount, finalFeatured,
      JSON.stringify(finalColors), JSON.stringify(finalSizes)
    ]);

    // Return the canonical DB record
    const rows = await query("SELECT * FROM products WHERE id = ?", [id]);
    return parseDbProduct(rows[0], []);
  }

  // In-memory fallback
  const newProduct = {
    id,
    name,
    description:  description || "",
    price:        finalPrice,
    category,
    rating:       0.0,
    reviewsCount: 0,
    image:        dummyImage,
    badge:        finalBadge,
    inStock:      !!finalInStock,
    stockCount:   finalStockCount,
    featured:     !!finalFeatured,
    colors:       finalColors,
    sizes:        finalSizes,
    reviews:      []
  };

  productsDb = [newProduct, ...productsDb];
  return newProduct;
}

// ---------------------------------------------------------------------------
// updateProduct
// ---------------------------------------------------------------------------

/**
 * Updates an existing product.
 */
export async function updateProduct(id, productData) {
  const { name, description, price, category, image, badge, inStock, stockCount, featured, colors, sizes } = productData;
  if (!name || isNaN(Number(price)) || !category) {
    throw new Error("Missing required product fields: name, price, category");
  }

  const finalPrice      = Number(price);
  const finalColors     = colors    || [];
  const finalSizes      = sizes     || [];
  const finalBadge      = badge     || null;
  const finalStockCount = stockCount !== undefined ? Number(stockCount) : 15;
  const finalInStock    = (inStock === true || inStock === 1) && finalStockCount > 0 ? 1 : 0;
  const finalFeatured   = featured  === true || featured  === 1 ? 1 : 0;
  const dummyImage      = image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600";

  if (isRealDb()) {
    const existing = await query("SELECT rating, reviewsCount FROM products WHERE id = ?", [id]);
    if (existing.length === 0) throw new Error("Product not found in database.");

    await query(`
      UPDATE products
      SET name = ?, description = ?, price = ?, category = ?, image = ?, badge = ?,
          inStock = ?, stockCount = ?, featured = ?, colors = ?, sizes = ?
      WHERE id = ?
    `, [
      name, description || "", finalPrice, category, dummyImage, finalBadge,
      finalInStock, finalStockCount, finalFeatured,
      JSON.stringify(finalColors), JSON.stringify(finalSizes), id
    ]);

    // Return the canonical DB record (with existing reviews)
    const updatedList    = await getProducts();
    const updatedProduct = updatedList.find(p => p.id === id);
    return updatedProduct;
  }

  // In-memory fallback
  const originalIndex = productsDb.findIndex(p => p.id === id);
  const rating        = originalIndex !== -1 ? productsDb[originalIndex].rating       : 0;
  const reviewsCount  = originalIndex !== -1 ? productsDb[originalIndex].reviewsCount : 0;
  const reviews       = originalIndex !== -1 ? productsDb[originalIndex].reviews      : [];

  const updatedProduct = {
    id,
    name,
    description:  description || "",
    price:        finalPrice,
    category,
    rating,
    reviewsCount,
    image:        dummyImage,
    badge:        finalBadge,
    inStock:      !!finalInStock,
    stockCount:   finalStockCount,
    featured:     !!finalFeatured,
    colors:       finalColors,
    sizes:        finalSizes,
    reviews
  };

  if (originalIndex !== -1) {
    productsDb[originalIndex] = updatedProduct;
  } else {
    productsDb.push(updatedProduct);
  }

  return updatedProduct;
}

// ---------------------------------------------------------------------------
// deleteProduct
// ---------------------------------------------------------------------------

/**
 * Deletes a product.
 */
export async function deleteProduct(id) {
  if (isRealDb()) {
    await query("DELETE FROM products WHERE id = ?", [id]);
    return { success: true };
  }

  // In-memory fallback
  const index = productsDb.findIndex(p => p.id === id);
  if (index !== -1) productsDb.splice(index, 1);

  return { success: true };
}
