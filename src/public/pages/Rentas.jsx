import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Rentas = () => {
   const navigate = useNavigate();
   const [reservas, setReservas] = useState([]);
   const [selectedEstado, setSelectedEstado] = useState('Todas');
   const [viewMode, setViewMode] = useState('fecha');
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   useEffect(() => {
      const user = localStorage.getItem('user');
      let parsedUser = null;
      try {
         parsedUser = user ? JSON.parse(user) : null;
      } catch {
         parsedUser = null;
      }
      if (!parsedUser || parsedUser.rol !== 'admin') {
         navigate('/login');
         return;
      }

      const fetchReservas = async () => {
         try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/reservas', {
               headers: { 'auth-token': token }
            });
            if (!response.ok) {
               throw new Error('No se pudo cargar la lista de rentas');
            }
            const data = await response.json();
            setReservas(data);
         } catch (err) {
            console.error(err);
            setError(err.message || 'Error al obtener las rentas');
         } finally {
            setLoading(false);
         }
      };
      fetchReservas();
   }, [navigate]);

   if (loading) {
      return <div className="loading">Cargando rentas...</div>;
   }

   if (error) {
      return <div className="error">Error: {error}</div>;
   }

   const estadosDisponibles = ['Todas', ...Array.from(new Set(reservas.map((r) => r.estado))).sort()];

   const reservasFiltradas = reservas.filter((reserva) => {
      if (selectedEstado === 'Todas') return true;
      return reserva.estado === selectedEstado;
   });

   const getWeekKey = (date) => {
      const d = new Date(date);
      const target = new Date(d.valueOf());
      const dayNumber = (d.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNumber + 3);
      const firstThursday = new Date(target.getFullYear(), 0, 4);
      const diff = target - firstThursday;
      const weekNumber = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
      return `${target.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
   };

   const reservasAgrupadas = reservasFiltradas.reduce((acc, reserva) => {
      const date = new Date(reserva.fechaevento);
      let agrupacion;

      if (viewMode === 'semana') {
         agrupacion = getWeekKey(date);
      } else {
         agrupacion = date.toLocaleDateString();
      }

      if (!acc[agrupacion]) acc[agrupacion] = [];
      acc[agrupacion].push(reserva);
      return acc;
   }, {});

   const ordenarClaves = Object.keys(reservasAgrupadas).sort((a, b) => {
      if (viewMode === 'semana') {
         return a.localeCompare(b);
      }
      return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
   });

   return (
      <div className="rentas-page">
         <h1>Rentas y reservas</h1>

         <div className="rentas-controls">
            <div>
               <label>Filtro por estado</label>
               <select value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)}>
                  {estadosDisponibles.map((estado) => (
                     <option key={estado} value={estado}>{estado}</option>
                  ))}
               </select>
            </div>
            <div>
               <label>Vista</label>
               <div className="view-buttons">
                  <button 
                     type="button" 
                     onClick={() => setViewMode('fecha')}
                     className={`view-btn ${viewMode === 'fecha' ? 'active' : ''}`}
                  >
                     Por día
                  </button>
                  <button 
                     type="button" 
                     onClick={() => setViewMode('semana')}
                     className={`view-btn ${viewMode === 'semana' ? 'active' : ''}`}
                  >
                     Por semana
                  </button>
               </div>
            </div>
         </div>

         {reservasFiltradas.length === 0 ? (
            <p className="no-data">No hay rentas registradas con ese filtro.</p>
         ) : (
            <div className="rentas-layout">
               <div className="rentas-list">
                  <h2>Lista de rentas</h2>
                  <table className="rentas-table">
                     <thead>
                        <tr>
                           <th>Fecha evento</th>
                           <th>Cliente</th>
                           <th>Productos</th>
                           <th>Estado</th>
                           <th>Total</th>
                        </tr>
                     </thead>
                     <tbody>
                        {reservasFiltradas.map((reserva, idx) => (
                           <tr key={reserva.id} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                              <td className="cell-date">{new Date(reserva.fechaevento).toLocaleDateString()}</td>
                              <td className="cell-client">{reserva.cliente}</td>
                              <td className="cell-products">
                                 {reserva.items.map((item) => (
                                    <div key={`${reserva.id}-${item.productoId}`} className="product-item">
                                       {item.productoNombre} <span className="product-role">({item.rol})</span>
                                    </div>
                                 ))}
                              </td>
                              <td className="cell-status"><span className={`status-badge status-${reserva.estado}`}>{reserva.estado}</span></td>
                              <td className="cell-total">${reserva.total}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               <div className="rentas-calendar">
                  <h2>{viewMode === 'semana' ? 'Calendario semanal' : 'Calendario de eventos'}</h2>
                  <p className="calendar-subtitle">{viewMode === 'semana' ? 'Reservas agrupadas por semana' : 'Fechas con rentas'}</p>
                  <div className="calendar-days">
                     {ordenarClaves.map((clave) => (
                        <div key={clave} className="calendar-group">
                           <div className="calendar-date-header">{viewMode === 'semana' ? `Semana ${clave.split('-W')[1]} (${clave.split('-W')[0]})` : clave}</div>
                           <ul className="calendar-items">
                              {reservasAgrupadas[clave].map((reserva) => (
                                 <li key={reserva.id} className="calendar-item">
                                    <span className="item-date">{viewMode === 'semana' ? `${new Date(reserva.fechaevento).toLocaleDateString()}` : ''}</span>
                                    <span className="item-client">{reserva.cliente}</span>
                                    <span className="item-count">{reserva.items.length} art.</span>
                                    <span className={`item-status status-${reserva.estado}`}>{reserva.estado}</span>
                                 </li>
                              ))}
                           </ul>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         <style>{`
            .rentas-page {
               max-width: 1400px;
               margin: 0 auto;
               padding: 30px 20px;
               font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            .rentas-page h1 {
               font-family: 'Caveat', cursive;
               font-size: 2.5rem;
               color: #333;
               margin-bottom: 30px;
               text-align: center;
            }

            .rentas-controls {
               display: flex;
               flex-wrap: wrap;
               gap: 25px;
               margin-bottom: 30px;
               align-items: flex-end;
            }

            .rentas-controls > div {
               display: flex;
               flex-direction: column;
            }

            .rentas-controls label {
               display: block;
               font-weight: 700;
               margin-bottom: 8px;
               color: #555;
               font-size: 0.95rem;
            }

            .rentas-controls select {
               padding: 10px 12px;
               border-radius: 8px;
               border: 2px solid #f0f0f0;
               background-color: #fff;
               cursor: pointer;
               font-size: 0.95rem;
               transition: all 0.3s;
            }

            .rentas-controls select:hover {
               border-color: #db2777;
            }

            .rentas-controls select:focus {
               outline: none;
               border-color: #db2777;
               box-shadow: 0 0 0 3px rgba(219, 39, 119, 0.1);
            }

            .view-buttons {
               display: flex;
               gap: 8px;
            }

            .view-btn {
               padding: 10px 16px;
               border-radius: 8px;
               border: 2px solid #f0f0f0;
               background-color: #fff;
               cursor: pointer;
               font-weight: 600;
               transition: all 0.3s;
               font-size: 0.95rem;
            }

            .view-btn:hover {
               border-color: #db2777;
            }

            .view-btn.active {
               background-color: #fce7f3;
               border-color: #db2777;
               color: #db2777;
            }

            .rentas-layout {
               display: grid;
               gap: 24px;
               grid-template-columns: 1fr 380px;
            }

            .rentas-list {
               background: white;
               border-radius: 12px;
               box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
               overflow: hidden;
            }

            .rentas-list h2 {
               background: linear-gradient(135deg, #fce7f3 0%, #fff5fb 100%);
               padding: 20px;
               margin: 0;
               color: #db2777;
               font-size: 1.3rem;
               border-bottom: 2px solid #f472b6;
            }

            .rentas-table {
               width: 100%;
               border-collapse: collapse;
               table-layout: auto;
            }

            .rentas-table thead {
               background: #fdf2f8;
            }

            .rentas-table thead tr th {
               padding: 14px 12px;
               text-align: left;
               color: #db2777;
               font-weight: 700;
               font-size: 0.9rem;
               text-transform: uppercase;
               letter-spacing: 0.5px;
               border-bottom: 2px solid #f472b6;
            }

            .rentas-table tbody tr {
               border-bottom: 1px solid #f0f0f0;
               transition: all 0.2s;
            }

            .rentas-table tbody tr.row-even {
               background-color: #ffffff;
            }

            .rentas-table tbody tr.row-odd {
               background-color: #faf8fa;
            }

            .rentas-table tbody tr:hover {
               background-color: #fce7f3;
               box-shadow: inset 0 0 0 2px #f472b6;
            }

            .rentas-table td {
               padding: 14px 12px;
               font-size: 0.95rem;
               color: #555;
            }

            .cell-date {
               font-weight: 600;
               color: #db2777;
               min-width: 100px;
            }

            .cell-client {
               font-weight: 500;
               color: #333;
               min-width: 120px;
            }

            .cell-products {
               max-width: 250px;
            }

            .product-item {
               margin-bottom: 4px;
               line-height: 1.4;
            }

            .product-role {
               color: #999;
               font-size: 0.85rem;
            }

            .cell-status {
               text-align: center;
               min-width: 130px;
            }

            .status-badge {
               display: inline-block;
               padding: 6px 12px;
               border-radius: 6px;
               font-size: 0.8rem;
               font-weight: 600;
               text-transform: uppercase;
               letter-spacing: 0.3px;
            }

            .status-pendiente_medidas {
               background-color: #fef3c7;
               color: #92400e;
            }

            .status-ajustes {
               background-color: #dbeafe;
               color: #1e40af;
            }

            .status-plancha {
               background-color: #e0e7ff;
               color: #3730a3;
            }

            .status-entregado {
               background-color: #dcfce7;
               color: #166534;
            }

            .status-devuelto {
               background-color: #fed7aa;
               color: #92400e;
            }

            .status-lavado {
               background-color: #cffafe;
               color: #164e63;
            }

            .status-pagado {
               background-color: #d1fae5;
               color: #065f46;
            }

            .cell-total {
               font-weight: 700;
               color: #db2777;
               text-align: right;
               min-width: 80px;
            }

            .rentas-calendar {
               background: white;
               border-radius: 12px;
               box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
               overflow: hidden;
               display: flex;
               flex-direction: column;
            }

            .rentas-calendar h2 {
               background: linear-gradient(135deg, #fce7f3 0%, #fff5fb 100%);
               padding: 20px;
               margin: 0;
               color: #db2777;
               font-size: 1.1rem;
               border-bottom: 2px solid #f472b6;
            }

            .calendar-subtitle {
               padding: 0 20px;
               margin: 10px 0 0 0;
               color: #999;
               font-size: 0.85rem;
               font-style: italic;
            }

            .calendar-days {
               flex: 1;
               overflow-y: auto;
               padding: 15px;
            }

            .calendar-group {
               margin-bottom: 18px;
            }

            .calendar-date-header {
               font-weight: 700;
               color: #db2777;
               padding: 8px 10px;
               background-color: #fdf2f8;
               border-left: 3px solid #db2777;
               margin-bottom: 10px;
               border-radius: 4px;
               font-size: 0.9rem;
               white-space: nowrap;
            }

            .calendar-items {
               list-style: none;
               margin: 0;
               padding: 0;
            }

            .calendar-item {
               display: flex;
               flex-direction: column;
               gap: 4px;
               padding: 10px;
               background-color: #faf8fa;
               border-left: 2px solid #f472b6;
               margin-bottom: 8px;
               border-radius: 4px;
               font-size: 0.85rem;
               line-height: 1.4;
            }

            .item-date {
               color: #db2777;
               font-weight: 600;
               font-size: 0.8rem;
               white-space: nowrap;
            }

            .item-client {
               color: #333;
               font-weight: 500;
               white-space: nowrap;
               overflow: hidden;
               text-overflow: ellipsis;
            }

            .item-count {
               color: #999;
               font-size: 0.8rem;
               white-space: nowrap;
            }

            .item-status {
               display: inline-block;
               padding: 3px 8px;
               border-radius: 4px;
               font-size: 0.75rem;
               font-weight: 600;
               text-transform: uppercase;
               width: fit-content;
               white-space: nowrap;
            }

            .no-data {
               text-align: center;
               padding: 40px;
               color: #999;
               font-size: 1.1rem;
            }

            @media (max-width: 1024px) {
               .rentas-layout {
                  grid-template-columns: 1fr;
               }

               .rentas-table {
                  font-size: 0.9rem;
               }

               .rentas-table td, .rentas-table th {
                  padding: 10px 8px;
               }
            }

            @media (max-width: 768px) {
               .rentas-page {
                  padding: 20px 15px;
               }

               .rentas-page h1 {
                  font-size: 2rem;
               }

               .rentas-controls {
                  flex-direction: column;
                  gap: 15px;
               }

               .rentas-controls > div {
                  width: 100%;
               }

               .rentas-controls select {
                  width: 100%;
               }

               .view-buttons {
                  width: 100%;
               }

               .view-btn {
                  flex: 1;
               }

               .rentas-table thead {
                  display: none;
               }

               .rentas-table tbody tr {
                  display: block;
                  margin-bottom: 15px;
                  border: 1px solid #f472b6;
                  border-radius: 8px;
                  padding: 10px;
               }

               .rentas-table td {
                  display: block;
                  text-align: right;
                  padding-left: 40%;
                  position: relative;
                  margin-bottom: 8px;
               }

               .rentas-table td::before {
                  content: attr(data-label);
                  position: absolute;
                  left: 0;
                  font-weight: bold;
                  color: #db2777;
               }
            }
         `}</style>
      </div>
   );
};

export default Rentas;
