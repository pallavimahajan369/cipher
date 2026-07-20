import React from "react";
import { Star, ShoppingBag, Eye, Heart } from "lucide-react";

export default function ProductCard({ product, onSelectProduct, onAddToCartDirect, isWishlisted = false, onToggleWishlist }) {
  const averageStars = Math.round(product.rating);

  return (
    <div 
      id={`product-card-${product.id}`} 
      className="group bg-[#121212] rounded-none border border-white/5 hover:border-[#C5A059]/35 overflow-hidden transition-all duration-500 flex flex-col h-full shadow-2xl relative"
    >
      {/* Product Image Stage */}
      <div 
        className="relative aspect-[4/5] w-full bg-[#1c1c1c] overflow-hidden cursor-pointer flex items-center justify-center" 
        onClick={() => onSelectProduct(product)}
      >
        
        {/* Elegant status badges */}
        {product.badge && (
          <span className="absolute top-4 left-4 z-10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] bg-white text-black">
            {product.badge}
          </span>
        )}

        {/* Wishlist toggle button */}
        {onToggleWishlist && (
          <button
            id={`btn-wishlist-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-[#C5A059] border border-white/10 text-white hover:text-black transition duration-350 cursor-pointer shadow-md rounded-none"
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-current text-black" : ""}`} />
          </button>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <span className="px-4 py-2 bg-transparent text-[#C5A059] border border-[#C5A059]/60 font-semibold text-xs tracking-[0.2em] uppercase">
              Out of stock
            </span>
          </div>
        )}

        {/* Shadow overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-0 opacity-80" />
        
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 filter brightness-90 group-hover:brightness-100"
        />

        {/* Quick View trigger on hover */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 py-2.5 px-5 bg-white text-black hover:bg-[#C5A059] text-[10px] font-bold uppercase tracking-widest transition-all duration-300 opacity-0 transform translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 flex items-center gap-1.5 shadow-lg z-10">
          <Eye className="h-3 w-3" />
          <span>Quick View</span>
        </div>
      </div>

      {/* Details Box */}
      <div className="p-5 flex flex-col flex-grow">
        
        {/* Category designation */}
        <span className="text-[9px] uppercase tracking-[0.25em] text-[#C5A059] font-semibold mb-1.5">
          {product.category}
        </span>

        {/* Product Name Title */}
        <h3 
          className="text-sm font-medium text-white/90 group-hover:text-white cursor-pointer min-h-[44px] mb-2 font-display transition duration-200 line-clamp-2" 
          onClick={() => onSelectProduct(product)}
        >
          {product.name}
        </h3>

        {/* Rating stars display */}
        <div className="flex items-center gap-1.5 mb-5">
          <div className="flex text-[#C5A059]">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-3 w-3 ${i < averageStars ? "fill-[#C5A059] text-[#C5A059]" : "text-white/10"}`} 
              />
            ))}
          </div>
          <span className="text-[10px] text-white/40 font-mono">
            {product.rating} ({product.reviewsCount})
          </span>
        </div>

        {/* Price & Action button */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[8px] text-white/30 uppercase tracking-widest font-mono">Curated Price</span>
            <span className="text-sm font-medium font-mono text-[#C5A059] mt-0.5">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <button
            id={`btn-add-direct-${product.id}`}
            onClick={() => onAddToCartDirect(product, product.colors[0], product.sizes?.[0])}
            disabled={!product.inStock}
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
              product.inStock
                ? "bg-white text-black hover:bg-[#C5A059] hover:text-black cursor-pointer shadow-md"
                : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
            }`}
          >
            <ShoppingBag className="h-3 w-3" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
