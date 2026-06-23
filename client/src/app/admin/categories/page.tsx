"use client";

import React, { useState, useEffect } from "react";
import Header from "../../../components/common/Header";
import { Plus, Trash2, Edit3, ArrowLeft, Loader2, CheckCircle, Tag, FolderTree, X } from "lucide-react";
import { API_URL } from "@/config";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [editId, setEditId] = useState<string | null>(null); // Null means Create Mode, otherwise Edit Mode
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [image, setImage] = useState("");

  // Status/Alert States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch all categories on mount
  const fetchCategories = () => {
    setIsLoading(true);
    fetch(`${API_URL}/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data);
        } else {
          setErrorMessage(data.error || "Failed to load categories.");
        }
      })
      .catch((err) => setErrorMessage("Error connecting to server to load categories."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Helper to auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editId) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // remove special chars
        .trim()
        .replace(/\s+/g, "-"); // replace spaces with hyphens
      setSlug(generatedSlug);
    }
  };

  // Switch to Edit Mode
  const handleEditClick = (cat: Category) => {
    setEditId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setParentId(cat.parentId || "");
    setImage(cat.image || "");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Reset/Cancel Form
  const resetForm = () => {
    setEditId(null);
    setName("");
    setSlug("");
    setDescription("");
    setParentId("");
    setImage("");
    setErrorMessage(null);
  };

  // Submit Handler: Create or Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim() || !slug.trim()) {
      setErrorMessage("Category Name and Slug are required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editId
        ? `${API_URL}/categories/${editId}`
        : `${API_URL}/categories`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          parentId: parentId || null,
          image: image.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Category "${data.data.name}" was successfully ${editId ? "updated" : "created"}.`);
        resetForm();
        fetchCategories();
      } else {
        setErrorMessage(data.error || "Failed to save category details.");
      }
    } catch (err: any) {
      setErrorMessage("Failed to connect to the backend server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Category "${catName}" was deleted successfully.`);
        fetchCategories();
      } else {
        setErrorMessage(data.error || "Failed to delete category.");
      }
    } catch (err) {
      setErrorMessage("Error connecting to server to delete category.");
    }
  };

  // Helper to find parent name
  const getParentName = (pId: string | null) => {
    if (!pId) return null;
    const parent = categories.find((cat) => cat.id === pId);
    return parent ? parent.name : null;
  };

  // Filter out the category itself to prevent setting it as its own parent
  const availableParents = categories.filter((cat) => !editId || cat.id !== editId);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full animate-slide-up">
        
        {/* Breadcrumb Back Link */}
        <Link href="/dashboard" className="text-xs font-bold text-accent hover:underline flex items-center gap-1.5 mb-6">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        {/* Title Heading */}
        <div className="border-b border-border-custom pb-6 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              Admin: Category Management
            </h1>
            <p className="text-sm text-foreground/60 mt-1">
              Add, edit, or delete storefront categories and subcategory relationships.
            </p>
          </div>
          <FolderTree size={36} className="text-accent/40" />
        </div>

        {/* Status Alerts */}
        {successMessage && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 mb-8 flex items-start gap-3 shadow-sm text-xs font-medium">
            <CheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={16} />
            <div>{successMessage}</div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-xs font-semibold mb-8">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Form Card (Add/Edit) */}
          <div className="bg-white border border-border-custom p-6 rounded-2xl shadow-sm flex flex-col gap-5 lg:sticky lg:top-24">
            <div className="flex justify-between items-center border-b border-border-custom pb-3">
              <h3 className="font-extrabold text-base text-primary flex items-center gap-2">
                <Tag size={16} className="text-accent" />
                {editId ? "Edit Category" : "Add New Category"}
              </h3>
              {editId && (
                <button
                  onClick={resetForm}
                  className="text-xs text-foreground/40 hover:text-red-500 flex items-center gap-0.5"
                  title="Cancel Edit"
                >
                  <X size={14} /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hoodies & Sweaters"
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
                  placeholder="e.g. hoodies-sweaters"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase">Parent Category (optional)</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">None (Top-Level Category)</option>
                  {availableParents.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase">Image URL (optional)</label>
                <input
                  type="url"
                  placeholder="Paste cover image link"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="h-10 border border-border-custom bg-white rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase">Description (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Short description of the category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border border-border-custom bg-white rounded-xl p-3 text-sm focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : editId ? (
                  "Update Category"
                ) : (
                  "Create Category"
                )}
              </button>
            </form>
          </div>

          {/* List Table Card */}
          <div className="lg:col-span-2 bg-white border border-border-custom rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-border-custom p-6 bg-secondary/10">
              <h3 className="font-extrabold text-base text-primary">
                Existing Categories ({categories.length})
              </h3>
            </div>

            {isLoading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-accent" size={24} />
                <span className="text-xs text-foreground/50 font-medium">Fetching categories catalog...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-20 text-center text-sm font-medium text-foreground/40">
                No categories found. Start by creating one!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-foreground/50 border-b border-border-custom font-medium bg-secondary/5">
                      <th className="py-3 px-6">Name / Slug</th>
                      <th className="py-3 px-6">Parent</th>
                      <th className="py-3 px-6">Description</th>
                      <th className="py-3 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom/50">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-secondary/15 transition-colors">
                        
                        {/* Name & Slug */}
                        <td className="py-4 px-6">
                          <span className="font-extrabold text-primary block">{cat.name}</span>
                          <span className="text-[10px] text-accent font-bold font-mono block mt-0.5">{cat.slug}</span>
                        </td>

                        {/* Parent Category */}
                        <td className="py-4 px-6 text-foreground/75">
                          {getParentName(cat.parentId) ? (
                            <span className="px-2.5 py-0.5 bg-accent/10 border border-accent/20 text-accent font-bold text-[10px] rounded-full uppercase tracking-wider">
                              {getParentName(cat.parentId)}
                            </span>
                          ) : (
                            <span className="text-xs text-foreground/40">None (Top-Level)</span>
                          )}
                        </td>

                        {/* Description */}
                        <td className="py-4 px-6 text-foreground/60 max-w-xs truncate text-xs">
                          {cat.description || <em className="opacity-40">No description</em>}
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleEditClick(cat)}
                              className="p-2 border border-border-custom hover:border-amber-200 text-foreground/40 hover:text-amber-500 rounded-xl hover:bg-amber-50 transition-colors"
                              title="Edit Category"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id, cat.name)}
                              className="p-2 border border-border-custom hover:border-red-200 text-foreground/40 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </main>
    </>
  );
}
