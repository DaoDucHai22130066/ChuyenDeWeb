import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Server_URL } from '../utils/config';
import { getAuthToken } from '../utils/auth';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    
    const getToken = () => getAuthToken();

    useEffect(() => {
        fetchWishlist();
        const handleAuthChange = () => fetchWishlist();
        window.addEventListener('cart:auth-changed', handleAuthChange);
        return () => window.removeEventListener('cart:auth-changed', handleAuthChange);
    }, []);

    const fetchWishlist = async () => {
        const token = getToken();
        if (!token) {
            setWishlistItems([]);
            return;
        }
        try {
            const response = await axios.get(`${Server_URL}wishlist`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setWishlistItems(response.data.wishlist);
            }
        } catch (error) {
            console.error("Error fetching wishlist:", error);
        }
    };

    const addToWishlist = async (book) => {
        const token = getToken();
        if (!token) return { success: false, message: "Vui lòng đăng nhập" };
        
        const bookId = book._id || book.id;
        
        try {
            // Optimistic update
            const tempItem = { _id: `temp-${bookId}`, bookId: book, userId: 'temp' };
            setWishlistItems(prev => [tempItem, ...prev]);

            const response = await axios.post(`${Server_URL}wishlist/${bookId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                fetchWishlist(); // Re-fetch to get actual IDs
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            // Revert on error
            setWishlistItems(prev => prev.filter(item => item.bookId?._id !== bookId && item.bookId?.id !== bookId));
            return { success: false, message: error.response?.data?.message || "Đã xảy ra lỗi" };
        }
    };

    const removeFromWishlist = async (bookId) => {
        const token = getToken();
        if (!token) return { success: false, message: "Vui lòng đăng nhập" };

        try {
            // Optimistic update
            setWishlistItems(prev => prev.filter(item => item.bookId?._id !== bookId && item.bookId?.id !== bookId));

            const response = await axios.delete(`${Server_URL}wishlist/${bookId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                return { success: true };
            }
            // Revert logic would ideally be here if it failed, but we'll re-fetch just in case
            fetchWishlist();
            return { success: false, message: response.data.message };
        } catch (error) {
            fetchWishlist();
            return { success: false, message: error.response?.data?.message || "Đã xảy ra lỗi" };
        }
    };

    const isInWishlist = (bookId) => {
        return wishlistItems.some(item => item.bookId?._id === bookId || item.bookId?.id === bookId);
    };

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            fetchWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
};
