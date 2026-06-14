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
         <div className="product-info" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    
            {/* 1. FILA SUPERIOR: El título ocupa todo el ancho */}
            <div className="product-title-row" style={{ width: '100%' }}>
               <h3 className="product-nombre" style={{ margin: '0 0 10px 0' }}>{product.name}</h3>
            </div>

            {/* 2. FILA INFERIOR: Detalles a la izquierda y botón a la derecha */}
            <div className="product-bottom-row" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
               
               {/* DETALLES (Izquierda) */}
               <div className="product-details" style={{ flex: '1' }}>
                  {product.color && <p style={{ margin: '2px 0' }}><strong>Color:</strong> {product.color}</p>}
                  {product.talla && <p style={{ margin: '2px 0' }}><strong>Talla:</strong> {product.talla}</p>}
               </div>
               
               {/* BOTÓN (Derecha - Corregido con marginRight) */}
               <div className="product-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: '5px', marginRight: '50px' }}>
                  <button className="product-button" onClick={() => navigate(`/producto/${product.id}`)}>
                     Ver
                  </button>
               </div>

            </div>
         
            {/* <div className="product-footer">
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
            </div> */}
         </div>
      </div>
   );
}
