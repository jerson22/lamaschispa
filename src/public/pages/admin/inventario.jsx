import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Inventario = () => {
   const [productos, setProductos] = useState([]);
   const [form, setForm] = useState({
      id: null,
      name: '',
      precio_venta: '',
      precio_renta: '',
      precio_vestido: '',
      silueta: '',
      mangas: '',
      color: '',
      talla: '',
      imagenes: [''],
      descripcion: '',
      vestido: true
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

   // Funcion para traer productos desde el servidor
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

   // Funcion para cambiar el formulario de producto
   const handleChange = (e) => {
      setForm({ ...form, [e.target.name]: e.target.value });
   };

   // Funcion para enviar el formulario de producto (crear o actualizar)
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
            setForm({ id: null, name: '', precio_venta: '', precio_renta: '', precio_vestido: '', color: '', talla: '', silueta:'', mangas:'', imagenes: [''], descripcion: '', vestido: true });
            fetchProductos();
         } else {
            const data = await response.json();
            alert(data.error || 'Error en la operación');
         }
      } catch (err) {
         alert('Error de conexión');
      }
   };

   // Funcion para cargar los datos de un producto en el formulario para editar
   const handleEdit = (v) => {
      setForm({
         ...v,
         vestido: v.vestido === '1' || v.vestido === true || v.vestido === 1,
         imagenes: v.imagenes && v.imagenes.length > 0 ? v.imagenes : ['']
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
   };

   // Funcion para eliminar un producto
   const handleDelete = async (id) => {
      if (!window.confirm('¿Seguro que quieres eliminar este producto?')) return;

      try {
         const response = await fetch(`/api/productos/${id}`, {
            method: 'DELETE',
            headers: { 'auth-token': token }
         });
         console.log('se mando el Delete');
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

   // Funcion para manejar cambios en los campos de imagenes
   const handleImageChange = (index, value) => {
      const newImagenes = [...form.imagenes];
      newImagenes[index] = value;
      setForm({ ...form, imagenes: newImagenes });
   };

   // Funcion para agregar un nuevo campo de imagen
   const addImageInput = () => {
      setForm({ ...form, imagenes: [...form.imagenes, ''] });
   };

   // Funcion para eliminar un campo de imagen
   const removeImageInput = (index) => {
      if (form.imagenes.length > 1) {
         const newImagenes = form.imagenes.filter((_, i) => i !== index);
         setForm({ ...form, imagenes: newImagenes });
      }
   };

   // Funcion para manejar la subida de archivos al servidor
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
         {/* HEADER DEL PANEL */}
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
                     <label>Precio Vestido</label>
                     <input type="number" name="precio_vestido" value={form.precio_vestido} onChange={handleChange} required />
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
                     <select className="filtro-select" name="color" value={form.color} onChange={handleChange} required>
                        <option value="">Selecciona un color</option>
                        <option value="rosa">Rosa</option>
                        <option value="rojo">Rojo</option>
                        <option value="azul">Azul</option>
                        <option value="verde">Verde</option>
                        <option value="negro">Negro</option>
                        <option value="beige">Beige</option>
                        <option value="naranja">Naranja</option>
                        <option value="gris">Gris</option>
                        <option value="floreal">Floreal</option>
                        <option value="cafe">Café</option>
                        <option value="amarillo">Amarillo</option>
                        <option value="dorado/plateado">Dorado/Plateado</option>
                     </select>
                  </div>
                  {form.vestido && (
                     <>
                        <div className="input-group">
                           <label>Talla</label>
                           <select	className="filtro-select" name="talla" value={form.talla} onChange={handleChange} required> 
                              <option value="">Selecciona una talla</option>
                              <option value="1 xl">1 XL</option>
                              <option value="2 xl">2 XL</option>
                              <option value="3 xl">3 XL</option>
                              <option value="4 xl">4 XL</option>
                              <option value="5 xl">5 XL</option>
                           </select>
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
                              <option value="tirante">Tirante</option>
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
                  {form.id && <button type="button" onClick={() => setForm({ id: null, name: '', precio_venta: '', precio_renta: '', precio_vestido: '', color: '', talla: '', imagenes: [''], descripcion: '', vestido: true })} className="cancel-btn">Cancelar</button>}
               </div>
            </form>
         </section>

         {/* SECCIÓN DE LISTADO DE PRODUCTOS */}
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
                        <th>Vestido</th>
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
                           <td>${p.precio_vestido}</td>
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
               margin: 10px auto;
               padding: 10px;
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
            .conteiner{
               display: flex;
               width: 100%;
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

export default Inventario;
