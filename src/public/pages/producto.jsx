import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Producto = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const [product, setProduct] = useState(null);
   const [reservas, setReservas] = useState([]);
   const [loading, setLoading] = useState(true);
   const [loadingReservas, setLoadingReservas] = useState(false);
   const [error, setError] = useState(null);
   const [errorReservas, setErrorReservas] = useState(null);
   const [currentImageIndex, setCurrentImageIndex] = useState(0);

   useEffect(() => {
      const fetchProducto = async () => {
         try {
            const response = await fetch(`/api/productos/${id}`);
            if (!response.ok) {
               throw new Error('No se pudo cargar el producto');
            }
            const data = await response.json();
            setProduct(data);
         } catch (err) {
            setError(err.message);
         } finally {
            setLoading(false);
         }
      };

      fetchProducto();
   }, [id]);

   const formatFechaEvento = (fecha) => {
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      return fecha.toLocaleDateString('es-ES', options).replace(/ de /g, ' ');
   };

   useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const fetchReservas = async () => {
         setLoadingReservas(true);
         try {
            const response = await fetch(`/api/productos/${id}/reservas`, {
               headers: { 'auth-token': token }
            });
            if (!response.ok) {
               throw new Error('No se pudo cargar las fechas de renta');
            }
            const data = await response.json();
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const proximas = data
               .map((reserva) => ({ ...reserva, fechaevento: new Date(reserva.fechaevento) }))
               .filter((reserva) => reserva.fechaevento >= hoy)
               .sort((a, b) => a.fechaevento - b.fechaevento);
            setReservas(proximas);
         } catch (err) {
            console.error(err);
            setErrorReservas(err.message || 'Error al obtener las fechas de renta');
         } finally {
            setLoadingReservas(false);
         }
      };

      fetchReservas();
   }, [id]);


   if (loading) return <div className="loading">Cargando detalles del producto...</div>;
   if (error) return <div className="error">Error: {error}</div>;
   if (!product) return <div className="error">Producto no encontrado.</div>;

   const imagenes = product.imagenes && product.imagenes.length > 0
      ? product.imagenes
      : (product.imagen ? [product.imagen] : []);

   return (
      <div className="producto-detail-container">
         <button className="back-button" onClick={() => navigate(-1)}>
            ❮ Volver
         </button>

         <div className="producto-detail-grid">
            {/* Sección de Imágenes */}
            <div className="producto-detail-images">
               <div className="main-image-container">
                  {imagenes.length > 0 ? (
                     <img
                        src={`/images/${imagenes[currentImageIndex]}`}
                        alt={product.name}
                        className="main-image"
                     />
                  ) : (
                     <div className="product-placeholder main-placeholder">👗</div>
                  )}
               </div>

               {imagenes.length > 1 && (
                  <div className="thumbnail-list">
                     {imagenes.map((img, index) => (
                        <div
                           key={index}
                           className={`thumbnail-container ${index === currentImageIndex ? 'active' : ''}`}
                           onClick={() => setCurrentImageIndex(index)}
                        >
                           <img src={`/images/${img}`} alt={`${product.name} ${index + 1}`} className="thumbnail-image" />
                        </div>
                     ))}
                  </div>
               )}
            </div>

            {/* Sección de Detalles */}
            <div className="producto-detail-info">
               <div className="badges-container">
                  {product.talla && <span className="badge-talla">{product.talla}</span>}
                  {product.color && <span className="badge-color-tag">{product.color}</span>}
               </div>

               <h1 className="producto-detail-title">{product.name}</h1>

               <div className="producto-detail-prices">
                  <div className="price-box renta">
                     <span className="price-label">Precio Renta</span>
                     <span className="price-value">${product.precio_renta}</span>
                  </div>
                  {product.precio_venta && (
                     <div className="price-box venta">
                        <span className="price-label">Precio Venta</span>
                        <span className="price-value">${product.precio_venta}</span>
                     </div>
                  )}
               </div>

               <div className="producto-detail-description">
                  <h3>Descripción</h3>
                  <p>{product.descripcion || 'No hay descripción disponible para este producto.'}</p>
               </div>

               <div className="producto-detail-attributes">
                  {product.silueta && (
                     <div className="attribute">
                        <span className="attr-label">Silueta:</span>
                        <span className="attr-value">Corte {product.silueta}</span>
                     </div>
                  )}
                  {product.mangas && (
                     <div className="attribute">
                        <span className="attr-label">Mangas:</span>
                        <span className="attr-value ">{product.mangas}</span>
                     </div>
                  )}
               </div>

               {localStorage.getItem('token') ? (
                  <div className="producto-detail-reservas">
                     <h3>Fechas de renta próximas</h3>
                     {loadingReservas ? (
                        <p>Cargando fechas...</p>
                     ) : errorReservas ? (
                        <p className="error">{errorReservas}</p>
                     ) : reservas.length === 0 ? (
                        <p>Este producto no tiene rentas próximas registradas.</p>
                     ) : (
                        <ul>
                           {reservas.map((reserva) => (
                              <li key={reserva.id}>
                                 <strong>{formatFechaEvento(reserva.fechaevento)}</strong> — {reserva.cliente}
                              </li>
                           ))}
                        </ul>
                     )}
                  </div>
               ) : null}

               <button className="btn-contactar">Me interesa</button>
            </div>
         </div>
      </div>
   );
};

export default Producto;
