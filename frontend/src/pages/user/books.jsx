import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { FiSearch, FiFilter } from "react-icons/fi";
import Preloader from "../../components/Preloader";

const Books = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  async function issueBook(bookid) {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        showErrorToast("Please login to issue a book.");
        return;
      }
      const response = await axios.post(`${Server_URL}books/borrow/request-issue/${bookid}`, {}, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const { error, message } = response.data;
      if (error) {
        showErrorToast(message);
      } else {
        showSuccessToast(message);
      }
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Something went wrong! Please try again.");
    }
  }

  function bookDetails(bookid) {
    navigate(`/bookdetails/${bookid}`);
  }

  useEffect(() => {
    setIsLoading(true);
    axios.get(`${Server_URL}books`)
      .then((response) => {
        if (!response.data.error) {
          setBooks(response.data.books);
          setFilteredBooks(response.data.books);
          const uniqueCategories = ["All", ...new Set(response.data.books.map(book => book.category))];
          setCategories(uniqueCategories);
        }
      })
      .catch((error) => {
        console.error("Error fetching books:", error);
      }).finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    filterBooks(e.target.value, selectedCategory);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    filterBooks(searchTerm, category);
  };

  const filterBooks = (search, category) => {
    let filtered = books;
    if (category !== "All") {
      filtered = filtered.filter(book => book.category === category);
    }
    if (search) {
      filtered = filtered.filter(book => book.title.toLowerCase().includes(search.toLowerCase()));
    }
    setFilteredBooks(filtered);
  };

  if (isLoading) return <Preloader />;

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar / Categories */}
          <div className="w-full md:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiFilter className="text-primary" /> Danh mục
              </h4>
              <div className="flex flex-col space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    className={`text-left px-4 py-2.5 rounded-lg font-medium transition-colors ${
                      selectedCategory === category 
                        ? "bg-primary text-white shadow-md shadow-primary/20" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category === "All" ? "Tất cả sách" : category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Tủ sách</h2>
              <div className="relative w-full sm:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-primary focus:border-primary transition-colors text-sm"
                  placeholder="Tìm kiếm sách theo tiêu đề..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>

            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map((book, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                    <div className="aspect-[2/3] relative overflow-hidden bg-gray-100 group">
                      <img
                        src={book.coverImage || "/assets/images/default-book.png"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={book.title}
                        onError={(e) => { e.target.src = "/assets/images/default-book.png"; }}
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/50 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {book.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-grow flex flex-col">
                      <h5 className="font-bold text-gray-900 text-lg line-clamp-2 mb-1">{book.title}</h5>
                      <p className="text-gray-500 text-sm mb-4">bởi {book.author}</p>
                      
                      <div className="mt-auto flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-primary font-bold">Cọc đ {book.price || '50,000'}</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${book.availableCopies > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {book.availableCopies > 0 ? `Còn ${book.availableCopies}` : 'Hết sách'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            className="px-3 py-2 text-sm font-medium border border-primary text-primary rounded-lg hover:bg-teal-50 transition-colors text-center"
                            onClick={() => bookDetails(book.id || book._id)}
                          >
                            Chi tiết
                          </button>
                          <button
                            className={`px-3 py-2 text-sm font-medium rounded-lg text-center transition-colors ${book.availableCopies > 0 ? 'bg-primary text-white hover:bg-[#3d5c5f] shadow-md shadow-primary/20' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                            onClick={() => book.availableCopies > 0 && issueBook(book.id || book._id)}
                            disabled={book.availableCopies <= 0}
                          >
                            Mượn sách
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                <FiSearch className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h4 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy sách!</h4>
                <p className="text-gray-500">Vui lòng thử điều chỉnh tìm kiếm hoặc danh mục của bạn.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Books;