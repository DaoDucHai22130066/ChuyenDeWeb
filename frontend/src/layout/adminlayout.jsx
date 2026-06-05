import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from 'framer-motion';
import AdminNavbar from "../components/adminnavbar";
import AdminFooter from "../components/AdminFooter";
import { ToastContainer } from 'react-toastify';
import "../pages/admin/admin-shared.css";

export default function AdminLayout() {
  const [render,setRender] = useState(false);
  const token = localStorage.getItem("authToken")
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  useEffect(() => {
    if(token && role === "admin"){
      setRender(true)
    }
    else{
      navigate("/login")
    }    
  }, [navigate, role, token])


  const location = useLocation();
  return (
    <>

    {render ? <><AdminNavbar />
          <motion.main
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
