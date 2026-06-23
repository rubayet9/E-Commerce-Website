import { create } from "zustand";

const API_URL = "http://localhost:5000/api";

export interface Variant {
  id: string;
  sku: string;
  color: string;
  size: string;
  stock: number;
  priceOverride: number | null;
  images: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  images: string[];
  categoryId: string;
  isActive: boolean;
  tags: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variants: Variant[];
}

export interface FacetOption {
  name: string;
  count: number;
}

export interface CategoryFacetOption {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface Facets {
  categories: CategoryFacetOption[];
  colors: FacetOption[];
  sizes: FacetOption[];
  priceRange: {
    min: number;
    max: number;
  };
}

interface FilterState {
  products: Product[];
  facets: Facets | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;
  
  isLoading: boolean;
  error: string | null;
  
  // Filter variables
  search: string;
  category: string;
  colors: string[]; // Refinement lists
  sizes: string[];
  minPrice: string;
  maxPrice: string;
  sort: string;
  page: number;

  // Actions
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  fetchProducts: () => Promise<void>;
  toggleColorFilter: (color: string) => void;
  toggleSizeFilter: (size: string) => void;
}

export const useSearchStore = create<FilterState>((set, get) => ({
  products: [],
  facets: null,
  pagination: null,
  isLoading: false,
  error: null,

  search: "",
  category: "",
  colors: [],
  sizes: [],
  minPrice: "",
  maxPrice: "",
  sort: "",
  page: 1,

  setFilters: (filters) => set((state) => ({ ...state, ...filters })),

  resetFilters: () => set({
    search: "",
    category: "",
    colors: [],
    sizes: [],
    minPrice: "",
    maxPrice: "",
    sort: "",
    page: 1
  }),

  toggleColorFilter: (color) => {
    const { colors } = get();
    const updated = colors.includes(color) 
      ? colors.filter((c) => c !== color) 
      : [...colors, color];
    set({ colors: updated, page: 1 });
  },

  toggleSizeFilter: (size) => {
    const { sizes } = get();
    const updated = sizes.includes(size) 
      ? sizes.filter((s) => s !== size) 
      : [...sizes, size];
    set({ sizes: updated, page: 1 });
  },

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { search, category, colors, sizes, minPrice, maxPrice, sort, page } = get();
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (category) queryParams.append("category", category);
      if (colors.length > 0) queryParams.append("colors", colors.join(","));
      if (sizes.length > 0) queryParams.append("sizes", sizes.join(","));
      if (minPrice) queryParams.append("minPrice", minPrice);
      if (maxPrice) queryParams.append("maxPrice", maxPrice);
      if (sort) queryParams.append("sort", sort);
      queryParams.append("page", page.toString());
      queryParams.append("limit", "12");

      const res = await fetch(`${API_URL}/products?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success) {
        set({
          products: data.data,
          facets: data.facets,
          pagination: data.pagination,
        });
      } else {
        set({ error: data.error });
      }
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch products." });
    } finally {
      set({ isLoading: false });
    }
  },
}));
