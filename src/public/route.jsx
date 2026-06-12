import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout"
import AdminLayout from "./components/adminLayout"
//Páginas Publicas
import Home from "./pages/home"
import Vestidos from "./pages/Vestidos"
import Login from "./pages/Login"
import Accesorios from "./pages/accesorios"
import Producto from "./pages/producto"
// import Rentas from "./pages/Rentas"
//pagina de administrador
import Admin from "./pages/Admin"
//sub paginas de administrador
import NewClient from "./pages/admin/newClient"
import Inventario from "./pages/admin/inventario"
import RentasAdmin from "./pages/admin/rentas"

export default function App() {
   return (
      <BrowserRouter>
         <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Layout />}>
               <Route index element={<Home />} />
               <Route path="/vestidos" element={<Vestidos />} />
               <Route path="/accesorios" element={<Accesorios />} />
               <Route path="/login" element={<Login />} />
               {/* <Route path="/rentas" element={<Rentas />} /> */}
               <Route path="/producto/:id" element={<Producto />} />
               {/* <Route path="/admin" element={<Admin />} /> */}
               {/* SUBRUTAS DE ADMIN: Ahora son hijas de Layout también */}
               {/* Al estar aquí dentro, conservan la Navbar del público */}
               <Route path="admin" element={<AdminLayout />}>
                  {/* Cuando entren a /admin, se verá la Navbar pública + Navbar admin + la página Admin */}
                  <Route index element={<Admin />} />
                  <Route path="nuevo-cliente" element={<NewClient />} />
                  <Route path="inventario" element={<Inventario />} />
                  <Route path="rentas" element={<RentasAdmin />} />
                  {/* Si mañana creas /admin/inventario, también conservará ambas navbars:
                  <Route path="inventario" element={<Inventario />} /> */}
               </Route>
            </Route>
         </Routes>
      </BrowserRouter>
   )
}