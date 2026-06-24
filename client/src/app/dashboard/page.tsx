"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/common/Header";
import { User, Mail, Phone, MapPin, Package, Calendar, Tag, ExternalLink, Loader2, Heart, ShoppingCart, Shield, Crown, Trash2, ChevronRight } from "lucide-react";
import { API_URL } from "@/config";
import { useAuthStore } from "@/context/authStore";
import Link from "next/link";

type TabKey = "profile" | "orders" | "cart" | "favourites" | "admin";

export default function Dashboard() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading, loadUser, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [orders, setOrders] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [favourites, setFavourites] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [isLoadingFavourites, setIsLoadingFavourites] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [roleUpdateMsg, setRoleUpdateMsg] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user || !token) return;
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "cart") fetchCart();
    if (activeTab === "favourites") fetchFavourites();
    if (activeTab === "admin" && (user.role === "SUPER_ADMIN")) fetchAllUsers();
  }, [activeTab, user, token]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/orders/user/${user!.id}`);
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (err) { console.error(err); }
    finally { setIsLoadingOrders(false); }
  };

  const fetchCart = async () => {
    setIsLoadingCart(true);
    try {
      const res = await fetch(`${API_URL}/cart?userId=${user!.id}`);
      const data = await res.json();
      if (data.success && data.data) setCartItems(data.data.items || []);
    } catch (err) { console.error(err); }
    finally { setIsLoadingCart(false); }
  };

  const fetchFavourites = async () => {
    setIsLoadingFavourites(true);
    try {
      const res = await fetch(`${API_URL}/favourites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setFavourites(data.data);
    } catch (err) { console.error(err); }
    finally { setIsLoadingFavourites(false); }
  };

  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAllUsers(data.data);
    } catch (err) { console.error(err); }
    finally { setIsLoadingUsers(false); }
  };

  const removeFavourite = async (productId: string) => {
    try {
      await fetch(`${API_URL}/favourites/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavourites((prev) => prev.filter((f: any) => f.productId !== productId));
    } catch (err) { console.error(err); }
  };

  const updateUserRole = async (userId: string, role: string) => {
    setRoleUpdateMsg(null);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        setRoleUpdateMsg(data.message);
        fetchAllUsers();
      } else {
        setRoleUpdateMsg(data.error);
      }
    } catch (err) { console.error(err); }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-amber-50 text-amber-600 border-amber-200/50",
      PROCESSING: "bg-blue-50 text-blue-600 border-blue-200/50",
      SHIPPED: "bg-purple-50 text-purple-600 border-purple-200/50",
      DELIVERED: "bg-emerald-50 text-emerald-600 border-emerald-200/50",
      CANCELLED: "bg-red-50 text-red-600 border-red-200/50",
    };
    return colors[status] || "bg-secondary text-foreground/60 border-border-custom";
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      SUPER_ADMIN: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200",
      ADMIN: "bg-indigo-50 text-indigo-600 border-indigo-200/50",
      STAFF: "bg-teal-50 text-teal-600 border-teal-200/50",
      CUSTOMER: "bg-secondary text-foreground/50 border-border-custom",
    };
    return styles[role] || styles.CUSTOMER;
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; show: boolean }[] = [
    { key: "profile", label: "Profile", icon: <User size={16} />, show: true },
    { key: "orders", label: "Orders", icon: <Package size={16} />, show: true },
    { key: "cart", label: "Cart", icon: <ShoppingCart size={16} />, show: true },
    { key: "favourites", label: "Favourites", icon: <Heart size={16} />, show: true },
    { key: "admin", label: "Users", icon: <Shield size={16} />, show: user?.role === "SUPER_ADMIN" },
  ];

  if (authLoading || !user) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-accent" size={24} />
          <span className="text-sm font-semibold text-foreground/60">Loading your dashboard...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full animate-slide-up">
        {/* Dashboard Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-custom pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">My Dashboard</h1>
            <p className="text-sm text-foreground/60 mt-1">
              Welcome back, <span className="font-bold text-accent">{user.name}</span>
            </p>
          </div>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="px-5 py-2.5 text-xs font-bold text-red-500 hover:text-white border border-red-200 hover:bg-red-500 rounded-xl transition-all"
          >
            Sign Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-secondary/80 p-1 rounded-xl mb-8 overflow-x-auto border border-border-custom">
          {tabs.filter((t) => t.show).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-white text-accent shadow-sm border border-border-custom"
                  : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-slide-up">
          {/* ===== PROFILE TAB ===== */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="bg-white border border-border-custom p-6 rounded-2xl shadow-sm flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-200/50">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-primary">{user.name}</h3>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${getRoleBadge(user.role)}`}>
                      {user.role === "SUPER_ADMIN" && <Crown size={10} />}
                      {user.role.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="h-[1px] bg-border-custom w-full" />

                <div className="space-y-3 text-sm text-foreground/75 font-medium">
                  <div className="flex items-center gap-2.5">
                    <Mail size={16} className="text-foreground/40" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone size={16} className="text-foreground/40" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <Calendar size={16} className="text-foreground/40" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                  <div className="flex flex-col gap-2 mt-2">
                    <Link href="/admin/add-product" className="w-full h-10 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow">
                      Add New Product
                    </Link>
                    <Link href="/admin/categories" className="w-full h-10 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow">
                      Manage Categories
                    </Link>
                  </div>
                )}
              </div>

              {/* Addresses */}
              <div className="lg:col-span-2 bg-white border border-border-custom p-6 rounded-2xl shadow-sm">
                <h4 className="font-bold text-sm text-primary flex items-center gap-2 mb-4">
                  <MapPin size={16} /> Saved Addresses
                </h4>
                {user.addresses && user.addresses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user.addresses.map((addr: any) => (
                      <div key={addr.id} className="text-xs bg-secondary/50 p-4 border border-border-custom rounded-xl flex flex-col gap-1.5 leading-relaxed">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-primary">Address</span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-bold">Default</span>
                          )}
                        </div>
                        <p className="text-foreground/75 font-medium">{addr.street}</p>
                        <p className="text-foreground/50">{addr.city} {addr.postalCode ? `- ${addr.postalCode}` : ""}, {addr.country}</p>
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mt-1">{addr.zone.replace("_", " ")} Delivery</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground/40">No saved addresses yet.</p>
                )}
              </div>
            </div>
          )}

          {/* ===== ORDERS TAB ===== */}
          {activeTab === "orders" && (
            <div className="bg-white border border-border-custom p-6 md:p-8 rounded-2xl shadow-sm">
              <h3 className="font-extrabold text-lg text-primary border-b border-border-custom pb-4 mb-6 flex items-center gap-2">
                <Package size={18} /> Order History
              </h3>

              {isLoadingOrders ? (
                <div className="py-20 text-center flex justify-center"><Loader2 className="animate-spin text-accent" size={24} /></div>
              ) : orders.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <p className="text-foreground/40 text-sm font-medium">You haven't placed any orders yet.</p>
                  <Link href="/products" className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-full shadow">Shop Now</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((ord) => (
                    <div key={ord.id} className="border border-border-custom/80 rounded-2xl p-5 flex flex-col gap-4 hover:border-accent transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-secondary/30 p-3 rounded-xl border border-border-custom/40">
                        <div className="flex items-center gap-4 text-xs font-medium text-foreground/50">
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-foreground/40">Order Number</span>
                            <Link href={`/track?track=${ord.orderNumber}`} className="font-bold text-sm text-accent hover:underline flex items-center gap-1 mt-0.5">
                              {ord.orderNumber} <ExternalLink size={12} />
                            </Link>
                          </div>
                          <div className="h-6 w-[1px] bg-border-custom" />
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-foreground/40">Date</span>
                            <span className="font-semibold text-primary mt-0.5 flex items-center gap-1">
                              <Calendar size={13} /> {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-extrabold border px-3 py-1 rounded-full uppercase tracking-wider ${getStatusColor(ord.status)}`}>{ord.status}</span>
                          <span className="text-sm font-black text-primary">{Number(ord.totalAmount)} BDT</span>
                        </div>
                      </div>
                      <div className="divide-y divide-border-custom/50">
                        {ord.items.map((item: any) => (
                          <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex gap-4 items-start text-sm justify-between">
                            <div className="flex gap-3">
                              <img src={item.variant.images?.[0] || item.variant.product?.images?.[0]} alt="" className="w-10 h-12 object-cover rounded bg-secondary border border-border-custom" />
                              <div className="flex flex-col justify-center">
                                <span className="font-semibold text-primary line-clamp-1">{item.variant.product?.name}</span>
                                <span className="text-[10px] text-foreground/40 mt-0.5">Size: {item.variant.size} / Color: {item.variant.color} / Qty: {item.quantity}</span>
                              </div>
                            </div>
                            <span className="font-bold text-primary self-center">{Number(item.priceAtPurchase) * item.quantity} BDT</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== CART TAB ===== */}
          {activeTab === "cart" && (
            <div className="bg-white border border-border-custom p-6 md:p-8 rounded-2xl shadow-sm">
              <h3 className="font-extrabold text-lg text-primary border-b border-border-custom pb-4 mb-6 flex items-center gap-2">
                <ShoppingCart size={18} /> My Cart
              </h3>

              {isLoadingCart ? (
                <div className="py-20 text-center flex justify-center"><Loader2 className="animate-spin text-accent" size={24} /></div>
              ) : cartItems.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <p className="text-foreground/40 text-sm font-medium">Your cart is empty.</p>
                  <Link href="/products" className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-full shadow">Browse Products</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item: any) => {
                    const price = item.variant.priceOverride ? Number(item.variant.priceOverride) : Number(item.variant.product?.basePrice || 0);
                    return (
                      <div key={item.id} className="flex items-center gap-4 p-4 border border-border-custom rounded-xl hover:border-accent/30 transition-colors">
                        <img src={item.variant.images?.[0] || item.variant.product?.images?.[0]} alt="" className="w-16 h-20 object-cover rounded-lg bg-secondary border border-border-custom" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-primary line-clamp-1">{item.variant.product?.name}</h4>
                          <p className="text-[11px] text-foreground/40 mt-1">
                            {item.variant.color} / {item.variant.size} · Qty: {item.quantity}
                          </p>
                        </div>
                        <span className="font-black text-primary text-sm whitespace-nowrap">{price * item.quantity} BDT</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-end pt-4 border-t border-border-custom">
                    <Link href="/checkout" className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow flex items-center gap-2 transition-all">
                      Proceed to Checkout <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== FAVOURITES TAB ===== */}
          {activeTab === "favourites" && (
            <div className="bg-white border border-border-custom p-6 md:p-8 rounded-2xl shadow-sm">
              <h3 className="font-extrabold text-lg text-primary border-b border-border-custom pb-4 mb-6 flex items-center gap-2">
                <Heart size={18} /> My Favourites
              </h3>

              {isLoadingFavourites ? (
                <div className="py-20 text-center flex justify-center"><Loader2 className="animate-spin text-accent" size={24} /></div>
              ) : favourites.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <p className="text-foreground/40 text-sm font-medium">You haven't added any favourites yet.</p>
                  <Link href="/products" className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-full shadow">Explore Products</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favourites.map((fav: any) => (
                    <div key={fav.id} className="border border-border-custom rounded-2xl overflow-hidden hover:border-accent/30 transition-colors group">
                      <div className="relative h-40 bg-secondary">
                        <img src={fav.product.images?.[0]} alt={fav.product.name} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeFavourite(fav.productId)}
                          className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-red-50 border border-border-custom rounded-full flex items-center justify-center transition-all group-hover:shadow"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                      <div className="p-4">
                        <Link href={`/product/${fav.product.slug}`} className="font-bold text-sm text-primary hover:text-accent transition-colors line-clamp-1">
                          {fav.product.name}
                        </Link>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-black text-accent">{Number(fav.product.basePrice)} BDT</span>
                          {fav.product.tags?.length > 0 && (
                            <span className="text-[9px] font-bold text-foreground/40 bg-secondary px-2 py-0.5 rounded-full border border-border-custom flex items-center gap-1">
                              <Tag size={8} /> {fav.product.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== ADMIN TAB (SUPER_ADMIN ONLY) ===== */}
          {activeTab === "admin" && user.role === "SUPER_ADMIN" && (
            <div className="bg-white border border-border-custom p-6 md:p-8 rounded-2xl shadow-sm">
              <h3 className="font-extrabold text-lg text-primary border-b border-border-custom pb-4 mb-6 flex items-center gap-2">
                <Shield size={18} /> User Management
              </h3>

              {roleUpdateMsg && (
                <div className="mb-5 p-3 bg-indigo-50 border border-indigo-200/60 rounded-xl text-xs font-semibold text-indigo-600 animate-slide-up">
                  {roleUpdateMsg}
                </div>
              )}

              {isLoadingUsers ? (
                <div className="py-20 text-center flex justify-center"><Loader2 className="animate-spin text-accent" size={24} /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-custom">
                        <th className="text-left py-3 px-2 text-xs font-bold text-foreground/40 uppercase tracking-wider">User</th>
                        <th className="text-left py-3 px-2 text-xs font-bold text-foreground/40 uppercase tracking-wider">Email</th>
                        <th className="text-left py-3 px-2 text-xs font-bold text-foreground/40 uppercase tracking-wider">Role</th>
                        <th className="text-left py-3 px-2 text-xs font-bold text-foreground/40 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom/50">
                      {allUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                                {u.name.charAt(0)}
                              </div>
                              <span className="font-semibold text-primary">{u.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-foreground/60 font-medium">{u.email}</td>
                          <td className="py-3 px-2">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${getRoleBadge(u.role)}`}>
                              {u.role === "SUPER_ADMIN" && <Crown size={10} />}
                              {u.role.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            {u.role === "SUPER_ADMIN" ? (
                              <span className="text-[10px] text-foreground/30 font-medium">Protected</span>
                            ) : (
                              <select
                                value={u.role}
                                onChange={(e) => updateUserRole(u.id, e.target.value)}
                                className="text-xs font-semibold bg-secondary border border-border-custom rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent cursor-pointer"
                              >
                                <option value="CUSTOMER">Customer</option>
                                <option value="ADMIN">Admin</option>
                                <option value="STAFF">Staff</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
