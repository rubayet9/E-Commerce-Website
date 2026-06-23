"use client";

import React, { useState } from "react";
import Header from "../../components/common/Header";
import { useCartStore } from "../../context/cartStore";
import { API_URL } from "@/config";
import { CreditCard, Truck, CheckCircle, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Checkout() {
  const {
    cart,
    shippingZone,
    setShippingZone,
    getSubtotal,
    getShippingCost,
    getTotal,
    userId,
    sessionToken,
    clearCartState,
  } = useCartStore();

  // Checkout form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "SSLCOMMERZ" | "STRIPE">("COD");

  // Flow states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name || !email || !phone || !street || !city || !shippingZone) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sessionToken,
          street,
          city,
          postalCode,
          zone: shippingZone,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrderSuccess(data.data);
        clearCartState(); // Reset local store cart items
      } else {
        setErrorMessage(data.error || "Failed to place order.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while placing your order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success view
  if (orderSuccess) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center animate-slide-up flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm">
            <CheckCircle size={44} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-primary">Order Placed Successfully!</h1>
            <p className="text-sm text-foreground/60 mt-2">
              Thank you for shopping with us. Your order has been placed and is currently being processed.
            </p>
          </div>

          <div className="w-full bg-secondary/50 border border-border-custom p-6 rounded-2xl text-left flex flex-col gap-4">
            <div className="flex justify-between border-b border-border-custom pb-3 text-sm">
              <span className="font-semibold text-foreground/50">Order Number</span>
              <span className="font-extrabold text-primary">{orderSuccess.orderNumber}</span>
            </div>
            <div className="flex justify-between border-b border-border-custom pb-3 text-sm">
              <span className="font-semibold text-foreground/50">Payment Status</span>
              <span className="font-bold text-accent uppercase tracking-wider text-xs bg-accent/5 px-2.5 py-1 rounded-full border border-accent/10">{orderSuccess.paymentStatus}</span>
            </div>
            <div className="flex justify-between border-b border-border-custom pb-3 text-sm">
              <span className="font-semibold text-foreground/50">Delivery Address</span>
              <span className="text-foreground/75 text-right font-medium">{street}, {city}</span>
            </div>
            <div className="flex justify-between text-sm pt-1">
              <span className="font-semibold text-foreground/50">Total Amount Paid</span>
              <span className="font-black text-primary">{orderSuccess.totalAmount} BDT</span>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <Link
              href="/products"
              className="flex-1 h-12 bg-secondary hover:bg-border-custom/50 border border-border-custom text-primary font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} /> Continue Shopping
            </Link>
            <Link
              href={`/products?track=${orderSuccess.orderNumber}`}
              className="flex-1 h-12 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2"
            >
              Track Order
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full animate-slide-up">
        <Link href="/products" className="text-xs font-bold text-accent hover:underline flex items-center gap-1.5 mb-6">
          <ArrowLeft size={14} /> Back to Products
        </Link>

        {!cart || cart.items.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <p className="text-foreground/50 font-medium">Your cart is empty. Cannot checkout.</p>
            <Link href="/products" className="px-6 py-2 bg-primary text-white rounded-full text-sm font-semibold shadow">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            
            {/* Left: Billing Address & Payment form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8 w-full">
              
              {/* Contact info */}
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-extrabold text-primary border-b border-border-custom pb-2">
                  1. Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-foreground/60 uppercase">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rubayet Khan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-foreground/60 uppercase">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +8801700000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/60 uppercase">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rubayet@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Shipping info */}
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-extrabold text-primary border-b border-border-custom pb-2">
                  2. Shipping Address
                </h2>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/60 uppercase">Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. House 24, Road 8, Dhanmondi"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-foreground/60 uppercase">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dhaka"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-foreground/60 uppercase">Postal Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 1209"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-foreground/60 uppercase">Shipping Zone *</label>
                    <select
                      value={shippingZone}
                      onChange={(e) => setShippingZone(e.target.value as any)}
                      className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                    >
                      <option value="INSIDE_DHAKA">Inside Dhaka (60 BDT)</option>
                      <option value="OUTSIDE_DHAKA">Outside Dhaka (120 BDT)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-extrabold text-primary border-b border-border-custom pb-2">
                  3. Payment Method
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label
                    className={`border p-4 rounded-2xl flex flex-col gap-2 cursor-pointer transition-all select-none ${paymentMethod === "COD" ? "border-accent bg-accent/5" : "border-border-custom hover:border-accent"}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="sr-only"
                    />
                    <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                      <Truck size={16} className="text-accent" /> Cash on Delivery
                    </span>
                    <span className="text-[10px] text-foreground/50">Pay with cash upon delivery of package at door.</span>
                  </label>

                  <label
                    className={`border p-4 rounded-2xl flex flex-col gap-2 cursor-pointer transition-all select-none ${paymentMethod === "SSLCOMMERZ" ? "border-accent bg-accent/5" : "border-border-custom hover:border-accent"}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "SSLCOMMERZ"}
                      onChange={() => setPaymentMethod("SSLCOMMERZ")}
                      className="sr-only"
                    />
                    <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                      <CreditCard size={16} className="text-accent" /> SSLCommerz
                    </span>
                    <span className="text-[10px] text-foreground/50">Pay via local debit/credit card, bKash, or Nagad gateway.</span>
                  </label>

                  <label
                    className={`border p-4 rounded-2xl flex flex-col gap-2 cursor-pointer transition-all select-none ${paymentMethod === "STRIPE" ? "border-accent bg-accent/5" : "border-border-custom hover:border-accent"}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "STRIPE"}
                      onChange={() => setPaymentMethod("STRIPE")}
                      className="sr-only"
                    />
                    <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                      <CreditCard size={16} className="text-accent" /> Stripe (Intl)
                    </span>
                    <span className="text-[10px] text-foreground/50">Pay securely with Visa, Mastercard, or Google Pay.</span>
                  </label>
                </div>
              </div>

              {/* Error messages */}
              {errorMessage && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Submit orders */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl text-sm shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Placing Order...
                  </>
                ) : (
                  <>
                    Place Order ({getTotal()} BDT)
                  </>
                )}
              </button>

            </form>

            {/* Right: Order Summary box */}
            <aside className="w-full lg:w-96 bg-secondary/30 border border-border-custom p-6 rounded-2xl flex flex-col gap-6 sticky top-24">
              <h3 className="font-extrabold text-lg text-primary border-b border-border-custom pb-2">
                Order Summary
              </h3>

              {/* Items in order */}
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-2">
                {cart.items.map((item) => {
                  const price = item.variant.priceOverride
                    ? Number(item.variant.priceOverride)
                    : Number(item.variant.product.basePrice);

                  return (
                    <div key={item.id} className="flex gap-3 justify-between items-start text-sm">
                      <div className="flex gap-3">
                        <img
                          src={item.variant.images[0] || item.variant.product.images[0]}
                          alt=""
                          className="w-10 h-12 object-cover rounded bg-secondary border border-border-custom"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-primary line-clamp-1">{item.variant.product.name}</span>
                          <span className="text-[10px] text-foreground/50">Size: {item.variant.size} / Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-bold text-primary whitespace-nowrap">{price * item.quantity} BDT</span>
                    </div>
                  );
                })}
              </div>

              <div className="h-[1px] bg-border-custom w-full" />

              {/* Prices summary */}
              <div className="space-y-2 text-sm text-foreground/75">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-primary">{getSubtotal()} BDT</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Cost</span>
                  <span className="font-semibold text-primary">{getShippingCost()} BDT</span>
                </div>
                <div className="h-[1px] bg-border-custom w-full my-1" />
                <div className="flex justify-between text-base font-extrabold text-primary">
                  <span>Total Amount</span>
                  <span className="text-accent">{getTotal()} BDT</span>
                </div>
              </div>

            </aside>

          </div>
        )}
      </main>
    </>
  );
}
