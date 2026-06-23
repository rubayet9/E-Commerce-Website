"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import { API_URL } from "@/config";
import { Search, Loader2, Package, Check, ArrowRight, Truck } from "lucide-react";

function TrackContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync with search parameter ?orderNumber= or ?track=
  useEffect(() => {
    const urlTrack = searchParams.get("track") || searchParams.get("orderNumber") || "";
    if (urlTrack) {
      setOrderNumber(urlTrack);
      handleTrack(urlTrack);
    }
  }, [searchParams]);

  const handleTrack = async (queryNum: string) => {
    if (!queryNum.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setOrder(null);

    try {
      const res = await fetch(`${API_URL}/orders/track/${queryNum}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      } else {
        setErrorMessage(data.error || "Order not found.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load order status.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case "PENDING":
        return 0;
      case "PROCESSING":
        return 1;
      case "SHIPPED":
        return 2;
      case "DELIVERED":
        return 3;
      default:
        return 0;
    }
  };

  const steps = [
    { title: "Order Placed", desc: "We received your order" },
    { title: "Processing", desc: "Preparing your items" },
    { title: "Shipped", desc: "Out for delivery" },
    { title: "Delivered", desc: "Received at destination" },
  ];

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <>
      <Header />
      
      <main className="mx-auto max-w-3xl px-4 py-16 flex-1 w-full animate-slide-up">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-primary">Track Your Order</h1>
          <p className="text-sm text-foreground/60 mt-2">
            Enter your order number starting with "FL-" to trace your package in real time.
          </p>
        </div>

        {/* Search tracker inputs */}
        <div className="flex gap-3 mb-10">
          <input
            type="text"
            placeholder="e.g. FL-1718911425123"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTrack(orderNumber)}
            className="flex-1 h-12 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
          />
          <button
            onClick={() => handleTrack(orderNumber)}
            disabled={isLoading}
            className="h-12 px-6 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl text-sm shadow transition-colors flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Track
          </button>
        </div>

        {/* Errors view */}
        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-xs font-semibold text-center">
            {errorMessage}
          </div>
        )}

        {/* Tracker Progress View */}
        {order && (
          <div className="flex flex-col gap-8 bg-white border border-border-custom p-6 md:p-8 rounded-2xl shadow-sm">
            
            {/* Summary info */}
            <div className="flex justify-between items-center border-b border-border-custom pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-foreground/40 uppercase">Tracking Details</span>
                <h3 className="font-extrabold text-lg text-primary">{order.orderNumber}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-foreground/40 block">Estimated Delivery</span>
                <span className="font-bold text-sm text-primary">2 - 3 Days</span>
              </div>
            </div>

            {/* Visual Steps Tracker */}
            <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-2 py-4">
              
              {/* Connector line for large screens */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border-custom -translate-y-1/2 hidden md:block z-0" />
              <div
                style={{ width: `${(currentStep / 3) * 100}%` }}
                className="absolute top-1/2 left-0 h-0.5 bg-accent -translate-y-1/2 hidden md:block z-0 transition-all duration-500"
              />

              {steps.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;
                
                return (
                  <div key={idx} className="flex md:flex-col items-center gap-4 md:gap-2 flex-1 z-10 text-left md:text-center">
                    
                    {/* Circle indicators */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${isCompleted ? "bg-accent border-accent text-white" : isCurrent ? "bg-white border-accent text-accent ring-4 ring-accent/10" : "bg-white border-border-custom text-foreground/30"}`}
                    >
                      {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                    </div>

                    <div>
                      <span className={`text-sm font-bold block ${isCurrent ? "text-accent" : "text-primary"}`}>{step.title}</span>
                      <span className="text-[10px] text-foreground/50">{step.desc}</span>
                    </div>
                  </div>
                );
              })}

            </div>

            <div className="h-[1px] bg-border-custom w-full" />

            {/* Order Items & shipping summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-primary flex items-center gap-2">
                  <Package size={16} /> Package Summary
                </h4>
                <div className="flex flex-col gap-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-foreground/75 font-medium">
                        {item.variant.product.name} (Size: {item.variant.size} x {item.quantity})
                      </span>
                      <span className="font-bold text-primary">{Number(item.priceAtPurchase) * item.quantity} BDT</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-primary flex items-center gap-2">
                  <Truck size={16} /> Shipping Details
                </h4>
                <div className="flex flex-col gap-1.5 text-foreground/75 font-medium">
                  <p><strong>Deliver to:</strong> {order.address.street}, {order.address.city}</p>
                  <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                  <p><strong>Shipping Cost:</strong> {Number(order.shippingCost)} BDT</p>
                  <p><strong>Total Amount:</strong> <strong className="text-accent">{Number(order.totalAmount)} BDT</strong></p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </>
  );
}

export default function Track() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-medium">Loading search params...</div>}>
      <TrackContent />
    </Suspense>
  );
}
