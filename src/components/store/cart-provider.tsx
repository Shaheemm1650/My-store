"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string;
  price: number; // minor units — display only, the server recalculates at checkout
  image: string | null;
  quantity: number;
  stock: number;
}

const STORAGE_KEY = "store.cart.v1";
const MAX_QTY = 100;
const EMPTY: CartItem[] = [];

let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    cache = Array.isArray(parsed)
      ? parsed.filter(
          (i): i is CartItem =>
            typeof i === "object" && i !== null && typeof i.variantId === "string" && Number.isInteger(i.quantity),
        )
      : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: CartItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full or disabled — keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage); // sync between tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  replace: (items: CartItem[]) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const clampQty = (q: number, stock: number) => Math.max(1, Math.min(q, stock, MAX_QTY));

  const add = useCallback<CartContextValue["add"]>((item, quantity = 1) => {
    const current = read();
    const existing = current.find((i) => i.variantId === item.variantId);
    if (existing) {
      write(
        current.map((i) =>
          i.variantId === item.variantId ? { ...i, ...item, quantity: clampQty(i.quantity + quantity, item.stock) } : i,
        ),
      );
    } else {
      write([...current, { ...item, quantity: clampQty(quantity, item.stock) }]);
    }
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    write(read().map((i) => (i.variantId === variantId ? { ...i, quantity: clampQty(quantity, i.stock) } : i)));
  }, []);

  const remove = useCallback((variantId: string) => write(read().filter((i) => i.variantId !== variantId)), []);
  const replace = useCallback((next: CartItem[]) => write(next), []);
  const clear = useCallback(() => write([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      hydrated,
      add,
      setQuantity,
      remove,
      replace,
      clear,
    }),
    [items, hydrated, add, setQuantity, remove, replace, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
