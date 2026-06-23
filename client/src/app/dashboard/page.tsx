"use client";

import React, { useEffect, useState } from "react";
import Header from "../../components/common/Header";
import { User, Mail, Phone, MapPin, Package, Calendar, Tag, ExternalLink, Loader2 } from "lucide-react";
import { API_URL } from "@/config";
import Link from "next/link";

export default function Dashboard() {
  const [profile, setProfile] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch profile on mount
  useEffect(() => {
    setIsLoadingProfile(true);
    fetch(`${API_URL}/users/profile?email=rubayet@zendora.com`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.data);
          // Fetch orders for this user
          fetchOrders(data.data.id);
        } else {
          setErrorMessage(data.error || "Failed to load user profile.");
          setIsLoadingProfile(false);
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || "Failed to connect to backend api.");
        setIsLoadingProfile(false);
      });
  }, []);

  const fetchOrders = async (userId: string) => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/orders/user/${userId}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setIsLoadingProfile(false);
      setIsLoadingOrders(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-600 border-amber-200/50";
      case "PROCESSING":
        return "bg-blue-50 text-blue-600 border-blue-200/50";
      case "SHIPPED":
        return "bg-purple-50 text-purple-600 border-purple-200/50";
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-600 border-emerald-200/50";
      case "CANCELLED":
        return "bg-red-50 text-red-600 border-red-200/50";
      default:
        return "bg-secondary text-foreground/60 border-border-custom";
    }
  };

  if (isLoadingProfile) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-accent" size={24} />
          <span className="text-sm font-semibold text-foreground/60">Loading your profile & orders...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full animate-slide-up">
        
        {/* Dashboard Title */}
        <div className="border-b border-border-custom pb-6 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            My Dashboard
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage your personal profile, addresses, and track active orders.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-xs font-semibold mb-8 text-center">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Panel: Profile info */}
          {profile && (
            <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
              
              {/* Profile Details Card */}
              <div className="bg-white border border-border-custom p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center font-bold text-lg">
                    {profile.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-primary">{profile.name}</h3>
                    <span className="text-xs text-accent font-bold uppercase tracking-wider bg-accent/5 px-2 py-0.5 rounded-full border border-accent/10">
                      {profile.role} Account
                    </span>
                  </div>
                </div>

                <div className="h-[1px] bg-border-custom w-full my-2" />

                <div className="space-y-3 text-sm text-foreground/75 font-medium">
                  <div className="flex items-center gap-2.5">
                    <Mail size={16} className="text-foreground/40" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone size={16} className="text-foreground/40" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>

                {profile.role === "ADMIN" && (
                  <div className="flex flex-col gap-2 mt-2 w-full">
                    <Link
                      href="/admin/add-product"
                      className="w-full h-10 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow"
                    >
                      Add New Product (Admin)
                    </Link>
                    <Link
                      href="/admin/categories"
                      className="w-full h-10 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow"
                    >
                      Manage Categories (Admin)
                    </Link>
                  </div>
                )}
              </div>

              {/* Shipping Addresses Card */}
              <div className="bg-white border border-border-custom p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                  <MapPin size={16} /> Saved Address
                </h4>
                
                {profile.addresses && profile.addresses.length > 0 ? (
                  profile.addresses.map((addr: any) => (
                    <div key={addr.id} className="text-xs bg-secondary/50 p-3.5 border border-border-custom rounded-xl flex flex-col gap-1 leading-relaxed">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-primary">Home Address</span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-bold">Default</span>
                        )}
                      </div>
                      <p className="text-foreground/75 font-medium">{addr.street}</p>
                      <p className="text-foreground/50">{addr.city} {addr.postalCode ? `- ${addr.postalCode}` : ""}, {addr.country}</p>
                      <p className="text-[10px] font-bold text-accent uppercase tracking-wider mt-1">{addr.zone.replace("_", " ")} Delivery</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-foreground/40">No saved addresses.</p>
                )}
              </div>

            </div>
          )}

          {/* Right Panel: Order History list */}
          <div className="flex-1 w-full bg-white border border-border-custom p-6 md:p-8 rounded-2xl shadow-sm">
            <h3 className="font-extrabold text-lg text-primary border-b border-border-custom pb-4 mb-6 flex items-center gap-2">
              <Package size={18} /> Order History
            </h3>

            {isLoadingOrders ? (
              <div className="py-20 text-center flex justify-center items-center">
                <Loader2 className="animate-spin text-accent" size={24} />
              </div>
            ) : orders.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <p className="text-foreground/40 text-sm font-medium">You haven't placed any orders yet.</p>
                <Link href="/products" className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-full shadow">
                  Shop Apparel Now
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord) => (
                  <div key={ord.id} className="border border-border-custom/80 rounded-2xl p-5 flex flex-col gap-4 hover:border-accent transition-colors">
                    
                    {/* Order header info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-secondary/30 p-3 rounded-xl border border-border-custom/40">
                      <div className="flex items-center gap-4 text-xs font-medium text-foreground/50">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-foreground/40">Order Number</span>
                          <Link
                            href={`/track?track=${ord.orderNumber}`}
                            className="font-bold text-sm text-accent hover:underline flex items-center gap-1 mt-0.5"
                          >
                            {ord.orderNumber} <ExternalLink size={12} />
                          </Link>
                        </div>
                        <div className="h-6 w-[1px] bg-border-custom" />
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-foreground/40">Date Placed</span>
                          <span className="font-semibold text-primary mt-0.5 flex items-center gap-1">
                            <Calendar size={13} /> {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-extrabold border px-3 py-1 rounded-full uppercase tracking-wider ${getStatusColor(ord.status)}`}>
                          {ord.status}
                        </span>
                        <span className="text-sm font-black text-primary">
                          {Number(ord.totalAmount)} BDT
                        </span>
                      </div>
                    </div>

                    {/* Order items listing */}
                    <div className="divide-y divide-border-custom/50">
                      {ord.items.map((item: any) => (
                        <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex gap-4 items-start text-sm justify-between">
                          <div className="flex gap-3">
                            <img
                              src={item.variant.images[0] || item.variant.product.images[0]}
                              alt=""
                              className="w-10 h-12 object-cover rounded bg-secondary border border-border-custom"
                            />
                            <div className="flex flex-col justify-center">
                              <span className="font-semibold text-primary line-clamp-1">{item.variant.product.name}</span>
                              <span className="text-[10px] text-foreground/40 mt-0.5">
                                Size: {item.variant.size} / Color: {item.variant.color} / Qty: {item.quantity}
                              </span>
                            </div>
                          </div>
                          
                          <span className="font-bold text-primary self-center">
                            {Number(item.priceAtPurchase) * item.quantity} BDT
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
