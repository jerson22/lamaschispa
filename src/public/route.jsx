import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout"
import Home from "./pages/home"
import Vestidos from "./pages/Vestidos"

export default function App() {
   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<Layout />}>
               <Route index element={<Home />} />
               <Route path="/vestidos" element={<Vestidos />} />
            </Route>
         </Routes>
      </BrowserRouter>
   )
}