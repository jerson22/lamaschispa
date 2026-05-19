import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
   const [currentIndex, setCurrentIndex] = useState(0);
   const navigate = useNavigate();

   // Unificar fuentes de imagen: puede ser un array de nombres de imagen (imagenes) o un solo nombre (imagen)
   const imagenes = product.imagenes && product.imagenes.length > 0
      ? product.imagenes
      : (product.imagen ? [product.imagen] : []);

   const nextImage = (e) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % imagenes.length);
   };

   const prevImage = (e) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
   };

   const isAccessory = typeof window !== 'undefined' && window.location.pathname.includes('accesorio');

   return (
      <div className="product-card">
         <div className={`product-image-container ${isAccessory ? 'is-accessory' : ''}`}>
            {imagenes.length > 0 ? (
               <img
                  src={'../images/' + imagenes[currentIndex]}
                  alt={product.name}
                  className="product-image"
               />
            ) : (
               <div className="product-placeholder">👗</div>
            )}

            {imagenes.length > 1 && (
               <>
                  <button className="carousel-button prev" onClick={prevImage} aria-label="Imagen anterior">❮</button>
                  <button className="carousel-button next" onClick={nextImage} aria-label="Siguiente imagen">❯</button>
                  <div className="carousel-dots">
                     {imagenes.map((_, index) => (
                        <span
                           key={index}
                           className={`dot ${index === currentIndex ? 'active' : ''}`}
                           onClick={(e) => {
                              e.stopPropagation();
                              setCurrentIndex(index);
                           }}
                        ></span>
                     ))}
                  </div>
               </>
            )}

            <div className="product-badges">
               {product.talla && (<span className="badge-talla">{product.talla}</span>)}
            </div>
         </div>
         <div className="product-info">
            <h3 className="product-nombre">{product.name}</h3>
            <div className="product-details">
               {product.color && <p><strong>Color:</strong> {product.color}</p>}
               {product.talla && (<p><strong>Talla:</strong> {product.talla}</p>)}
               {/* <p>{product.descripcion}</p> */}
            </div>
            <div className="product-footer">
               <div className="prices">
                  <span className="product-precio-label">Renta:</span>
                  <span className="product-precio">${product.precio_renta}</span>
                  {product.precio_venta && (
                     <div className="renta-info">
                        <span className="product-precio-label">Venta:</span>
                        <span className="product-precio-small">${product.precio_venta}</span>
                     </div>
                  )}
               </div>
               <button className="product-button" onClick={() => navigate(`/producto/${product.id}`)}>Ver</button>
            </div>
         </div>
      </div>
   );
}
