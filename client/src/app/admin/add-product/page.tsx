"use client";

import React, { useState, useEffect, Suspense } from "react";
import Header from "../../../components/common/Header";
import { Plus, Trash2, ArrowLeft, Loader2, CheckCircle, PackageOpen } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/config";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface VariantInput {
  sku: string;
  color: string;
  size: string;
  stock: string;
  priceOverride: string;
}

function AddProductContent() {
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");
  const isEditMode = !!editSlug;
  const [productId, setProductId] = useState<string | null>(null);

  // Database states
  const [categories, setCategories] = useState<Category[]>([]);

  // Product Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [images, setImages] = useState<string[]>([""]); // starts with one empty image url input
  const [categoryId, setCategoryId] = useState("");
  const [tagInput, setTagInput] = useState(""); // comma-separated tags

  // Variants input array state
  const [variants, setVariants] = useState<VariantInput[]>([
    { sku: "", color: "", size: "M", stock: "100", priceOverride: "" }
  ]);

  // UI Flow states
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successProduct, setSuccessProduct] = useState<any | null>(null);

  // Upload States
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Fetch categories list on mount
  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data);
          if (data.data.length > 0 && !isEditMode) {
            setCategoryId(data.data[0].id);
          }
        }
      })
      .catch((err) => console.error("Error fetching categories:", err))
      .finally(() => {
        if (!isEditMode) setIsLoadingCategories(false);
      });
  }, [isEditMode]);

  // Fetch product if in Edit Mode
  useEffect(() => {
    if (!editSlug) return;
    
    setIsLoadingCategories(true);
    fetch(`${API_URL}/products/slug/${editSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const prod = data.data;
          setProductId(prod.id);
          setName(prod.name);
          setSlug(prod.slug);
          setDescription(prod.description);
          setBasePrice(prod.basePrice.toString());
          setCategoryId(prod.categoryId);
          setTagInput(prod.tags.join(", "));
          setImages(prod.images.length > 0 ? prod.images : [""]);
          
          if (prod.variants && prod.variants.length > 0) {
            setVariants(prod.variants.map((v: any) => ({
              sku: v.sku,
              color: v.color,
              size: v.size,
              stock: v.stock.toString(),
              priceOverride: v.priceOverride ? v.priceOverride.toString() : ""
            })));
          }
        } else {
          setErrorMessage(data.error || "Failed to load product for editing.");
        }
      })
      .catch((err) => setErrorMessage("Error connecting to server to load product."))
      .finally(() => setIsLoadingCategories(false));
  }, [editSlug]);

  // Helper to auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditMode) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // remove special chars
        .trim()
        .replace(/\s+/g, "-"); // replace spaces with hyphens
      setSlug(generatedSlug);
    }
  };

  // Image input handlers
  const handleAddImageRow = () => {
    setImages([...images, ""]);
  };

  const handleRemoveImageRow = (index: number) => {
    const updated = images.filter((_, idx) => idx !== index);
    setImages(updated.length > 0 ? updated : [""]);
  };

  const handleImageChange = (index: number, val: string) => {
    const updated = [...images];
    updated[index] = val;
    setImages(updated);
  };

  // File Upload Handler
  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;

    setUploadingIndex(index);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        handleImageChange(index, data.url);
      } else {
        setErrorMessage(data.error || "Failed to upload image.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect to the file upload server.");
    } finally {
      setUploadingIndex(null);
    }
  };

  // Variant input handlers
  const handleAddVariantRow = () => {
    // Attempt auto-generating SKU pattern based on name
    const prefix = name ? name.substring(0, 3).toUpperCase().replace(/\s/g, "") : "PROD";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const skuPlaceholder = `${prefix}-${randomNum}`;

    setVariants([...variants, { sku: skuPlaceholder, color: "", size: "M", stock: "100", priceOverride: "" }]);
  };

  const handleRemoveVariantRow = (index: number) => {
    const updated = variants.filter((_, idx) => idx !== index);
    setVariants(updated.length > 0 ? updated : [{ sku: "", color: "", size: "M", stock: "100", priceOverride: "" }]);
  };

  const handleVariantChange = (index: number, field: keyof VariantInput, val: string) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessProduct(null);

    // Basic validation
    if (!name || !slug || !basePrice || !categoryId || !description) {
      setErrorMessage("Please fill in all core product information fields.");
      return;
    }

    // Filter out empty image strings
    const filteredImages = images.filter((img) => img.trim() !== "");
    if (filteredImages.length === 0) {
      setErrorMessage("Please add at least one product image.");
      return;
    }

    // Validate variant SKUs
    const hasEmptySku = variants.some((v) => !v.sku.trim());
    if (hasEmptySku) {
      setErrorMessage("Every product variant must have a valid SKU.");
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedTags = tagInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "");

      const url = isEditMode 
        ? `${API_URL}/products/${productId}`
        : `${API_URL}/products`;
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          basePrice,
          images: filteredImages,
          categoryId,
          tags: parsedTags,
          variants: variants.map((v) => ({
            sku: v.sku,
            color: v.color || "Default Color",
            size: v.size || "M",
            stock: v.stock || "0",
            priceOverride: v.priceOverride ? parseFloat(v.priceOverride) : null,
            images: [filteredImages[0]], // assign primary product image as default variant image
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessProduct(data.data);
        if (!isEditMode) {
          // Reset form only when creating a new product
          setName("");
          setSlug("");
          setDescription("");
          setBasePrice("");
          setImages([""]);
          setTagInput("");
          setVariants([{ sku: "", color: "", size: "M", stock: "100", priceOverride: "" }]);
        }
      } else {
        setErrorMessage(data.error || `Failed to ${isEditMode ? "update" : "create"} product.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while connecting to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full animate-slide-up">

        {/* Back Link */}
        <Link href="/products" className="text-xs font-bold text-accent hover:underline flex items-center gap-1.5 mb-6">
          <ArrowLeft size={14} /> Back to Catalog
        </Link>

        {/* Title */}
        <div className="border-b border-border-custom pb-6 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              {isEditMode ? "Admin: Edit Product" : "Admin: Add New Product"}
            </h1>
            <p className="text-sm text-foreground/60 mt-1">
              {isEditMode 
                ? "Update design details, pricing, and variant specifications in the shop database." 
                : "Publish new apparel designs and variant inventory specifications to the shop database."}
            </p>
          </div>
          <PackageOpen size={36} className="text-accent/40" />
        </div>

        {/* Success Alert */}
        {successProduct && (
          <div className="bg-emerald-50 text-emerald-800 p-5 rounded-2xl border border-emerald-200 mb-8 flex items-start gap-3 shadow-sm">
            <CheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={18} />
            <div>
              <span className="font-bold text-sm">Product {isEditMode ? "Updated" : "Published"} Successfully!</span>
              <p className="text-xs mt-1">
                <strong>{successProduct.name}</strong> is now {isEditMode ? "updated" : "live"} in the catalog.
                You can view it here:{" "}
                <Link href={`/product/${successProduct.slug}`} className="text-accent hover:underline font-bold">
                  View Product Page
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-xs font-semibold mb-8">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* Card 1: Core Product Properties */}
          <div className="bg-white border border-border-custom p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <h3 className="font-extrabold text-base text-primary border-b border-border-custom pb-2">
              1. Product Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangladesh Premium Polo"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase">URL Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. bangladesh-premium-polo"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase">Base Price (BDT) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1150"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase">Category *</label>
                {isLoadingCategories ? (
                  <div className="h-10 border border-border-custom bg-secondary/35 rounded-xl px-4 text-sm flex items-center justify-between text-foreground/40">
                    Loading...
                  </div>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase">Product Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. New Arrival, Top Selling, Fan Edition"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground/60 uppercase">Product Description *</label>
              <textarea
                required
                rows={4}
                placeholder="Write detail specifications about fabric material, GSM, wash guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border border-border-custom bg-white rounded-xl p-4 text-sm focus:outline-none focus:border-accent resize-none"
              />
            </div>
          </div>

          {/* Card 2: Gallery Image Uploads / URLs */}
          <div className="bg-white border border-border-custom p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-border-custom pb-2">
              <h3 className="font-extrabold text-base text-primary">
                2. Product Images
              </h3>
              <button
                type="button"
                onClick={handleAddImageRow}
                className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> Add Image Slot
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="flex flex-col gap-2 border border-border-custom/50 p-4 rounded-xl bg-secondary/20">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-bold text-foreground/60 w-16">Image #{idx + 1}</span>

                    {/* URL Input */}
                    <input
                      type="url"
                      placeholder="Paste remote Image URL (e.g. https://images.unsplash.com/...)"
                      value={img}
                      onChange={(e) => handleImageChange(idx, e.target.value)}
                      className="flex-1 h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveImageRow(idx)}
                      className="p-2 border border-border-custom hover:border-red-200 text-foreground/40 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* File Selector */}
                  <div className="flex items-center gap-4 pl-16">
                    <span className="text-xs text-foreground/40 font-medium">Or upload local file:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(idx, file);
                      }}
                      className="text-xs text-foreground/60 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
                    />

                    {uploadingIndex === idx && (
                      <span className="text-xs text-accent font-semibold flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> Uploading...
                      </span>
                    )}

                    {img && (
                      <div className="flex items-center gap-3 ml-auto">
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">Uploaded</span>
                        <img src={img} alt="Preview" className="w-8 h-8 object-cover rounded border border-border-custom bg-secondary" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Variant Builder */}
          <div className="bg-white border border-border-custom p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-border-custom pb-2">
              <h3 className="font-extrabold text-base text-primary">
                3. Size, Color & Stock Variants
              </h3>
              <button
                type="button"
                onClick={handleAddVariantRow}
                className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> Add Variant Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[650px]">
                <thead>
                  <tr className="text-foreground/50 border-b border-border-custom font-medium">
                    <th className="py-2.5 pr-4">SKU Code *</th>
                    <th className="py-2.5 px-4">Color *</th>
                    <th className="py-2.5 px-4">Size *</th>
                    <th className="py-2.5 px-4">Stock *</th>
                    <th className="py-2.5 px-4">Price Override (optional)</th>
                    <th className="py-2.5 pl-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom/50">
                  {variants.map((v, idx) => (
                    <tr key={idx} className="group">
                      {/* SKU */}
                      <td className="py-3 pr-4">
                        <input
                          type="text"
                          required
                          placeholder="FL-POLO-BLK-M"
                          value={v.sku}
                          onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                          className="h-9 w-full max-w-[150px] border border-border-custom bg-white rounded-lg px-3 text-xs focus:outline-none focus:border-accent"
                        />
                      </td>

                      {/* Color */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Jet Black"
                          value={v.color}
                          onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                          className="h-9 w-full max-w-[120px] border border-border-custom bg-white rounded-lg px-3 text-xs focus:outline-none focus:border-accent"
                        />
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4">
                        <select
                          value={v.size}
                          onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
                          className="h-9 border border-border-custom bg-white rounded-lg px-2 text-xs focus:outline-none focus:border-accent"
                        >
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                        </select>
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          required
                          min="0"
                          value={v.stock}
                          onChange={(e) => handleVariantChange(idx, "stock", e.target.value)}
                          className="h-9 w-20 border border-border-custom bg-white rounded-lg px-3 text-xs text-center focus:outline-none focus:border-accent"
                        />
                      </td>

                      {/* Price override */}
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          placeholder="e.g. 950"
                          value={v.priceOverride}
                          onChange={(e) => handleVariantChange(idx, "priceOverride", e.target.value)}
                          className="h-9 w-28 border border-border-custom bg-white rounded-lg px-3 text-xs text-center focus:outline-none focus:border-accent"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3 pl-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="p-1.5 border border-border-custom hover:border-red-200 text-foreground/40 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {isEditMode ? "Updating Product..." : "Publishing Product..."}
              </>
            ) : (
              <>
                {isEditMode ? "Update Product Details" : "Publish Product to Catalog"}
              </>
            )}
          </button>

        </form>

      </main>
    </>
  );
}

export default function AddProduct() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm font-semibold text-foreground/60 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-accent" size={24} />
          <span>Loading page context...</span>
        </div>
      </>
    }>
      <AddProductContent />
    </Suspense>
  );
}
