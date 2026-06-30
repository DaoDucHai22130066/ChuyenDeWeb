import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { showSuccessToast } from '../../utils/toasthelper';
import { FiTrash2, FiShoppingBag, FiArrowRight, FiHeart, FiBookOpen } from 'react-icons/fi';
import './wishlist.css';

const Wishlist = () => {
    const { wishlistItems, removeFromWishlist, fetchWishlist } = useWishlist();
    const { addToCart, isInCart } = useCart();

    useEffect(() => {
        fetchWishlist();
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        // The context action is intentionally invoked once when this page opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRemove = async (bookId) => {
        const result = await removeFromWishlist(bookId);
        if (result.success) {
            showSuccessToast("Đã xóa khỏi sách yêu thích");
        }
    };

    const handleAddToCart = (book) => {
        addToCart(book);
        showSuccessToast("Đã thêm vào giỏ sách mượn");
    };

    return (
        <motion.div 
            className="wishlist-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <div className="container-dfb">
                <div className="wishlist-header">
                    <div>
                        <span className="wishlist-eyebrow"><FiHeart /> Bộ sưu tập cá nhân</span>
                        <h1>Sách yêu thích của bạn</h1>
                        <p>Lưu lại những cuốn sách bạn muốn đọc và thêm vào giỏ khi sẵn sàng.</p>
                    </div>
                    <div className="wishlist-count"><strong>{wishlistItems.length}</strong><span>cuốn đã lưu</span></div>
                </div>

                {wishlistItems.length === 0 ? (
                    <div className="wishlist-empty">
                        <span className="wishlist-empty-icon"><FiBookOpen /></span>
                        <h2>Danh sách yêu thích trống</h2>
                        <p>Bạn chưa lưu cuốn sách nào. Hãy khám phá kho sách và lưu lại nhé!</p>
                        <Link to="/books" className="btn-dfb-primary">
                            Khám phá sách <FiArrowRight />
                        </Link>
                    </div>
                ) : (
                    <div className="wishlist-grid">
                        {wishlistItems.map((item) => {
                            const book = item.bookId;
                            if (!book) return null; // Handle deleted books
                            
                            const isUnavailable = book.availableCopies <= 0;
                            const inCart = isInCart(book._id || book.id);

                            return (
                                <motion.div 
                                    className="wishlist-card dfb-card" 
                                    key={item._id}
                                    whileHover={{ y: -5 }}
                                >
                                    <div className="wishlist-card-image-wrap">
                                        <img 
                                            src={book.coverImage || "/assets/library.avif"} 
                                            alt={book.title} 
                                            onError={(e) => { e.currentTarget.src = "/assets/library.avif"; }}
                                        />
                                        <button 
                                            className="remove-btn" 
                                            onClick={() => handleRemove(book._id || book.id)}
                                            title="Xóa khỏi danh sách"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                    <div className="wishlist-card-content">
                                        <div className="wishlist-book-category">{book.categoryId?.name || book.category || "Chưa phân loại"}</div>
                                        <Link to={`/bookdetails/${book._id || book.id}`} className="book-title-link">
                                            <h3>{book.title}</h3>
                                        </Link>
                                        <p className="book-author">{book.author}</p>
                                        
                                        <div className="availability-status">
                                            {isUnavailable ? (
                                                <span className="status-badge unavailable">Đang hết sách</span>
                                            ) : (
                                                <span className="status-badge available">Còn {book.availableCopies} cuốn</span>
                                            )}
                                        </div>

                                        <div className="wishlist-actions">
                                            <button 
                                                className={`issue-button ${isUnavailable ? "disabled" : ""}`}
                                                onClick={() => handleAddToCart(book)}
                                                disabled={isUnavailable || inCart}
                                            >
                                                <FiShoppingBag className="button-icon" />
                                                {isUnavailable ? "Hết sách" : inCart ? "Đã trong giỏ" : "Thêm vào giỏ"}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Wishlist;
