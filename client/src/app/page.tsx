"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/common/Header";
import { Product as ProductType } from "../context/searchStore";
import { ArrowRight, ShoppingBag, Truck, CreditCard, ShieldCheck, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      img: "/slider_cuban.png",
      link: "/products?category=men",
      title: "CUBAN COLLAR SHIRTS",
      desc: "Effortless casual comfort tailored for daily style.",
      badge: "Summer Season 2026"
    },
    {
      img: "/slider_panjabi.png",
      link: "/products",
      title: "LUXURY PANJABI COLLECTION",
      desc: "Traditional cuts engineered with modern premium details.",
      badge: "Traditional Edition"
    },
    {
      img: "/slider_denim_jacket.png",
      link: "/products",
      title: "STREETWEAR OUTERWEAR",
      desc: "Heavyweight utility layer and premium denim jackets.",
      badge: "Winter Collection"
    },
    {
      img: "/slider_denim_shirt.png",
      link: "/products",
      title: "CASUAL DENIM SHIRTS",
      desc: "Classic indigo washes, timeless everyday silhouettes.",
      badge: "All-time Classic"
    }
  ];

  // Autoplay Slider every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Fetch featured items
  useEffect(() => {
    fetch("http://localhost:5000/api/products?limit=4")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFeaturedProducts(data.data);
        }
      })
      .catch((err) => console.error("Error fetching featured products:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = [
    {
      name: "Men's Wear",
      slug: "men",
      desc: "Premium Polos, Crewnecks & activewear",
      img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600",
    },
    {
      name: "Women's Collection",
      slug: "women",
      desc: "Linen Kurtis, summer tops & daily wear",
      img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
    },
    {
      name: "Sports Gear",
      slug: "sports",
      desc: "Official fan jerseys & active track jackets",
      img: "https://images.unsplash.com/photo-1577416412292-747c6607f055?auto=format&fit=crop&q=80&w=600",
    },
  ];

  return (
    <>
      <Header />
      
      {/* Interactive Image Slider */}
      <section className="relative w-full h-[450px] sm:h-[550px] md:h-[650px] overflow-hidden bg-primary">
        
        {/* Slides Wrapper */}
        <div 
          className="flex h-full w-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div 
              key={idx} 
              onClick={() => router.push(slide.link)}
              className="w-full h-full flex-shrink-0 relative cursor-pointer"
            >
              {/* Background Image */}
              <img 
                src={slide.img} 
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Dark Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              
              {/* Content Panel */}
              <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-start gap-4 sm:gap-6 text-white z-10 select-none">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-accent bg-accent/15 px-3.5 py-1.5 rounded-full border border-accent/20 animate-fade-in">
                  {slide.badge}
                </span>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none max-w-3xl animate-slide-up">
                  {slide.title}
                </h1>
                <p className="text-xs sm:text-base text-white/70 max-w-lg leading-relaxed font-medium">
                  {slide.desc}
                </p>
                <div className="flex gap-4 w-full sm:w-auto mt-2">
                  <span
                    className="h-11 sm:h-12 px-6 sm:px-8 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Shop Now <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Left Navigation Arrow */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur flex items-center justify-center transition-all cursor-pointer border border-white/10 opacity-0 md:group-hover:opacity-100 md:opacity-75"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Right Navigation Arrow */}
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur flex items-center justify-center transition-all cursor-pointer border border-white/10 opacity-0 md:group-hover:opacity-100 md:opacity-75"
        >
          <ChevronRight size={20} />
        </button>

        {/* Pagination Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(idx);
              }}
              className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${currentSlide === idx ? "bg-accent w-6" : "bg-white/40 hover:bg-white/70 w-2"}`}
            />
          ))}
        </div>

      </section>

      {/* Categories Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 w-full">
        <h2 className="text-2xl font-black text-primary tracking-tight mb-8">
          Browse Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.slug}
              onClick={() => router.push(`/products?category=${cat.slug}`)}
              className="group cursor-pointer relative aspect-[16/10] rounded-2xl overflow-hidden hover-lift border border-border-custom bg-secondary"
            >
              {/* Background cover zoom */}
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Backdrop Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6" />
              
              <div className="relative text-white flex flex-col gap-1 z-10">
                <h3 className="text-lg font-extrabold">{cat.name}</h3>
                <p className="text-xs text-white/70 leading-relaxed font-medium">{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="bg-secondary/40 py-16 border-t border-b border-border-custom/50 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-black text-primary tracking-tight">
              Featured Arrivals
            </h2>
            <Link
              href="/products"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              View All Products <ArrowRight size={13} />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col gap-4">
                  <div className="bg-secondary aspect-[3/4] rounded-2xl" />
                  <div className="h-4 bg-secondary w-2/3 rounded" />
                  <div className="h-4 bg-secondary w-1/3 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => router.push(`/product/${product.slug}`)}
                  className="group flex flex-col relative rounded-2xl overflow-hidden hover-lift border border-border-custom bg-white cursor-pointer"
                >
                  {/* Badge */}
                  {product.tags.length > 0 && (
                    <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-[8px] font-black rounded-full bg-accent text-white uppercase tracking-wider">
                      {product.tags[0]}
                    </span>
                  )}

                  {/* Image wrapper */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Info details */}
                  <div className="p-4 flex flex-col justify-between gap-1 flex-1">
                    <div>
                      <span className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest">
                        {product.category.name}
                      </span>
                      <h3 className="font-bold text-sm text-primary group-hover:text-accent transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </div>
                    <span className="font-black text-sm text-primary mt-1">
                      {Number(product.basePrice)} BDT
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Core values / Features checklist */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4 bg-white border border-border-custom p-6 rounded-2xl">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center flex-shrink-0">
              <Truck size={22} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-primary">Fast Delivery</h4>
              <p className="text-xs text-foreground/50 mt-1 leading-relaxed font-medium">Nationwide home shipping. Inside Dhaka deliveries in 24 - 48 hours.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white border border-border-custom p-6 rounded-2xl">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center flex-shrink-0">
              <CreditCard size={22} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-primary">Secure Payments</h4>
              <p className="text-xs text-foreground/50 mt-1 leading-relaxed font-medium">Cash on Delivery alongside card, bKash, and Nagad digital payments.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white border border-border-custom p-6 rounded-2xl">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-primary">Combed Organic Fabrics</h4>
              <p className="text-xs text-foreground/50 mt-1 leading-relaxed font-medium">We print and tailor only with high-quality, pre-shrunk cotton blends.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-primary text-white py-12 border-t border-white/5 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row justify-between gap-8 text-sm">
          <div className="flex flex-col gap-3 max-w-xs">
            <span className="text-xl font-black tracking-tight flex items-center gap-1.5">
              <img src="/logo.png" alt="Zendora Logo" className="h-6 w-auto object-contain brightness-0 invert" />
            </span>
            <p className="text-xs text-white/50 leading-relaxed font-medium">
              Zendora is a premium clothing brand in Bangladesh, crafting active sports jerseys, luxury pique polos, and casual organic streetwear.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-white/40">Shop Pages</span>
              <Link href="/products?category=men" className="text-xs text-white/70 hover:text-white transition-colors">Men's Apparel</Link>
              <Link href="/products?category=women" className="text-xs text-white/70 hover:text-white transition-colors">Women's Wear</Link>
              <Link href="/products?category=sports" className="text-xs text-white/70 hover:text-white transition-colors">Sportswear Jerseys</Link>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-white/40">Customer Support</span>
              <Link href="/track" className="text-xs text-white/70 hover:text-white transition-colors">Track Order Status</Link>
              <Link href="/dashboard" className="text-xs text-white/70 hover:text-white transition-colors">My Profile Dashboard</Link>
              <span className="text-xs text-white/50">Return Policy</span>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full text-center text-xs text-white/30 border-t border-white/5 pt-6 mt-8 font-medium">
          &copy; {new Date().getFullYear()} Zendora E-Commerce Store. Act as Expert pair-programmer AI agent.
        </div>
      </footer>
    </>
  );
}
