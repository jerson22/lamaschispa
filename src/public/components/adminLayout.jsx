import { Outlet, Link, useNavigate } from "react-router-dom";

export default function AdminLayout() {
    const navigate = useNavigate();
    const logout = () => {
      localStorage.clear();
      navigate('/');
    };

    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
         {/* SEGUNDA BARRA DE NAVEGACIÓN (Exclusiva de Admin) */}
         <aside className="aside-sidebar">
            <h2>Panel Admin</h2>
            <nav className="admin-nav">
               {/* Quitamos los estilos inline para manejarlos limpiamente desde el CSS */}
               <Link to="/admin">Nueva Renta</Link>
               <Link to="/admin/rentas">Rentas</Link>
               <Link to="/admin/nuevo-cliente">Nuevo Cliente</Link>
               <Link to="/admin/inventario">Inventario</Link>
               
               <button onClick={logout} className="logout-btn">Cerrar Sesión</button>
            </nav>
         </aside>

         {/* CONTENEDOR DINÁMICO DEL ADMIN */}
         <main style={{ flex: 1, padding: "20px" }}>
            <Outlet /> 
         </main>

         {/* CSS MEJORADO Y CORREGIDO */}
         <style>{`
            .aside-sidebar {
               width: 220px; 
               background: #fff4fb; 
               color: #1f2937; 
               padding: 24px 16px;
               position: sticky;      
               top: 90px; /* 1. Cambiado de 0 a 90px para que respete tu barra superior */
               height: calc(100vh - 90px); /* 2. Restamos los 90px para que encaje perfecto en la pantalla */
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
               color: #db2777; /* Tono rosa oscuro elegante */
               font-weight: 700;
            }

            .admin-nav {
               display: flex;
               flex-direction: column;
               gap: 8px;
               flex: 1; /* 3. Cambiado a flex:1 para asegurarse de que use el espacio disponible */
               box-sizing: border-box;
            }

            /* 🎯 AQUÍ QUITAMOS EL SUBRAYADO Y DISEÑAMOS LOS LINKS */
            .admin-nav a {
               color: #4b5563;           /* Gris oscuro más moderno que el negro puro */
               text-decoration: none;    /* ¡ESTO QUITA EL SUBRAYADO! */
               padding: 10px 12px;
               border-radius: 8px;
               font-weight: 500;
               font-size: 0.95rem;
               transition: all 0.2s ease-in-out;
            }

            /* Efecto cuando pasas el mouse sobre los enlaces */
            .admin-nav a:hover {
               background-color: #fce7f3; /* Fondo rosa sutil */
               color: #db2777;            /* Texto rosa oscuro */
               padding-left: 16px;        /* Pequeño efecto de desplazamiento */
            }

            .logout-btn {
               background: #4b5563;
               color: white;
               border: none;
               padding: 10px 15px;
               border-radius: 8px;
               cursor: pointer;
               margin-top: auto; /* Sigue empujando el botón al fondo */
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