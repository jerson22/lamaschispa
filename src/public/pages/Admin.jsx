import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
   const [productos, setProductos] = useState([]);

   const [ventasForm, setVentasForm] = useState({
      name: '',
      productId: '',
      bolso: false,
      aretes: false,
      ajuste: false,
      fechaAjustes: '',
      fechaRenta: '',
      fechaEntrega: '',
      fechaDevolucion: '',
      anticipoEfectivo: '',
      anticipoTarjeta: '',
      pendienteEfectivo: '',
      pendienteTarjeta: '',
      liquidado: false,
      notas: '',
   });
   const [loading, setLoading] = useState(true);
   const [uploading, setUploading] = useState(false);
   const [error, setError] = useState(null);
   const [searchTerm, setSearchTerm] = useState('');
   
   // NUEVOS ESTADOS PARA EL BUSCADOR DE PRODUCTOS CON IMAGEN
   const [productSearch, setProductSearch] = useState('');
   const [showDropdown, setShowDropdown] = useState(false);
   const [selectedProduct, setSelectedProduct] = useState(null);

   const navigate = useNavigate();
   const token = localStorage.getItem('token');

   const clearSession = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
   };

   const handleAuthError = (response) => {
      if (response.status === 401 || response.status === 403) {
         clearSession();
         return true;
      }
      return false;
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
      fetchProductos();
   }, [token, navigate]);

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

   const fetchProductos = async () => {
      try {
         const response = await fetch('/api/productos');
         
         if (!response.ok) {
            console.error('Error fetching productos:', response.status);
            setProductos([]);
            setLoading(false);
            return;
         }
         
         const data = await response.json();
         setProductos(Array.isArray(data) ? data : []);
      } catch (err) {
         console.error('Error en fetchProductos:', err);
         setError('Error al cargar productos');
         setProductos([]);
      } finally {
         setLoading(false);
      }
   };

   const handleVentasChange = (e) => {
      const { name, value, type, checked } = e.target;
      setVentasForm({ 
         ...ventasForm, 
         [name]: type === 'checkbox' ? checked : value 
      });
   };

   // FUNCIÓN CUANDO SE SELECCIONA UN PRODUCTO DEL DESPLEGABLE
   const handleSelectProduct = (producto) => {
      setVentasForm({
         ...ventasForm,
         productId: producto.id // Guarda el ID numérico en tu formulario original
      });
      setProductSearch(producto.name); // Muestra el nombre en el input de búsqueda
      setSelectedProduct(producto); // Guarda el objeto para renderizar la foto
      setShowDropdown(false); // Cierra el menú
   };

   const handleVentaSubmit = async (e) => {
      e.preventDefault();
      try {
         const body = {
            name: ventasForm.name,
            productId: Number(ventasForm.productId),
            bolso: ventasForm.bolso,
            aretes: ventasForm.aretes,
            ajuste: ventasForm.ajuste,
            fechaAjustes: ventasForm.fechaAjustes || null,
            fechaRenta: ventasForm.fechaRenta,
            fechaEntrega: ventasForm.fechaEntrega,
            fechaDevolucion: ventasForm.fechaDevolucion,
            anticipoEfectivo: Number(ventasForm.anticipoEfectivo),
            pendienteEfectivo: Number(ventasForm.pendienteEfectivo),
            anticipoTarjeta: Number(ventasForm.anticipoTarjeta),
            pendienteTarjeta: Number(ventasForm.pendienteTarjeta),
            liquidado: ventasForm.liquidado,
            notas: ventasForm.notas
         };

         const response = await fetch('/api/ventas', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'auth-token': token
            },
            body: JSON.stringify(body)
         });

         if (!response.ok) {
            const text = await response.text();
            try {
               const data = JSON.parse(text);
               throw new Error(data.error || 'No se pudo crear la venta');
            } catch (parseErr) {
               console.error('Error response:', text);
               throw new Error('Error del servidor al crear la venta');
            }
         }

         setVentasForm({
            name: '',
            productId: '',
            bolso: false,
            aretes: false,
            ajuste: false,
            fechaAjustes: '',
            fechaRenta: '',
            fechaEntrega: '',
            fechaDevolucion: '',
            anticipoEfectivo: '',
            anticipoTarjeta: '',
            pendienteEfectivo: '',
            pendienteTarjeta: '',
            liquidado: false,
            notas: '',
         });
         
         // Limpiar estados extras del buscador
         setProductSearch('');
         setSelectedProduct(null);

         alert('Venta registrada correctamente');
      } catch (err) {
         alert(err.message);
      }
   };

   if (loading) return <div className="admin-msg">Cargando panel...</div>;

   // Filtrado dinámico en tiempo real para las sugerencias del desplegable
   const sugerenciasProductos = productos.filter((p) => {
      const term = productSearch.toLowerCase();
      return (
         p.name.toLowerCase().includes(term) ||
         p.id.toString().includes(term) ||
         (p.talla && p.talla.toLowerCase().includes(term))
      );
   });

   return (
      <div className="admin-container">
         <section className="form-section container">
            <h2>Registrar Renta / Compra</h2>
            <form onSubmit={handleVentaSubmit} className="admin-form">
               
               <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  {/* columna izquierda */}
                  <div style={{ flex: '0 0 calc(60% - 10px)' }}>
                     <div className="input-group">
                        <label>Cliente</label>
                        <input type="text" name="name" value={ventasForm.name} onChange={handleVentasChange} required />
                     </div>
                     
                     {/* NUEVO INPUT DE PRODUCTO INTERACTIVO */}
                     <div className="input-group" style={{ position: 'relative' }}>
                        <label>Producto (Escribe para buscar)</label>
                        <input 
                           type="text" 
                           placeholder="Buscar por nombre, ID o talla..." 
                           value={productSearch} 
                           onChange={(e) => {
                              setProductSearch(e.target.value);
                              setShowDropdown(true);
                           }}
                           onFocus={() => setShowDropdown(true)}
                           required
                        />
                        
                        {/* Menú desplegable con los resultados de la base de datos */}
                        {showDropdown && productSearch.length > 0 && (
                           <div className="dropdown-productos">
                              {sugerenciasProductos.length > 0 ? (
                                 sugerenciasProductos.map((p) => (
                                    <div 
                                       key={p.id} 
                                       className="dropdown-item-producto"
                                       onClick={() => handleSelectProduct(p)}
                                    >
                                       {/* Ajusta p.imagen o la propiedad de tu BD donde guardes la URL de la foto */}
                                       <img 
                                          src={p.imagenes && p.imagenes[0] ? `/images/${p.imagenes[0]}` : 'https://via.placeholder.com/40x50?text=No+Img'}
                                          alt={p.name} 
                                       />
                                       <div>
                                          <strong>{p.name}</strong>
                                          <span>ID: {p.id} {p.talla ? `| Talla: ${p.talla}` : ''}</span>
                                       </div>
                                    </div>
                                 ))
                              ) : (
                                 <div style={{ padding: '10px', color: '#888', fontSize: '0.9rem' }}>
                                    No se encontraron productos
                                 </div>
                              )}
                           </div>
                        )}
                     </div>

                     {/* VISTA PREVIA: Se muestra solo si ya se seleccionó un producto */}
                     {selectedProduct && (
                        <div className="producto-preview-box">
                           {console.log(selectedProduct.imagenes)}
                           <img 
                              src={selectedProduct.imagenes && selectedProduct.imagenes[0] ? `/images/${selectedProduct.imagenes[0]}` : 'https://via.placeholder.com/100x130?text=No+Foto'} 
                              alt="Vista previa" 
                           />
                           <div className="preview-details">
                              <h4>{selectedProduct.name}</h4>
                              {/* <p><strong>ID Seleccionado:</strong> {selectedProduct.id}</p> */}
                              {selectedProduct.talla && <p><strong>Talla:</strong> {selectedProduct.talla}</p>}
                              {selectedProduct.precio_vestido && <p><strong>Precio Vestido:</strong> ${selectedProduct.precio_vestido}</p>}
                              {selectedProduct.precio_renta && <p><strong>Precio Renta:</strong> ${selectedProduct.precio_renta}</p>}
                              {selectedProduct.precio_venta && <p><strong>Precio Venta:</strong> ${selectedProduct.precio_venta}</p>}
                           </div>
                        </div>
                     )}

                     <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px', marginTop: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', cursor: 'pointer', margin: 0 }}>
                           <input type="checkbox" name="bolso" checked={ventasForm.bolso} onChange={handleVentasChange} />
                           Bolso
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', cursor: 'pointer', margin: 0 }}>
                           <input type="checkbox" name="aretes" checked={ventasForm.aretes} onChange={handleVentasChange} />
                           Aretes
                        </label>
                     </div>
                     <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', cursor: 'pointer', margin: 0 }}>
                           <input type="checkbox" name="ajuste" checked={ventasForm.ajuste} onChange={handleVentasChange} />
                           Ajustes
                        </label>
                        <input type="date" name="fechaAjustes" value={ventasForm.fechaAjustes} onChange={handleVentasChange} style={{ flex: 1 }} />
                     </div>
                  </div>
                  
                  {/* columna derecha */}
                  <div style={{ flex: '0 0 calc(40% - 10px)' , display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     <div className="input-group">
                        <label>Fecha de Renta</label>
                        <input type="date" name="fechaRenta" value={ventasForm.fechaRenta} onChange={handleVentasChange} required />
                     </div>
                     <div className="input-group">
                        <label>Fecha de Entrega</label>
                        <input type="date" name="fechaEntrega" value={ventasForm.fechaEntrega} onChange={handleVentasChange} />
                     </div>
                     <div className="input-group">
                        <label>Fecha de Devolucion</label>
                        <input type="date" name="fechaDevolucion" value={ventasForm.fechaDevolucion} onChange={handleVentasChange} />
                     </div>
                  </div>
               </div>
               
               {/* FILA 2: Notas */}
               <div style={{ marginBottom: '20px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>Notas</label>
                  <textarea name="notas" value={ventasForm.notas} onChange={handleVentasChange} placeholder="Opcional" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', minHeight: '80px', fontFamily: 'inherit' }} />
               </div>
               
               {/* FILA 3: Anticipo y Total */}
               <div style={{ display: 'flex', gap: '20px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
                  <div style={{ flex: '1' }} className="input-groupA">
                     <h3>Anticipo</h3>
                     <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>Efectivo</label>
                     <input type="number" name="anticipoEfectivo" value={ventasForm.anticipoEfectivo} onChange={handleVentasChange} />
                     <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>Tarjeta</label>
                     <input type="number" name="anticipoTarjeta" value={ventasForm.anticipoTarjeta} onChange={handleVentasChange} />
                  </div>
                  <div style={{ flex: '1' }} className="input-groupA">
                     <h3>{selectedProduct ? `Pendiente $${Number(selectedProduct.precio_renta) - Number(ventasForm.anticipoEfectivo) - Number(ventasForm.anticipoTarjeta)}` : 'Pendiente'}</h3>
                     <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>Efectivo</label>
                     <input type="number" name="pendienteEfectivo" value={ventasForm.pendienteEfectivo} onChange={handleVentasChange} />
                     <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>Tarjeta</label>
                     <input type="number" name="pendienteTarjeta" value={ventasForm.pendienteTarjeta} onChange={handleVentasChange} />
                  </div>
                  <div>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', cursor: 'pointer', margin: 0 }}>
                        <input type="checkbox" name="liquidado" checked={ventasForm.liquidado} onChange={handleVentasChange} />
                        Liquidado
                     </label>
                  </div>
               </div>
               
               <div className="form-actions">
                  <button type="submit" className="save-btn">Registrar renta / compra</button>
               </div>
            </form>
         </section>

         {/* CERRAR DROPDOWN SI SE HACE CLICK FUERA */}
         {showDropdown && (
            <div 
               style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }} 
               onClick={() => setShowDropdown(false)} 
            />
         )}

         <style>{`
            .input-groupA {
               border: 1px solid #6d6d6d;
               padding: 15px;
               border-radius: 10px;
            }
            .admin-container {
               max-width: 1000px;
               margin: 10px auto;
               padding: 10px;
            }
            .form-section {
               background: white;
               padding: 30px;
               border-radius: 15px;
               box-shadow: 0 4px 15px rgba(0,0,0,0.05);
               margin-bottom: 40px;
            }
            
            /* NUEVOS ESTILOS PARA EL DESPLEGABLE DE PRODUCTOS */
            .dropdown-productos {
               position: absolute;
               top: 100%;
               left: 0;
               width: 100%;
               background: white;
               border: 1px solid #ddd;
               border-radius: 8px;
               box-shadow: 0 8px 24px rgba(0,0,0,0.15);
               max-height: 250px;
               overflow-y: auto;
               z-index: 10;
            }
            .dropdown-item-producto {
               display: flex;
               align-items: center;
               padding: 8px 12px;
               cursor: pointer;
               border-bottom: 1px solid #f5f5f5;
               transition: background 0.2s;
            }
            .dropdown-item-producto:hover {
               background: #fdf2f8;
            }
            .dropdown-item-producto img {
               width: 80px;
               height: 100px;
               object-fit: cover;
               border-radius: 4px;
               margin-right: 12px;
            }
            .dropdown-item-producto div {
               display: flex;
               flex-direction: column;
            }
            .dropdown-item-producto strong {
               font-size: 0.95rem;
               color: #333;
            }
            .dropdown-item-producto span {
               font-size: 0.8rem;
               color: #777;
            }

            /* ESTILOS PARA LA TARJETA DE VISTA PREVIA */
            .producto-preview-box {
               display: flex;
               align-items: center;
               gap: 15px;
               background: #fdf2f8;
               border: 1px dashed #db2777;
               padding: 12px;
               border-radius: 10px;
               margin-top: 15px;
            }
            .producto-preview-box img {
               width: 150px;
               height: 200px;
               object-fit: cover;
               border-radius: 6px;
               box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .preview-details h4 {
               margin: 0 0 5px 0;
               color: #db2777;
               font-size: 1.05rem;
            }
            .preview-details p {
               margin: 2px 0;
               font-size: 0.9rem;
               color: #555;
            }

            .admin-form label {
               display: block;
               font-size: 0.9rem;
               font-weight: bold;
               margin-bottom: 5px;
               color: #555;
            }
            .admin-form input:not([type="radio"]), .admin-form textarea {
               width: 100%;
               padding: 10px;
               border: 1px solid #ddd;
               border-radius: 8px;
               outline: none;
               box-sizing: border-box;
            }
            .form-actions {
               margin-top: 25px;
               display: flex;
               gap: 10px;
            }
            .save-btn {
               background: #db2777;
               color: white;
               border: none;
               padding: 12px 25px;
               border-radius: 8px;
               font-weight: bold;
               cursor: pointer;
            }
            @media (max-width: 768px) {
               .admin-container { margin: 20px auto; padding: 10px; }
               .form-section { padding: 20px; }
               .save-btn { width: 100%; }
            }
               /* Modifica esta regla para excluir también los checkboxes */
            .admin-form input:not([type="radio"]):not([type="checkbox"]), .admin-form textarea {
               width: 100%;
               padding: 10px;
               border: 1px solid #ddd;
               border-radius: 8px;
               outline: none;
               box-sizing: border-box;
            }

            /* Agrega esta nueva regla abajo para domar a Safari */
            .admin-form input[type="checkbox"] {
               width: auto;
               max-width: 18px;
               height: 18px;
               margin: 0;
               cursor: pointer;
            }
         `}</style>
      </div>
   );
};

export default Admin;