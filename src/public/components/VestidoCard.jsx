import React from 'react';

const VestidoCard = ({ vestido }) => {
   return (
      <div className="vestido-card">
         <div className="vestido-image-container">
            {vestido.imagen ? (
               <img src={'../images/' + vestido.imagen} alt={vestido.name} className="vestido-image" />
            ) : (
               <div className="vestido-placeholder">👗</div>
            )}
            <div className="vestido-badges">
               <span className="badge-talla">{vestido.talla}</span>
               {/* <span className="badge-color" style={{ backgroundColor: vestido.color?.toLowerCase() }}></span> */}
            </div>
         </div>
         <div className="vestido-info">
            <h3 className="vestido-nombre">{vestido.name}</h3>
            <div className="vestido-details">
               <p><strong>Color:</strong> {vestido.color}</p>
               <p><strong>Talla:</strong> {vestido.talla}</p>
               <p>{vestido.descripcion}</p>
            </div>
            <div className="vestido-footer">
               <div className="prices">
                  <span className="vestido-precio-label">Renta:</span>
                  <span className="vestido-precio">${vestido.precio_renta}</span>
                  {vestido.precio_venta && (
                     <div className="renta-info">
                        <span className="vestido-precio-label">Venta:</span>
                        <span className="vestido-precio-small">${vestido.precio_venta}</span>
                     </div>
                  )}
               </div>
               <button className="vestido-button">Ver</button>
            </div>
         </div>
      </div>
   );
};

export default VestidoCard;
