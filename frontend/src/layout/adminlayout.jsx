import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from 'framer-motion';
import axios from "axios";
import AdminNavbar from "../components/adminnavbar";
import AdminFooter from "../components/AdminFooter";
import { ToastContainer } from 'react-toastify';
import { Server_URL } from "../utils/config";
import { removeAuthToken, setAuthUser } from "../utils/auth";
import "../pages/admin/admin-shared.css";

export default function AdminLayout() {
  const [render,setRender] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const response = await axios.get(`${Server_URL}users/session`);
        const user = response.data.user;
        if (!cancelled && user?.role === "admin") {
          setAuthUser(user);
          setRender(true);
          return;
        }
      } catch {
        // Invalid or expired session falls through to login.
      }

      if (!cancelled) {
        removeAuthToken();
        setRender(false);
        navigate("/login");
      }
    };

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [navigate])


  const location = useLocation();
  return (
    <>

    {render ? <><AdminNavbar />
          <motion.main
            className="admin-app-main"
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.36, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.main>
          <AdminFooter /></> :
          null
          }
          <ToastContainer
position="top-right"
autoClose={1000}
hideProgressBar={false}
newestOnTop={false}
closeOnClick
rtl={false}
pauseOnFocusLoss
draggable
pauseOnHover
theme="light"
/>
    </>
  );
}
