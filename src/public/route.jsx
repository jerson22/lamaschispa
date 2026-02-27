import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout"
import Home from "./pages/home"
import Vestidos from "./pages/Vestidos"
import Login from "./pages/Login"
import Admin from "./pages/Admin"
import Accesorios from "./pages/accesorios"

export default function App() {
   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<Layout />}>
               <Route index element={<Home />} />
               <Route path="/vestidos" element={<Vestidos />} />
               <Route path="/accesorios" element={<Accesorios />} />
               <Route path="/login" element={<Login />} />
               <Route path="/admin" element={<Admin />} />
            </Route>
         </Routes>
      </BrowserRouter>
   )
}