import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Server_URL } from "../utils/config";
import { getAuthToken } from "../utils/auth";

const CART_STORAGE_KEY = "borrowCart";

const CartContext = createContext(null);

const getBookId = (book) => {
  const rawId = book?._id ?? book?.id ?? book?.bookId;
  const numericId = Number(rawId);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
};

const normalizeCartItem = (book) => {
  const id = getBookId(book);
  return id ? { ...book, _id: id } : null;
};

const mergeCartItems = (primary = [], secondary = []) => {
  const merged = [];
  const seen = new Set();

  for (const item of [...primary, ...secondary]) {
    const normalized = normalizeCartItem(item);
    if (!normalized || seen.has(normalized._id)) continue;
    seen.add(normalized._id);
    merged.push(normalized);
  }

  return merged;
};

const readCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? mergeCartItems(parsed) : [];
  } catch {
    return [];
  }
};

const fetchServerCart = async () => {
  try {
    const token = getAuthToken();
    if (!token) return null;
    const res = await axios.get(`${Server_URL}cart/`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.data || res.data.error) return [];
    return mergeCartItems(res.data.cart || []);
  } catch {
    return null;
  }
};

const saveServerCart = async (items) => {
  try {
    const token = getAuthToken();
    if (!token) return;
    const bookIds = [...new Set(items.map(getBookId).filter(Boolean))];
    await axios.post(`${Server_URL}cart/save`, { bookIds }, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    // ignore network errors silently
  }
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => readCart());
  const serverSyncReadyRef = useRef(!getAuthToken());

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    const token = getAuthToken();
    if (token && serverSyncReadyRef.current) {
      saveServerCart(cartItems);
    }
  }, [cartItems]);

  useEffect(() => {
    const handler = async () => {
      const token = getAuthToken();
      if (!token) {
        serverSyncReadyRef.current = false;
        return;
      }

      serverSyncReadyRef.current = false;
      const serverCart = await fetchServerCart();
      if (serverCart === null) {
        serverSyncReadyRef.current = true;
        return;
      }

      setCartItems((local) => {
        return mergeCartItems(serverCart, local);
      });
      serverSyncReadyRef.current = true;
    };

    window.addEventListener('cart:auth-changed', handler);
    // run once on mount
    handler();
    return () => window.removeEventListener('cart:auth-changed', handler);
  }, []);

  const value = useMemo(() => {
    const addToCart = (book) => {
      setCartItems((current) => {
        const normalized = normalizeCartItem(book);
        if (!normalized || current.some((item) => item._id === normalized._id)) {
          return current;
        }

        return [...current, normalized];
      });
    };

    const removeFromCart = (bookId) => {
      const normalizedBookId = getBookId({ _id: bookId });
      setCartItems((current) => current.filter((item) => item._id !== normalizedBookId));
    };

    const clearCart = () => setCartItems([]);
    const clearLocalCart = () => {
      serverSyncReadyRef.current = false;
      setCartItems([]);
      localStorage.removeItem(CART_STORAGE_KEY);
    };

    return {
      cartItems,
      cartCount: cartItems.length,
      addToCart,
      removeFromCart,
      clearCart,
      clearLocalCart,
      isInCart: (bookId) => {
        const normalizedBookId = getBookId({ _id: bookId });
        return cartItems.some((item) => item._id === normalizedBookId);
      },
    };
  }, [cartItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
