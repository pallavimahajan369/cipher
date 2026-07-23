import React, { useState } from "react";
import { ShoppingBag, Search, Sparkles, Clock, User, LogOut, ChevronDown, ShieldAlert, Heart } from "lucide-react";

export default function Navbar({
  cartCount,
  onOpenCart,
  onOpenAdvisor,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  onViewOrders,
  hasOrders,
  currentUser,
  onOpenLoginModal,
  onLogout,
  isAdminOpen,
  onOpenAdmin,
  wishlistCount = 0,
  onOpenWishlist
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const categories = ["All", "Minimalist Tech", "Lifestyle & Apparel", "Curated Home"];

  return (
    <header id="aura-header" className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand ID with Elegant Serif style */}
          <div className="flex items-center gap-10 cursor-pointer" onClick={() => { setActiveCategory("All"); if (onOpenAdmin) onOpenAdmin(false); }}>
            <span className="font-serif text-2xl tracking-tighter text-white italic">
              AURA<span className="text-[#C5A059] not-italic font-bold">.</span>
            </span>
            
            {/* Desktop Category Navigation */}
            <nav className="hidden lg:flex items-center gap-8 text-xs uppercase tracking-widest text-white/50">
              {categories.map((cat) => (
                <button
                  id={`cat-btn-${cat.toLowerCase().replace(/[^a-z0-9]/g, "")}`}
                  key={cat}
                  onClick={() => { setActiveCategory(cat); if (onOpenAdmin) onOpenAdmin(false); }}
                  className={`hover:text-white transition duration-200 cursor-pointer ${
                    activeCategory === cat ? "text-[#C5A059] font-bold" : ""
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>

          {/* Search Input bar & Utility Controls */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Desktop Search bar */}
            <div className="relative hidden md:block w-48 lg:w-60">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/40">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                id="navbar-search-input"
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-4 py-2 bg-white/5 hover:bg-white/10 focus:bg-white/10 text-white placeholder-white/40 border border-white/10 focus:border-[#C5A059]/50 rounded-none transition-all outline-none font-sans"
              />
            </div>

            {/* AI Advisor Trigger */}
            <button
              id="btn-trigger-ai"
              onClick={onOpenAdvisor}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#C5A059]/10 to-[#C5A059]/20 hover:from-[#C5A059]/20 hover:to-[#C5A059]/30 border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer"
              title="Speak with Aura AI Advisor"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-[#C5A059]" />
              <span className="hidden sm:inline">AI Advisor</span>
            </button>

            {/* Admin Console Switcher - Exclusively shown for authenticated Administrators */}
            {currentUser?.isAdmin && (
              <button
                id="btn-trigger-admin-panel"
                onClick={() => onOpenAdmin ? onOpenAdmin(!isAdminOpen) : null}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer ${
                  isAdminOpen 
                    ? "bg-[#C5A059] text-black border-transparent font-bold" 
                    : "bg-white/5 border border-white/10 text-white/85 hover:text-white hover:bg-white/10"
                }`}
                title="Aura Showroom and Catalog Admin Desk"
              >
                <ShieldAlert className={`h-3.5 w-3.5 ${isAdminOpen ? "text-black" : "text-[#C5A059]"}`} />
                <span className="hidden md:inline">Admin Console</span>
              </button>
            )}

            {/* Member Account / Authentications Trigger */}
            <div className="relative">
              {currentUser ? (
                <div className="relative">
                  <button
                    id="btn-navbar-member-profile"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-all duration-300 cursor-pointer"
                  >
                    <img 
                      src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/micah/svg?seed=${currentUser.username}`} 
                      alt="Avatar" 
                      className="h-5 w-5 rounded-full object-cover bg-white/10 border border-white/20"
                    />
                    <span className="text-xs font-semibold hidden md:inline max-w-[100px] truncate">
                      {currentUser.fullName.split(" ")[0]}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-white/50" />
                  </button>

                  {/* Sleek Dark Dropdown Portal */}
                  {isProfileOpen && (
                    <div 
                      id="navbar-profile-dropdown"
                      className="absolute right-0 mt-3 w-64 bg-[#0F0F0F] border border-white/10 rounded-lg shadow-2xl p-4 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      <div className="flex items-center gap-3 pb-3 border-b border-white/5 mb-3">
                        <img 
                          src={currentUser.avatarUrl} 
                          alt="Avatar Large" 
                          className="h-10 w-10 rounded-full bg-white/5 border border-white/10"
                        />
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-white truncate">{currentUser.fullName}</h4>
                          <p className="text-[10px] text-white/40 truncate">@{currentUser.username}</p>
                          <span className="inline-block mt-1 text-[9px] font-mono tracking-widest uppercase bg-[#C5A059]/10 text-[#C5A059] px-1.5 py-0.5 rounded">
                            VAULT MEMBER
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-white/70 mb-3">
                        <div className="flex justify-between py-1 text-[11px]">
                          <span className="text-white/40">Registered Email:</span>
                          <span className="text-white truncate max-w-[130px]" title={currentUser.email}>{currentUser.email}</span>
                        </div>
                        {currentUser.preferredVibe && (
                          <div className="flex justify-between py-1 text-[11px]">
                            <span className="text-white/40">Preferred Vibe:</span>
                            <span className="text-[#C5A059]">{currentUser.preferredVibe}</span>
                          </div>
                        )}
                      </div>

                      <button
                        id="btn-navbar-logout"
                        onClick={() => {
                          setIsProfileOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 text-red-400 transition-all font-semibold rounded cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out of Vault
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="btn-navbar-launch-login"
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-2 px-4 py-2 border border-[#C5A059]/30 hover:border-[#C5A059]/80 text-[#C5A059] hover:bg-[#C5A059]/10 text-xs font-semibold uppercase tracking-wider rounded-full transition-all duration-300"
                  title="Sign in as Vault Member"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Sign In</span>
                </button>
              )}
            </div>

            {/* Past Orders Tab */}
            <button
              id="btn-view-purchases"
              onClick={onViewOrders}
              className={`relative p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center ${
                hasOrders 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title="Order History"
            >
              <Clock className="h-4 w-4" />
              {hasOrders && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>

            {/* Wishlist Trigger Button */}
            <button
              id="btn-navbar-wishlist"
              onClick={onOpenWishlist}
              className={`relative p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${
                wishlistCount > 0 
                  ? "bg-[#C5A059]/15 border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/25" 
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title="Your Curated Wishlist"
            >
              <Heart className={`h-4 w-4 ${wishlistCount > 0 ? "fill-current" : ""}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C5A059] text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center font-mono border border-black">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              id="btn-navbar-cart"
              onClick={onOpenCart}
              className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full border border-white/10 transition-all duration-300"
              title="Open Chamber"
            >
              <span className="text-xs font-semibold tracking-wider font-display uppercase hidden sm:inline">CART</span>
              <ShoppingBag className="h-4 w-4 text-[#C5A059]" />
              <span className="bg-[#C5A059] text-[#0A0A0A] text-[10px] px-1.5 py-0.5 rounded-full font-black font-mono">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex lg:hidden flex-col gap-2 pb-4 pt-1 border-t border-white/5">
          <div className="relative w-full md:hidden">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/40">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              id="navbar-search-mobile"
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-4 py-2 bg-white/5 hover:bg-white/10 focus:bg-white/10 text-white placeholder-white/30 border border-white/5 rounded-none transition-all outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                id={`cat-mobile-${cat.toLowerCase().replace(/[^a-z0-9]/g, "")}`}
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-none uppercase tracking-wider text-[11px] transition duration-200 ${
                  activeCategory === cat
                    ? "bg-[#C5A059] text-black font-semibold"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
