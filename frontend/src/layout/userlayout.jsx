import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from 'framer-motion';
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import { ToastContainer } from 'react-toastify';

export default function userLayout() {
  const location = useLocation();
  return (
    <>
          <Navbar />
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.main>
          <Footer />
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
