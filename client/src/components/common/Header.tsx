"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, User, ChevronDown, Clock, TrendingUp, X, LogOut, LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { useCartStore } from "../../context/cartStore";
import { useSearchStore } from "../../context/searchStore";
import { useAuthStore } from "../../context/authStore";
import { API_URL, BASE_PATH } from "@/config";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  subCategories: CategoryNode[];
}

export default function Header() {
  const router = useRouter();
  
  // Zustand Store values
  const { cart, toggleCart, initCart } = useCartStore();
  const { setFilters, fetchProducts } = useSearchStore();
  const { user, isAuthenticated, logout, loadUser } = useAuthStore();

  // Component States
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Popular search items
  const popularSearches = [
    "Bangladesh Fan Edition Jersey",
    "Premium Crewneck T-Shirt",
    "Luxury Pique Polo Shirt",
    "Classic Cotton Print Kurti",
  ];

  // Initialize cart, auth, and fetch categories on mount
  useEffect(() => {
    initCart();
    loadUser();
    
    // Fetch categories tree
    fetch(`${API_URL}/categories?tree=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));

    // Load recent searches from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fl_recent_searches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    }
  }, [initCart]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (queryText: string) => {
    if (!queryText.trim()) return;

    // Save to recent searches
    const updated = [queryText, ...recentSearches.filter((s) => s !== queryText)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("fl_recent_searches", JSON.stringify(updated));

    setIsSearchFocused(false);
    setSearchQuery(queryText);

    // Update global search store and redirect to PLP
    setFilters({ search: queryText, category: "", page: 1 });
    fetchProducts();
    router.push(`/products?search=${encodeURIComponent(queryText)}`);
  };

  const removeRecentSearch = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== text);
    setRecentSearches(updated);
    localStorage.setItem("fl_recent_searches", JSON.stringify(updated));
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push("/login");
  };

  // Compute total cart item quantity
  const cartItemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-custom glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src={`${BASE_PATH}/logo.png`} alt="Zendora Logo" className="h-8 w-auto object-contain" />
          </Link>

          {/* Navigation Mega Menu */}
          <nav className="hidden lg:flex items-center gap-8 h-full">
            {categories.map((category) => (
              <div key={category.id} className="relative group h-full flex items-center">
                <Link
                  href={`/products?category=${category.slug}`}
                  onClick={() => {
                    setFilters({ category: category.slug, search: "", colors: [], sizes: [], minPrice: "", maxPrice: "", page: 1 });
                    fetchProducts();
                  }}
                  className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-5"
                >
                  {category.name}
                  {category.subCategories.length > 0 && <ChevronDown size={14} className="opacity-60" />}
                </Link>

                {/* Mega Menu Dropdown */}
                {category.subCategories.length > 0 && (
                  <div className={`absolute top-[100%] left-1/2 -translate-x-1/2 p-6 bg-white border border-border-custom rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out transform translate-y-2 group-hover:translate-y-0 grid gap-6 glass animate-slide-up ${
                    category.subCategories.length === 1 
                      ? "w-[200px] grid-cols-1" 
                      : category.subCategories.length === 2 
                      ? "w-[400px] grid-cols-2" 
                      : "w-[600px] grid-cols-3"
                  }`}>
                    {category.subCategories.map((sub) => (
                      <div key={sub.id} className="flex flex-col gap-2">
                        <Link
                          href={`/products?category=${sub.slug}`}
                          onClick={() => {
                            setFilters({ category: sub.slug, search: "", colors: [], sizes: [], minPrice: "", maxPrice: "", page: 1 });
                            fetchProducts();
                          }}
                          className="font-semibold text-sm text-primary hover:text-accent transition-colors"
                        >
                          {sub.name}
                        </Link>
                        {/* We could render third level subcategories here if available */}
                        <div className="h-[1px] bg-border-custom w-full my-1" />
                        <span className="text-xs text-foreground/60 hover:text-accent cursor-pointer transition-colors">
                          New Arrivals
                        </span>
                        <span className="text-xs text-foreground/60 hover:text-accent cursor-pointer transition-colors">
                          Best Sellers
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Direct links if DB empty */}
            {categories.length === 0 && (
              <>
                <Link href="/products" className="text-sm font-medium text-foreground/80 hover:text-primary">Shop</Link>
                <Link href="/products?tags=New Arrival" className="text-sm font-medium text-foreground/80 hover:text-primary">New Arrivals</Link>
              </>
            )}
          </nav>

          {/* Search bar & suggestion overlay */}
          <div ref={searchRef} className="relative flex-1 max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, designs, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(searchQuery)}
                className="w-full h-10 pl-4 pr-10 rounded-full bg-secondary/80 border border-border-custom text-sm focus:outline-none focus:border-accent focus:bg-white transition-all"
              />
              <button 
                onClick={() => handleSearchSubmit(searchQuery)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-accent transition-colors"
              >
                <Search size={16} />
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-[110%] left-0 w-full p-4 bg-white border border-border-custom rounded-2xl shadow-2xl glass z-50 flex flex-col gap-4 animate-slide-up">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={12} /> Recent Searches
                    </span>
                    <div className="flex flex-col">
                      {recentSearches.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSearchSubmit(item)}
                          className="flex items-center justify-between py-1.5 px-2 hover:bg-secondary rounded-lg cursor-pointer text-sm text-foreground/80 hover:text-primary transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Clock size={14} className="opacity-40" /> {item}
                          </span>
                          <button
                            onClick={(e) => removeRecentSearch(e, item)}
                            className="p-1 text-foreground/40 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular searches */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp size={12} /> Popular Searches
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((item, idx) => (
                      <span
                        key={idx}
                        onClick={() => handleSearchSubmit(item)}
                        className="py-1 px-3 bg-secondary hover:bg-accent/10 hover:text-accent rounded-full text-xs font-medium cursor-pointer transition-colors border border-border-custom"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-3">
            {/* User Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 text-foreground/70 hover:text-primary transition-colors relative flex items-center gap-1.5"
              >
                {isAuthenticated && user ? (
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                ) : (
                  <User size={20} />
                )}
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-[110%] w-56 bg-white border border-border-custom rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up">
                  {isAuthenticated && user ? (
                    <>
                      {/* User Info */}
                      <div className="px-4 py-3 bg-secondary/50 border-b border-border-custom">
                        <p className="text-sm font-bold text-primary truncate">{user.name}</p>
                        <p className="text-[11px] text-foreground/40 truncate">{user.email}</p>
                      </div>
                      <div className="py-1.5">
                        <Link
                          href="/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-secondary hover:text-primary transition-colors"
                        >
                          <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-1.5">
                      <Link
                        href="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-secondary hover:text-primary transition-colors"
                      >
                        <LogIn size={16} /> Sign In
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-secondary hover:text-accent transition-colors"
                      >
                        <UserPlus size={16} /> Create Account
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Shopping Bag Icon with Count */}
            <button
              onClick={() => toggleCart(true)}
              className="p-2 text-foreground/70 hover:text-primary transition-colors relative"
            >
              <ShoppingBag size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
