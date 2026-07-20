import React, { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash, Users, ShoppingBag, DollarSign, 
  Package, RefreshCw, X, Check, Save, RotateCcw, 
  Wifi, AlertCircle, Truck, CreditCard, Layers,
  TrendingUp, BarChart3, PieChart, Activity, ShoppingCart
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from "recharts";

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0A0A]/95 backdrop-blur-md border border-white/10 p-3 shadow-2xl rounded-none font-mono text-left">
        <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{label}</p>
        <p className="text-xs font-bold text-[#C5A059] mt-1 font-mono">
          Settled Revenue: ${Number(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminPanel({ onProductChange }) {
  const [activeTab, setActiveTab] = useState("insights"); // insights | products | orders | users
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [insightsData, setInsightsData] = useState(null);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Product Form states
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Minimalist Tech",
    image: "",
    badge: "",
    inStock: true,
    stockCount: "15",
    featured: false,
    colors: "",
    sizes: ""
  });

  const categories = ["Minimalist Tech", "Lifestyle & Apparel", "Curated Home"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("aura_jwt_token");
      const authHeader = token ? { "Authorization": `Bearer ${token}` } : {};

      // Fetch Products
      const prodRes = await fetch("/api/products");
      const prodData = await prodRes.json();
      setProducts(prodData.products || []);

      // Fetch Orders
      const orderRes = await fetch("/api/admin/orders", { headers: authHeader });
      const orderData = await orderRes.json();
      setOrders(orderData.orders || []);

      // Fetch Users
      const userRes = await fetch("/api/admin/users", { headers: authHeader });
      const userData = await userRes.json();
      setUsers(userData.users || []);

      // Fetch Insights stats
      const insightsRes = await fetch("/api/admin/dashboard-stats", { headers: authHeader });
      if (insightsRes.ok) {
        const insightsVal = await insightsRes.json();
        setInsightsData(insightsVal);
      }
    } catch (err) {
      setErrorMsg("Failed to synchronize with Aura Registry services.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      category: "Minimalist Tech",
      image: "",
      badge: "",
      inStock: true,
      stockCount: "15",
      featured: false,
      colors: "",
      sizes: ""
    });
    setIsEditing(false);
    setSelectedProductId(null);
  };

  const handleEditClick = (product) => {
    setIsEditing(true);
    setSelectedProductId(product.id);
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price) || "",
      category: product.category || "Minimalist Tech",
      image: product.image || "",
      badge: product.badge || "",
      inStock: !!product.inStock,
      stockCount: String(product.stockCount !== undefined ? product.stockCount : 15),
      featured: !!product.featured,
      colors: Array.isArray(product.colors) ? product.colors.join(", ") : "",
      sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : ""
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!productForm.name || !productForm.price || !productForm.category) {
      setErrorMsg("Please populate core properties (Name, Price, Category).");
      return;
    }

    if (isNaN(Number(productForm.price))) {
      setErrorMsg("Price must be a valid numeric coefficient.");
      return;
    }

    if (isNaN(Number(productForm.stockCount))) {
      setErrorMsg("Stock Level must be a valid integer coefficient.");
      return;
    }

    const colorsArr = productForm.colors
      ? productForm.colors.split(",").map(c => c.trim()).filter(Boolean)
      : [];
    const sizesArr = productForm.sizes
      ? productForm.sizes.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price),
      category: productForm.category,
      image: productForm.image || undefined,
      badge: productForm.badge || null,
      inStock: Number(productForm.stockCount) > 0 && productForm.inStock ? 1 : 0,
      stockCount: Number(productForm.stockCount),
      featured: productForm.featured ? 1 : 0,
      colors: colorsArr,
      sizes: sizesArr
    };

    try {
      const url = isEditing 
        ? `/api/admin/products/${selectedProductId}` 
        : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";
      const token = localStorage.getItem("aura_jwt_token");

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Catalog write execution rejected.");
      }

      setSuccessMsg(isEditing ? "Product design model updated successfully." : "New product published and synchronized.");
      resetForm();
      await fetchData();
      if (onProductChange) onProductChange();
    } catch (err) {
      setErrorMsg(err.message || "Bespoke database synchronization issue occurred.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Perform irreversible purge of this product record?")) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = localStorage.getItem("aura_jwt_token");
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erasure query rejected.");
      }

      setSuccessMsg("Catalog record obliterated successfully.");
      await fetchData();
      if (onProductChange) onProductChange();
    } catch (err) {
      setErrorMsg(err.message || "Failed to purge chosen product listing.");
    }
  };

  // Update real-time Order statuses (delivery tracking & payment status)
  const handleOrderStatusUpdate = async (orderId, updates) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const token = localStorage.getItem("aura_jwt_token");
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Status update packet rejected.");
      }
      setSuccessMsg(`Order ${orderId} updated successfully.`);
      await fetchData();
    } catch (err) {
      setErrorMsg(err.message || "Failed during status transmission.");
    }
  };

  const totalGrossRevenue = orders.reduce((sum, ord) => sum + (ord.total || ord.cartItems?.reduce?.((s, it) => s + (it.price || it.product?.price || 0) * (it.quantity || 1), 0) || 0), 0);

  return (
    <div id="aura-admin-container" className="bg-[#121212] border border-white/10 p-6 md:p-8 space-y-8 max-w-7xl mx-auto my-12 text-white font-sans rounded-none select-none">
      
      {/* Top Header Controls bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#C5A059]">Fulfillment System Portal</span>
          <h2 className="text-3xl font-serif italic text-white mt-1">Aura Showroom Controller</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            id="btn-admin-manual-sync"
            onClick={fetchData} 
            disabled={isLoading}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 hover:bg-white/10 hover:border-white/20 transition text-[10px] uppercase font-mono tracking-widest disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-[#C5A059]" : ""}`} />
            Sync Ledger Space
          </button>
        </div>
      </div>

      {/* Numerical Metrics Dashboard cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#0A0A0A] p-5 border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-[#C5A059]/10 text-[#C5A059] rounded-none">
            <DollarSign className="h-5 w-5 font-bold" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-mono tracking-widest text-white/40">Aggregated Sales</p>
            <p className="text-xl font-mono font-bold text-white">${totalGrossRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Metric 2 */}
        <div className="bg-[#0A0A0A] p-5 border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-[#C5A059]/10 text-[#C5A059] rounded-none">
            <ShoppingBag className="h-5 w-5 font-bold" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-mono tracking-widest text-white/40">Total Checkout Bags</p>
            <p className="text-xl font-mono font-bold text-white">{orders.length} Receipts</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0A0A0A] p-5 border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-[#C5A059]/10 text-[#C5A059] rounded-none">
            <Package className="h-5 w-5 font-bold" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-mono tracking-widest text-white/40">Catalog Designs</p>
            <p className="text-xl font-mono font-bold text-white">{products.length} Items</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0A0A0A] p-5 border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-[#C5A059]/10 text-[#C5A059] rounded-none">
            <Users className="h-5 w-5 font-bold" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-mono tracking-widest text-white/40">Active Valued Profiles</p>
            <p className="text-xl font-mono font-bold text-white">{users.length} Registrants</p>
          </div>
        </div>
      </div>

      {/* Diagnostics Alerts banner */}
      {errorMsg && (
        <div className="bg-red-950/20 border border-red-500/20 text-red-400 p-4 font-mono text-[11px] text-left">
          [REGISTRY_ALARM_ENGAGED] : {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 p-4 font-mono text-[11px] text-left">
          [REGISTRY_COORDINATES_SUCCESS_ALIGNED] : {successMsg}
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab("insights")}
          className={`px-5 py-3 text-[11px] uppercase tracking-widest font-mono font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "insights" ? "border-[#C5A059] text-white" : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          Insights Dashboard
        </button>
        <button 
          onClick={() => setActiveTab("products")}
          className={`px-5 py-3 text-[11px] uppercase tracking-widest font-mono font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "products" ? "border-[#C5A059] text-white" : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          Product Catalog Setup
        </button>
        <button 
          onClick={() => setActiveTab("orders")}
          className={`px-5 py-3 text-[11px] uppercase tracking-widest font-mono font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "orders" ? "border-[#C5A059] text-white" : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          Customer Orders Ledger ({orders.length})
        </button>
        <button 
          onClick={() => setActiveTab("users")}
          className={`px-5 py-3 text-[11px] uppercase tracking-widest font-mono font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "users" ? "border-[#C5A059] text-white" : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          Registered Members ({users.length})
        </button>
      </div>

      {/* TAB: INSIGHTS DASHBOARD */}
      {activeTab === "insights" && (
        <div className="space-y-8 text-left">
          {/* Dashboard Summary Aggregates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0A0A0A] p-6 border border-white/5 space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Gross Sales Analytics</p>
              <h4 className="text-3xl font-mono font-bold text-[#C5A059]">
                ${insightsData?.aggregates?.totalRevenue?.toFixed?.(2) || "0.00"}
              </h4>
              <p className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +14.5% versus preceding month
              </p>
            </div>
            <div className="bg-[#0A0A0A] p-6 border border-white/5 space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Validated Receipts</p>
              <h4 className="text-3xl font-mono font-bold text-white">
                {insightsData?.aggregates?.totalOrders || "0"} Orders
              </h4>
              <p className="text-[9px] font-mono text-white/40">100% simulated credit settlement</p>
            </div>
            <div className="bg-[#0A0A0A] p-6 border border-white/5 space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Curated Offerings</p>
              <h4 className="text-3xl font-mono font-bold text-white">
                {insightsData?.aggregates?.totalProducts || "0"} Designs
              </h4>
              <p className="text-[9px] font-mono text-[#C5A059]">All exclusive to Aura Vault</p>
            </div>
            <div className="bg-[#0A0A0A] p-6 border border-white/5 space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Registered Aura Members</p>
              <h4 className="text-3xl font-mono font-bold text-white">
                {insightsData?.aggregates?.totalUsers || "0"} Profiles
              </h4>
              <p className="text-[9px] font-mono text-white/40">Access token & encryption engaged</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Sales Chart & Logistics */}
            <div className="lg:col-span-2 space-y-8">
              {/* SVG Sales Trend graph */}
              <div className="bg-[#0A0A0A] p-6 border border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <h3 className="font-serif italic text-lg text-white">Sales Revenue Timeline</h3>
                    <p className="text-[9px] font-mono text-white/40">Interactive graph plotting simulated gross transaction flows</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-[#C5A059]" />
                </div>

                {insightsData?.revenueTimeline?.length > 0 ? (
                  <div className="h-64 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={insightsData.revenueTimeline}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="rgba(255, 255, 255, 0.4)" 
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                          tickFormatter={(val) => {
                            if (!val) return "";
                            const parts = val.split("-");
                            return parts.length >= 3 ? `${parts[1]}-${parts[2]}` : val;
                          }}
                        />
                        <YAxis 
                          stroke="rgba(255, 255, 255, 0.4)" 
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          dx={-5}
                          tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip content={<CustomAreaTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#C5A059" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 w-full bg-[#111111]/50 border border-white/5 flex items-center justify-center text-xs text-white/30 font-mono font-bold uppercase tracking-wider text-center">
                    [Awaiting transaction records to map trends]
                  </div>
                )}
              </div>

              {/* Delivery Logistics Tracking Pipeline */}
              <div className="bg-[#0A0A0A] p-6 border border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <h3 className="font-serif italic text-lg text-white">Delivery Logistics Tracking Pipeline</h3>
                    <p className="text-[9px] font-mono text-white/40">Tracking live ship milestones across the grid</p>
                  </div>
                  <Truck className="h-5 w-5 text-white/60" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                  {[
                    { key: "Processing", label: "Processing", color: "bg-blue-500" },
                    { key: "Dispatched", label: "Dispatched", color: "bg-indigo-500" },
                    { key: "In Transit", label: "In Transit", color: "bg-amber-500" },
                    { key: "Out for Delivery", label: "Destination", color: "bg-purple-500" },
                    { key: "Delivered", label: "Delivered", color: "bg-emerald-500" }
                  ].map((step, i) => {
                    const count = insightsData?.deliveryBreakdown?.[step.key] || 0;
                    return (
                      <div key={step.key} className="relative p-3 bg-[#0c0c0c] border border-white/5 flex flex-col justify-between h-24 text-left">
                        <div className="flex justify-between items-start">
                          <span className={`h-2 w-2 rounded-full ${step.color}`} />
                          <span className="text-[9px] font-mono text-white/30">#0{i+1}</span>
                        </div>
                        <div>
                          <p className="text-xl font-mono font-bold text-white mt-2">{count}</p>
                          <p className="text-[8px] uppercase tracking-wider font-mono text-white/50">{step.label}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right: Best Sellers & Segment metrics */}
            <div className="space-y-8">
              {/* Category Sales distribution */}
              <div className="bg-[#0A0A0A] p-6 border border-white/5 space-y-5">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <h3 className="font-serif italic text-lg text-white">Vibe Segment Proportions</h3>
                    <p className="text-[9px] font-mono text-white/40">Sales contribution by design archetype</p>
                  </div>
                  <PieChart className="h-5 w-5 text-[#C5A059]" />
                </div>

                <div className="space-y-4">
                  {(insightsData?.salesByCategory?.length > 0 ? insightsData.salesByCategory : [
                    { name: "Minimalist Tech", value: 0 },
                    { name: "Lifestyle & Apparel", value: 0 },
                    { name: "Curated Home", value: 0 }
                  ]).map((cat) => {
                    const total = insightsData?.salesByCategory?.reduce((acc, c) => acc + c.value, 0) || 1;
                    const percent = Math.round((cat.value / total) * 100) || 0;
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-white/85">
                          <span>{cat.name}</span>
                          <div>
                            <span className="text-white/40 select-none mr-2">(${cat.value.toFixed(0)})</span>
                            <span className="font-bold text-[#C5A059]">{percent}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-none overflow-hidden">
                          <div 
                            className="h-full bg-[#C5A059]" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-[#0A0A0A] p-6 border border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <h3 className="font-serif italic text-lg text-white">Bestselling Curations</h3>
                    <p className="text-[9px] font-mono text-white/40">Top catalog pieces sorted by revenue</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>

                <div className="space-y-2">
                  {insightsData?.bestSellers?.length > 0 ? (
                    insightsData.bestSellers.map((prod, idx) => (
                      <div key={prod.id} className="flex items-center justify-between p-2.5 bg-[#0c0c0c] border border-white/5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[10px] text-[#C5A059] font-mono w-4 font-bold">#{idx+1}</span>
                          <span className="text-[10px] text-white/80 font-mono font-bold truncate max-w-[130px]">{prod.name}</span>
                        </div>
                        <div className="text-right text-[10px] font-mono shrink-0">
                          <p className="text-white font-bold">${prod.revenue.toFixed(2)}</p>
                          <p className="text-white/40 text-[9px]">{prod.quantity} units sold</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 text-[10px] font-mono text-white/30 bg-[#111111]/50 border border-white/5">
                      [No orders settled yet]
                    </div>
                  )}
                </div>
              </div>

              {/* Settlement Ledger Health */}
              <div className="bg-[#0A0A0A] p-6 border border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <h3 className="font-serif italic text-lg text-white">Billing & Clearing States</h3>
                    <p className="text-[9px] font-mono text-white/40">Ledger balance clearing health metrics</p>
                  </div>
                  <CreditCard className="h-5 w-5 text-white/60" />
                </div>

                <div className="space-y-3">
                  {[
                    { key: "Completed", label: "Settle Complete", color: "bg-emerald-500" },
                    { key: "Pending", label: "Pending Processing", color: "bg-amber-500" },
                    { key: "Refunded", label: "Accounts Refunded", color: "bg-red-500" }
                  ].map((pay) => {
                    const val = insightsData?.paymentBreakdown?.[pay.key] || 0;
                    return (
                      <div key={pay.key} className="flex justify-between items-center text-[10px] font-mono">
                        <div className="flex items-center gap-2 text-white/70">
                          <span className={`h-1.5 w-1.5 rounded-full ${pay.color}`} />
                          <span>{pay.label}</span>
                        </div>
                        <span className="font-bold text-white bg-white/5 px-2 py-0.5 border border-white/5">{val}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: PRODUCT CATALOG EDITOR */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Side */}
          <div className="lg:col-span-1 bg-[#0A0A0A] p-6 border border-white/5 space-y-4">
            <h3 className="font-serif italic text-lg text-white border-b border-white/5 pb-2">
              {isEditing ? "Alter Design Specifications" : "Register New Masterwork Design"}
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-sans text-left">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Product Title *</label>
                <input 
                  type="text" 
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                  placeholder="e.g. Amber Moss Sandstone Cup"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Price Coefficient ($) *</label>
                  <input 
                    type="text" 
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                    placeholder="e.g. 89.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Category Select *</label>
                  <select 
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 p-2.5 text-white/80 outline-none focus:border-[#C5A059] cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-[#121212]">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Stock Level Count *</label>
                <input 
                  type="number" 
                  min="0"
                  value={productForm.stockCount}
                  onChange={(e) => setProductForm({...productForm, stockCount: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2.5 text-white outline-none focus:border-[#C5A059]"
                  placeholder="e.g. 15"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Curator Summary</label>
                <textarea 
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059] leading-relaxed resize-none"
                  placeholder="Outline aesthetic philosophy..."
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Product Art JPG/PNG URL</label>
                <input 
                  type="text" 
                  value={productForm.image}
                  onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                  placeholder="https://images.unsplash..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Visual Tag Badge</label>
                  <input 
                    type="text" 
                    value={productForm.badge}
                    onChange={(e) => setProductForm({...productForm, badge: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                    placeholder="e.g. Curated Rare"
                  />
                </div>
                <div className="flex gap-3 items-center h-full pt-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold uppercase tracking-wider text-[9px] text-white/60">
                    <input 
                      type="checkbox" 
                      checked={productForm.inStock}
                      onChange={(e) => setProductForm({...productForm, inStock: e.target.checked})}
                      className="accent-[#C5A059] cursor-pointer"
                    />
                    Listed Active
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold uppercase tracking-wider text-[9px] text-white/60">
                    <input 
                      type="checkbox" 
                      checked={productForm.featured}
                      onChange={(e) => setProductForm({...productForm, featured: e.target.checked})}
                      className="accent-[#C5A059] cursor-pointer"
                    />
                    Featured
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/30 mb-1">Colors (comma sep)</label>
                  <input 
                    type="text" 
                    value={productForm.colors}
                    onChange={(e) => setProductForm({...productForm, colors: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                    placeholder="Soot, Pebble Black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/30 mb-1">Sizes (comma sep)</label>
                  <input 
                    type="text" 
                    value={productForm.sizes}
                    onChange={(e) => setProductForm({...productForm, sizes: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                    placeholder="Standard, Deluxe"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit" 
                  className="flex-grow bg-[#C5A059] hover:bg-[#D1B072] text-[10px] font-bold text-[#0A0A0A] uppercase tracking-widest py-3 hover:translate-y-[-1px] transition-all cursor-pointer"
                >
                  {isEditing ? "Apply Revisions" : "Integrate Design"}
                </button>
                {(isEditing || productForm.name) && (
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 p-3 cursor-pointer text-white/60 hover:text-white"
                    title="Reset Editor"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table Side */}
          <div className="lg:col-span-2 overflow-x-auto">
            <table className="w-full text-left text-xs bg-[#0A0A0A] border border-white/5 select-none font-mono">
              <thead className="bg-[#121212] border-b border-white/5 font-mono text-[9px] text-white/40 uppercase tracking-widest">
                <tr>
                  <th className="p-4">Visual Art</th>
                  <th className="p-4">Product Characteristics</th>
                  <th className="p-4">Vibe Group</th>
                  <th className="p-4 text-center">Remaining Stock</th>
                  <th className="p-4 text-right">Pricing</th>
                  <th className="p-4 text-center">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-white/40 font-serif italic text-sm">
                      Zero catalog assets published in register.
                    </td>
                  </tr>
                ) : (
                  products.map(prod => (
                    <tr key={prod.id} className="hover:bg-white/5 transition">
                      <td className="p-4 w-16">
                        <img src={prod.image} className="w-12 h-14 object-cover border border-white/10 bg-[#141414]" alt="" referrerPolicy="no-referrer" />
                      </td>
                      <td className="p-4 max-w-[180px]">
                        <div className="font-semibold font-sans text-white/95 truncate" title={prod.name}>{prod.name}</div>
                        <div className="text-[10px] text-white/35 font-mono mt-0.5">{prod.id}</div>
                        <div className="flex gap-1 flex-wrap mt-1.5">
                          {prod.badge && <span className="px-1.5 py-0.5 bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 text-[8px] font-bold uppercase tracking-widest leading-none">{prod.badge}</span>}
                          {prod.featured && <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/25 text-[8px] font-bold uppercase tracking-widest leading-none">Featured</span>}
                          {(!prod.inStock || (prod.stockCount !== undefined && prod.stockCount <= 0)) && (
                            <span className="px-1.5 py-0.5 bg-red-500/15 text-red-400 border border-red-500/25 text-[8px] font-bold uppercase tracking-widest leading-none">Empty Stock</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[9px] text-white/60 font-medium">
                          {prod.category}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold">
                        <span className={`px-2 py-0.5 font-bold ${
                          (prod.stockCount || 0) === 0 
                            ? "text-red-400 font-mono" 
                            : (prod.stockCount || 0) < 5 
                              ? "text-amber-400 font-mono" 
                              : "text-white/80 font-mono"
                        }`}>
                          {prod.stockCount !== undefined ? prod.stockCount : 15} Units
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-[#C5A059]">
                        ${Number(prod.price).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button 
                            onClick={() => handleEditClick(prod)} 
                            className="p-2 border border-white/10 hover:border-[#C5A059]/40 text-white/70 hover:text-[#C5A059] transition cursor-pointer"
                            title="Refactor properties"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(prod.id)} 
                            className="p-2 border border-white/10 hover:border-red-500/40 text-white/70 hover:text-red-400 transition cursor-pointer"
                            title="Erase listing"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER ORDERS LEDGER (Delivery & Payment Tracking) */}
      {activeTab === "orders" && (
        <div className="overflow-x-auto bg-[#0A0A0A] border border-white/5">
          <table className="w-full text-left text-xs text-white/80 select-none font-mono">
            <thead className="bg-[#121212] border-b border-white/5 font-mono text-[9px] text-white/40 uppercase tracking-widest">
              <tr>
                <th className="p-4">Receipt Token</th>
                <th className="p-4">Purchase Stamp</th>
                <th className="p-4">Receiver & Shipping Address</th>
                <th className="p-4">Selected Items & Variation</th>
                <th className="p-4 text-right">Aggregate Cost</th>
                <th className="p-4 text-center">Payment Status (Completion)</th>
                <th className="p-4 text-center">Fulfillment Tracking Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-white/40 font-serif italic text-sm font-sans">
                    Fulfillment books are empty. Create an order via the checkout module to generate receipts.
                  </td>
                </tr>
              ) : (
                orders.map((ord, idx) => {
                  const items = Array.isArray(ord.cartItems) 
                    ? ord.cartItems 
                    : (typeof ord.cartItems === 'string' ? JSON.parse(ord.cartItems) : []);
                  
                  const finalTotal = ord.total || items.reduce((sum, it) => sum + (it.price || it.product?.price || 0) * (it.quantity || 1), 0);

                  return (
                    <tr key={ord.orderId || idx} className="hover:bg-white/5 transition">
                      <td className="p-4 font-bold text-white uppercase tracking-wider text-[11px]">
                        {ord.orderId || "AURA-715201"}
                      </td>
                      <td className="p-4 text-white/40 text-[10px]">
                        {ord.date ? new Date(ord.date).toLocaleDateString() : new Date().toLocaleDateString()}
                      </td>
                      <td className="p-4 text-[11px] font-sans">
                        <div className="font-bold text-white">{ord.shippingFullName}</div>
                        <div className="text-white/40 mt-1 leading-snug text-[10px]">
                          {ord.shippingAddressLine}, {ord.shippingCity}, {ord.shippingPostalCode}
                        </div>
                      </td>
                      <td className="p-4 font-sans text-[10px] max-w-[220px]">
                        <ul className="list-disc list-inside space-y-1 text-white/60">
                          {items.map((it, iIdx) => (
                            <li key={iIdx} className="truncate">
                              <span className="font-semibold text-white">{it.quantity}x</span> - {it.productName || it.product?.name || "Premium Design"}{" "}
                              {it.selectedColor && (
                                <span className="text-[#C5A059] font-mono text-[9px] uppercase">[{it.selectedColor}]</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-4 text-right font-bold text-[#C5A059] text-xs">
                        ${Number(finalTotal).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {/* Payment Completed Status Badge */}
                          <span className={`px-2 py-0.5 border font-bold text-[8px] uppercase tracking-wider leading-none rounded-none ${
                            ord.paymentStatus === "Completed"
                              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                              : "bg-red-500/10 border-red-500/25 text-red-400"
                          }`}>
                            {ord.paymentStatus || "Completed"}
                          </span>
                          
                          <select
                            value={ord.paymentStatus || "Completed"}
                            onChange={(e) => handleOrderStatusUpdate(ord.orderId, { paymentStatus: e.target.value })}
                            className="bg-black border border-white/10 text-[9px] px-1 py-1 rounded-none outline-none text-white/60 focus:border-[#C5A059] cursor-pointer"
                          >
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                            <option value="Refunded">Refunded</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {/* Tracking Shipping Status Badge */}
                          <span className={`px-2.5 py-0.5 border font-black text-[8px] uppercase tracking-widest leading-none ${
                            ord.deliveryStatus === "Delivered"
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : ord.deliveryStatus === "Out for Delivery"
                                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                                : ord.deliveryStatus === "In Transit"
                                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                  : ord.deliveryStatus === "Dispatched"
                                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                                    : "bg-white/5 border-white/10 text-white/50"
                          }`}>
                            {ord.deliveryStatus || "Processing"}
                          </span>

                          <select
                            value={ord.deliveryStatus || "Processing"}
                            onChange={(e) => handleOrderStatusUpdate(ord.orderId, { deliveryStatus: e.target.value })}
                            className="bg-black border border-white/10 text-[9px] px-1 py-1 rounded-none outline-none text-white/60 focus:border-[#C5A059] cursor-pointer"
                          >
                            <option value="Processing">Processing</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: REGISTERED MEMBERS LIST */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.length === 0 ? (
            <div className="col-span-full py-16 text-center text-white/40 font-serif italic text-sm">
              No registered member records discovered in vault.
            </div>
          ) : (
            users.map((usr, uIdx) => (
              <div key={usr.username || uIdx} className="bg-[#0A0A0A] p-5 border border-white/5 flex items-center gap-4 flex-grow-0 rounded-none text-left">
                <img 
                  src={usr.avatarUrl || `https://api.dicebear.com/7.x/micah/svg?seed=${usr.username}`} 
                  alt="" 
                  className="w-14 h-14 rounded-full border border-white/10 bg-white/5 object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-grow">
                  <div className="font-serif italic text-base text-white/90 truncate">{usr.fullName}</div>
                  <div className="text-[10px] font-mono text-white/35 mt-0.5 truncate">@{usr.username}</div>
                  <div className="text-[9px] font-mono text-[#C5A059] uppercase tracking-widest mt-1.5 leading-none">
                    Vault Registrant
                  </div>
                  <div className="text-[10px] text-white/40 truncate mt-1">
                    {usr.email}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
