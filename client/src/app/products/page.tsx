"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../../components/common/Header";
import { useSearchStore, Product as ProductType, Variant as VariantType } from "../../context/searchStore";
import { useCartStore } from "../../context/cartStore";
import { Filter, SlidersHorizontal, Check, Eye, ShoppingCart, Plus, Minus, X } from "lucide-react";

function PLPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Zustand Search Store hooks
  const {
    products,
    facets,
    pagination,
    isLoading,
    search,
    category,
    colors,
    sizes,
    minPrice,
    maxPrice,
    sort,
    page,
    setFilters,
    fetchProducts,
    toggleColorFilter,
    toggleSizeFilter,
    resetFilters,
  } = useSearchStore();

  const { addToCart } = useCartStore();

  // Quick Options Modal State
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [modalQty, setModalQty] = useState<number>(1);
  const [modalError, setModalError] = useState<string | null>(null);

  // Sync URL search parameters with Zustand store on load
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlCategory = searchParams.get("category") || "";
    const urlColors = searchParams.get("colors") ? searchParams.get("colors")!.split(",") : [];
    const urlSizes = searchParams.get("sizes") ? searchParams.get("sizes")!.split(",") : [];
    const urlMinPrice = searchParams.get("minPrice") || "";
    const urlMaxPrice = searchParams.get("maxPrice") || "";
    const urlSort = searchParams.get("sort") || "";
    const urlPage = parseInt(searchParams.get("page") || "1", 10);

    setFilters({
      search: urlSearch,
      category: urlCategory,
      colors: urlColors,
      sizes: urlSizes,
      minPrice: urlMinPrice,
      maxPrice: urlMaxPrice,
      sort: urlSort,
      page: urlPage,
    });

    fetchProducts();
  }, [searchParams, setFilters, fetchProducts]);

  // Update browser URL query strings dynamically when state changes
  const updateURL = (updatedFilters: any) => {
    const query = new URLSearchParams();
    
    const merged = {
      search,
      category,
      colors,
      sizes,
      minPrice,
      maxPrice,
      sort,
      page,
      ...updatedFilters,
    };

    if (merged.search) query.append("search", merged.search);
    if (merged.category) query.append("category", merged.category);
    if (merged.colors.length > 0) query.append("colors", merged.colors.join(","));
    if (merged.sizes.length > 0) query.append("sizes", merged.sizes.join(","));
    if (merged.minPrice) query.append("minPrice", merged.minPrice);
    if (merged.maxPrice) query.append("maxPrice", merged.maxPrice);
    if (merged.sort) query.append("sort", merged.sort);
    if (merged.page > 1) query.append("page", merged.page.toString());

    router.push(`?${query.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage });
    updateURL({ page: newPage });
  };

  const handleSortChange = (newSort: string) => {
    setFilters({ sort: newSort, page: 1 });
    updateURL({ sort: newSort, page: 1 });
  };

  const handlePriceFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ page: 1 });
    updateURL({ page: 1 });
  };

  const handleClearAll = () => {
    resetFilters();
    router.push("/products");
  };

  // Quick purchase flow option selection handler
  const handleOpenQuickModal = (product: ProductType) => {
    setSelectedProduct(product);
    // Auto-select first variant color and size
    if (product.variants.length > 0) {
      setSelectedColor(product.variants[0].color);
      setSelectedSize(product.variants[0].size);
    }
    setModalQty(1);
    setModalError(null);
  };

  const getAvailableSizesForColor = () => {
    if (!selectedProduct) return [];
    const sizesSet = new Set<string>();
    selectedProduct.variants.forEach((v) => {
      if (v.color === selectedColor) {
        sizesSet.add(v.size);
      }
    });
    return Array.from(sizesSet);
  };

  const getAvailableColorsForSize = () => {
    if (!selectedProduct) return [];
    const colorsSet = new Set<string>();
    selectedProduct.variants.forEach((v) => {
      if (v.size === selectedSize) {
        colorsSet.add(v.color);
      }
    });
    return Array.from(colorsSet);
  };

  const getSelectedVariant = (): VariantType | undefined => {
    if (!selectedProduct) return undefined;
    return selectedProduct.variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    );
  };

  const handleQuickAdd = async () => {
    setModalError(null);
    const variant = getSelectedVariant();
    if (!variant) {
      setModalError("Please select a valid color and size combination.");
      return;
    }

    if (variant.stock < modalQty) {
      setModalError(`Insufficient stock. Only ${variant.stock} units available.`);
      return;
    }

    await addToCart(variant.id, modalQty);
    setSelectedProduct(null);
  };

  return (
    <>
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Banner Headers */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-custom pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              {category ? `${category.charAt(0).toUpperCase()}${category.slice(1)} Collections` : "All Apparel"}
            </h1>
            <p className="text-sm text-foreground/60 mt-1">
              Showing {products.length} of {pagination?.total || 0} premium items
            </p>
          </div>

          {/* Sort selection Dropdown */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground/60">Sort By:</span>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-white border border-border-custom rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-accent"
            >
              <option value="">Latest Arrival</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Faceted Filters Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-border-custom pb-4">
              <span className="font-bold text-lg flex items-center gap-2">
                <SlidersHorizontal size={18} /> Filters
              </span>
              {(colors.length > 0 || sizes.length > 0 || minPrice || maxPrice || search || category) && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-accent font-semibold hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Active search filter notice */}
            {search && (
              <div className="bg-secondary/60 p-3 rounded-lg border border-border-custom flex items-center justify-between text-xs">
                <span>Search: <strong className="text-primary">"{search}"</strong></span>
                <button onClick={() => { setFilters({ search: "" }); updateURL({ search: "" }); }} className="text-red-500 font-bold hover:underline">X</button>
              </div>
            )}

            {/* Colors Filter */}
            {facets?.colors && facets.colors.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="font-bold text-sm text-primary">Colors</span>
                <div className="flex flex-col gap-2">
                  {facets.colors.map((c) => {
                    const isActive = colors.includes(c.name);
                    return (
                      <label
                        key={c.name}
                        onClick={() => {
                          toggleColorFilter(c.name);
                          updateURL({ colors: colors.includes(c.name) ? colors.filter((x) => x !== c.name) : [...colors, c.name], page: 1 });
                        }}
                        className="flex items-center justify-between text-sm cursor-pointer select-none group"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isActive ? "bg-accent border-accent text-white" : "border-border-custom bg-white group-hover:border-accent"}`}>
                            {isActive && <Check size={10} strokeWidth={3} />}
                          </div>
                          <span className="text-foreground/80">{c.name}</span>
                        </div>
                        <span className="text-xs text-foreground/40 font-mono">({c.count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes Filter */}
            {facets?.sizes && facets.sizes.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-border-custom pt-6">
                <span className="font-bold text-sm text-primary">Sizes</span>
                <div className="grid grid-cols-4 gap-2">
                  {facets.sizes.map((s) => {
                    const isActive = sizes.includes(s.name);
                    return (
                      <button
                        key={s.name}
                        onClick={() => {
                          toggleSizeFilter(s.name);
                          updateURL({ sizes: sizes.includes(s.name) ? sizes.filter((x) => x !== s.name) : [...sizes, s.name], page: 1 });
                        }}
                        className={`py-1.5 border rounded-lg text-xs font-semibold hover:border-accent transition-colors ${isActive ? "bg-primary border-primary text-white" : "border-border-custom bg-white text-foreground/75"}`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            <div className="flex flex-col gap-3 border-t border-border-custom pt-6">
              <span className="font-bold text-sm text-primary">Price Range</span>
              <form onSubmit={handlePriceFilterSubmit} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min BDT"
                    value={minPrice}
                    onChange={(e) => setFilters({ minPrice: e.target.value })}
                    className="w-full h-9 border border-border-custom bg-white rounded-lg text-xs text-center focus:outline-none focus:border-accent"
                  />
                  <span className="text-foreground/40 text-xs">to</span>
                  <input
                    type="number"
                    placeholder="Max BDT"
                    value={maxPrice}
                    onChange={(e) => setFilters({ maxPrice: e.target.value })}
                    className="w-full h-9 border border-border-custom bg-white rounded-lg text-xs text-center focus:outline-none focus:border-accent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-9 bg-secondary hover:bg-accent hover:text-white border border-border-custom hover:border-accent rounded-lg text-xs font-bold transition-all"
                >
                  Apply Price
                </button>
              </form>
            </div>

          </aside>

          {/* Product Grid Area */}
          <div className="flex-1">
            
            {/* Loading Skeleton */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse flex flex-col gap-4">
                    <div className="bg-secondary aspect-[3/4] w-full rounded-2xl" />
                    <div className="h-4 bg-secondary w-2/3 rounded" />
                    <div className="h-4 bg-secondary w-1/3 rounded" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-foreground/50 font-medium">No products found matching the criteria.</p>
                <button
                  onClick={handleClearAll}
                  className="mt-4 px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-semibold transition-all shadow"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => {
                  const hasDiscount = product.variants.some((v) => v.priceOverride);
                  
                  return (
                    <div
                      key={product.id}
                      className="group flex flex-col relative rounded-2xl overflow-hidden hover-lift border border-border-custom/50 bg-white"
                    >
                      {/* Product Tags Badge Overlay */}
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                        {product.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2.5 py-1 text-[9px] font-bold rounded-full text-white uppercase tracking-wider ${tag === "New Arrival" ? "bg-accent" : tag === "Top Selling" ? "bg-primary" : "bg-orange-500"}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Image Zoom Hover Container */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                        <img
                          src={product.images[0] || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800"}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        
                        {/* Option actions overlays */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                          <button
                            onClick={() => router.push(`/product/${product.slug}`)}
                            className="w-10 h-10 rounded-full bg-white text-primary hover:bg-accent hover:text-white flex items-center justify-center transition-all shadow-md transform translate-y-4 group-hover:translate-y-0 duration-300"
                            title="View details"
                          >
                            <Eye size={18} />
                          </button>
                          
                          <button
                            onClick={() => handleOpenQuickModal(product)}
                            className="w-10 h-10 rounded-full bg-white text-primary hover:bg-accent hover:text-white flex items-center justify-center transition-all shadow-md transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75"
                            title="Quick Add"
                          >
                            <ShoppingCart size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-4 flex flex-col flex-1 justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-semibold text-foreground/40 uppercase tracking-widest">
                            {product.category.name}
                          </span>
                          <h3 className="font-bold text-sm text-primary group-hover:text-accent transition-colors line-clamp-1">
                            {product.name}
                          </h3>
                        </div>

                        {/* Price rendering */}
                        <div className="flex items-baseline gap-2">
                          <span className="font-extrabold text-base text-primary">
                            {Number(product.basePrice)} BDT
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-foreground/40 line-through">
                              {Number(product.basePrice) + 150} BDT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="px-4 py-2 border border-border-custom rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-secondary transition-colors"
                >
                  Prev
                </button>
                {[...Array(pagination.pages)].map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => handlePageChange(pNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold border transition-colors ${page === pNum ? "bg-primary border-primary text-white" : "border-border-custom hover:bg-secondary"}`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  disabled={page === pagination.pages}
                  onClick={() => handlePageChange(page + 1)}
                  className="px-4 py-2 border border-border-custom rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-secondary transition-colors"
                >
                  Next
                </button>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Quick Add / Select Options Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-border-custom rounded-2xl shadow-2xl p-6 glass animate-slide-up flex flex-col gap-6">
            
            {/* Modal Close */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-1 hover:bg-secondary rounded-lg text-foreground/50 hover:text-primary transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header info */}
            <div className="flex gap-4 items-start">
              <img
                src={selectedProduct.images[0] || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800"}
                alt={selectedProduct.name}
                className="w-16 h-20 object-cover rounded-lg border border-border-custom bg-secondary"
              />
              <div>
                <h3 className="font-extrabold text-lg text-primary">{selectedProduct.name}</h3>
                <span className="text-xl font-black text-accent mt-1 block">
                  {getSelectedVariant()?.priceOverride 
                    ? Number(getSelectedVariant()?.priceOverride) 
                    : Number(selectedProduct.basePrice)} BDT
                </span>
              </div>
            </div>

            {/* Variant options selection */}
            <div className="flex flex-col gap-4">
              
              {/* Color Toggles */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Select Color</span>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(selectedProduct.variants.map((v) => v.color))).map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          // Auto-select a valid size for this new color
                          const validSizes = selectedProduct.variants
                            .filter((v) => v.color === color)
                            .map((v) => v.size);
                          if (validSizes.length > 0 && !validSizes.includes(selectedSize)) {
                            setSelectedSize(validSizes[0]);
                          }
                        }}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors ${isSelected ? "border-accent bg-accent/5 text-accent" : "border-border-custom hover:border-accent text-foreground/80"}`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Toggles */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Select Size</span>
                <div className="flex flex-wrap gap-2">
                  {getAvailableSizesForColor().map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-10 h-10 border rounded-lg text-xs font-bold transition-all ${isSelected ? "bg-primary border-primary text-white" : "border-border-custom hover:border-accent text-foreground/80"}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity selector & stock warnings */}
              <div className="flex justify-between items-center border-t border-border-custom pt-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Quantity</span>
                  <div className="flex items-center border border-border-custom rounded-lg h-9 mt-1 overflow-hidden">
                    <button
                      onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                      className="px-3 h-full hover:bg-secondary text-foreground/60 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 text-sm font-bold">{modalQty}</span>
                    <button
                      onClick={() => setModalQty((q) => q + 1)}
                      className="px-3 h-full hover:bg-secondary text-foreground/60 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Stock notice */}
                <div className="text-right">
                  {getSelectedVariant() ? (
                    <>
                      <span className="text-xs text-foreground/40 block">Availability</span>
                      {getSelectedVariant()!.stock <= 5 ? (
                        <span className="text-xs font-bold text-red-500">
                          Only {getSelectedVariant()!.stock} left!
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-500">
                          {getSelectedVariant()!.stock} in stock
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-red-500">Variant Unavailable</span>
                  )}
                </div>
              </div>

            </div>

            {/* Error alerts */}
            {modalError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-xs font-medium">
                {modalError}
              </div>
            )}

            {/* Add to cart action buttons */}
            <button
              onClick={handleQuickAdd}
              className="w-full h-11 bg-accent hover:bg-accent-hover text-white rounded-lg font-bold text-sm shadow transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>

          </div>
        </div>
      )}
    </>
  );
}

export default function PLP() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-medium">Loading search params...</div>}>
      <PLPContent />
    </Suspense>
  );
}
