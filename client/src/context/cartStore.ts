import { create } from "zustand";

const API_URL = "http://localhost:5000/api";

export interface CartItem {
  id: string;
  cartId: string;
  productVariantId: string;
  quantity: number;
  variant: {
    id: string;
    sku: string;
    color: string;
    size: string;
    stock: number;
    priceOverride: number | null;
    images: string[];
    product: {
      id: string;
      name: string;
      slug: string;
      description: string;
      basePrice: number;
      images: string[];
    };
  };
}

export interface Cart {
  id: string;
  userId: string | null;
  sessionToken: string | null;
  items: CartItem[];
}

interface CartState {
  cart: Cart | null;
  isCartOpen: boolean;
  isLoading: boolean;
  error: string | null;
  shippingZone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
  userId: string | null;
  sessionToken: string | null;
  
  // Actions
  toggleCart: (open?: boolean) => void;
  setUserId: (id: string | null) => void;
  setShippingZone: (zone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA") => void;
  initCart: (userId?: string | null) => Promise<void>;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, qty: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  mergeGuestCart: (loggedInUserId: string) => Promise<void>;
  clearCartState: () => void;
  
  // Computations
  getSubtotal: () => number;
  getShippingCost: () => number;
  getTotal: () => number;
}

// Generate SSR safe session token
const getOrGenerateSessionToken = (): string | null => {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem("fl_session_token");
  if (!token) {
    token = `guest_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    localStorage.setItem("fl_session_token", token);
  }
  return token;
};

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isCartOpen: false,
  isLoading: false,
  error: null,
  shippingZone: "INSIDE_DHAKA",
  userId: null,
  sessionToken: null,

  toggleCart: (open) => set((state) => ({ isCartOpen: open !== undefined ? open : !state.isCartOpen })),
  
  setUserId: (id) => set({ userId: id }),

  setShippingZone: (zone) => set({ shippingZone: zone }),

  initCart: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const token = getOrGenerateSessionToken();
      set({ sessionToken: token, userId: userId || null });
      
      const query = userId ? `userId=${userId}` : `sessionToken=${token}`;
      const res = await fetch(`${API_URL}/cart?${query}`);
      const data = await res.json();
      
      if (data.success) {
        set({ cart: data.data });
      } else {
        set({ error: data.error });
      }
    } catch (err: any) {
      set({ error: err.message || "Failed to load cart" });
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (variantId, quantity = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { userId, sessionToken } = get();
      const res = await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sessionToken,
          productVariantId: variantId,
          quantity,
        }),
      });
      const data = await res.json();
      if (data.success) {
        set({ cart: data.data, isCartOpen: true }); // Open cart drawer on add
      } else {
        set({ error: data.error });
      }
    } catch (err: any) {
      set({ error: err.message || "Failed to add item" });
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (cartItemId, qty) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/cart/item/${cartItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically update quantity locally first
        const currentCart = get().cart;
        if (currentCart) {
          const updatedItems = currentCart.items.map((item) =>
            item.id === cartItemId ? { ...item, quantity: qty } : item
          );
          set({ cart: { ...currentCart, items: updatedItems } });
        }
      } else {
        set({ error: data.error });
      }
    } catch (err: any) {
      set({ error: err.message || "Failed to update item" });
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (cartItemId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/cart/item/${cartItemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        // Filter out item locally
        const currentCart = get().cart;
        if (currentCart) {
          const filtered = currentCart.items.filter((item) => item.id !== cartItemId);
          set({ cart: { ...currentCart, items: filtered } });
        }
      } else {
        set({ error: data.error });
      }
    } catch (err: any) {
      set({ error: err.message || "Failed to remove item" });
    } finally {
      set({ isLoading: false });
    }
  },

  mergeGuestCart: async (loggedInUserId) => {
    const sessionToken = getOrGenerateSessionToken();
    if (!sessionToken) return;
    
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/cart/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId, sessionToken }),
      });
      const data = await res.json();
      if (data.success) {
        set({ cart: data.data, userId: loggedInUserId });
        // Clear local storage token since merged
        localStorage.removeItem("fl_session_token");
        getOrGenerateSessionToken(); // Get a fresh empty one if needed
      } else {
        set({ error: data.error });
      }
    } catch (err: any) {
      set({ error: err.message || "Failed to merge carts" });
    } finally {
      set({ isLoading: false });
    }
  },

  clearCartState: () => {
    set({ cart: null, error: null });
  },

  getSubtotal: () => {
    const cart = get().cart;
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => {
      const price = item.variant.priceOverride 
        ? Number(item.variant.priceOverride)
        : Number(item.variant.product.basePrice);
      return total + price * item.quantity;
    }, 0);
  },

  getShippingCost: () => {
    const zone = get().shippingZone;
    return zone === "INSIDE_DHAKA" ? 60.0 : 120.0;
  },

  getTotal: () => {
    return get().getSubtotal() + get().getShippingCost();
  },
}));
