import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { motion } from "framer-motion";
import { FaBookOpen, FaTags, FaBarcode, FaInfoCircle } from "react-icons/fa";
import { RiBookmarkLine } from "react-icons/ri";
import "./bookdetails.css"
import { showSuccessToast } from "../../utils/toasthelper";
import { useCart } from "../../context/CartContext";


function BookDetails() {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
        const { addToCart, isInCart } = useCart();
        const categoryLabel = book?.categoryId?.name || book?.category || "Chưa phân loại";

    useEffect(() => {
        async function fetchBook() {
            try {
                setIsLoading(true);
                const response = await axios.get(`${Server_URL}books/${id}`);
                setBook(response.data);
                setError(null);
            } catch (error) {
                console.error("Error fetching book:", error);
                setError("Không tải được thông tin sách. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchBook();
    }, [id]);

    if (isLoading) return (
        <div className="loading-container">
            <motion.div 
                className="spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            ></motion.div>
            <p>Đang tải...</p>
        </div>
    );

    if (error) return (
        <motion.div 
            className="error-message"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {error}
        </motion.div>
    );

    if (!book) return (
        <div className="not-found-container">
            <RiBookmarkLine className="not-found-icon" />
            <h2>Không tìm thấy sách</h2>
            <p>Sách bạn tìm không tồn tại hoặc đã được gỡ khỏi thư viện.</p>
        </div>
    );

    return (
        <motion.div 
            className="book-details-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="book-details">
                <motion.div 
                    className="book-cover"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    <img 
                        src={book.coverImage || '/assets/library.avif'} 
                        alt={book.title} 
                        className="book-image"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/library.avif';
                        }}
                    />
                    {book.availableCopies !== undefined && (
                        <div className={`availability-badge ${book.availableCopies > 0 ? 'available' : 'unavailable'}`}>
                            {book.availableCopies > 0 ? `Còn ${book.availableCopies} cuốn` : 'Hết sách'}
                        </div>
                    )}
                </motion.div>
                
                <div className="book-info">
                    <div className="book-header">
                        <h1 className="book-title">{book.title}</h1>
                        <p className="book-author">Tác giả: {book.author}</p>
                      
                    </div>
                    
                    <div className="book-meta">
                        <div className="meta-item">
                            <FaTags className="meta-icon" />
                            <div>
                                <span className="meta-label">Danh mục</span>
                                <span className="meta-value">{categoryLabel}</span>
                            </div>
                        </div>
                        <div className="meta-item">
                            <FaBarcode className="meta-icon" />
                            <div>
                                <span className="meta-label">ISBN</span>
                                <span className="meta-value">{book.isbn}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="book-description">
                        <h3>
                            <FaInfoCircle className="description-icon" />
                            Mô tả
                        </h3>
                        <p>{book.description || "Chưa có mô tả cho cuốn sách này."}</p>
                    </div>
                    
                    <div className="action-buttons">
                        <motion.button 
                            className={`issue-button ${book.availableCopies !== undefined && book.availableCopies <= 0 ? 'disabled' : ''}`}
                            onClick={() => {
                                addToCart(book);
                                showSuccessToast("Đã thêm vào giỏ sách mượn.");
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={book.availableCopies !== undefined && book.availableCopies <= 0 || isInCart(book._id)}
                        >
                            <>
                                <FaBookOpen className="button-icon" />
                                {book.availableCopies !== undefined && book.availableCopies <= 0 ?
                                    "Hết sách" : isInCart(book._id) ? "Đã trong giỏ" : "Thêm vào giỏ sách mượn"}
                            </>
                        </motion.button>
                    </div>
                </div>
            </div>
            
          
           
        </motion.div>
    );
}

export default BookDetails;