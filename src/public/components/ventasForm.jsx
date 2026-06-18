import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';

export default function VentasForm() {
   const { id } = useParams();
   const [productos, setProductos] = useState([]);

   const [ventasForm, setVentasForm] = useState({
      name: '',
      productId: '',
      bolso: false,
      aretes: false,
      ajuste: false,
      fechaAjuste: '',
      fechaRenta: '',
      fechaEntrega: '',
      fechaDevolucion: '',
      anticipoEfectivo: '',
      anticipoTarjeta: '',
      pendienteEfectivo: '',
      pendienteTarjeta: '',
      liquidado: false,
      notas: '',
      telefono: '',
      bastilla: '',
      busto: '',
      tirantes: '',
      mangaPuno: '',
      cintura: '',
      espalda: ''
   });
   const [loading, setLoading] = useState(true);
   const [uploading, setUploading] = useState(false);
   const [error, setError] = useState(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [editandoFlag, setEditandoFlag] = useState(false);
   
   // NUEVOS ESTADOS PARA EL BUSCADOR DE PRODUCTOS CON IMAGEN
   const [productSearch, setProductSearch] = useState('');
   const [showDropdown, setShowDropdown] = useState(false);
   const [selectedProduct, setSelectedProduct] = useState(null);

   // Estados para token y navigate
   const navigate = useNavigate();
   const { token } = useOutletContext();



   useEffect(() => {
      const fetchVenta = async () => {
         // solo buscamos si hay ID (modo edición)
         if(!id) return;

         try{
            const response = await fetch(`/api/renta/${id}`, {
               headers: {'auth-token': token}
            });
            if (!response.ok) {
               throw new Error('No se pudo cargar la venta');
            }
            const data = await response.json();
            // console.log('Respuesta de Venta: ', data);
            // rellenar el formulario si hay datos
            setVentasForm({
               name:data.name || '',
               productId: data.productId || '',
               bolso: data.bolso === "1",
               aretes: data.aretes === "1",
               ajuste: data.ajuste === "1",
               fechaAjuste: data.fechaAjuste ? data.fechaAjuste.split('T')[0] : '',
               fechaRenta: data.fechaRenta ? data.fechaRenta.split('T')[0] : '',
               fechaEntrega: data. fechaEntrega ? data.fechaEntrega.split('T')[0] : '',
               fechaDevolucion: data. fechaDevolucion ? data.fechaDevolucion.split('T')[0] : '',
               anticipoEfectivo: data.anticipoEfectivo || '',
               anticipoTarjeta: data.anticipoTarjeta || '',
               pendienteEfectivo: data.pendienteEfectivo || '',
               pendienteTarjeta: data.pendienteTarjeta || '',
               liquidado: data.liquidado === "1",
               notas: data.notas || '',
               telefono: data.telefono || '',
               bastilla: data.bastilla || '',
               busto: data.busto || '',
               tirantes: data.tirantes || '',
               mangaPuno: data.mangaPuno || '',
               cintura: data.cintura || '',
               espalda: data.espalda || '',
            });
            setEditandoFlag(true);
         }catch(err){
            console.error('Error fetching ventas:', err);
            setError('Error al cargar ventas');
         }
      };
      fetchProductos();
      fetchVenta();
   }, [id, token]);

   // Este se dispara cuando cambia el productId (que viene de la BD) o la lista de productos
   useEffect(() => {
      if (ventasForm.productId && productos.length > 0) {
         const p = productos.find(prod => prod.id === Number(ventasForm.productId));
         if (p) {
            setSelectedProduct(p);
            setProductSearch(p.name);
         }
      }
   }, [ventasForm.productId, productos]);

   // Traer Productos para el input Producto
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

// Manejar cuando cambia el formulario
const handleVentasChange = (e) => {
   const { name, value, type, checked } = e.target;

   // Interceptamos específicamente el campo 'ajuste'
   if (name === 'ajuste') {
      if (!checked) {
         // SI SE DESMARCA: Desactivamos el ajuste y limpiamos todas las medidas a vacías
         setVentasForm((prev) => ({
            ...prev,
            ajuste: false,
            bastilla: '',
            busto: '',
            tirantes: '',
            mangaPuno: '',
            cintura: '',
            espalda: ''
         }));
      } else {
         // SI SE MARCA: Solo activamos el ajuste (mantiene los datos existentes si venían del update)
         setVentasForm((prev) => ({
            ...prev,
            ajuste: true
         }));
      }
   } else {
      // LÓGICA ORIGINAL: Para cualquier otro input (texto, números u otros checkboxes)
      setVentasForm((prev) => ({ 
         ...prev, 
         [name]: type === 'checkbox' ? checked : value 
      }));
   }
};

   // FUNCIÓN CUANDO SE SELECCIONA UN PRODUCTO DEL DESPLEGABLE Productos
   const handleSelectProduct = (producto) => {
      setVentasForm({
         ...ventasForm,
         productId: producto.id // Guarda el ID numérico en tu formulario original
      });
      setProductSearch(producto.name); // Muestra el nombre en el input de búsqueda
      setSelectedProduct(producto); // Guarda el objeto para renderizar la foto
      setShowDropdown(false); // Cierra el menú
   };

   // Para envio de Formulario
   const handleVentaSubmit = async (e) => {
      e.preventDefault();
      
      // 1. Determinar si estamos editando o creando
      const isEditing = !!id; // Esto es true si existe id, false si es undefined
      const url = isEditing ? `/api/ventas/${id}` : '/api/ventas';
      const method = isEditing ? 'PUT' : 'POST';

      try {
         const body = {
            name: ventasForm.name,
            productId: Number(ventasForm.productId),
            bolso: ventasForm.bolso ? "1" : "0", // Convertimos bool a "1"/"0" para tu BD
            aretes: ventasForm.aretes ? "1" : "0",
            ajuste: ventasForm.ajuste ? "1" : "0",
            fechaAjuste: ventasForm.fechaAjuste || null,
            fechaRenta: ventasForm.fechaRenta,
            fechaEntrega: ventasForm.fechaEntrega,
            fechaDevolucion: ventasForm.fechaDevolucion,
            anticipoEfectivo: Number(ventasForm.anticipoEfectivo),
            pendienteEfectivo: Number(ventasForm.pendienteEfectivo),
            anticipoTarjeta: Number(ventasForm.anticipoTarjeta),
            pendienteTarjeta: Number(ventasForm.pendienteTarjeta),
            liquidado: ventasForm.liquidado ? "1" : "0",
            notas: ventasForm.notas,
            telefono: ventasForm.telefono,
            bastilla: ventasForm.bastilla,
            busto: ventasForm.busto,
            tirantes: ventasForm.tirantes,
            mangaPuno: ventasForm.mangaPuno,
            cintura: ventasForm.cintura,
            espalda: ventasForm.espalda
         };

         const response = await fetch(url, {
            method: method,
            headers: {
               'Content-Type': 'application/json',
               'auth-token': token
            },
            body: JSON.stringify(body)
         });

         if (!response.ok) throw new Error('Error al guardar la venta');

         alert(isEditing ? 'Venta actualizada correctamente' : 'Venta registrada correctamente');
         
         // Si fue una creación, limpiamos el form
         if (!isEditing) {
            setVentasForm({ 
               name: '',
               productId: '',
               bolso: false,
               aretes: false,
               ajuste: false,
               fechaAjuste: '',
               fechaRenta: '',
               fechaEntrega: '',
               fechaDevolucion: '',
               anticipoEfectivo: '',
               anticipoTarjeta: '',
               pendienteEfectivo: '',
               pendienteTarjeta: '',
               liquidado: false,
               notas: '',
               telefono: '',
               bastilla: '',
               busto: '',
               tirantes: '',
               mangaPuno: '',
               cintura: '',
               espalda: ''
            });
            setProductSearch('');
            setSelectedProduct(null);
         } else {
            // Si fue edición, podrías redirigir al listado o simplemente dejar el form tal cual
            navigate('/admin/rentas'); 
         }

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
            {editandoFlag ? <h2>Tarjeta #{id}</h2> : <h2>Nueva Venta</h2>}
            <form onSubmit={handleVentaSubmit} className="admin-form">
               
               <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  {/* columna izquierda */}
                  <div style={{ flex: '0 0 calc(60% - 10px)' }}>
                     <div className="input-group">
                        <label>Cliente</label>
                        <input type="text" name="name" value={ventasForm.name} onChange={handleVentasChange} required />
                     </div>
                     <div className="input-group">
                        <label> Teléfono</label>
                        <input type="text" name="telefono" value={ventasForm.telefono} onChange={handleVentasChange} required />
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
                        <input type="date" name="fechaAjuste" value={ventasForm.fechaAjuste} onChange={handleVentasChange} style={{ flex: 1 }} />
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
               {/* Seccion de ajustes */}
               {ventasForm.ajuste && (
                  <>
                     <div style={{display: 'flex', gap:'30px', marginBottom: '30px'}}>
                        <div>
                           <label>Bastilla</label>
                           <input type="text" name="bastilla" value={ventasForm.bastilla} onChange={handleVentasChange} />
                           <label>Busto</label>
                           <input type="text" name="busto" value={ventasForm.busto} onChange={handleVentasChange} />
                        </div>
                        <div>
                           <label>Tirantes</label>
                           <input type="text" name="tirantes" value={ventasForm.tirantes} onChange={handleVentasChange} />
                           <label>Manga/Puño</label>
                           <input type="text" name="mangaPuno" value={ventasForm.mangaPuno} onChange={handleVentasChange} />
                        </div>
                        <div>
                           <label>Cintura</label>
                           <input type="text" name="cintura" value={ventasForm.cintura} onChange={handleVentasChange} />
                           <label>Espalda</label>
                           <input type="text" name="espalda" value={ventasForm.espalda} onChange={handleVentasChange} />
                        </div>
                     </div>
                  </>
               )}

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
                  <button type="submit" className="save-btn">
                     {editandoFlag ? 'Guardar Cambios' : 'Registrar Renta' }
                  </button>
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
