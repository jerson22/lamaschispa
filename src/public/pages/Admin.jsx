import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
   const [vestidos, setVestidos] = useState([]);
   const [form, setForm] = useState({
      id: null,
      name: '',
      precio_venta: '',
      precio_renta: '',
      color: '',
      talla: '',
      imagen: '',
      descripcion: ''
   });
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const navigate = useNavigate();
   const token = localStorage.getItem('token');

   useEffect(() => {
      // Verificar si hay token y si es admin (simulado, el backend lo validará)
      if (!token) {
         navigate('/login');
         return;
      }
      fetchVestidos();
   }, [token, navigate]);

   const fetchVestidos = async () => {
      try {
         const response = await fetch('/api/vestidos');
         const data = await response.json();
         setVestidos(data);
      } catch (err) {
         setError('Error al cargar datos');
      } finally {
         setLoading(false);
      }
   };

   const handleChange = (e) => {
      setForm({ ...form, [e.target.name]: e.target.value });
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `/api/vestidos/${form.id}` : '/api/vestidos';

      try {
         const response = await fetch(url, {
            method,
            headers: {
               'Content-Type': 'application/json',
               'auth-token': token
            },
            body: JSON.stringify(form)
         });

         if (response.ok) {
            alert(form.id ? 'Vestido actualizado' : 'Vestido creado');
            setForm({ id: null, name: '', precio_venta: '', precio_renta: '', color: '', talla: '', imagen: '', descripcion: '' });
            fetchVestidos();
         } else {
            const data = await response.json();
            alert(data.error || 'Error en la operación');
         }
      } catch (err) {
         alert('Error de conexión');
      }
   };

   const handleEdit = (v) => {
      setForm(v);
      window.scrollTo({ top: 0, behavior: 'smooth' });
   };

   const handleDelete = async (id) => {
      if (!window.confirm('¿Seguro que quieres eliminar este vestido?')) return;

      try {
         const response = await fetch(`/api/vestidos/${id}`, {
            method: 'DELETE',
            headers: { 'auth-token': token }
         });

         if (response.ok) {
            fetchVestidos();
         } else {
            alert('No se pudo eliminar');
         }
      } catch (err) {
         alert('Error de conexión');
      }
   };

   const logout = () => {
      localStorage.clear();
      navigate('/login');
   };

   if (loading) return <div className="admin-msg">Cargando panel...</div>;

   return (
      <div className="admin-container">
         <div className="admin-header">
            <h1>Panel de Administración</h1>
            <button onClick={logout} className="logout-btn">Cerrar Sesión</button>
         </div>

         <section className="form-section">
            <h2>{form.id ? 'Editar Vestido' : 'Subir Nuevo Vestido'}</h2>
            <form onSubmit={handleSubmit} className="admin-form">
               <div className="form-grid">
                  <div className="input-group">
                     <label>Nombre del Vestido</label>
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
                  <div className="input-group">
                     <label>Talla</label>
                     <input name="talla" value={form.talla} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                     <label>URL Imagen</label>
                     <input name="imagen" value={form.imagen} onChange={handleChange} placeholder="vestido1.jpg" />
                  </div>
               </div>
               <div className="input-group full-width">
                  <label>Descripción</label>
                  <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows="3"></textarea>
               </div>
               <div className="form-actions">
                  <button type="submit" className="save-btn">{form.id ? 'Guardar Cambios' : 'Publicar Vestido'}</button>
                  {form.id && <button type="button" onClick={() => setForm({ id: null, name: '', precio_venta: '', precio_renta: '', color: '', talla: '', imagen: '', descripcion: '' })} className="cancel-btn">Cancelar</button>}
               </div>
            </form>
         </section>

         <section className="list-section">
            <h2>Gestión de Inventario</h2>
            <div className="admin-table-container">
               <table className="admin-table">
                  <thead>
                     <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Venta</th>
                        <th>Renta</th>
                        <th>Talla</th>
                        <th>Acciones</th>
                     </tr>
                  </thead>
                  <tbody>
                     {vestidos.map(v => (
                        <tr key={v.id}>
                           <td>{v.id}</td>
                           <td>{v.name}</td>
                           <td>${v.precio_venta}</td>
                           <td>${v.precio_renta}</td>
                           <td>{v.talla}</td>
                           <td>
                              <button onClick={() => handleEdit(v)} className="edit-btn">Editar</button>
                              <button onClick={() => handleDelete(v.id)} className="delete-btn">Borrar</button>
                           </td>
                        </tr>
                     ))}
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
            .admin-form input, .admin-form textarea {
               width: 100%;
               padding: 10px;
               border: 1px solid #ddd;
               border-radius: 8px;
               outline: none;
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
               overflow: hidden;
               box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            }
            .admin-table {
               width: 100%;
               border-collapse: collapse;
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
         `}</style>
      </div>
   );
};

export default Admin;
