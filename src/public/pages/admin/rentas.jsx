import React, { useState, useEffect } from 'react';
import { MdEdit, MdDelete } from "react-icons/md";
import { useNavigate } from 'react-router-dom';

export default function Rentas() {
   const [rentas, setRentas] = useState([]);
   const navigate = useNavigate();

   useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const fetchRentas = async () => {
         try {
            const response = await fetch('/api/rentas', {
               headers: { 'auth-token': token }
            });
            const data = await response.json();
            console.log('Rentas obtenidas:', data);
            setRentas(data);
         } catch (error) {
            console.error('Error fetching rentas:', error);
         }
      };

      fetchRentas();
   }, []);
	{/* Opciones para formatear la fecha en español */}
   const opciones = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
   };
	const handleEstadoChange = async (rentaId, nuevoEstado) => {
   	const token = localStorage.getItem('token');
		if (!token) return;

		try {
			// Hacemos la petición PUT o PATCH a tu backend
			const response = await fetch(`/api/rentas/${rentaId}`, {
				method: 'PUT', 
				headers: { 
					'Content-Type': 'application/json',
					'auth-token': token 
				},
				body: JSON.stringify({ estado: nuevoEstado })
			});
			if (response.ok) {
				// Si el backend respondió bien, actualizamos el estado de React
				setRentas(prevRentas => 
					prevRentas.map(renta => 
						renta.id === rentaId ? { ...renta, estado: nuevoEstado } : renta
					)
				);
				console.log(`Renta ${rentaId} actualizada a: ${nuevoEstado}`);
				alert(`Renta ${rentaId} actualizada a: ${nuevoEstado}`);
			} else {
				console.error('Error al actualizar en el servidor');
			}
		} catch (error) {
			console.error('Error en la conexión:', error);
		}
	};
	const handleDelete = async (rentaId) => {
		const token = localStorage.getItem('token');
		if (!token) return;
		if (!window.confirm('¿Estás seguro de que quieres eliminar esta renta?')) return;

		try {
			const response = await fetch(`/api/rentas/${rentaId}`, {
				method: 'DELETE',
				headers: { 'auth-token': token }
			});
			if (response.ok) {
				// Si el backend respondió bien, actualizamos el estado de React
				setRentas(prevRentas => prevRentas.filter(renta => renta.id !== rentaId));
				console.log(`Renta ${rentaId} eliminada`);
				alert(`Renta ${rentaId} eliminada`);
			} else {
				console.error('Error al eliminar en el servidor');
			}
		} catch (error) {
			console.error('Error en la conexión:', error);
		}
	};
   return (
      <div className="rentas-container">
         <h1>Rentas</h1>
         <p>{rentas.length} rentas encontradas</p>
         <table className="rentas-table">
            <thead>
               <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Fecha de Entrega</th>
                  <th>Estado</th>
                  <th>Fecha de Devolución</th>
                  <th>Acciones</th>
               </tr>
            </thead>
            <tbody>
               {Array.isArray(rentas) && rentas.map((renta) => (
                  <tr key={renta.id}>
                     <td>{renta.id}</td>
                     <td>{renta.name}</td>
                     <td>{renta.telefono}</td>
                     <td>{renta.fechaEntrega ? new Date(renta.fechaEntrega).toLocaleDateString('es-ES', opciones) : 'N/A'}</td>
                     <td>
								<select 
									className="select-estado-neumorphic"
									value={renta.estado} 
									onChange={(e) => handleEstadoChange(renta.id, e.target.value)}
								>
									<option value="cita de ajustes">Cita de Ajustes</option>
									<option value="ajustes">Ajustes</option>
									<option value="planchado">Planchado</option>
									<option value="entregado">Entregado</option>
									<option value="devolucion">Devolucion</option>
									<option value="tintoreria">Tintorería</option>
									<option value="en tienda">En tienda</option>
								</select>
							</td>
                     <td>{renta.fechaDevolucion ? new Date(renta.fechaDevolucion).toLocaleDateString('es-ES', opciones) : 'N/A'}</td>
                     <td>
                        <div className="acciones-container">
                        	<button className="btn-neumorphic edit-btn" onClick={() => navigate(`/admin/renta/${renta.id}`)}>
                           	<MdEdit />
									</button>
                        	<button className="btn-neumorphic delete-btn" onClick={() => handleDelete(renta.id)}>
                           	<MdDelete />
                        	</button>
								</div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
         <style>{`
               .rentas-container {
                  max-width: 1000px;
                  margin: 20px auto;
                  padding: 0 20px;
               }
               .rentas-table {
                  width: 100%;
                  border-collapse: collapse;
                  /* Cambiado a gris suave para que resalte el neumorfismo */
                  background-color: #fcfcfc; 
                  border-radius: 16px;
                  overflow: hidden;
                  padding: 10px;
               }
               .rentas-table th,
               .rentas-table td {
                  padding: 16px;
                  text-align: left;
                  border-bottom: 1px solid #d1d5db;
               }
               .rentas-table th {
                  /* Un gris un poco más oscuro para el encabezado */
                  background-color: #eeecec; 
                  font-weight: 600;
						color: #374151;
            
               }
               
               /* Estilos del botón Neumórfico */
               .btn-neumorphic {
                  border: none;
                  outline: none;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 40px;
                  height: 40px;
                  border-radius: 50%; /* Lo hace perfectamente redondo */
                  color: #666;
                  font-size: 1.2rem;
                  
                  /* Fondo idéntico al de la tabla para lograr el efecto */
                  background: linear-gradient(145deg, #ffffff, #e2e2e2);
                  
                  /* Sombras proporcionales al tamaño del botón */
                  box-shadow: 2px 2px 8px #acacac, 
                              -2px -2px 8px #f1f1f1;
                  transition: all 0.2s ease;
               }

               /* Efecto de hundido cuando el usuario hace clic */
               .btn-neumorphic:active {
                  background: #ffffff;
                  box-shadow: inset 2px 2px 5px #d1d1d1;
                              inset -2px -2px 5px #ffffff;
                  color: #333;
               }
					.acciones-container{
						display: flex;
						flex-direction: row;
						gap: 10px;
						algin-items: center;
					}
					// .edit-btn {
					// 	color: #3b82f6;
					// }
					// .edit-btn:active {
					// 	color: #1d4ed8;
					// }
					// .delete-btn {
					// 	color: #ef4444;
					// }
					// .delete-btn:active {
					// 	color: #dc2626;
					// }
					.select-estado-neumorphic {
						border: none;
						outline: none;
						padding: 8px 12px;
						border-radius: 8px;
						background: #ffffff;
						color: #4b5563;
						font-weight: 500;
						cursor: pointer;
						
						/* Efecto neumórfico hundido para que parezca un input/campo */
						box-shadow: inset 2px 2px 5px #bebebe, 
										inset -2px -2px 5px #ffffff;
						transition: all 0.3s ease;
					}

					.select-estado-neumorphic:focus {
						/* Resalta un poco al dar clic */
						box-shadow: inset 1px 1px 3px #bebebe, 
										inset -1px -1px 3px #ffffff,
										0 0 4px rgba(59, 130, 246, 0.5); 
					}
         `}</style>
      </div>
   );
}