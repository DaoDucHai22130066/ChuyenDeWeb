import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';
import axios from "axios";
import './App.css';
import { Server_URL } from "./utils/config";
import { getAuthUser, removeAuthToken, setAuthUser } from "./utils/auth";
import Userlayout from "./layout/userlayout";
import AdminLayout from "./layout/adminlayout";
import Preloader from "./components/Preloader";

const Login = lazy(() => import("./pages/user/login"));
const Register = lazy(() => import('./pages/user/register'));
const Home = lazy(() => import("./pages/user/home"));
const Books = lazy(() => import('./pages/user/books'));
const AllCategories = lazy(() => import('./pages/user/allcategories'));
const CartPage = lazy(() => import('./pages/user/cart'));
const AdminDashboard = lazy(() => import('./pages/admin/admindashboard'));
const AddBookForm = lazy(() => import('./pages/admin/addbook'));
const ViewBooks = lazy(() => import('./pages/admin/viewbook'));
const BookDetails = lazy(() => import('./pages/user/bookdetails'));
const ProfilePage = lazy(() => import('./pages/user/profile'));
const AboutUs = lazy(() => import('./pages/user/AboutUs'));
const ContactUs = lazy(() => import('./pages/user/ContactUs'));
const Activities = lazy(() => import('./pages/user/Activities'));
const Partners = lazy(() => import('./pages/user/Partners'));
const Policies = lazy(() => import('./pages/user/Policies'));
const NotFound = lazy(() => import('./pages/user/NotFound'));
const PaymentResult = lazy(() => import('./pages/user/PaymentResult'));
const Wishlist = lazy(() => import('./pages/user/wishlist'));
const ForgotPassword = lazy(() => import('./pages/user/ForgetPassword/ForgetPassword'));
const VerifyOTP = lazy(() => import('./pages/user/ForgetPassword/VerifyOtp'));
const ResetPassword = lazy(() => import('./pages/user/ForgetPassword/UpdatePassword'));

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authUser = getAuthUser();
    if (authUser?.role === "admin" && location.pathname === "/") {
      navigate("/admin");
    } else if (localStorage.getItem("authToken")) {
      removeAuthToken();
    }

    axios.get(`${Server_URL}users/session`)
      .then((response) => {
        if (response.data.user) {
          setAuthUser(response.data.user);
          window.dispatchEvent(new Event("cart:auth-changed"));
        }
      })
      .catch(() => {
        if (authUser) {
          removeAuthToken();
          window.dispatchEvent(new Event("cart:auth-changed"));
        }
      });
  }, [location.pathname, navigate]);

  return (
    <Suspense fallback={<Preloader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/admin-login" element={<Navigate to="/login" replace />} />

          <Route path="/" element={<Userlayout />}>
            <Route index element={<Home />} />
            <Route path="books" element={<Books />} />
            <Route path="bookdetails/:id" element={<BookDetails />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="category" element={<AllCategories />} />
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
            <Route path="aboutus" element={<AboutUs />} />
            <Route path="ve-d-free-book" element={<AboutUs />} />
            <Route path="contactus" element={<ContactUs />} />
            <Route path="lien-he" element={<ContactUs />} />
            <Route path="hoat-dong" element={<Activities />} />
            <Route path="doi-tac" element={<Partners />} />
            <Route path="chinh-sach/:slug" element={<Policies />} />
            <Route path="forgetPassword" element={<ForgotPassword />} />
            <Route path="verifyotp" element={<VerifyOTP />} />
            <Route path="resetpass" element={<ResetPassword />} />
            <Route path="payment-result" element={<PaymentResult />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="tickets" element={<AdminDashboard initialSection="tickets" />} />
            <Route path="addbook" element={<AddBookForm />} />
            <Route path="viewbook" element={<ViewBooks />} />
          </Route>

          <Route path="/user" element={<Userlayout />}>
            <Route index element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

export default App;
