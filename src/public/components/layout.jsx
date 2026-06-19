import { Outlet, Link, useLocation } from "react-router-dom";
import { FaTiktok, FaInstagram, FaFacebookF, FaWhatsapp } from 'react-icons/fa'
import { AiFillTikTok } from "react-icons/ai";
import { useState, useEffect } from "react";
import { NavLink } from 'react-router-dom';

export default function Layout() {
   const location = useLocation();
   const [open, setOpen] = useState(false);
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [isAdmin, setIsAdmin] = useState(false);

   useEffect(() => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      setIsLoggedIn(!!token);
      try {
         const parsed = user ? JSON.parse(user) : null;
         setIsAdmin(parsed?.rol === 'admin');
      } catch {
         setIsAdmin(false);
      }
   }, [location]);

   return (
      <>
         <nav className="navbar">
            <div className="nav-left">
               <NavLink to="/">
                  <img src="/images/logo.png" alt="" width="200" height="auto" />
               </NavLink>
               <NavLink to="https://www.tiktok.com/@lamaschispa?_t=8sNw0oVLf1R&_r=1" target="_blank"><FaTiktok className="fa-icon" /></NavLink>
               <NavLink to="https://www.instagram.com/lamaschispa/profilecard/?igsh=emdmdXV3bm9vcW0=" target="_blank"><FaInstagram className="fa-icon" /></NavLink>
               <NavLink to="https://www.facebook.com/share/15crZa7MWF/?mibextid=wwXIfr" target="_blank"><FaFacebookF className="fa-icon" /></NavLink>
               <NavLink to="https://wa.me/528120281520" target="_blank"><FaWhatsapp className="fa-icon" /></NavLink>
            </div>
            {/* Boton toggle */}
            <button className="hamburger" onClick={() => setOpen(!open)}>
               ☰
            </button>
            <div className={`nav-right ${open ? "open" : ""}`}>
               <Link to="/" onClick={() => setOpen(false)}>Quiénes Somos</Link>
               <Link to="/vestidos" onClick={() => setOpen(false)}>Vestidos</Link>
               <Link to="/accesorios" onClick={() => setOpen(false)}>Accesorios</Link>
               {isAdmin ? (
                  <>
                     {/* <Link to="/rentas" onClick={() => setOpen(false)}>Rentas</Link> */}
                     <Link to="/admin" onClick={() => setOpen(false)} style={{ color: '#db2777', fontWeight: 'bold' }}>Admin</Link>
                  </>
               ) : (
                  <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
               )}
            </div>
         </nav>
         <div>
            <Outlet />
         </div>
      </>
   )
}