import { createContext, useContext, useEffect, useMemo, useState } from "react";

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

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => readCart());

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

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