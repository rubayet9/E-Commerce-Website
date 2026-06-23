"use client";

import React from "react";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { useCartStore } from "../../context/cartStore";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    toggleCart,
    updateQuantity,
    removeItem,
    shippingZone,
    setShippingZone,
    getSubtotal,
    getShippingCost,
    getTotal,
  } = useCartStore();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        onClick={() => toggleCart(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Slide-over panel */}
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col glass animate-slide-up h-full border-l border-border-custom">
          
          {/* Header */}
          <div className="p-6 border-b border-border-custom flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-primary flex items-center gap-2">
              <ShoppingCart size={18} /> Shopping Cart
            </h2>
            <button
              onClick={() => toggleCart(false)}
              className="p-1 hover:bg-secondary rounded-lg text-foreground/50 hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!cart || cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-foreground/30">
                  <ShoppingCart size={32} />
                </div>
                <div>
                  <p className="font-bold text-primary text-sm">Your cart is empty</p>
                  <p className="text-xs text-foreground/40 mt-1">Add items from the store to get started.</p>
                </div>
                <button
                  onClick={() => toggleCart(false)}
                  className="mt-2 px-6 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              cart.items.map((item) => {
                const itemPrice = item.variant.priceOverride
                  ? Number(item.variant.priceOverride)
                  : Number(item.variant.product.basePrice);

                return (
                  <div key={item.id} className="flex gap-4 border-b border-border-custom/50 pb-4">
                    {/* Item Thumbnail */}
                    <img
                      src={item.variant.images[0] || item.variant.product.images[0]}
                      alt={item.variant.product.name}
                      className="w-16 h-20 object-cover rounded-lg border border-border-custom bg-secondary"
                    />

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between gap-1">
                      <div>
                        <h4 className="font-bold text-sm text-primary line-clamp-1">
                          {item.variant.product.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-foreground/50 block">
                          Size: {item.variant.size} / Color: {item.variant.color}
                        </span>
                      </div>

                      {/* Quantity counter and delete trigger */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border-custom rounded-lg h-7 overflow-hidden">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantity(item.id, item.quantity - 1);
                              } else {
                                removeItem(item.id);
                              }
                            }}
                            className="px-2 h-full hover:bg-secondary text-foreground/60 transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="px-2.5 text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 h-full hover:bg-secondary text-foreground/60 transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right flex items-center gap-3">
                          <span className="text-xs font-black text-primary">
                            {itemPrice * item.quantity} BDT
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 hover:bg-red-50 text-foreground/30 hover:text-red-500 rounded transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer details (totals & zone selector) */}
          {cart && cart.items.length > 0 && (
            <div className="p-6 border-t border-border-custom bg-secondary/30 flex flex-col gap-4">
              
              {/* Shipping Zone Selector */}
              <div className="flex items-center justify-between gap-4 bg-white border border-border-custom p-3 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold text-foreground/40 uppercase tracking-wide">Shipping Area</span>
                  <span className="text-xs font-bold text-primary">Calculate initial delivery</span>
                </div>
                <select
                  value={shippingZone}
                  onChange={(e) => setShippingZone(e.target.value as any)}
                  className="bg-secondary text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border-custom focus:outline-none"
                >
                  <option value="INSIDE_DHAKA">Inside Dhaka (60 BDT)</option>
                  <option value="OUTSIDE_DHAKA">Outside Dhaka (120 BDT)</option>
                </select>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-sm text-foreground/70">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-primary">{getSubtotal()} BDT</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-semibold text-primary">{getShippingCost()} BDT</span>
                </div>
                <div className="h-[1px] bg-border-custom w-full my-2" />
                <div className="flex justify-between text-base font-extrabold text-primary">
                  <span>Total Amount</span>
                  <span className="text-accent">{getTotal()} BDT</span>
                </div>
              </div>

              {/* Checkout redirects */}
              <Link
                href="/checkout"
                onClick={() => toggleCart(false)}
                className="w-full h-11 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl text-sm shadow transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight size={15} />
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
