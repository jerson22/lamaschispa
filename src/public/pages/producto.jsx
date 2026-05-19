import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Producto = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const [product, setProduct] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
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

               <button className="btn-contactar">Me interesa</button>
            </div>
         </div>
      </div>
   );
};

export default Producto;
