import React, { useState, useEffect, useRef } from "react";
import { 
  X, Minus, Plus, Trash, CreditCard, Sparkles, Star, 
  Send, CheckCircle, Clock, Gift, ShieldCheck, Heart,
  User as UserIcon, Lock, Mail
} from "lucide-react";
import Navbar from "./components/Navbar";
import BannerCarousel from "./components/BannerCarousel";
import ProductCard from "./components/ProductCard";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // --- Authentication States ---
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ usernameOrEmail: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    preferredVibe: 'Minimalist Tech'
  });
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // --- Product & Store States ---
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // --- Cart States ---
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [activeDiscount, setActiveDiscount] = useState(null);
  const [discountError, setDiscountError] = useState("");
  const [discountSuccess, setDiscountSuccess] = useState("");

  // --- Quick Select Options for Modal ---
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // --- Review Form State ---
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // --- Checkout States ---
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    fullName: "",
    addressLine: "",
    city: "",
    postalCode: "",
    country: "United States"
  });
  const [creditCardForm, setCreditCardForm] = useState({
    cardNumber: "",
    expiry: "",
    cvv: ""
  });
  const [checkoutError, setCheckoutError] = useState("");
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  // --- Orders Tracking List ---
  const [orders, setOrders] = useState([]);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // --- AI Advisor Chat States ---
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: "welcome-msg",
      sender: "assistant",
      text: "Welcome to **Aura**. I am your personal stylist, architectural scent curation guide, and workspace optimizer. Tell me what vibe or function you are looking to cultivate in your space or wardrobe, and I will recommend perfectly curated items.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // --- Load Products and Orders on Boot ---
  useEffect(() => {
    fetchProducts();
    
    // Load user session if saved
    try {
      const savedUser = localStorage.getItem("aura_current_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed loading active user session", e);
    }
    
    // Load local storage orders if any exist
    try {
      const savedOrders = localStorage.getItem("aura_curated_orders");
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch (e) {
      console.error("Failed loading order history", e);
    }
  }, []);

  // Set default details when Selected Product shifts
  useEffect(() => {
    if (selectedProduct) {
      setSelectedColor(selectedProduct.colors[0] || "");
      setSelectedSize(selectedProduct.sizes?.[0] || "");
      setReviewError("");
    }
  }, [selectedProduct]);

  // Scroll to bottom of AI chat log
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isChatLoading]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Could not retrieve catalog");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Products Load Error:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // --- Auth Handlers ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setIsSubmittingAuth(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login verification failed.");
      }

      setCurrentUser(data.user);
      localStorage.setItem("aura_current_user", JSON.stringify(data.user));
      setAuthSuccess("Authentication approved. Welcome back!");
      
      // Auto-prefill shipping form
      setShippingForm((prev) => ({
        ...prev,
        fullName: data.user.fullName
      }));

      // Prefill review author
      setReviewAuthor(data.user.fullName);

      // Auto welcome assistant message update
      setChatHistory((prev) => [
        ...prev,
        {
          id: `auth-success-${Date.now()}`,
          sender: "assistant",
          text: `Greetings, **${data.user.fullName}**. I have synced with your Aura Vault profile. Let me know if you would like specialized stylist recommendations for your preferred style segment (${data.user.preferredVibe}).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Close modal on brief delay
      setTimeout(() => {
        setIsLoginModalOpen(false);
        setLoginForm({ usernameOrEmail: "", password: "" });
        setAuthSuccess("");
      }, 1200);

    } catch (err) {
      setAuthError(err.message || "An authentication issue occurred.");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setIsSubmittingAuth(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration validation failed.");
      }

      // Automatically sign in the newly registered profile
      setCurrentUser(data.user);
      localStorage.setItem("aura_current_user", JSON.stringify(data.user));
      setAuthSuccess("Member registered successfully! Entry granted.");

      // Auto-prefill shipping properties
      setShippingForm((prev) => ({
        ...prev,
        fullName: data.user.fullName
      }));

      // Prefill review author
      setReviewAuthor(data.user.fullName);

      // Welcome chat message
      setChatHistory((prev) => [
        ...prev,
        {
          id: `auth-reg-success-${Date.now()}`,
          sender: "assistant",
          text: `Welcome, **${data.user.fullName}**, to the Aura Curated Store! Your profile is actively curated. Feel free to explore our Minimalist Tech, Lifestyle and Curated Home lines.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      setTimeout(() => {
        setIsLoginModalOpen(false);
        setRegisterForm({
          username: "",
          password: "",
          email: "",
          fullName: "",
          preferredVibe: "Minimalist Tech"
        });
        setAuthSuccess("");
      }, 1500);

    } catch (err) {
      setAuthError(err.message || "Could not complete registration.");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("aura_current_user");
    
    // Clear prefilled forms
    setShippingForm((prev) => ({
      ...prev,
      fullName: ""
    }));
    setReviewAuthor("");

    // Add logging state message to chatbot
    setChatHistory((prev) => [
      ...prev,
      {
        id: `auth-logout-${Date.now()}`,
        sender: "assistant",
        text: "You have signed out of the Aura Vault. You are exploring as an anonymous guest curator.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // --- Cart Actions ---
  const handleAddToCart = (product, color, size) => {
    const itemColor = color || product.colors[0] || "";
    const itemSize = size || product.sizes?.[0] || "";
    const cartItemId = `${product.id}-${itemColor}-${itemSize}`;

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((item) => item.id === cartItemId);
      if (existingIdx !== -1) {
        const copy = [...prevCart];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [...prevCart, {
        id: cartItemId,
        product,
        quantity: 1,
        selectedColor: itemColor,
        selectedSize: itemSize
      }];
    });

    // Automatically trigger notification side effects
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (itemId, amount) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === itemId) {
          const nextQty = item.quantity + amount;
          return nextQty > 0 ? { ...item, quantity: nextQty } : item;
        }
        return item;
      }).filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  // --- Calculations ---
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = activeDiscount ? (cartSubtotal * activeDiscount.percent) / 100 : 0;
  const deliveryTax = (cartSubtotal - discountAmount) * 0.08; // 8% sales tax
  const shippingFee = cartSubtotal > 150 || cartSubtotal === 0 ? 0 : 15; // Free shipping above $150
  const cartTotal = cartSubtotal - discountAmount + deliveryTax + shippingFee;

  // --- Discount Code Validator ---
  const applyPromoCode = async () => {
    if (!discountCodeInput) return;
    setDiscountError("");
    setDiscountSuccess("");
    try {
      const res = await fetch("/api/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCodeInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setDiscountError(data.error || "Failed to validate promo coupon.");
      } else {
        setActiveDiscount({ code: data.code, percent: data.discountPercent });
        setDiscountSuccess(`Coupon applied! Enjoy ${data.discountPercent}% off.`);
        setDiscountCodeInput("");
      }
    } catch (err) {
      setDiscountError("Server check unavailable.");
    }
  };

  // --- Submit Dynamic Review to Backend ---
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!reviewAuthor.trim() || !reviewComment.trim()) {
      setReviewError("Please complete all feedback fields.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");

    try {
      const res = await fetch(`/api/products/${selectedProduct.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: reviewAuthor,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Failed to submit report.");
      } else {
        // Update product in general lists and selection modal state
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? data.updatedProduct : p));
        setSelectedProduct(data.updatedProduct);
        
        // Reset form variables
        setReviewAuthor("");
        setReviewComment("");
        setReviewRating(5);
      }
    } catch (err) {
      setReviewError("Our backend is undergoing server improvements, please try again shortly.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // --- Real Checkout handler ---
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setCheckoutError("");

    if (!shippingForm.fullName || !shippingForm.addressLine || !shippingForm.city || !shippingForm.postalCode) {
      setCheckoutError("Please provide absolute shipping address parameters.");
      return;
    }

    if (!creditCardForm.cardNumber || creditCardForm.cardNumber.length < 15 || !creditCardForm.expiry || !creditCardForm.cvv) {
      setCheckoutError("Please provide a valid simulated Credit Card identifier.");
      return;
    }

    setIsProcessingCheckout(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cart,
          shippingAddress: shippingForm,
          paymentDetails: creditCardForm
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || "Simulation authorization failed.");
      } else {
        // Construct Order Data Record
        const newOrder = {
          id: data.orderId,
          date: new Date().toISOString().split("T")[0],
          items: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
            image: item.product.image
          })),
          subtotal: cartSubtotal,
          discount: discountAmount,
          tax: deliveryTax,
          shipping: shippingFee,
          total: cartTotal,
          status: "Processing",
          shippingAddress: shippingForm,
          paymentMethod: `Card ending in ${creditCardForm.cardNumber.slice(-4)}`
        };

        const updatedOrders = [newOrder, ...orders];
        setOrders(updatedOrders);
        localStorage.setItem("aura_curated_orders", JSON.stringify(updatedOrders));

        setCart([]);
        setActiveDiscount(null);
        setLastPlacedOrder(newOrder);
        setIsCheckoutOpen(false);
      }
    } catch (err) {
      setCheckoutError("Secure checkout service lost. Please retry.");
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // --- AI Stylist Chat handler ---
  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    const originalInput = chatInput;
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: originalInput,
          chatHistory: chatHistory.map(m => ({ role: m.sender, text: m.text }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Advisor error");

      const systemMsg = {
        id: `sys-${Date.now()}`,
        sender: "assistant",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProductIds: data.recommendedProductIds || []
      };

      setChatHistory(prev => [...prev, systemMsg]);
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: "I am having trouble accessing our private design archives at the moment. Please ensure your `GEMINI_API_KEY` is loaded correctly in the Settings secrets and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Filter Catalog Products
  const filteredProducts = products.filter((prod) => {
    const matchCat = activeCategory === "All" || prod.category === activeCategory;
    const matchSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        prod.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div id="aura-viewport" className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] font-sans antialiased pb-20 relative">
      
      {/* Dynamic Navigation Bar Component */}
      <Navbar 
        cartCount={cart.reduce((s, c) => s + c.quantity, 0)} 
        onOpenCart={() => { setIsCartOpen(true); setIsAdvisorOpen(false); setIsOrdersOpen(false); setIsAdminOpen(false); }}
        onOpenAdvisor={() => { setIsAdvisorOpen(true); setIsCartOpen(false); setIsOrdersOpen(false); setIsAdminOpen(false); }}
        activeCategory={activeCategory}
        setActiveCategory={(cat) => {
          setActiveCategory(cat);
          setIsAdminOpen(false); // Close Admin Panel when shifting catalog category
          // Scroll smoothly to catalog
          const target = document.getElementById("catalog-grid-row");
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onViewOrders={() => { setIsOrdersOpen(true); setIsCartOpen(false); setIsAdvisorOpen(false); setIsAdminOpen(false); }}
        hasOrders={orders.length > 0}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isAdminOpen={isAdminOpen}
        onToggleAdmin={() => {
          setIsAdminOpen(!isAdminOpen);
          setIsCartOpen(false);
          setIsAdvisorOpen(false);
          setIsOrdersOpen(false);
        }}
      />

      {/* Admin Module Division */}
      {isAdminOpen ? (
        <AdminPanel onProductChange={fetchProducts} />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-12">
        
        {/* Banner Cinematic Slider */}
        <BannerCarousel 
          onCategorySelect={(cat) => {
            setActiveCategory(cat);
            const target = document.getElementById("catalog-grid-row");
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onOpenAdvisor={() => setIsAdvisorOpen(true)}
        />

        {/* Promo Code Flash Tip Bar */}
        <div id="info-promo-bar" className="bg-[#121212] border border-white/5 py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C5A059]/20 rounded-none text-[#C5A059]">
              <Gift className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-white">Seasonal Designer Unlocks</p>
              <p className="text-[11px] text-white/50">Unlock bespoke discount codes for simulated test checkout flows.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap text-[10px] uppercase font-mono font-bold tracking-wider">
            <span className="px-3 py-1.5 bg-white/5 text-[#E0E0E0] border border-white/10">10% Off: <span className="text-[#C5A059]">SAVE10</span></span>
            <span className="px-3 py-1.5 bg-white/5 text-[#E0E0E0] border border-white/10">15% Off: <span className="text-[#C5A059]">WELCOME15</span></span>
            <span className="px-3 py-1.5 bg-white/5 text-[#E0E0E0] border border-white/10">25% Off: <span className="text-[#C5A059]">AURA25</span></span>
          </div>
        </div>

        {/* Grid Title Row */}
        <div id="catalog-grid-row" className="pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-bold">The Curated Collection</span>
              <h2 className="text-2xl font-serif italic text-white mt-1">
                {activeCategory === "All" ? "New Season Masterpieces" : activeCategory}
              </h2>
            </div>
            {searchQuery && (
              <span className="text-xs bg-white/5 px-4 py-1.5 text-white/60 border border-white/10 uppercase tracking-widest font-mono">
                Found {filteredProducts.length} matches for "{searchQuery}"
              </span>
            )}
          </div>

          {/* Loader Placeholder or Products Grid */}
          {isLoadingProducts ? (
            <div className="py-24 text-center">
              <div className="h-8 w-8 border-2 border-dashed border-[#C5A059] border-t-transparent animate-spin mx-auto mb-4 rounded-full"></div>
              <p className="text-xs uppercase tracking-widest text-[#C5A059]">Loading archival records...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-white/10 bg-[#121212]/30">
              <p className="text-sm font-serif italic text-white/40 mb-2">No elements configured to current criteria.</p>
              <button 
                onClick={() => { setActiveCategory("All"); setSearchQuery(""); }} 
                className="text-xs text-[#C5A059] underline tracking-widest uppercase"
              >
                Reset catalog filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((prod) => (
                <ProductCard 
                  key={prod.id} 
                  product={prod} 
                  onSelectProduct={setSelectedProduct} 
                  onAddToCartDirect={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cinematic Lookbook Showcase Division */}
        <section id="aesthetic-film-showcase" className="grid grid-cols-1 md:grid-cols-2 border border-white/10 bg-[#121212]">
          <div className="p-10 sm:p-16 flex flex-col justify-center gap-6 border-r border-white/10">
            <span className="text-[#C5A059] text-[10px] font-bold uppercase tracking-[0.3em]">Exquisite Curation</span>
            <h3 className="text-4xl font-serif leading-tight text-white italic">
              Designed for <br />
              <span className="not-italic text-[#C5A059] font-medium">Permanence</span>
            </h3>
            <p className="text-sm text-white/40 leading-relaxed font-sans max-w-sm">
              We work hand-in-hand with individual ceramic artists and highweight garment engineers to ensure every thread, switch, and candle clay vessel maintains sensory value.
            </p>
            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setIsAdvisorOpen(true)}
                className="bg-white hover:bg-[#C5A059] text-black text-[11px] font-semibold uppercase tracking-widest px-8 py-3.5 transition"
              >
                Chat with Assistant
              </button>
              <button 
                onClick={() => handleAddToCart(products.find(p => p.id === "prod-8") || products[0])}
                className="bg-white/5 border border-white/20 hover:bg-white/10 text-white text-[11px] font-semibold uppercase tracking-widest px-8 py-3.5 transition"
              >
                Featured Vase
              </button>
            </div>
          </div>
          <div className="bg-[#1c1c1c] aspect-video md:aspect-auto min-h-[300px] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/80 to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=800" 
              className="absolute inset-0 object-cover w-full h-full filter brightness-75 contrast-125 hover:scale-105 transition duration-[2s]"
              alt="Japanese Hinoki Moss Atmosphere" 
            />
            <div className="absolute bottom-6 left-6 z-20 text-left">
              <p className="text-[9px] uppercase tracking-wider text-white/40">In-Depth Craftsmanship</p>
              <p className="text-sm font-serif italic text-white">Hinoki Scented Clay Vessels</p>
            </div>
          </div>
        </section>
      </main>
      )}

      {/* --- SIDEBAR 1: SMART CARTER DRAWER --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="cart-sidebar-container">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#121212] border-l border-white/10 shadow-2xl flex flex-col animate-slideInRight text-white h-full">
              
              {/* Header */}
              <div className="h-20 border-b border-white/10 flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg tracking-tighter italic">Your Chamber</span>
                  <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-widest bg-white/5 px-2 py-0.5 border border-white/15">
                    {cart.reduce((s, c) => s + c.quantity, 0)} Items
                  </span>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 border border-white/10 text-white/50 hover:text-white hover:bg-white/5">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-72 flex flex-col justify-center items-center text-center opacity-65">
                    <p className="text-sm font-serif italic text-white/40 mb-3">Your curation portfolio is empty.</p>
                    <button 
                      onClick={() => setIsCartOpen(false)} 
                      className="text-xs uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 px-4 py-2 hover:bg-[#C5A059]/10 transition"
                    >
                      Acquire Masterpieces
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-[#0A0A0A] p-3 border border-white/5 rounded-none relative group">
                      <div className="h-20 w-16 bg-[#1C1C1C] flex-shrink-0 border border-white/10">
                        <img src={item.product.image} className="h-full w-full object-cover filter brightness-90" alt="" />
                      </div>
                      <div className="flex-grow flex flex-col min-w-0">
                        <span className="text-[9px] uppercase tracking-widest text-[#C5A059] font-medium">{item.product.category}</span>
                        <h4 className="text-xs font-medium text-white/85 truncate font-display mb-1">{item.product.name}</h4>
                        
                        {/* Selected variations */}
                        <div className="flex gap-2 text-[9px] text-white/50 mb-2 font-mono uppercase">
                          {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                          {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                        </div>

                        {/* Adjust qty & price */}
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center border border-white/10 text-xs">
                            <button onClick={() => handleUpdateQuantity(item.id, -1)} className="px-2 py-0.5 text-white/40 hover:text-white hover:bg-white/5">-</button>
                            <span className="px-2 font-mono text-[11px] text-white/80">{item.quantity}</span>
                            <button onClick={() => handleUpdateQuantity(item.id, 1)} className="px-2 py-0.5 text-white/40 hover:text-white hover:bg-white/5">+</button>
                          </div>
                          <span className="text-xs font-mono font-medium text-[#C5A059]">${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleRemoveFromCart(item.id)} 
                        className="absolute right-3 top-3 p-1 opacity-0 group-hover:opacity-100 Transition text-white/40 hover:text-red-400 font-mono text-[10px]"
                        title="Remove unit"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Promo Coupon Check and Summary Block */}
              {cart.length > 0 && (
                <div className="border-t border-white/10 bg-[#0F0F0F] p-6 space-y-4">
                  {/* Coupon box */}
                  <div className="flex gap-2">
                    <input 
                      id="promo-input-field"
                      type="text" 
                      placeholder="Coupon Code" 
                      value={discountCodeInput}
                      onChange={(e) => setDiscountCodeInput(e.target.value)}
                      className="bg-white/5 border border-white/10 text-xs px-3 py-2 text-white placeholder-white/30 rounded-none flex-grow"
                    />
                    <button 
                      onClick={applyPromoCode}
                      className="bg-white text-black hover:bg-[#C5A059] px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition"
                    >
                      Apply
                    </button>
                  </div>
                  
                  {discountError && <p className="text-[10px] text-red-400 font-mono">{discountError}</p>}
                  {discountSuccess && <p className="text-[10px] text-emerald-400 font-mono">{discountSuccess}</p>}

                  {/* Pricing Breakdown */}
                  <div className="space-y-2 text-xs font-mono border-t border-white/5 pt-3">
                    <div className="flex justify-between text-white/50">
                      <span>Subtotal</span>
                      <span>${cartSubtotal.toFixed(2)}</span>
                    </div>
                    {activeDiscount && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount ({activeDiscount.code})</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white/50">
                      <span>Tax (8%)</span>
                      <span>${deliveryTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white/50">
                      <span>Shipping</span>
                      <span>{shippingFee === 0 ? "FREE" : `$${shippingFee.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-white border-t border-white/15 pt-2">
                      <span className="font-serif italic font-normal">Vault Total</span>
                      <span className="text-[#C5A059]">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                    className="w-full bg-[#C5A059] hover:bg-[#D1B072] text-[#0A0A0A] font-bold text-xs uppercase tracking-widest py-4 transition shadow-lg"
                  >
                    Proceed to Simulated Checkout
                  </button>
                  <p className="text-center text-[9px] text-white/30 tracking-wider">SECURE MOCK CRYPTOGRAPHY TRANSACTION PANEL</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR 2: AI STYLIST & SHOPPING ADVISOR --- */}
      {isAdvisorOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="advisor-sidebar-container">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsAdvisorOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-[#0F0F0F] border-l border-white/10 shadow-2xl flex flex-col animate-slideInRight h-full text-white">
              
              {/* Header */}
              <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 bg-[#0A0A0A]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#C5A059]/10 rounded-full text-[#C5A059] animate-pulse">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base text-white font-medium italic">Aura Advisor</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Powered by Gemini AI</p>
                  </div>
                </div>
                <button onClick={() => setIsAdvisorOpen(false)} className="p-2 border border-white/10 text-white/50 hover:text-white hover:bg-white/5">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Dialogue Log Window */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0A0A0A]/50 no-scrollbar">
                {chatHistory.map((item) => (
                  <div key={item.id} className={`flex flex-col ${item.sender === "user" ? "items-end" : "items-start"}`}>
                    <div className={`p-4 max-w-[85%] text-xs leading-relaxed ${
                      item.sender === "user" 
                        ? "bg-[#C5A059] text-black font-semibold rounded-none" 
                        : "bg-[#161616] text-white/90 border border-white/5"
                    }`}>
                      <div className="prose prose-invert prose-xs text-xs font-sans">
                        {/* Standard simplified Markdown translator */}
                        {item.text.split("\n").map((line, idx) => {
                          let clean = line;
                          // simple bold check
                          const boldMatches = line.match(/\*\*(.*?)\*\*/g);
                          if (boldMatches) {
                            boldMatches.forEach(match => {
                              const w = match.replace(/\*\*/g, "");
                              clean = clean.replace(match, `<strong class="text-[#C5A059]">${w}</strong>`);
                            });
                          }
                          return (
                            <p 
                              key={idx} 
                              className="mb-1 last:mb-0"
                              dangerouslySetInnerHTML={{ __html: clean }} 
                            />
                          );
                        })}
                      </div>

                      {/* Deep Grounded Suggestions Grid inside Assistant Bubble */}
                      {item.recommendedProductIds && item.recommendedProductIds.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                          <p className="text-[10px] text-[#C5A059] font-semibold uppercase tracking-wider">Advisory Curated Selections:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {item.recommendedProductIds.map(recId => {
                              const p = products.find(prod => prod.id === recId);
                              if (!p) return null;
                              return (
                                <div key={recId} className="flex items-center gap-3 bg-[#0A0A0A] p-2 border border-white/5 hover:border-[#C5A059]/30 transition text-white">
                                  <img src={p.image} className="w-10 h-12 object-cover object-center filter brightness-90" alt="" />
                                  <div className="flex-grow min-w-0">
                                    <p className="text-[11px] font-medium font-display truncate text-white">{p.name}</p>
                                    <p className="text-[10px] text-white/40 font-mono">${p.price.toFixed(2)}</p>
                                  </div>
                                  <button 
                                    className="bg-white/10 hover:bg-white text-white hover:text-black p-1.5 text-[9px] font-bold uppercase transition"
                                    onClick={() => setSelectedProduct(p)}
                                    title="View Details"
                                  >
                                    View
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-white/30 font-mono mt-1 px-1">{item.timestamp}</span>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex flex-col items-start">
                    <div className="bg-[#161616] p-4 text-xs text-white/50 border border-white/5 rounded-none flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 bg-[#C5A059] rounded-full animate-bounce"></span>
                        <span className="h-1.5 w-1.5 bg-[#C5A059] rounded-full animate-bounce delay-150"></span>
                        <span className="h-1.5 w-1.5 bg-[#C5A059] rounded-full animate-bounce delay-300"></span>
                      </div>
                      <span className="italic text-[11px]">Personal Assistant drafting recommendations...</span>
                    </div>
                  </div>
                )}
                
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Send Form */}
              <form onSubmit={sendChatMessage} className="p-4 bg-[#0A0A0A] border-t border-white/10 flex gap-2">
                <input 
                  id="chat-advisory-input"
                  type="text" 
                  placeholder="Ask advisor: 'What fits a warm oat aesthetic?'" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatLoading}
                  className="bg-white/5 border border-white/10 text-xs px-4 py-3 text-white placeholder-white/30 rounded-none flex-grow focus:border-[#C5A059]/40 outline-none font-sans"
                />
                <button 
                  type="submit" 
                  disabled={isChatLoading || !chatInput.trim()}
                  className="bg-[#C5A059] text-black hover:bg-[#D1B072] disabled:opacity-40 px-4 flex items-center justify-center transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR 3: PAST ORDERS HISTORY RECEIPT VIEW --- */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="orders-sidebar-container">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsOrdersOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#121212] border-l border-white/10 shadow-2xl flex flex-col animate-slideInRight text-white h-full">
              
              <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 bg-[#0A0A0A]">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg tracking-tighter italic">Receipt Book</span>
                  <span className="text-[10px] font-mono text-[#E5C079] uppercase tracking-widest bg-white/5 px-2 py-0.5 border border-white/15">
                     Archived Tracks
                  </span>
                </div>
                <button onClick={() => setIsOrdersOpen(false)} className="p-2 border border-white/10 text-white/50 hover:text-white hover:bg-white/5">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Order Lists dynamic rendering */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {orders.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center text-white/40">
                    <Clock className="h-10 w-10 text-white/20 mb-3" />
                    <p className="text-sm font-serif italic">Your ledger is completely offline.</p>
                    <p className="text-[10px] text-white/20 uppercase mt-1">Submit a simulated order to spawn a receipt.</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="border border-white/10 bg-[#0A0A0A] p-4 text-xs font-mono">
                      
                      {/* Top Bar Header block */}
                      <div className="flex justify-between border-b border-white/5 pb-2 mb-3">
                        <div>
                          <p className="text-[#C5A059] font-bold text-[11px]">{order.id}</p>
                          <p className="text-[9px] text-white/40">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[9px] uppercase tracking-wider">
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2 mb-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-white/70">
                            <span className="truncate max-w-[200px]">
                              {item.quantity}x {item.productName}
                              {item.selectedColor && <span className="text-[9px] text-white/30 uppercase ml-1">({item.selectedColor})</span>}
                            </span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Totals Breakdown list */}
                      <div className="space-y-1 text-white/40 border-t border-white/5 pt-3 mb-2 font-mono text-[10px]">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-emerald-400">
                            <span>Promo Discount</span>
                            <span>-${order.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Simulated Tariffs</span>
                          <span>${order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Freight Logistics</span>
                          <span>{order.shipping === 0 ? "FREE" : `$${order.shipping.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between text-white font-semibold text-xs border-t border-white/10 pt-2">
                          <span className="text-[#C5A059]">Aggregate Paid</span>
                          <span className="text-[#C5A059]">${order.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Client Destination */}
                      <div className="bg-white/5 p-2 text-[10px] text-white/40 border border-white/5 space-y-0.5 font-sans">
                        <p className="text-white/70 font-semibold">{order.shippingAddress.fullName}</p>
                        <p>{order.shippingAddress.addressLine}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                        <p className="text-[#C5A059] font-mono text-[9px] mt-1.5 uppercase">Simulated Method: {order.paymentMethod}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- MODAL A: PRODUCT QUICK VIEW DIALOG --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="details-modal-wrapper">
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity" onClick={() => setSelectedProduct(null)} />
          <div className="bg-[#121212] border border-white/10 max-w-4xl w-full relative z-10 grid grid-cols-1 md:grid-cols-2 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            
            {/* Close Button top-right */}
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute right-4 top-4 p-2 z-20 border border-white/10 bg-black text-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left Frame: Premium Product Art Stage */}
            <div className="bg-[#1c1c1c] p-6 flex flex-col justify-center items-center relative min-h-[350px]">
              <div className="absolute top-4 left-4 text-[9px] uppercase tracking-widest text-[#C5A059] font-bold border border-[#C5A059]/40 bg-black/40 px-2 py-0.5">
                {selectedProduct.category}
              </div>
              <img 
                src={selectedProduct.image} 
                alt={selectedProduct.name} 
                className="w-full max-w-[320px] aspect-square object-cover filter brightness-95 rounded-none border border-white/5"
              />
            </div>

            {/* Right Frame: Functional Content and Review Ledger */}
            <div className="p-6 md:p-8 flex flex-col border-t md:border-t-0 md:border-l border-white/10 overflow-y-auto max-h-[85vh] no-scrollbar">
              
              <div className="border-b border-white/5 pb-4 mb-4">
                <span className="text-[10px] uppercase font-mono text-[#C5A059] tracking-widest">AURA ARCHIVAL SELECTION</span>
                <h3 className="text-xl font-serif text-white italic mt-1">{selectedProduct.name}</h3>
                <p className="text-lg font-mono font-bold text-[#C5A059] mt-2">${selectedProduct.price.toFixed(2)}</p>
                <p className="text-xs text-white/50 leading-relaxed mt-3 font-sans">{selectedProduct.description}</p>
              </div>

              {/* Variations selector */}
              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-2">Architectural Colorway</span>
                  <div className="flex gap-2.5">
                    {selectedProduct.colors.map((col) => (
                      <button
                        key={col}
                        onClick={() => setSelectedColor(col)}
                        className={`px-3 py-1.5 text-xs font-medium border uppercase tracking-wider transition rounded-none ${
                          selectedColor === col
                            ? "bg-[#C5A059] text-black border-transparent font-bold"
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedProduct.sizes && (
                  <div>
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-2">Sizing Scale</span>
                    <div className="flex gap-2">
                       {selectedProduct.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`min-w-10 px-3 py-1.5 text-xs font-mono border transition rounded-none ${
                            selectedSize === s
                              ? "bg-[#C5A059] text-black border-transparent font-bold"
                              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase button control */}
              <button
                disabled={!selectedProduct.inStock}
                onClick={() => {
                  handleAddToCart(selectedProduct, selectedColor, selectedSize);
                  setSelectedProduct(null);
                }}
                className={`w-full py-3 text-xs font-bold uppercase tracking-widest mb-6 transition shadow-md ${
                  selectedProduct.inStock
                    ? "bg-white hover:bg-[#C5A059] text-black"
                    : "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
                }`}
              >
                {selectedProduct.inStock 
                  ? `Integrate into Chamber • $${selectedProduct.price.toFixed(2)}` 
                  : "Unavailable / Out of Stock"}
              </button>

              {/* --- Reviews Expansion Ledger --- */}
              <div className="border-t border-white/10 pt-5 mt-4 space-y-4">
                <div className="flex justify-between items-center bg-[#0A0A0A]/30 p-2 border border-white/5">
                  <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">Feedback Reports ({selectedProduct.reviewsCount})</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-[#C5A059] text-[#C5A059]" />
                    <span className="text-xs font-mono text-white">{selectedProduct.rating} / 5</span>
                  </div>
                </div>

                {/* Submitting review list scroll */}
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 no-scrollbar">
                  {selectedProduct.reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-[#0A0A0A] border border-white/5">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="font-semibold text-white/95">{rev.author}</span>
                        <div className="flex text-[#C5A059]">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="h-2.5 w-2.5 fill-[#C5A059] text-[#C5A059]" />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-white/60 font-sans leading-relaxed">{rev.comment}</p>
                      <p className="text-[8px] text-white/20 text-right mt-1 font-mono">{rev.date}</p>
                    </div>
                  ))}
                </div>

                {/* Submit review portal */}
                <form onSubmit={handleSubmitReview} className="border-t border-white/5 pt-4 space-y-3 font-sans">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 block">Register Feedback</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      id="review-author-field"
                      type="text" 
                      placeholder="Your name" 
                      value={reviewAuthor}
                      onChange={(e) => setReviewAuthor(e.target.value)}
                      className="bg-white/5 border border-white/10 text-xs px-3 py-2 text-white placeholder-white/30 rounded-none w-full"
                    />
                    
                    <select 
                      id="review-rating-field"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="bg-white/5 border border-white/10 text-xs px-3 py-2 text-white/80 rounded-none w-full outline-none"
                    >
                      <option className="bg-[#121212]" value="5">★★★★★ Outstanding (5/5)</option>
                      <option className="bg-[#121212]" value="4">★★★★ Very satisfying (4/5)</option>
                      <option className="bg-[#121212]" value="3">★★★ Acceptable (3/5)</option>
                      <option className="bg-[#121212]" value="2">★★ Disappointing (2/5)</option>
                      <option className="bg-[#121212]" value="1">★ Inoperable (1/5)</option>
                    </select>
                  </div>

                  <textarea 
                    id="review-comment-field"
                    placeholder="Provide specific details about design comfort, scent throw, or acoustics..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={2}
                    className="bg-white/5 border border-white/10 text-xs p-3 text-white placeholder-white/20 rounded-none w-full block"
                  />

                  {reviewError && <p className="text-[10px] text-red-400 font-mono">{reviewError}</p>}

                  <button
                    id="btn-submit-review"
                    type="submit"
                    disabled={isSubmittingReview}
                    className="bg-white/5 hover:bg-white/10 text-[#C5A059] border border-[#C5A059]/40 text-[9px] font-bold uppercase tracking-widest px-4 py-2 hover:border-[#C5A059] transition"
                  >
                    {isSubmittingReview ? "Submitting..." : "Publish Review"}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- MODAL B: SECURE SIMULATED CHECKOUT DIALOG --- */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="checkout-modal-wrapper">
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)} />
          <form 
            onSubmit={handleCheckoutSubmit}
            className="bg-[#121212] border border-white/10 p-6 md:p-8 max-w-lg w-full relative z-10 shadow-2xl animate-fadeIn space-y-6"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 className="font-serif text-lg text-white italic">Mock Payment Portal</h3>
                <p className="text-[9px] text-[#C5A059] uppercase tracking-widest font-mono">Secured Sandbox Engine</p>
              </div>
              <button type="button" onClick={() => setIsCheckoutOpen(false)} className="p-2 border border-white/10 text-white/50 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {checkoutError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 font-mono">
                {checkoutError}
              </div>
            )}

            {/* Shipping Address Inputs */}
            <div className="space-y-3 font-sans">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#C5A059] block">1. Shipping Destination</span>
              
              <div className="space-y-2">
                <input 
                  id="checkout-name"
                  type="text" 
                  placeholder="Recipient Full Name" 
                  required
                  value={shippingForm.fullName}
                  onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                  className="bg-white/5 border border-white/10 text-xs px-3 py-2 text-white placeholder-white/30 rounded-none w-full"
                />
                <input 
                  id="checkout-address"
                  type="text" 
                  placeholder="Address Line 1" 
                  required
                  value={shippingForm.addressLine}
                  onChange={(e) => setShippingForm({ ...shippingForm, addressLine: e.target.value })}
                  className="bg-white/5 border border-white/10 text-xs px-3 py-2 text-white placeholder-white/30 rounded-none w-full"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    id="checkout-city"
                    type="text" 
                    placeholder="City" 
                    required
                    value={shippingForm.city}
                    onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                    className="bg-white/5 border border-white/10 text-xs px-3 py-2 text-white placeholder-white/30 rounded-none w-full"
                  />
                  <input 
                    id="checkout-zip"
                    type="text" 
                    placeholder="Postal Code" 
                    required
                    value={shippingForm.postalCode}
                    onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                    className="bg-white/5 border border-white/10 text-xs px-3 py-2 text-white placeholder-white/30 rounded-none w-full"
                  />
                </div>
              </div>
            </div>

            {/* Credit Card Inputs */}
            <div className="space-y-3 font-sans">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#C5A059] block">2. Simulated Card Details</span>
              
              <div className="space-y-2">
                <input 
                  id="checkout-card-num"
                  type="text" 
                  maxLength={19}
                  placeholder="Card Number (e.g. 4111 2222 3333 4444)" 
                  required
                  value={creditCardForm.cardNumber}
                  onChange={(e) => setCreditCardForm({ ...creditCardForm, cardNumber: e.target.value })}
                  className="bg-white/5 border border-white/10 text-xs px-3 py-2 text-white placeholder-white/30 rounded-none w-full"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    id="checkout-card-expiry"
                    type="text" 
                    maxLength={5}
                    placeholder="MM/YY" 
                    required
                    value={creditCardForm.expiry}
                    onChange={(e) => setCreditCardForm({ ...creditCardForm, expiry: e.target.value })}
                    className="bg-white/5 border border-white/10 text-xs px-3 py-2 text-white placeholder-white/30 rounded-none w-full"
                  />
                  <input 
                    id="checkout-card-cvv"
                    type="password" 
                    maxLength={4}
                    placeholder="CVV" 
                    required
                    value={creditCardForm.cvv}
                    onChange={(e) => setCreditCardForm({ ...creditCardForm, cvv: e.target.value })}
                    className="bg-white/5 border border-white/10 text-xs px-3 py-2 text-white placeholder-white/30 rounded-none w-full"
                  />
                </div>
              </div>
            </div>

            {/* Price review summary */}
            <div className="bg-white/5 p-3 font-mono text-[10px] border border-white/5 flex justify-between">
              <span className="text-white/40 uppercase">Archived Amount Due</span>
              <span className="text-[#C5A059] font-bold text-xs">${cartTotal.toFixed(2)}</span>
            </div>

            <button
              id="checkout-submit-btn"
              type="submit"
              disabled={isProcessingCheckout}
              className="w-full bg-[#C5A059] text-[#0A0A0A] py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#D1B072] transition"
            >
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>{isProcessingCheckout ? "Processing order..." : `Authorize Payment • $${cartTotal.toFixed(2)}`}</span>
              </div>
            </button>
            <p className="text-center text-[9px] text-[#C5A059]/40 tracking-wider font-mono">FINANCIAL SERVICES FOR CURATED OBJECTS • SECURE MOCK AUTH</p>
          </form>
        </div>
      )}

      {/* --- MODAL C: TRANSACTION PLACED SUCCESS OVERLAY --- */}
      {lastPlacedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="success-overlay-wrapper">
          <div className="fixed inset-0 bg-black/95" onClick={() => setLastPlacedOrder(null)} />
          <div className="bg-[#121212] border border-white/10 p-8 max-w-md w-full relative z-10 shadow-2xl text-center space-y-6 animate-fadeIn">
            
            <div className="mx-auto h-12 w-12 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 flex items-center justify-center">
              <CheckCircle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#C5A059] uppercase tracking-widest font-mono font-bold">Transaction Confirmed</span>
              <h3 className="text-lg font-serif italic text-white">Your Curation is Acknowledged</h3>
              <p className="text-xs text-[#C5A059] font-mono mt-1 font-bold">{lastPlacedOrder.id}</p>
            </div>

            <p className="text-xs text-white/50 leading-relaxed font-sans pb-4 border-b border-white/5">
              Awesome! Your simulated e-commerce purchase has processed perfectly. We loaded the details in your ledger tab, and we anticipate delivery in 4 workdays!
            </p>

            <div className="space-y-2">
              <button
                id="btn-success-history"
                onClick={() => {
                  setLastPlacedOrder(null);
                  setIsOrdersOpen(true);
                }}
                className="w-full bg-white text-black hover:bg-[#C5A059] font-bold text-xs uppercase tracking-widest py-3 transition"
              >
                Track Shipping
              </button>
              <button
                id="btn-success-close"
                onClick={() => setLastPlacedOrder(null)}
                className="w-full bg-transparent text-white/60 hover:text-white border border-white/10 font-bold text-xs uppercase tracking-widest py-3 transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL D: AUTHENTICATION PORTAL (LOGIN & REGISTRATION) --- */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="auth-portal-wrapper">
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsLoginModalOpen(false)} />
          <div className="bg-[#121212] border border-white/10 p-8 max-w-md w-full relative z-10 shadow-2xl space-y-6 animate-fadeIn text-left">
            
            {/* Close trigger button */}
            <button
              id="btn-auth-close"
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header Title */}
            <div className="space-y-1">
              <span className="text-[9px] text-[#C5A059] uppercase tracking-[0.25em] font-mono font-bold block">
                AURA COOPERATIVE MEMBER DECK
              </span>
              <h3 className="text-xl font-serif italic text-white">
                {loginMode === 'login' ? 'Access the Curated Vault' : 'Join the Curated Vault'}
              </h3>
              <p className="text-xs text-white/40 font-sans leading-relaxed">
                {loginMode === 'login' 
                  ? 'Sign in with your credentials to enable member discounts and synchronized ledgers.' 
                  : 'Establish a new permanent member account inside the store register.'}
              </p>
            </div>

            {/* Error & Success Alerts */}
            {authError && (
              <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-3 text-xs flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                <span className="leading-snug">{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 p-3 text-xs flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="leading-snug">{authSuccess}</span>
              </div>
            )}

            {/* Mode Switcher Buttons */}
            <div className="grid grid-cols-2 border-b border-white/10 pb-2">
              <button
                id="btn-switch-login-mode"
                onClick={() => {
                  setLoginMode('login');
                  setAuthError('');
                }}
                className={`py-2 text-[10px] uppercase tracking-wider font-bold text-center border-b-2 transition cursor-pointer ${
                  loginMode === 'login' 
                    ? "border-[#C5A059] text-white" 
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                Sign In
              </button>
              <button
                id="btn-switch-register-mode"
                onClick={() => {
                  setLoginMode('register');
                  setAuthError('');
                }}
                className={`py-2 text-[10px] uppercase tracking-wider font-bold text-center border-b-2 transition cursor-pointer ${
                  loginMode === 'register' 
                    ? "border-[#C5A059] text-white" 
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Login Form view */}
            {loginMode === 'login' ? (
              <form id="form-vault-login" onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/30">
                      <UserIcon className="h-3.5 w-3.5" />
                    </span>
                    <input
                      id="input-login-username"
                      type="text"
                      placeholder="Username or email (e.g. curator)"
                      required
                      value={loginForm.usernameOrEmail}
                      onChange={(e) => setLoginForm({ ...loginForm, usernameOrEmail: e.target.value })}
                      className="bg-white/5 border border-white/10 text-xs pl-10 pr-3 py-2.5 text-white placeholder-white/30 rounded-none w-full outline-none focus:border-[#C5A059]/50 transition-all font-sans"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/30">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                    <input
                      id="input-login-password"
                      type="password"
                      placeholder="Enter password (e.g. curator)"
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="bg-white/5 border border-white/10 text-xs pl-10 pr-3 py-2.5 text-white placeholder-white/30 rounded-none w-full outline-none focus:border-[#C5A059]/50 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="bg-white/5 p-3 rounded-none border border-white/5 text-[10px] text-white/50 font-mono leading-relaxed space-y-1">
                  <p className="font-semibold text-white/70">💡 Quick Evaluation Accounts:</p>
                  <p>• username: <span className="text-[#C5A059] font-bold">curator</span> / password: <span className="text-[#C5A059] font-bold">curator</span> (Full profile)</p>
                  <p>• username: <span className="text-[#C5A059] font-bold">demo</span> / password: <span className="text-[#C5A059] font-bold">demo</span> (Standard test)</p>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full bg-[#C5A059] text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#D1B072] disabled:opacity-50 transition cursor-pointer"
                >
                  {isSubmittingAuth ? "Unlocking vault..." : "Sign In & Access"}
                </button>
              </form>
            ) : (
              /* Register Form view */
              <form id="form-vault-register" onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/30">
                      <UserIcon className="h-3.5 w-3.5" />
                    </span>
                    <input
                      id="input-register-username"
                      type="text"
                      placeholder="Choose unique username"
                      required
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      className="bg-white/5 border border-white/10 text-xs pl-10 pr-3 py-2.5 text-white placeholder-white/30 rounded-none w-full outline-none focus:border-[#C5A059]/50 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/30">
                      <UserIcon className="h-3.5 w-3.5" />
                    </span>
                    <input
                      id="input-register-fullname"
                      type="text"
                      placeholder="Your Full Name"
                      required
                      value={registerForm.fullName}
                      onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                      className="bg-white/5 border border-white/10 text-xs pl-10 pr-3 py-2.5 text-white placeholder-white/30 rounded-none w-full outline-none focus:border-[#C5A059]/50 transition-all font-sans"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/30">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <input
                      id="input-register-email"
                      type="email"
                      placeholder="Your Email Address"
                      required
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="bg-white/5 border border-white/10 text-xs pl-10 pr-3 py-2.5 text-white placeholder-white/30 rounded-none w-full outline-none focus:border-[#C5A059]/50 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/30">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                    <input
                      id="input-register-password"
                      type="password"
                      placeholder="Choose Password (min 4 chars)"
                      required
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      className="bg-white/5 border border-white/10 text-xs pl-10 pr-3 py-2.5 text-white placeholder-white/30 rounded-none w-full outline-none focus:border-[#C5A059]/50 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest block font-bold leading-none">Preferred Vibe Segment</label>
                    <select
                      id="input-register-vibe"
                      value={registerForm.preferredVibe}
                      onChange={(e) => setRegisterForm({ ...registerForm, preferredVibe: e.target.value })}
                      className="bg-[#181818] border border-white/10 text-xs px-3 py-2.5 text-white/80 rounded-none w-full outline-none focus:border-[#C5A059]/50 cursor-pointer"
                    >
                      <option value="Minimalist Tech">Minimalist Tech</option>
                      <option value="Lifestyle & Apparel">Lifestyle & Apparel</option>
                      <option value="Curated Home">Curated Home</option>
                    </select>
                  </div>
                </div>

                <button
                  id="btn-register-submit"
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full bg-[#C5A059] text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#D1B072] disabled:opacity-50 transition cursor-pointer"
                >
                  {isSubmittingAuth ? "Establishing credentials..." : "Confirm & Register Member"}
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                id="btn-auth-cancel"
                onClick={() => setIsLoginModalOpen(false)}
                className="text-[10px] uppercase font-mono tracking-widest text-[#C5A059]/50 hover:text-[#C5A059] underline decoration-dotted transition"
              >
                Explore anonymously
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Aesthetic Status Block Footer --- */}
      <footer className="h-20 bg-black border-t border-white/10 flex flex-col sm:flex-row items-center justify-between px-10 text-[9px] uppercase tracking-[0.2em] text-white/30 flex-shrink-0 gap-3 py-4 sm:py-0 mt-20">
        <div className="flex gap-4 sm:gap-10 flex-wrap justify-center">
          <span>Global Shipping Active</span>
          <span>Sustainable Sourcing</span>
          <span>Archival Support Concierge</span>
        </div>
        <div className="flex gap-6 font-mono">
          <a href="#" className="hover:text-[#C5A059] transition">Instagram</a>
          <a href="#" className="hover:text-[#C5A059] transition">Pinterest</a>
          <a href="#" className="hover:text-[#C5A059] transition">Aura Journal</a>
        </div>
      </footer>

    </div>
  );
}
