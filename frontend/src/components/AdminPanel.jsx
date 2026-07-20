import React, { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash, Users, ShoppingBag, DollarSign, 
  Package, RefreshCw, X, Check, Save, RotateCcw, HelpCircle 
} from "lucide-react";

export default function AdminPanel({ onProductChange }) {
  const [activeTab, setActiveTab] = useState("products"); // products | orders | users
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Product Form states (for creating or editing)
  const [isEditing, setIsEditing] = useState(false); // false (New) | true (Edit)
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Minimalist Tech",
    image: "",
    badge: "",
    inStock: true,
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
      // Fetch Products
      const prodRes = await fetch("/api/products");
      const prodData = await prodRes.json();
      setProducts(prodData.products || []);

      // Fetch Orders
      const orderRes = await fetch("/api/admin/orders");
      const orderData = await orderRes.json();
      setOrders(orderData.orders || []);

      // Fetch Users
      const userRes = await fetch("/api/admin/users");
      const userData = await userRes.json();
      setUsers(userData.users || []);
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
      setErrorMsg("Please populate the critical product definitions (Name, Price, Category).");
      return;
    }

    if (isNaN(Number(productForm.price))) {
      setErrorMsg("Product Price coordinates must be a numeric coefficient.");
      return;
    }

    // Process comma separated lists
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
      inStock: productForm.inStock ? 1 : 0,
      featured: productForm.featured ? 1 : 0,
      colors: colorsArr,
      sizes: sizesArr
    };

    try {
      const url = isEditing 
        ? `/api/admin/products/${selectedProductId}` 
        : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registry update rejected.");
      }

      setSuccessMsg(isEditing ? "Product model successfully revised." : "New product registered in database.");
      resetForm();
      await fetchData();
      if (onProductChange) onProductChange();
    } catch (err) {
      setErrorMsg(err.message || "E-commerce synchronization failure.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to purge this product record?")) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Deletion rejected.");
      }

      setSuccessMsg("Catalog record eradicated successfully.");
      await fetchData();
      if (onProductChange) onProductChange();
    } catch (err) {
      setErrorMsg(err.message || "Failed to remove product segment.");
    }
  };

  // Stats calculation
  const totalGrossRevenue = orders.reduce((sum, ord) => sum + (ord.total || 0), 0);
  const averageOrderValue = orders.length > 0 ? (totalGrossRevenue / orders.length) : 0;

  return (
    <div id="admin-panel-stage" className="bg-[#121212] border border-white/10 p-6 md:p-8 space-y-8 max-w-7xl mx-auto my-6 text-white animate-fadeIn">
      
      {/* Top Console Title bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#C5A059]">Bespoke Vault Control</span>
          <h2 className="text-3xl font-serif italic text-white mt-1">Aura Admin Console</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData} 
            disabled={isLoading}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 hover:bg-white/10 hover:border-white/20 transition text-xs uppercase font-mono tracking-widest disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-[#C5A059]" : ""}`} />
            Sync Vault Registry
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-[#0A0A0A] p-5 border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-[#C5A059]/10 text-[#C5A059]">
            <DollarSign className="h-5 w-4 font-bold" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-white/40">Gross Revenue</p>
            <p className="text-xl font-mono font-bold text-white">${totalGrossRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Metric 2 */}
        <div className="bg-[#0A0A0A] p-5 border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-[#C5A059]/10 text-[#C5A059]">
            <ShoppingBag className="h-5 w-4 font-bold" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-white/40">Total Sales</p>
            <p className="text-xl font-mono font-bold text-white">{orders.length} Receipts</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0A0A0A] p-5 border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-[#C5A059]/10 text-[#C5A059]">
            <Package className="h-5 w-4 font-bold" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-white/40">Stock Models</p>
            <p className="text-xl font-mono font-bold text-white">{products.length} Designs</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0A0A0A] p-5 border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-[#C5A059]/10 text-[#C5A059]">
            <Users className="h-5 w-4 font-bold" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-white/40">Registered Members</p>
            <p className="text-xl font-mono font-bold text-white">{users.length} Vault Users</p>
          </div>
        </div>
      </div>

      {/* Dynamic Alerts */}
      {errorMsg && (
        <div className="bg-red-950/20 border border-red-500/20 text-red-400 p-4 font-mono text-xs text-left">
          [Registry System Error] : {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 p-4 font-mono text-xs text-left">
          [Registry Success] : {successMsg}
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-white/10">
        <button 
          onClick={() => setActiveTab("products")}
          className={`px-6 py-3.5 text-xs uppercase tracking-widest font-mono font-bold border-b-2 transition ${
            activeTab === "products" 
              ? "border-[#C5A059] text-white" 
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          Product Catalog
        </button>
        <button 
          onClick={() => setActiveTab("orders")}
          className={`px-6 py-3.5 text-xs uppercase tracking-widest font-mono font-bold border-b-2 transition ${
            activeTab === "orders" 
              ? "border-[#C5A059] text-white" 
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          Customer Orders
        </button>
        <button 
          onClick={() => setActiveTab("users")}
          className={`px-6 py-3.5 text-xs uppercase tracking-widest font-mono font-bold border-b-2 transition ${
            activeTab === "users" 
              ? "border-[#C5A059] text-white" 
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          Registered Members ({users.length})
        </button>
      </div>

      {/* Tab: Products */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Side */}
          <div className="lg:col-span-1 bg-[#0A0A0A] p-6 border border-white/5 space-y-4">
            <h3 className="font-serif italic text-lg text-white border-b border-white/5 pb-2">
              {isEditing ? "Amend Product Layout" : "Publish New Product Design"}
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-white/60 mb-1">Product Title *</label>
                <input 
                  type="text" 
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                  placeholder="e.g. Hinoki Scent Terracotta"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-white/60 mb-1">Price Coefficient *</label>
                  <input 
                    type="text" 
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                    placeholder="e.g. 120.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-white/60 mb-1">Category Segment *</label>
                  <select 
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 p-2.5 text-white outline-none focus:border-[#C5A059]"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-[#121212]">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-white/60 mb-1">Interactive Description</label>
                <textarea 
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                  placeholder="Summarize product aesthetic..."
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-white/60 mb-1">Unsplash Image URL / Source</label>
                <input 
                  type="text" 
                  value={productForm.image}
                  onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-white/60 mb-1">Sleek Badge Label</label>
                  <input 
                    type="text" 
                    value={productForm.badge}
                    onChange={(e) => setProductForm({...productForm, badge: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                    placeholder="e.g. Rare, Limited"
                  />
                </div>
                <div className="flex gap-4 items-center h-full pt-4">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold uppercase tracking-wider text-[10px] text-white/60">
                    <input 
                      type="checkbox" 
                      checked={productForm.inStock}
                      onChange={(e) => setProductForm({...productForm, inStock: e.target.checked})}
                      className="accent-[#C5A059]"
                    />
                    In Stock
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold uppercase tracking-wider text-[10px] text-white/60">
                    <input 
                      type="checkbox" 
                      checked={productForm.featured}
                      onChange={(e) => setProductForm({...productForm, featured: e.target.checked})}
                      className="accent-[#C5A059]"
                    />
                    Featured
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-white/40 mb-1">Colors (comma separated)</label>
                  <input 
                    type="text" 
                    value={productForm.colors}
                    onChange={(e) => setProductForm({...productForm, colors: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                    placeholder="Slate, Off-White"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-white/40 mb-1">Sizes (comma separated)</label>
                  <input 
                    type="text" 
                    value={productForm.sizes}
                    onChange={(e) => setProductForm({...productForm, sizes: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 p-2.5 text-white placeholder-white/20 outline-none focus:border-[#C5A059]"
                    placeholder="Small, Regular"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit" 
                  className="flex-grow bg-[#C5A059] hover:bg-[#D1B072] text-[11px] font-bold text-[#0A0A0A] uppercase tracking-widest py-3 hover:translate-y-[-1px] transition-all"
                >
                  {isEditing ? "Save Revisions" : "Integrate Product"}
                </button>
                {(isEditing || productForm.name) && (
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 p-3"
                    title="Cancel edit / reset"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table Side */}
          <div className="lg:col-span-2 overflow-x-auto">
            <table className="w-full text-left text-xs bg-[#0A0A0A] border border-white/5 select-none">
              <thead className="bg-[#121212] border-b border-white/5 font-mono text-[10px] text-white/40 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Visual asset</th>
                  <th className="p-4">Catalog properties</th>
                  <th className="p-4">Vibe / segment</th>
                  <th className="p-4 text-right">Unit Pricing</th>
                  <th className="p-4 text-center">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-white/40 font-serif italic">
                      Zero catalog elements registered.
                    </td>
                  </tr>
                ) : (
                  products.map(prod => (
                    <tr key={prod.id} className="hover:bg-white/5 transition">
                      <td className="p-4 w-16">
                        <img src={prod.image} className="w-12 h-14 object-cover border border-white/10 bg-[#161616]" alt="" />
                      </td>
                      <td className="p-4 max-w-[200px]">
                        <div className="font-semibold text-white/95 truncate">{prod.name}</div>
                        <div className="text-[10px] text-white/35 font-mono mt-0.5 truncate">{prod.id}</div>
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {prod.badge && <span className="px-1.5 py-0.5 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 font-bold text-[8px] uppercase tracking-wider">{prod.badge}</span>}
                          {prod.featured === true && <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold text-[8px] uppercase tracking-wider">HEAVY FEATURE</span>}
                          {!prod.inStock && <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-[8px] uppercase tracking-wider">OUT OF STOCK</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/60 font-medium">
                          {prod.category}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-[#C5A059]">
                        ${Number(prod.price).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEditClick(prod)} 
                            className="p-2 border border-white/10 hover:border-[#C5A059]/40 text-white/70 hover:text-[#C5A059] transition"
                            title="Refactor properties"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(prod.id)} 
                            className="p-2 border border-white/10 hover:border-red-500/40 text-white/70 hover:text-red-400 transition"
                            title="Eradicate listing"
                          >
                            <Trash className="h-3 w-3" />
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

      {/* Tab: Orders */}
      {activeTab === "orders" && (
        <div className="overflow-x-auto bg-[#0A0A0A] border border-white/5">
          <table className="w-full text-left text-xs text-white/80 select-none">
            <thead className="bg-[#121212] border-b border-white/5 font-mono text-[10px] text-white/40 uppercase tracking-wider">
              <tr>
                <th className="p-4">Receipt Token</th>
                <th className="p-4">Date stamp</th>
                <th className="p-4">Consignee Coordinates</th>
                <th className="p-4">Acquired chamber items</th>
                <th className="p-4 text-right">Sum total</th>
                <th className="p-4 text-center">Sim security key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-white/40 font-serif italic font-sans">
                    Ledger book is currently offline. No mock purchase records exist.
                  </td>
                </tr>
              ) : (
                orders.map((ord, idx) => {
                  const items = Array.isArray(ord.cartItems) 
                    ? ord.cartItems 
                    : (typeof ord.cartItems === 'string' ? JSON.parse(ord.cartItems) : []);
                  
                  // Sum up manually if totalPrice doesn't exist
                  const finalTotal = ord.total || items.reduce((sum, it) => sum + (it.product?.price || it.price || 0) * (it.quantity || 1), 0);

                  return (
                    <tr key={ord.orderId || idx} className="hover:bg-white/5 transition">
                      <td className="p-4 font-bold text-white uppercase tracking-wider text-[11px]">
                        {ord.orderId || "AURA-715201"}
                      </td>
                      <td className="p-4 text-white/40 text-[10px]">
                        {ord.date ? new Date(ord.date).toLocaleDateString() : new Date().toLocaleDateString()}
                      </td>
                      <td className="p-4 text-[11px] font-sans">
                        <div className="font-bold text-white/90">{ord.shippingFullName}</div>
                        <div className="text-white/40 leading-snug mt-0.5 mt-1 text-[10px]">
                          {ord.shippingAddressLine}, {ord.shippingCity}, {ord.shippingPostalCode}
                        </div>
                      </td>
                      <td className="p-4 font-sans text-[10px] max-w-[240px]">
                        <ul className="list-disc list-inside space-y-1 text-white/60">
                          {items.map((it, iIdx) => (
                            <li key={iIdx} className="truncate">
                              <span className="font-semibold text-white">{it.quantity}x</span> - {it.product?.name || it.productName || "Studio Masterpiece"}{" "}
                              {it.selectedColor && <span className="text-[#C5A059] font-mono text-[9px] uppercase">[{it.selectedColor}]</span>}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-4 text-right font-bold text-[#E5C079] tracking-wider">
                        ${Number(finalTotal).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[9px] uppercase">
                          {ord.authCode || "TXN-SIM-APPROVED"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.length === 0 ? (
            <div className="col-span-full py-16 text-center text-white/40 font-serif italic">
              No registered vault profiles located.
            </div>
          ) : (
            users.map((usr, uIdx) => (
              <div key={usr.username || uIdx} className="bg-[#0A0A0A] p-5 border border-white/5 flex items-center gap-4">
                <img 
                  src={usr.avatarUrl || `https://api.dicebear.com/7.x/micah/svg?seed=${usr.username}`} 
                  alt="User Avatar" 
                  className="w-14 h-14 rounded-full border border-white/10 bg-white/5 object-cover" 
                />
                <div className="min-w-0 flex-grow">
                  <div className="font-serif italic text-base text-white/90 truncate">{usr.fullName}</div>
                  <div className="text-[10px] font-mono text-white/35 mt-0.5 truncate">@{usr.username}</div>
                  <div className="text-[11px] text-[#C5A059] font-mono uppercase tracking-widest mt-2">
                    {usr.preferredVibe || "Unspecified Vibe"}
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
