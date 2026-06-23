"use client";

import React, { useEffect, useState, use } from "react";
import Header from "../../../components/common/Header";
import { useCartStore } from "../../../context/cartStore";
import { Product as ProductType, Variant as VariantType } from "../../../context/searchStore";
import { Heart, ShieldCheck, Truck, RefreshCw, ShoppingCart, Ruler, Plus, Minus, Check, X, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function PDP({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { addToCart } = useCartStore();

  // Page States
  const [product, setProduct] = useState<ProductType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Variant States
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  
  // UI Modals
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [pdpError, setPdpError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Admin States & Handlers
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Check if current user is an Admin
  useEffect(() => {
    fetch("http://localhost:5000/api/users/profile?email=rubayet@zendora.com")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.role === "ADMIN") {
          setIsAdmin(true);
        }
      })
      .catch((err) => console.error("Error checking admin profile:", err));
  }, []);

  const handleDeleteProduct = async () => {
    if (!product) return;
    if (!window.confirm("Are you sure you want to delete this product? (This will soft-delete the product from the storefront)")) {
      return;
    }
    
    setIsDeleting(true);
    setPdpError(null);
    
    try {
      const res = await fetch(`http://localhost:5000/api/products/${product.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setDeleteSuccess(true);
        setTimeout(() => {
          window.location.href = "/products";
        }, 2000);
      } else {
        setPdpError(data.error || "Failed to delete product.");
        setIsDeleting(false);
      }
    } catch (err: any) {
      setPdpError(err.message || "Failed to connect to server to delete product.");
      setIsDeleting(false);
    }
  };

  // Fetch product on mount
  useEffect(() => {
    setIsLoading(true);
    fetch(`http://localhost:5000/api/products/slug/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProduct(data.data);
          
          // Auto-select first variant on load
          if (data.data.variants.length > 0) {
            const first = data.data.variants[0];
            setSelectedColor(first.color);
            setSelectedSize(first.size);
            setSelectedImage(first.images[0] || data.data.images[0]);
          } else {
            setSelectedImage(data.data.images[0]);
          }
        } else {
          setError(data.error);
        }
      })
      .catch((err) => setError("Failed to fetch product details."))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm font-semibold">
          Loading product details...
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-red-500 font-semibold">
          Error: {error || "Product not found."}
        </div>
      </>
    );
  }

  // Get available options dynamically
  const uniqueColors = Array.from(new Set(product.variants.map((v) => v.color)));
  
  const getSizesForColor = () => {
    return product.variants
      .filter((v) => v.color === selectedColor)
      .map((v) => v.size);
  };

  const getSelectedVariant = (): VariantType | undefined => {
    return product.variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    );
  };

  const currentVariant = getSelectedVariant();
  const currentPrice = currentVariant?.priceOverride
    ? Number(currentVariant.priceOverride)
    : Number(product.basePrice);

  const handleAddToCart = async () => {
    setPdpError(null);
    if (!currentVariant) {
      setPdpError("Please select color and size.");
      return;
    }

    if (currentVariant.stock < qty) {
      setPdpError(`Insufficient stock. Only ${currentVariant.stock} units available.`);
      return;
    }

    await addToCart(currentVariant.id, qty);
  };

  // Compile all images (product level + variant specific level)
  const allImages = Array.from(new Set([
    ...product.images,
    ...product.variants.flatMap((v) => v.images)
  ])).filter(Boolean);

  return (
    <>
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full animate-slide-up">
        {/* Breadcrumb */}
        <div className="text-xs text-foreground/40 mb-6 flex gap-2">
          <span>Home</span> / <span>Products</span> / <span className="text-primary font-semibold">{product.name}</span>
        </div>

        {/* Product Split Info */}
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Column: Image Gallery */}
          <div className="flex-1 flex flex-col md:flex-row gap-4">
            
            {/* Thumbnails list */}
            <div className="flex md:flex-col gap-2 order-2 md:order-1 overflow-x-auto md:overflow-y-auto md:max-h-[500px]">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-16 h-20 bg-secondary border rounded-lg overflow-hidden flex-shrink-0 transition-all ${selectedImage === img ? "border-accent ring-2 ring-accent/20" : "border-border-custom hover:border-accent"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image Screen */}
            <div className="flex-1 order-1 md:order-2 aspect-[3/4] rounded-2xl overflow-hidden bg-secondary border border-border-custom relative">
              <img
                src={selectedImage || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              
              {/* Product Badge */}
              {product.tags.length > 0 && (
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-[9px] font-extrabold rounded-full bg-accent text-white uppercase tracking-wider shadow-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Buying Actions & Specs */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Admin Controls Card */}
            {isAdmin && (
              <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl flex flex-col gap-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-amber-600" /> Admin Control Panel
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100/50 text-amber-800 border border-amber-200/50 rounded text-[9px] font-bold uppercase tracking-wider">
                    Authorized
                  </span>
                </div>
                
                {deleteSuccess ? (
                  <div className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
                    Product deleted successfully. Redirecting to catalog...
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/add-product?edit=${product.slug}`}
                      className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      Edit Product Details
                    </Link>
                    <button
                      onClick={handleDeleteProduct}
                      disabled={isDeleting}
                      className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {isDeleting ? "Deleting..." : "Delete Product (Soft)"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Title / Price */}
            <div>
              <span className="text-xs font-bold text-accent uppercase tracking-widest block mb-1">
                {product.category.name}
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-primary leading-tight">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 mt-4">
                <span className="text-2xl font-black text-primary">
                  {currentPrice} BDT
                </span>
                {currentVariant?.priceOverride && (
                  <span className="text-base text-foreground/40 line-through">
                    {Number(product.basePrice)} BDT
                  </span>
                )}
              </div>
            </div>

            <div className="h-[1px] bg-border-custom w-full" />

            {/* Variant Selector options */}
            <div className="flex flex-col gap-5">
              
              {/* Colors Option Selection */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-extrabold text-foreground/50 uppercase tracking-wider">Color: <strong className="text-primary font-bold">{selectedColor}</strong></span>
                <div className="flex flex-wrap gap-2.5">
                  {uniqueColors.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          const validSizes = product.variants.filter((v) => v.color === color).map((v) => v.size);
                          if (validSizes.length > 0 && !validSizes.includes(selectedSize)) {
                            setSelectedSize(validSizes[0]);
                          }
                          // Update image to color variant matching if found
                          const matching = product.variants.find((v) => v.color === color);
                          if (matching && matching.images[0]) {
                            setSelectedImage(matching.images[0]);
                          }
                        }}
                        className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-all ${isSelected ? "border-accent bg-accent/5 text-accent shadow-sm" : "border-border-custom hover:border-accent text-foreground/80"}`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sizes Option Selection */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-foreground/50 uppercase tracking-wider">Size: <strong className="text-primary font-bold">{selectedSize}</strong></span>
                  <button
                    onClick={() => setIsSizeChartOpen(true)}
                    className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    <Ruler size={13} /> Size Chart
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {getSizesForColor().map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 border rounded-xl text-xs font-bold transition-all ${isSelected ? "bg-primary border-primary text-white shadow-sm" : "border-border-custom hover:border-accent text-foreground/80"}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Quantity selection & stock availability warnings */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-b border-border-custom py-4 mt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Qty</span>
                <div className="flex items-center border border-border-custom rounded-xl h-10 overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3.5 h-full hover:bg-secondary text-foreground/60 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-4 text-sm font-bold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="px-3.5 h-full hover:bg-secondary text-foreground/60 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="text-left sm:text-right">
                {currentVariant ? (
                  currentVariant.stock <= 5 ? (
                    <span className="text-xs font-bold text-red-500">
                      Hurry, only {currentVariant.stock} left in stock!
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-500">
                      {currentVariant.stock} items available
                    </span>
                  )
                ) : (
                  <span className="text-xs font-bold text-red-500">Variant selection invalid</span>
                )}
              </div>
            </div>

            {/* Error logs */}
            {pdpError && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl border border-red-200 text-xs font-semibold">
                {pdpError}
              </div>
            )}

            {/* Actions: Add to Cart and Wishlist toggling */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 h-12 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>

              <button 
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-12 h-12 border rounded-xl flex items-center justify-center transition-colors ${isWishlisted ? "bg-red-50 border-red-200 text-red-500" : "border-border-custom hover:bg-secondary text-foreground/60"}`}
              >
                <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Delivery Specifications / Features list */}
            <div className="flex flex-col gap-3 bg-secondary/50 border border-border-custom p-4 rounded-2xl mt-4">
              <div className="flex items-start gap-3">
                <Truck size={18} className="text-accent mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-primary">Express Home Delivery</span>
                  <p className="text-[11px] text-foreground/50">Delivery inside Dhaka in 24-48 hours. Outside Dhaka in 3-4 days.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCw size={18} className="text-accent mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-primary">Easy Returns & Exchanges</span>
                  <p className="text-[11px] text-foreground/50">Exchange items within 7 days of receiving if size issues occur.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="text-accent mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-primary">100% Quality Assurance</span>
                  <p className="text-[11px] text-foreground/50">Made with premium combed cotton fabrics for durability and comfort.</p>
                </div>
              </div>
            </div>

            {/* Product description */}
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Product Details</span>
              <p className="text-sm text-foreground/75 leading-relaxed">
                {product.description}
              </p>
            </div>

          </div>

        </div>
      </main>

      {/* Size Chart Modal */}
      {isSizeChartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white border border-border-custom rounded-2xl shadow-2xl p-6 glass animate-slide-up flex flex-col gap-6">
            
            {/* Modal Close */}
            <button
              onClick={() => setIsSizeChartOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-secondary rounded-lg text-foreground/50 hover:text-primary transition-colors"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="font-extrabold text-lg text-primary">Size Chart Specifications</h3>
              <p className="text-xs text-foreground/60">Standard measurements (in inches) for regular fits</p>
            </div>

            {/* Measurement Table */}
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border-custom text-foreground/50 font-medium">
                  <th className="py-2.5">Size</th>
                  <th className="py-2.5">Chest Width</th>
                  <th className="py-2.5">Body Length</th>
                  <th className="py-2.5">Sleeve Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                <tr className="text-foreground/80">
                  <td className="py-3 font-bold text-primary">S</td>
                  <td className="py-3">38 in</td>
                  <td className="py-3">27 in</td>
                  <td className="py-3">7.5 in</td>
                </tr>
                <tr className="text-foreground/80">
                  <td className="py-3 font-bold text-primary">M</td>
                  <td className="py-3">40 in</td>
                  <td className="py-3">28 in</td>
                  <td className="py-3">8.0 in</td>
                </tr>
                <tr className="text-foreground/80">
                  <td className="py-3 font-bold text-primary">L</td>
                  <td className="py-3">42 in</td>
                  <td className="py-3">29 in</td>
                  <td className="py-3">8.5 in</td>
                </tr>
                <tr className="text-foreground/80">
                  <td className="py-3 font-bold text-primary">XL</td>
                  <td className="py-3">44 in</td>
                  <td className="py-3">30 in</td>
                  <td className="py-3">9.0 in</td>
                </tr>
              </tbody>
            </table>

            <div className="bg-secondary/50 p-4 rounded-xl border border-border-custom text-[11px] text-foreground/60 leading-relaxed">
              <strong>Measuring Tip:</strong> Measure around the fullest part of your chest, keeping the tape horizontal. For body length, measure from the highest point of the shoulder down to the hem.
            </div>

            <button
              onClick={() => setIsSizeChartOpen(false)}
              className="w-full h-11 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm transition-colors"
            >
              Close Guide
            </button>

          </div>
        </div>
      )}
    </>
  );
}
