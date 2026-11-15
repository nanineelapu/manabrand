"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* ---------------------------------------------------------------- Cart */
export interface CartLine {
  key: string; // productId|color|size
  productId: string;
  color: string;
  size: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  coupon: string | null;
  add: (l: Omit<CartLine, "key" | "qty"> & { qty?: number }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  applyCoupon: (code: string | null) => void;
}

export const lineKey = (productId: string, color: string, size: string) => `${productId}|${color}|${size}`;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      coupon: null,
      add: ({ productId, color, size, qty = 1 }) =>
        set((s) => {
          const key = lineKey(productId, color, size);
          const exists = s.lines.find((l) => l.key === key);
          if (exists) return { lines: s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(10, l.qty + qty) } : l)) };
          return { lines: [...s.lines, { key, productId, color, size, qty }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({ lines: s.lines.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l)) })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [], coupon: null }),
      applyCoupon: (code) => set({ coupon: code }),
    }),
    { name: "mana-cart", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

/* ------------------------------------------------------------ Wishlist */
interface WishlistState {
  ids: string[];
  toggle: (id: string) => boolean; // returns new state (true = added)
  has: (id: string) => boolean;
  remove: (id: string) => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const has = get().ids.includes(id);
        set({ ids: has ? get().ids.filter((x) => x !== id) : [id, ...get().ids] });
        return !has;
      },
      has: (id) => get().ids.includes(id),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
    }),
    { name: "mana-wishlist", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

/* --------------------------------------------------------------- Toast */
export interface ToastItem { id: number; message: string; tone: "success" | "error" | "info"; action?: { label: string; href: string } }
interface ToastState {
  items: ToastItem[];
  push: (message: string, opts?: { tone?: ToastItem["tone"]; action?: ToastItem["action"] }) => void;
  dismiss: (id: number) => void;
}
let toastId = 0;
export const useToast = create<ToastState>((set) => ({
  items: [],
  push: (message, opts) => {
    const id = ++toastId;
    set((s) => ({ items: [...s.items.slice(-2), { id, message, tone: opts?.tone ?? "success", action: opts?.action }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 3200);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));
export const toast = {
  success: (m: string, action?: ToastItem["action"]) => useToast.getState().push(m, { tone: "success", action }),
  error: (m: string) => useToast.getState().push(m, { tone: "error" }),
  info: (m: string) => useToast.getState().push(m, { tone: "info" }),
};

/* ------------------------------------------------------------------ UI */
interface UiState {
  menuOpen: boolean;
  searchOpen: boolean;
  cartOpen: boolean;
  setMenu: (v: boolean) => void;
  setSearch: (v: boolean) => void;
  setCart: (v: boolean) => void;
}
export const useUi = create<UiState>((set) => ({
  menuOpen: false,
  searchOpen: false,
  cartOpen: false,
  setMenu: (menuOpen) => set({ menuOpen }),
  setSearch: (searchOpen) => set({ searchOpen }),
  setCart: (cartOpen) => set({ cartOpen }),
}));

/* Recent searches (store) */
interface RecentState { items: string[]; add: (q: string) => void; clear: () => void }
export const useRecentSearches = create<RecentState>()(
  persist(
    (set) => ({
      items: [],
      add: (q) => set((s) => ({ items: [q, ...s.items.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6) })),
      clear: () => set({ items: [] }),
    }),
    { name: "mana-recent", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
