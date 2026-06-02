import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
   const [productos, setProductos] = useState([]);
   const [clientes, setClientes] = useState([]);
   const [form, setForm] = useState({
      id: null,
      name: '',
      precio_venta: '',
      precio_renta: '',
      silueta: '',
      mangas: '',
      color: '',
      talla: '',
      imagenes: [''],
      descripcion: '',
      vestido: true
   });
   const [clientForm, setClientForm] = useState({
      nombre: '',
      telefono: '',
      email: '',
      direccion: ''
   });
   const [reserveForm, setReserveForm] = useState({
      clienteId: '',
      fechaEvento: '',
      fechaEntrega: '',
      fechaDevolucion: '',
      estado: 'pendiente_medidas',
      total: '',
      tipo: 'renta',
      items: [
         { productoId: '', cantidad: 1, rol: 'vestido', estadoItem: 'pendiente', precioUnitario: '', notas: '' }
      ]
   });
   const [loading, setLoading] = useState(true);
   const [uploading, setUploading] = useState(false);
   const [error, setError] = useState(null);
   const [searchTerm, setSearchTerm] = useState('');
   const navigate = useNavigate();
   const token = localStorage.getItem('token');

   // Función para limpiar sesión
   const clearSession = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
   };

   // Función para verificar si la respuesta es un error de autenticación
   const handleAuthError = (response) => {
      if (response.status === 401 || response.status === 403) {
         clearSession();
         return true;
      }
      return false;
   };

   useEffect(() => {
      // Verificar si hay token y si es admin
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

      // Validar que el token siga siendo válido en el servidor
      validateToken();
      fetchProductos();
      fetchClientes();
   }, [token, navigate]);

   // Función para validar el token con el servidor
   const validateToken = async () => {
      try {
         const response = await fetch('/auth/validate', {
            headers: { 'auth-token': token }
         });

         if (response.status === 401 || response.status === 403) {
            // Token inválido, expirado o no autorizado
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

   const fetchClientes = async () => {
      try {
         const response = await fetch('/api/clientes', {
            headers: { 'auth-token': token }
         });
         
         if (handleAuthError(response)) return;
         
         if (!response.ok) {
            console.error('Error fetching clientes:', response.status);
            setClientes([]);
            return;
         }
         
         const data = await response.json();
         setClientes(Array.isArray(data) ? data : []);
      } catch (err) {
         console.error('Error en fetchClientes:', err);
         setClientes([]);
      }
   };

   const handleChange = (e) => {
      setForm({ ...form, [e.target.name]: e.target.value });
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `/api/productos/${form.id}` : '/api/productos';

      try {
         const response = await fetch(url, {
            method,
            headers: {
               'Content-Type': 'application/json',
               'auth-token': token
            },
            body: JSON.stringify(form)
         });

         if (handleAuthError(response)) return;

         if (response.ok) {
            alert(form.id ? 'Producto actualizado' : 'Producto creado');
            setForm({ id: null, name: '', precio_venta: '', precio_renta: '', color: '', talla: '', silueta:'', mangas:'', imagenes: [''], descripcion: '', vestido: true });
            fetchProductos();
         } else {
            const data = await response.json();
            alert(data.error || 'Error en la operación');
         }
      } catch (err) {
         alert('Error de conexión');
      }
   };

   const handleEdit = (v) => {
      setForm({
         ...v,
         vestido: v.vestido === '1' || v.vestido === true || v.vestido === 1,
         imagenes: v.imagenes && v.imagenes.length > 0 ? v.imagenes : ['']
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
   };

   const handleDelete = async (id) => {
      if (!window.confirm('¿Seguro que quieres eliminar este producto?')) return;

      try {
         const response = await fetch(`/api/productos/${id}`, {
            method: 'DELETE',
            headers: { 'auth-token': token }
         });

         if (handleAuthError(response)) return;

         if (response.ok) {
            fetchProductos();
         } else {
            alert('No se pudo eliminar');
         }
      } catch (err) {
         alert('Error de conexión');
      }
   };

   const handleImageChange = (index, value) => {
      const newImagenes = [...form.imagenes];
      newImagenes[index] = value;
      setForm({ ...form, imagenes: newImagenes });
   };

   const addImageInput = () => {
      setForm({ ...form, imagenes: [...form.imagenes, ''] });
   };

   const removeImageInput = (index) => {
      if (form.imagenes.length > 1) {
         const newImagenes = form.imagenes.filter((_, i) => i !== index);
         setForm({ ...form, imagenes: newImagenes });
      }
   };

   const handleFileUpload = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      setUploading(true);
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
          formData.append('images', files[i]);
      }

      try {
          const response = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'auth-token': token },
              body: formData
          });
          const data = await response.json();
          if (response.ok) {
              const filteredImagenes = form.imagenes.filter(img => img.trim() !== '');
              setForm({ ...form, imagenes: [...filteredImagenes, ...data.filenames] });
          } else {
              alert(data.error || 'Error al subir imágenes');
          }
      } catch (err) {
          alert('Error de conexión al subir imágenes');
      } finally {
          setUploading(false);
      }
   };

   const handleClientChange = (e) => {
      setClientForm({ ...clientForm, [e.target.name]: e.target.value });
   };

   const handleClientSubmit = async (e) => {
      e.preventDefault();
      try {
         const response = await fetch('/api/clientes', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'auth-token': token
            },
            body: JSON.stringify(clientForm)
         });

         if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'No se pudo crear el cliente');
         }

         const newClient = await response.json();
         setClientes([...clientes, newClient]);
         setClientForm({ nombre: '', telefono: '', email: '', direccion: '' });
         alert('Cliente registrado correctamente');
      } catch (err) {
         alert(err.message);
      }
   };

   const handleReserveChange = (e) => {
      setReserveForm({ ...reserveForm, [e.target.name]: e.target.value });
   };

   const handleReserveItemChange = (index, field, value) => {
      const newItems = [...reserveForm.items];
      newItems[index][field] = value;
      setReserveForm({ ...reserveForm, items: newItems });
   };

   const addReserveItem = () => {
      setReserveForm({
         ...reserveForm,
         items: [...reserveForm.items, { productoId: '', cantidad: 1, rol: 'vestido', estadoItem: 'pendiente', precioUnitario: '', notas: '' }]
      });
   };

   const removeReserveItem = (index) => {
      if (reserveForm.items.length === 1) return;
      const newItems = reserveForm.items.filter((_, i) => i !== index);
      setReserveForm({ ...reserveForm, items: newItems });
   };

   const handleReserveSubmit = async (e) => {
      e.preventDefault();
      try {
         const body = {
            ...reserveForm,
            clienteId: Number(reserveForm.clienteId),
            total: Number(reserveForm.total),
            items: reserveForm.items.map((item) => ({
               ...item,
               productoId: Number(item.productoId),
               cantidad: Number(item.cantidad),
               precioUnitario: Number(item.precioUnitario)
            }))
         };

         const response = await fetch('/api/reservas', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'auth-token': token
            },
            body: JSON.stringify(body)
         });

         if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'No se pudo crear la reserva');
         }

         setReserveForm({
            clienteId: '',
            fechaEvento: '',
            fechaEntrega: '',
            fechaDevolucion: '',
            estado: 'pendiente_medidas',
            total: '',
            tipo: 'renta',
            items: [{ productoId: '', cantidad: 1, rol: 'vestido', estadoItem: 'pendiente', precioUnitario: '', notas: '' }]
         });
         alert('Reserva registrada correctamente');
      } catch (err) {
         alert(err.message);
      }
   };

   const logout = () => {
      localStorage.clear();
      navigate('/login');
   };

   if (loading) return <div className="admin-msg">Cargando panel...</div>;

   const productosFiltrados = productos.filter((p) => {
      const term = searchTerm.toLowerCase();
      const tipo = (p.vestido === '1' || p.vestido === true || p.vestido === 1) ? 'vestido' : 'accesorio';
      return (
         p.name.toLowerCase().includes(term) ||
         p.id.toString().includes(term) ||
         tipo.includes(term) ||
         (p.talla && p.talla.toLowerCase().includes(term))
      );
   });

   return (
      <div className="admin-container">
         <div className="admin-header">
            <h1>Panel de Administración</h1>
            <button onClick={logout} className="logout-btn">Cerrar Sesión</button>
         </div>

         <section className="form-section">
            <h2>{form.id ? 'Editar Producto' : 'Subir Nuevo Producto'}</h2>
            <form onSubmit={handleSubmit} className="admin-form">
               <div className="input-group full-width" style={{ marginBottom: '20px' }}>
                  <label>Tipo de Producto</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', cursor: 'pointer' }}>
                        <input 
                           type="radio" 
                           name="vestido" 
                           checked={form.vestido === true} 
                           onChange={() => setForm({ ...form, vestido: true })} 
                        />
                        Vestido
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', cursor: 'pointer' }}>
                        <input 
                           type="radio" 
                           name="vestido" 
                           checked={form.vestido === false} 
                           onChange={() => setForm({ ...form, vestido: false })} 
                        />
                        Accesorio
                     </label>
                  </div>
               </div>
               <div className="form-grid">
                  <div className="input-group">
                     <label>Nombre del Producto</label>
                     <input name="name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                     <label>Precio Venta</label>
                     <input type="number" name="precio_venta" value={form.precio_venta} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                     <label>Precio Renta</label>
                     <input type="number" name="precio_renta" value={form.precio_renta} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                     <label>Color</label>
                     <input name="color" value={form.color} onChange={handleChange} required />
                  </div>
                  {form.vestido && (
                     <>
                        <div className="input-group">
                           <label>Talla</label>
                           <input name="talla" value={form.talla} onChange={handleChange} required />
                        </div>
                        <div className="input-group">
                           <label>Silueta</label>
                           <select	className="filtro-select" name="silueta" value={form.silueta} onChange={handleChange} required> 
                              <option value="">Selecciona una silueta</option>
                              <option value="a">Corte A</option>
                              <option value="sirena">Corte Sirena</option>
                              <option value="recto">Corte Recto</option>
                           </select>
                        </div>
                        <div className="input-group">
                           <label>Mangas</label>
                           <select	className="filtro-select" name="mangas" value={form.mangas} onChange={handleChange} required> 
                              <option value="">Selecciona una opción</option>
                              <option value="mangas">Mangas</option>
                              <option value="mangas caidas">Mangas Caidas</option>
                              <option value="strapless">Strapless</option>
                              <option value="tirante">tirante</option>
                           </select>
                        </div>
                     </>
                  )}
               </div>
               
               <div className="input-group full-width" style={{ marginTop: '20px' }}>
                  <label>Fotos (en orden de aparición)</label>
                  
                  <div style={{ border: '2px dashed #db2777', padding: '20px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#fdf2f8', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }}>
                     <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                        disabled={uploading}
                     />
                     <p style={{ margin: 0, color: '#db2777', fontWeight: 'bold' }}>
                        {uploading ? 'Subiendo archivos...' : 'Arrastra tus fotos aquí o haz clic para subir 📁'}
                     </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                     {form.imagenes.map((img, index) => (
                        <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                           <span style={{ padding: '8px 12px', background: '#fdf2f8', color: '#db2777', borderRadius: '5px', fontWeight: 'bold' }}>{index + 1}</span>
                           <input 
                              value={img} 
                              onChange={(e) => handleImageChange(index, e.target.value)} 
                              placeholder={`Ej. foto_${index + 1}.jpg`} 
                              style={{ flex: 1 }}
                              required={index === 0}
                           />
                           {form.imagenes.length > 1 && (
                              <button type="button" onClick={() => removeImageInput(index)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} title="Quitar foto">X</button>
                           )}
                        </div>
                     ))}
                  </div>
                  <button type="button" onClick={addImageInput} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold', width: 'fit-content' }}>+ Añadir URL manualmente</button>
               </div>

               <div className="input-group full-width" style={{ marginTop: '20px' }}>
                  <label>Descripción</label>
                  <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows="3"></textarea>
               </div>
               <div className="form-actions">
                  <button type="submit" className="save-btn">{form.id ? 'Guardar Cambios' : 'Publicar Producto'}</button>
                  {form.id && <button type="button" onClick={() => setForm({ id: null, name: '', precio_venta: '', precio_renta: '', color: '', talla: '', imagenes: [''], descripcion: '', vestido: true })} className="cancel-btn">Cancelar</button>}
               </div>
            </form>
         </section>

         <section className="form-section">
            <h2>Registrar nuevo cliente</h2>
            <form onSubmit={handleClientSubmit} className="admin-form">
               <div className="form-grid">
                  <div className="input-group">
                     <label>Nombre</label>
                     <input name="nombre" value={clientForm.nombre} onChange={handleClientChange} required />
                  </div>
                  <div className="input-group">
                     <label>Teléfono</label>
                     <input name="telefono" value={clientForm.telefono} onChange={handleClientChange} />
                  </div>
                  <div className="input-group">
                     <label>Email</label>
                     <input type="email" name="email" value={clientForm.email} onChange={handleClientChange} required />
                  </div>
                  <div className="input-group">
                     <label>Dirección</label>
                     <input name="direccion" value={clientForm.direccion} onChange={handleClientChange} />
                  </div>
               </div>
               <div className="form-actions">
                  <button type="submit" className="save-btn">Registrar Cliente</button>
               </div>
            </form>
         </section>

         <section className="form-section">
            <h2>Registrar renta / compra</h2>
            <form onSubmit={handleReserveSubmit} className="admin-form">
               <div className="form-grid">
                  <div className="input-group">
                     <label>Cliente</label>
                     <select name="clienteId" value={reserveForm.clienteId} onChange={handleReserveChange} required>
                        <option value="">Selecciona un cliente</option>
                        {clientes.map((cliente) => (
                           <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                        ))}
                     </select>
                  </div>
                  <div className="input-group">
                     <label>Fecha del evento</label>
                     <input type="date" name="fechaEvento" value={reserveForm.fechaEvento} onChange={handleReserveChange} required />
                  </div>
                  <div className="input-group">
                     <label>Fecha de entrega</label>
                     <input type="date" name="fechaEntrega" value={reserveForm.fechaEntrega} onChange={handleReserveChange} />
                  </div>
                  <div className="input-group">
                     <label>Fecha de devolución</label>
                     <input type="date" name="fechaDevolucion" value={reserveForm.fechaDevolucion} onChange={handleReserveChange} />
                  </div>
                  <div className="input-group">
                     <label>Tipo</label>
                     <select name="tipo" value={reserveForm.tipo} onChange={handleReserveChange}>
                        <option value="renta">Renta</option>
                        <option value="venta">Venta</option>
                     </select>
                  </div>
                  <div className="input-group">
                     <label>Estado</label>
                     <select name="estado" value={reserveForm.estado} onChange={handleReserveChange}>
                        <option value="pendiente_medidas">Pendiente medidas</option>
                        <option value="ajustes">Ajustes</option>
                        <option value="plancha">Plancha</option>
                        <option value="entregado">Entregado</option>
                        <option value="devuelto">Devuelto</option>
                        <option value="lavado">Lavado</option>
                        <option value="pagado">Pagado</option>
                     </select>
                  </div>
                  <div className="input-group">
                     <label>Total</label>
                     <input type="number" name="total" value={reserveForm.total} onChange={handleReserveChange} required />
                  </div>
               </div>

               <div className="input-group full-width" style={{ marginTop: '20px' }}>
                  <label>Productos de la reserva</label>
                  {reserveForm.items.map((item, index) => (
                     <div key={index} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                           <div style={{ flex: '1 1 200px' }}>
                              <label>Producto</label>
                              <select value={item.productoId} onChange={(e) => handleReserveItemChange(index, 'productoId', e.target.value)} required>
                                 <option value="">Selecciona un producto</option>
                                 {productos.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                 ))}
                              </select>
                           </div>
                           <div style={{ flex: '1 1 120px' }}>
                              <label>Cantidad</label>
                              <input type="number" min="1" value={item.cantidad} onChange={(e) => handleReserveItemChange(index, 'cantidad', e.target.value)} required />
                           </div>
                           <div style={{ flex: '1 1 160px' }}>
                              <label>Rol</label>
                              <select value={item.rol} onChange={(e) => handleReserveItemChange(index, 'rol', e.target.value)}>
                                 <option value="vestido">Vestido</option>
                                 <option value="zapatos">Zapatos</option>
                                 <option value="aretes">Aretes</option>
                                 <option value="accesorio">Accesorio</option>
                              </select>
                           </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                           <div style={{ flex: '1 1 160px' }}>
                              <label>Estado Ítem</label>
                              <select value={item.estadoItem} onChange={(e) => handleReserveItemChange(index, 'estadoItem', e.target.value)}>
                                 <option value="pendiente">Pendiente</option>
                                 <option value="medidas">Medidas</option>
                                 <option value="ajustes">Ajustes</option>
                                 <option value="plancha">Plancha</option>
                                 <option value="entregado">Entregado</option>
                                 <option value="devuelto">Devuelto</option>
                                 <option value="lavado">Lavado</option>
                                 <option value="pagado">Pagado</option>
                              </select>
                           </div>
                           <div style={{ flex: '1 1 160px' }}>
                              <label>Precio unitario</label>
                              <input type="number" min="0" value={item.precioUnitario} onChange={(e) => handleReserveItemChange(index, 'precioUnitario', e.target.value)} required />
                           </div>
                           <div style={{ flex: '1 1 200px' }}>
                              <label>Notas</label>
                              <input value={item.notas} onChange={(e) => handleReserveItemChange(index, 'notas', e.target.value)} placeholder="Opcional" />
                           </div>
                        </div>
                        {reserveForm.items.length > 1 && (
                           <button type="button" onClick={() => removeReserveItem(index)} className="delete-btn" style={{ marginTop: '12px' }}>Eliminar producto</button>
                        )}
                     </div>
                  ))}
                  <button type="button" onClick={addReserveItem} className="save-btn" style={{ marginTop: '10px' }}>Agregar otro producto</button>
               </div>

               <div className="form-actions">
                  <button type="submit" className="save-btn">Registrar renta / compra</button>
               </div>
            </form>
         </section>

         <section className="list-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
               <h2 style={{ margin: 0 }}>Gestión de Inventario</h2>
               <input 
                  type="text" 
                  placeholder="Buscar por ID, nombre, tipo o talla..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '10px 15px', border: '1px solid #ddd', borderRadius: '8px', minWidth: '250px', outline: 'none' }}
               />
            </div>
            <div className="admin-table-container">
               <table className="admin-table">
                  <thead>
                     <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Venta</th>
                        <th>Renta</th>
                        <th>Talla</th>
                        <th>Acciones</th>
                     </tr>
                  </thead>
                  <tbody>
                     {productosFiltrados.length > 0 ? (
                        productosFiltrados.map(p => (
                        <tr key={p.id}>
                           <td>{p.id}</td>
                           <td>{p.name}</td>
                           <td>{(p.vestido === '1' || p.vestido === true || p.vestido === 1) ? 'Vestido' : 'Accesorio'}</td>
                           <td>${p.precio_venta}</td>
                           <td>${p.precio_renta}</td>
                           <td>{p.talla || '-'}</td>
                           <td>
                              <button onClick={() => handleEdit(p)} className="edit-btn">Editar</button>
                              <button onClick={() => handleDelete(p.id)} className="delete-btn">Borrar</button>
                           </td>
                        </tr>
                     ))
                     ) : (
                        <tr>
                           <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No se encontraron productos con esa búsqueda.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </section>

         <style>{`
            .admin-container {
               max-width: 1000px;
               margin: 40px auto;
               padding: 20px;
            }
            .admin-header {
               display: flex;
               justify-content: space-between;
               align-items: center;
               margin-bottom: 30px;
            }
            .admin-header h1 {
               font-family: 'Caveat', cursive;
               font-size: 2.5rem;
               color: #333;
               margin: 0;
            }
            .logout-btn {
               background: #666;
               color: white;
               border: none;
               padding: 8px 15px;
               border-radius: 8px;
               cursor: pointer;
            }
            .form-section {
               background: white;
               padding: 30px;
               border-radius: 15px;
               box-shadow: 0 4px 15px rgba(0,0,0,0.05);
               margin-bottom: 40px;
            }
            .form-grid {
               display: grid;
               grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
               gap: 20px;
            }
            .full-width {
               grid-column: 1 / -1;
               margin-top: 20px;
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
            .admin-form input[type="radio"] {
               width: auto;
               margin: 0;
               display: inline-block;
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
            .cancel-btn {
               background: #eee;
               color: #333;
               border: none;
               padding: 12px 25px;
               border-radius: 8px;
               cursor: pointer;
            }
            .admin-table-container {
               background: white;
               border-radius: 15px;
               overflow-x: auto;
               box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            }
            .admin-table {
               width: 100%;
               border-collapse: collapse;
               min-width: 600px;
            }
            .admin-table th, .admin-table td {
               padding: 15px;
               text-align: left;
               border-bottom: 1px solid #eee;
            }
            .admin-table th {
               background: #fdf2f8;
               color: #db2777;
            }
            .edit-btn {
               background: #3b82f6;
               color: white;
               border: none;
               padding: 5px 10px;
               border-radius: 5px;
               margin-right: 5px;
               cursor: pointer;
            }
            .delete-btn {
               background: #ef4444;
               color: white;
               border: none;
               padding: 5px 10px;
               border-radius: 5px;
               cursor: pointer;
            }
            .admin-msg {
               text-align: center;
               padding: 100px;
               font-size: 1.5rem;
            }

            /* RESPONSIVO MÓVIL */
            @media (max-width: 768px) {
               .admin-container {
                  margin: 20px auto;
                  padding: 10px;
               }
               .admin-header {
                  flex-direction: column;
                  gap: 15px;
                  text-align: center;
               }
               .admin-header h1 {
                  font-size: 2rem;
               }
               .form-section {
                  padding: 20px;
               }
               .form-grid {
                  grid-template-columns: 1fr;
               }
               .form-actions {
                  flex-direction: column;
               }
               .save-btn, .cancel-btn {
                  width: 100%;
               }
               .admin-table th, .admin-table td {
                  padding: 10px;
                  font-size: 0.9rem;
               }
               .edit-btn, .delete-btn {
                  margin-bottom: 5px;
                  display: block;
                  width: 100%;
               }
            }
         `}</style>
      </div>
   );
};

export default Admin;
