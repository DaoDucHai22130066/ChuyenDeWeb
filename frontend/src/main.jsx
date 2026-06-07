import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
<<<<<<< HEAD
import axios from 'axios'

// send cookies by default so backend httpOnly auth cookie works
axios.defaults.withCredentials = true
=======
>>>>>>> hai
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import './styles/theme.css'
import './styles/components.css'
import 'react-toastify/dist/ReactToastify.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <BrowserRouter>
    <CartProvider>
      <WishlistProvider>
        <App />
      </WishlistProvider>
    </CartProvider>
  </BrowserRouter>
  </StrictMode>
)
