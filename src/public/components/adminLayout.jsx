import { Outlet, useNavigate, NavLink } from "react-router-dom"; // Limpiamos los imports duplicados
import React, { useEffect } from 'react';

export default function AdminLayout() {

   const navigate = useNavigate();
   const token = localStorage.getItem('token');

   const clearSession = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
   };

   const validateToken = async () => {
      try {
         const response = await fetch('/auth/validate', {
            headers: { 'auth-token': token }
         });

         if (response.status === 401 || response.status === 403) {
            clearSession();
            return false;
         }

         return response.ok;
      } catch (err) {
         console.error('Error validating token:', err);
         return false;
      }
   };

   useEffect(() => {
      const storedUser = localStorage.getItem('user');
      let parsedUser = null;
      try {
         parsedUser = storedUser ? JSON.parse(storedUser) : null;
      } catch {
         parsedUser = null;
      }

      if (!token || !parsedUser || parsedUser.rol !== 'admin') {
         clearSession();
         return;
      }

      validateToken();
   }, [token, navigate]);

    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
         {/* SEGUNDA BARRA DE NAVEGACIÓN (Exclusiva de Admin) */}
         <aside className="aside-sidebar">
            <h2>Panel Admin</h2>
            <nav className="admin-nav">
               {/* 1. Agregamos 'end' aquí para que no se quede prendido siempre */}
               <NavLink to="/admin" end>Nueva Renta</NavLink>
               <NavLink to="/admin/rentas">Rentas</NavLink>
               <NavLink to="/admin/nuevo-cliente">Nuevo Cliente</NavLink>
               <NavLink to="/admin/inventario">Inventario</NavLink>

               <button onClick={clearSession} className="logout-btn">Cerrar Sesión</button>
            </nav>
         </aside>

         {/* CONTENEDOR DINÁMICO DEL ADMIN */}
         <main style={{ flex: 1, padding: "20px" }}>
            <Outlet context={{ token }} /> 
         </main>

         {/* CSS MEJORADO Y CORREGIDO */}
         <style>{`
            .aside-sidebar {
               width: 180px; 
               background: #fff4fb; 
               color: #1f2937; 
               padding: 24px 16px;
               position: sticky;      
               top: 90px; 
               height: calc(100vh - 90px); 
               box-sizing: border-box;
               border-right: 1px solid #f3e8ff;
               display: flex;
               flex-direction: column;
               gap: 20px;
            }

            .aside-sidebar h2 {
               font-size: 1.2rem;
               margin: 0;
               padding-left: 12px;
               color: #db2777; 
               font-weight: 700;
            }

            .admin-nav {
               display: flex;
               flex-direction: column;
               gap: 8px;
               flex: 1; 
               box-sizing: border-box;
            }

            .admin-nav a {
               color: #4b5563;           
               text-decoration: none;    
               padding: 10px 12px;
               border-radius: 8px;
               font-weight: 500;
               font-size: 0.95rem;
               transition: all 0.2s ease-in-out;
            }

            .admin-nav a:hover {
               background-color: #fce7f3; 
               color: #db2777;            
               padding-left: 16px;        
            }
            
            /* 2. CORREGIDO: Ahora apunta correctamente al enlace activo */
            .admin-nav a.active {
               background-color: #fce7f3; 
               color: #db2777;            
               font-weight: bold;
               padding-left: 16px;        
            }

            .logout-btn {
               background: #4b5563;
               color: white;
               border: none;
               padding: 10px 15px;
               border-radius: 8px;
               cursor: pointer;
               margin-top: auto; 
               font-weight: 500;
               transition: background 0.2s ease;
            }

            .logout-btn:hover {
               background: #db2777;
            }
         `}</style>
      </div>
    );
}