import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Server_URL } from "../utils/config";
import { getAuthToken } from "../utils/auth";

const CART_STORAGE_KEY = "borrowCart";

const CartContext = createContext(null);

const readCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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
    return res.data.cart || [];
  } catch (err) {
    return null;
  }
};

const saveServerCart = async (items) => {
  try {
    const token = getAuthToken();
    if (!token) return;
    const bookIds = items.map((i) => i._id);
    await axios.post(`${Server_URL}cart/save`, { bookIds }, { headers: { Authorization: `Bearer ${token}` } });
  } catch (err) {
    // ignore network errors silently
  }
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => readCart());

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    // If user logged in, persist to server
    const token = getAuthToken();
    if (token) {
      saveServerCart(cartItems);
    }
  }, [cartItems]);

  // On mount, if user logged in, try to load server cart and merge
  useEffect(() => {
    const handler = async () => {
      const token = getAuthToken();
      if (!token) return;
      const serverCart = await fetchServerCart();
      if (serverCart === null) return;

      setCartItems((local) => {
        const merged = [...serverCart];
        for (const item of local) {
          if (!merged.some((m) => m._id === item._id)) merged.push(item);
        }
        saveServerCart(merged);
        return merged;
      });
    };

    window.addEventListener('cart:auth-changed', handler);
    // run once on mount
    handler();
    return () => window.removeEventListener('cart:auth-changed', handler);
  }, []);

  const value = useMemo(() => {
    const addToCart = (book) => {
      setCartItems((current) => {
        if (current.some((item) => item._id === book._id)) {
          return current;
        }

        return [...current, book];
      });
    };

    const removeFromCart = (bookId) => {
      setCartItems((current) => current.filter((item) => item._id !== bookId));
    };

    const clearCart = () => setCartItems([]);

    return {
      cartItems,
      cartCount: cartItems.length,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart: (bookId) => cartItems.some((item) => item._id === bookId),
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