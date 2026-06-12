import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NewClient = () => {
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
      municipio: ''
   });
   const [reserveForm, setReserveForm] = useState({
      clienteId: '',
      name: '',
      productoId: '',
      bolso: false,
      aretes: false,
      ajuste: false,
      fechaAjustes: '',
      fechaRenta: '',
      fechaEntrega: '',
      fechaDevolucion: '',
      anticipo: '',
      pendiente: '',
      notas: '',
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
         setClientForm({ nombre: '', telefono: '', email: '', municipio: '' });
         alert('Cliente registrado correctamente');
      } catch (err) {
         alert(err.message);
      }
   };

   const handleReserveChange = (e) => {
      const { name, value, type, checked } = e.target;
      setReserveForm({ 
         ...reserveForm, 
         [name]: type === 'checkbox' ? checked : value 
      });
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
            clienteId: Number(reserveForm.clienteId),
            name: reserveForm.name,
            productoId: Number(reserveForm.productoId),
            bolso: reserveForm.bolso,
            aretes: reserveForm.aretes,
            ajuste: reserveForm.ajuste,
            fechaAjustes: reserveForm.fechaAjustes || null,
            fechaRenta: reserveForm.fechaRenta,
            fechaEntrega: reserveForm.fechaEntrega,
            fechaDevolucion: reserveForm.fechaDevolucion,
            anticipo: Number(reserveForm.anticipo),
            pendiente: Number(reserveForm.pendiente),
            notas: reserveForm.notas
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

         alert('Venta registrada correctamente');
         setReserveForm({
            clienteId: '',
            name: '',
            productoId: '',
            bolso: false,
            aretes: false,
            ajuste: false,
            fechaAjustes: '',
            fechaRenta: '',
            fechaEntrega: '',
            fechaDevolucion: '',
            anticipo: '',
            pendiente: '',
            notas: '',
         });
         alert('venta registrada correctamente');
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
                     <label>Municipio</label>
                     <input name="municipio" value={clientForm.municipio} onChange={handleClientChange} />
                  </div>
               </div>
               <div className="form-actions">
                  <button type="submit" className="save-btn">Registrar Cliente</button>
               </div>
            </form>
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

export default NewClient;
