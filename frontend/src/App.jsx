import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, HashRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import './App.css';
import Userlayout from "./layout/userlayout";

// Lazy load all page components
const Login = lazy(() => import("./pages/user/login"));
const Register = lazy(() => import('./pages/user/register'));
const Home = lazy(() => import("./pages/user/home"));
const Books = lazy(() => import('./pages/user/books'));
const AllCategories = lazy(() => import('./pages/user/allcategories'));
const BookDetails = lazy(() => import('./pages/user/bookdetails'));
const ProfilePage = lazy(() => import('./pages/user/profile'));
const AboutUs = lazy(() => import('./pages/user/AboutUs'));
const ContactUs = lazy(() => import('./pages/user/ContactUs'));
const ForgotPassword = lazy(() => import('./pages/user/ForgetPassword/ForgetPassword'));
const VerifyOTP = lazy(() => import('./pages/user/ForgetPassword/VerifyOtp'));
const ResetPassword = lazy(() => import('./pages/user/ForgetPassword/UpdatePassword'));
const Branches = lazy(() => import('./pages/user/branches'));
const Articles = lazy(() => import('./pages/user/articles'));
const Donations = lazy(() => import('./pages/user/donations'));

// Lazy load dashboard components
const UserDashboard = lazy(() => import('./pages/user/dashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/dashboard'));
const LibrarianDashboard = lazy(() => import('./pages/librarian/dashboard'));

const Preloader = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token && location.pathname === "/") {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role === "admin" || decoded.role === "librarian") {
          navigate("/");
        } else if (decoded.role === "user") {
          navigate("/");
        }
      } catch (err) {
        console.error("Token decode failed", err);
        localStorage.removeItem("authToken");
      }
    }
  }, [location.pathname, navigate]);

  return (
    <Suspense fallback={<Preloader />}>
      <Routes>
        <Route path="/" element={<Userlayout/>}>
          <Route index element={<Home/>}/>
          <Route path="books" element={<Books/>}/>
          <Route path="bookdetails/:id" element={<BookDetails/>}/>
          <Route path="category" element={<AllCategories/>}/>
          <Route path="branches" element={<Branches/>}/>
          <Route path="articles" element={<Articles/>}/>
          <Route path="donations" element={<Donations/>}/>
          <Route path="register" element={<Register/>}/>
          <Route path="login" element={<Login/>}/>
          <Route path="aboutus" element={<AboutUs/>}/>
          <Route path="contactus" element={<ContactUs/>}/>
          <Route path="forgetPassword" element={<ForgotPassword/>}/>
          <Route path="verifyotp" element={<VerifyOTP/>}/>
          <Route path="resetpass" element={<ResetPassword/>}/>
        </Route>
        
        {/* User Dashboard */}
        <Route path="/user" element={<UserDashboard/>}/>
        <Route path="/user/dashboard" element={<UserDashboard/>}/>
        <Route path="/user/profile" element={<UserDashboard/>}/>

        {/* Admin Dashboard */}
        <Route path="/admin" element={<AdminDashboard/>}/>
        <Route path="/admin/dashboard" element={<AdminDashboard/>}/>

        {/* Librarian Dashboard */}
        <Route path="/librarian" element={<LibrarianDashboard/>}/>
        <Route path="/librarian/dashboard" element={<LibrarianDashboard/>}/>
      </Routes>
    </Suspense>
  )
}

export default App;