import React, { useState, useEffect } from 'react';
import { MdEdit, MdDelete } from "react-icons/md";
import { useNavigate } from 'react-router-dom';

// 💡 FUNCIÓN ASISTENTE CORREGIDA: Extrae estrictamente la fecha textual (YYYY-MM-DD) e ignora la zona horaria
const formatearFechaSafe = (fechaString, opciones) => {
   if (!fechaString) return 'N/A';
   
   // Tomamos solo los primeros 10 caracteres (YYYY-MM-DD), ignorando 'T', horas o 'Z'
   const fechaLimpia = fechaString.slice(0, 10);
   
   if (fechaLimpia.includes('-') && fechaLimpia.length === 10) {
      const [year, month, day] = fechaLimpia.split('-').map(Number);
      // Creamos la fecha en modo local estricto (año, mes base 0, día)
      return new Date(year, month - 1, day).toLocaleDateString('es-ES', opciones);
   }
   
   return new Date(fechaString).toLocaleDateString('es-ES', opciones);
};

export default function Rentas() {
   const [rentas, setRentas] = useState([]);
   const navigate = useNavigate();

   const [filtros, setFiltros] = useState({
      tipoFecha: 'todas',        
      preset: 'todos',          
      fechaInicio: '',          
      fechaFin: ''              
   });

   useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const fetchData = async () => {
         try {
            const responseRentas = await fetch('/api/rentas2', {
               headers: { 'auth-token': token }
            });
            const dataRentas = await responseRentas.json();
            setRentas(dataRentas);
            
         } catch (error) {
            console.error('Error fetching data:', error);
         }
      };

      fetchData();
   }, []);

   const opciones = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
   };

   const obtenerRentasFiltradas = () => {
      if (!Array.isArray(rentas)) return []; 

      const filtradas = rentas.filter((renta) => {
         if (filtros.tipoFecha !== 'todas' && !renta[filtros.tipoFecha]) {
            return false; 
         }

         if (filtros.preset === 'todos') return true; 

         const verificarFechaIndividual = (fechaString) => {
            if (!fechaString) return false;

            // 🛠️ CORRECCIÓN AQUÍ: Extraemos el formato YYYY-MM-DD directamente del texto.
            // Esto evita que JavaScript reste un día al intentar convertir la hora UTC a local.
            const stringRenta = fechaString.slice(0, 10);

            // 2. Obtener la fecha de HOY en formato estricto LOCAL
            const hoy = new Date();
            const stringHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

            // Filtro: Hoy
            if (filtros.preset === 'hoy') {
               return stringRenta === stringHoy; 
            }

            // Para rangos estables creamos objetos Date locales a mediodía
            const [rYear, rMonth, rDay] = stringRenta.split('-').map(Number);
            const fRentaComparar = new Date(rYear, rMonth - 1, rDay, 12, 0, 0);

            // Filtro: Esta Semana
            if (filtros.preset === 'semana') {
               const tempHoy = new Date();
               tempHoy.setHours(0, 0, 0, 0);
               
               const diaSemana = tempHoy.getDay();
               const diferenciaLunes = tempHoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); 
               const lunes = new Date(tempHoy.getFullYear(), tempHoy.getMonth(), diferenciaLunes, 0, 0, 0);
               
               const domingo = new Date(lunes);
               domingo.setDate(lunes.getDate() + 6);
               domingo.setHours(23, 59, 59, 999);

               return fRentaComparar >= lunes && fRentaComparar <= domingo;
            }

            // Filtro: Rango Personalizado
            if (filtros.preset === 'personalizado') {
               if (!filtros.fechaInicio || !filtros.fechaFin) return true;

               const [iYear, iMonth, iDay] = filtros.fechaInicio.split('-').map(Number);
               const inicio = new Date(iYear, iMonth - 1, iDay, 0, 0, 0);

               const [fYear, fMonth, fDay] = filtros.fechaFin.split('-').map(Number);
               const fin = new Date(fYear, fMonth - 1, fDay, 23, 59, 59, 999);

               return fRentaComparar >= inicio && fRentaComparar <= fin;
            }

            return false;
         };

         if (filtros.tipoFecha === 'todas') {
            return (
               verificarFechaIndividual(renta.fechaEntrega) ||
               verificarFechaIndividual(renta.fechaDevolucion) ||
               verificarFechaIndividual(renta.fechaAjuste) ||
               verificarFechaIndividual(renta.fechaRenta)
            );
         }

         return verificarFechaIndividual(renta[filtros.tipoFecha]);
      });

      return filtradas;
   };

   const rentasFiltradas = obtenerRentasFiltradas();

   const handleEstadoChange = async (rentaId, nuevoEstado) => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
         const response = await fetch(`/api/rentas/${rentaId}`, {
            method: 'PUT', 
            headers: { 
               'Content-Type': 'application/json',
               'auth-token': token 
            },
            body: JSON.stringify({ estado: nuevoEstado })
         });
         if (response.ok) {
            setRentas(prevRentas => 
               prevRentas.map(renta => 
                  renta.id === rentaId ? { ...renta, estado: nuevoEstado } : renta
               )
            );
            alert(`Renta ${rentaId} actualizada a: ${nuevoEstado}`);
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
            setRentas(prevRentas => prevRentas.filter(renta => renta.id !== rentaId));
            alert(`Renta ${rentaId} eliminada`);
         }
      } catch (error) {
         console.error('Error en la conexión:', error);
      }
   };

   return (
      <div className="rentas-container">
         <h1>Rentas</h1>
         <p>{rentasFiltradas.length} rentas encontradas</p>

         <div className="filtros-container-bar">
            <div className="filtro-grupo">
               <label>¿Qué fecha revisar?</label>
               <select 
                  className="select-estado-neumorphic"
                  value={filtros.tipoFecha}
                  onChange={(e) => setFiltros({ ...filtros, tipoFecha: e.target.value })}
               >
                  <option value="todas">Todas las fechas (Cualquiera)</option>
                  <option value="fechaEntrega">Fecha de Entrega</option>
                  <option value="fechaDevolucion">Fecha de Devolución</option>
                  <option value="fechaAjuste">Fecha de Ajuste</option>
                  <option value="fechaRenta">Fecha de Renta</option>
               </select>
            </div>

            <div className="filtro-grupo">
               <label>Rango de Tiempo</label>
               <select 
                  className="select-estado-neumorphic"
                  value={filtros.preset}
                  onChange={(e) => setFiltros({ ...filtros, preset: e.target.value })}
               >
                  <option value="todos">Ver Todas</option>
                  <option value="hoy">Hoy</option>
                  <option value="semana">Esta Semana</option>
                  <option value="personalizado">Rango Personalizado 📅</option>
               </select>
            </div>

            {filtros.preset === 'personalizado' && (
               <div className="filtro-grupo-fechas">
                  <div>
                     <label>Desde:</label>
                     <input 
                        type="date" 
                        className="select-estado-neumorphic input-fecha"
                        value={filtros.fechaInicio}
                        onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                     />
                  </div>
                  <div>
                     <label>Hasta:</label>
                     <input 
                        type="date" 
                        className="select-estado-neumorphic input-fecha"
                        value={filtros.fechaFin}
                        onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                     />
                  </div>
               </div>
            )}
         </div>

         <table className="rentas-table">
            <thead>
               <tr>
                  <th>ID</th>
                  <th style={{ textAlign: 'center' }}>Liquidado</th> 
                  <th>Vestido</th>
                  <th>Fecha de Entrega</th>
                  <th>Estado</th>
                  <th>Fecha de Devolución</th>
                  <th>Acciones</th>
               </tr>
            </thead>
            <tbody>
               {Array.isArray(rentasFiltradas) && rentasFiltradas.map((renta, index) => {
                  
                  const nombreVestido = renta.producto_nombre ? renta.producto_nombre : 'No especificado / Cargando...';
                  const precioDeRenta = renta.precio_renta ? Number(renta.precio_renta || 0) : 0;

                  const totalAnticipos = Number(renta.anticipoEfectivo || 0) + Number(renta.anticipoTarjeta || 0);
                  const faltaPorPagarCalculado = precioDeRenta - totalAnticipos;

                  const esLiquidado = renta.liquidado === true || renta.liquidado === 1 || renta.liquidado === '1' || renta.liquidado === 'true';
                  const tieneAjuste = renta.ajuste === true || renta.ajuste === 1 || renta.ajuste === '1' || renta.ajuste === 'true';
                  const tieneNotas = renta.notes || renta.notas;

                  const mostrarHaciaArriba = index >= 1;

                  return (
                     <tr key={renta.id}>
                        <td className="id-cell-tooltip">
                           <span className="id-number">{renta.id}</span>
                           
                           <div className={`tooltip-box ${mostrarHaciaArriba ? 'up' : ''}`}>
                              <h4>Resumen de Renta {renta.id}</h4>
                              
                              <div className="tooltip-content-grid">
                                 <div className="tooltip-col">
                                    <p className="tooltip-seccion-titulo">📏 Ajustes de Costura</p>
                                    
                                    {tieneAjuste && renta.fechaAjuste && (
                                       <p className="tooltip-fecha-ajuste-top">
                                          📅 <strong>Cita de ajuste:</strong> {formatearFechaSafe(renta.fechaAjuste, {day: 'numeric', month: 'short'})}
                                       </p>
                                    )}

                                    {tieneAjuste ? (
                                       <div className="tooltip-grid">
                                          <p><strong>Bastilla:</strong> {renta.bastilla || '—'}</p>
                                          <p><strong>Busto:</strong> {renta.busto || '—'}</p>
                                          <p><strong>Tirantes:</strong> {renta.tirantes || '—'}</p>
                                          <p><strong>Manga/P:</strong> {renta.mangaPuno || '—'}</p>
                                          <p><strong>Cintura:</strong> {renta.cintura || '—'}</p>
                                          <p><strong>Espalda:</strong> {renta.espalda || '—'}</p>
                                       </div>
                                    ) : (
                                       <p className="no-ajustes-text">❌ Sin modificaciones de costura.</p>
                                    )}
                                 </div>

                                 <div className="tooltip-col">
                                    <p className="tooltip-seccion-titulo">Vestido</p>
                                    <p className="tooltip-vestido-nombre">✨ {nombreVestido}</p>
                                    <img src={`/images/${renta.imagen_nombre}`} style={{width:'150px', borderRadius:'10px'}} alt="Vestido"/>
                                 </div>

                                 <div className="tooltip-col">
                                    <p className="tooltip-seccion-titulo">📍 Cliente</p>
                                    <div style={{background: '#fdecfa', fontSize:'0.8rem', padding:'10px', borderRadius:'8px'}}>
                                       <p><strong>Nombre: </strong>{renta.name}</p>
                                       <p><strong>Teléfono: </strong>{renta.telefono}</p>
                                       <p><strong>Fecha Renta: </strong>{formatearFechaSafe(renta.fechaRenta, opciones)}</p>
                                    </div>
                                    <p className="tooltip-seccion-titulo">💰 Finanzas y Cuenta</p>
                                    <div className="tooltip-finanzas-box">
                                       <p><strong>Precio Renta:</strong> ${precioDeRenta}</p> 
                                       <p style={{ marginTop: '4px' }}><strong>Anticipo Total:</strong> ${totalAnticipos}</p>
                                       <span className="tooltip-finanzas-desglose">
                                          (Efec: ${renta.anticipoEfectivo || 0} | Tarj: ${renta.anticipoTarjeta || 0})
                                       </span>
                                       <div className="tooltip-restante-row">
                                          <strong>Falta por pagar:</strong> 
                                          <span className="restante-monto">${faltaPorPagarCalculado}</span>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="tooltip-col">
                                    <p className="tooltip-seccion-titulo">👜 Complementos</p>
                                    <div className="tooltip-grid-mini" style={{ marginBottom: tieneNotas ? '14px' : '0' }}>
                                       <p><strong>Bolso:</strong> {renta.bolso || '—'}</p>
                                       <p><strong>Aretes:</strong> {renta.aretes || '—'}</p>
                                    </div>

                                    {tieneNotas ? (
                                       <div className="tooltip-notas-container-inline">
                                          <p className="tooltip-seccion-titulo">📝 Notas Generales</p>
                                          <p className="notas-texto">{renta.notes || renta.notas}</p>
                                       </div>
                                    ) : null}
                                 </div>
                              </div>
                           </div>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                           <span className={`icono-liquidado-neumorphic ${esLiquidado ? 'pagado' : 'pendiente'}`}>
                              {esLiquidado ? '✔' : '✕'}
                           </span>
                        </td>

                        <td>{renta.producto_nombre}</td>
                        <td>{formatearFechaSafe(renta.fechaEntrega, opciones)}</td>
                        
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
                        
                        <td>{formatearFechaSafe(renta.fechaDevolucion, opciones)}</td>

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
                  );
               })}
            </tbody>
         </table>

         <style>{`
               .rentas-container {
                  max-width: 1150px; 
                  margin: 20px auto;
                  padding: 0 20px;
               }
               
               .filtros-container-bar {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 20px;
                  align-items: flex-end;
                  background-color: #fcfcfc;
                  padding: 20px;
                  border-radius: 16px;
                  margin-bottom: 20px;
                  box-shadow: 4px 4px 12px rgba(0,0,0,0.03);
               }

               .filtro-grupo {
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
               }

               .filtro-grupo label {
                  margin: 0;
                  font-size: 0.85rem;
                  font-weight: 600;
                  color: #6b7280;
               }

               .filtro-grupo-fechas {
                  display: flex;
                  gap: 15px;
               }

               .input-fecha {
                  font-family: inherit;
                  padding: 6px 12px;
               }

               .rentas-table {
                  width: 100%;
                  border-collapse: separate; 
                  border-spacing: 0;         
                  background-color: #fcfcfc; 
                  border-radius: 16px;
                  overflow: visible;         
                  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
               }

               .rentas-table th,
               .rentas-table td {
                  padding: 16px;
                  text-align: left;
                  border-bottom: 1px solid #e5e7eb;
                  vertical-align: middle;
                  font-size: 0.9rem;
               }

               .rentas-table th:first-child {
                  border-top-left-radius: 16px;
               }
               .rentas-table th:last-child {
                  border-top-right-radius: 16px;
               }

               .rentas-table tr:last-child td {
                  border-bottom: none;
               }
               
               .rentas-table tr:last-child td:first-child {
                  border-bottom-left-radius: 16px;
               }
               .rentas-table tr:last-child td:last-child {
                  border-bottom-right-radius: 16px;
               }

               .rentas-table th {
                  background-color: #eeecec; 
                  font-weight: 600;
                  color: #374151;
               }

               .id-cell-tooltip {
                  position: relative; 
                  cursor: pointer;       
               }

               .id-number {
                  font-weight: bold;
                  color: #db2777; 
                  font-size: 1.05rem;
               }

               .tooltip-box {
                  display: none;
                  position: absolute;
                  top: 100%; 
                  left: 15px;
                  background-color: #ffffff;
                  color: #374151;
                  padding: 16px;
                  border-radius: 14px;
                  width: 730px; 
                  z-index: 999;
                  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15), 
                              0 4px 10px rgba(0, 0, 0, 0.04);
                  border: 1px solid #e5e7eb;
                  text-align: left;
               }

               .tooltip-box::before {
                  content: "";
                  position: absolute;
                  bottom: 100%; 
                  left: 20px;
                  border-width: 8px;
                  border-style: solid;
                  border-color: transparent transparent #ffffff transparent;
               }

               .tooltip-box.up {
                  top: auto;
                  bottom: 100%; 
                  margin-bottom: 12px;
                  box-shadow: 0 -12px 30px rgba(0, 0, 0, 0.15), 
                              0 -4px 10px rgba(0, 0, 0, 0.04);
               }

               .tooltip-box.up::before {
                  bottom: auto;
                  top: 100%; 
                  border-color: #ffffff transparent transparent transparent;
               }

               .id-cell-tooltip:hover .tooltip-box {
                  display: block;
               }

               .tooltip-box h4 {
                  margin: 0 0 12px 0;
                  color: #db2777; 
                  font-size: 1.05rem;
                  border-bottom: 2px solid #fce7f3;
                  padding-bottom: 6px;
               }

               .tooltip-content-grid {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr); 
                  gap: 16px;
               }

               .tooltip-seccion-titulo {
                  margin: 0 0 8px 0;
                  font-size: 0.8rem;
                  font-weight: bold;
                  color: #4b5563;
                  text-transform: uppercase;
                  letter-spacing: 0.6px;
               }

               .tooltip-fecha-ajuste-top {
                  margin: 0 0 8px 0;
                  font-size: 0.82rem;
                  color: #1f2937;
                  background-color: #fff1f2;
                  padding: 4px 8px;
                  border-radius: 4px;
                  display: inline-block;
               }

               .tooltip-vestido-nombre {
                  margin: 0 0 12px 0;
                  font-size: 0.9rem;
                  font-weight: 600;
                  color: #db2777;
                  background: #fdf2f8;
                  padding: 6px 10px;
                  border-radius: 6px;
               }

               .tooltip-grid {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr); 
                  gap: 6px;
                  font-size: 0.8rem;
                  background-color: #f9fafb;
                  padding: 10px;
                  border-radius: 8px;
               }

               .tooltip-grid p { margin: 0; }

               .tooltip-finanzas-box {
                  background-color: #f0fdf4;
                  padding: 10px;
                  border-radius: 8px;
                  font-size: 0.82rem;
                  margin-bottom: 12px;
                  border: 1px solid #dcfce7;
               }
               .tooltip-finanzas-box p { margin: 0; }
               .tooltip-finanzas-desglose {
                  font-size: 0.72rem;
                  color: #166534;
                  display: block;
                  margin-bottom: 6px;
               }
               .tooltip-restante-row {
                  border-top: 1px dashed #bbf7d0;
                  padding-top: 6px;
                  margin-top: 4px;
                  display: flex;
                  justify-content: space-between;
               }
               .restante-monto {
                  color: #b91c1c;
                  font-weight: bold;
               }

               .tooltip-grid-mini {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 6px;
                  font-size: 0.8rem;
                  background-color: #f9fafb;
                  padding: 8px 10px;
                  border-radius: 6px;
               }
               .tooltip-grid-mini p { margin: 0; }

               .no-ajustes-text {
                  margin: 0;
                  font-size: 0.8rem;
                  color: #9ca3af;
                  background-color: #f9fafb;
                  padding: 10px;
                  border-radius: 8px;
               }

               .tooltip-notas-container-inline {
                  display: flex;
                  flex-direction: column;
               }

               .notas-texto {
                  margin: 0;
                  font-size: 0.8rem;
                  background-color: #fffbeb; 
                  color: #78350f;
                  padding: 10px;
                  border-radius: 6px;
                  border-left: 3px solid #f59e0b;
                  max-height: 110px; 
                  overflow-y: auto;  
               }

               .icono-liquidado-neumorphic {
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  font-size: 0.85rem;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  box-shadow: inset 1px 1px 3px rgba(0,0,0,0.15), 1px 1px 2px rgba(255,255,255,0.8);
               }
               .icono-liquidado-neumorphic.pagado {
                  background-color: #e6f9ed;
                  color: #166534;
               }
               .icono-liquidado-neumorphic.pendiente {
                  background-color: #fee2e2;
                  color: #991b1b;
               }
               
               .select-estado-neumorphic {
                  -webkit-appearance: none;  
                  -moz-appearance: none;
                  appearance: none;          

                  border: none;
                  outline: none;
                  
                  padding: 8px 32px 8px 12px; 
                  border-radius: 8px;
                  background: #ffffff;
                  color: #4b5563;
                  font-weight: 500;
                  cursor: pointer;
                  
                  box-shadow: inset 2px 2px 5px #bebebe, 
                              inset -2px -2px 5px #ffffff;
                  transition: all 0.3s ease;

                  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
                  background-repeat: no-repeat;
                  background-position: right 12px center;
                  background-size: 14px;
               }

               .select-estado-neumorphic:focus {
                  box-shadow: inset 1px 1px 3px #bebebe, 
                              inset -1px -1px 3px #ffffff,
                              0 0 4px rgba(59, 130, 246, 0.5); 
               }
               
               .btn-neumorphic {
                  border: none;
                  outline: none;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  color: #666;
                  font-size: 1.2rem;
                  background: linear-gradient(145deg, #ffffff, #e2e2e2);
                  box-shadow: 2px 2px 8px #acacac, 
                              -2px -2px 8px #f1f1f1;
                  transition: all 0.2s ease;
               }

               .btn-neumorphic:active {
                  background: #ffffff;
                  box-shadow: inset 2px 2px 5px #d1d1d1, 
                              inset -2px -2px 5px #ffffff;
                  color: #333;
               }
               .acciones-container{
                  display: flex;
                  flex-direction: row;
                  gap: 10px;
                  align-items: center;
               }
         `}</style>
      </div>
   );
}