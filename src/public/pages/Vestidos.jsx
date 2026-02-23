import React, { useState, useEffect } from 'react';
import VestidoCard from '../components/VestidoCard';

const Vestidos = () => {
   const [vestidos, setVestidos] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   useEffect(() => {
      const fetchVestidos = async () => {
         try {
            const response = await fetch('/api/vestidos');
            if (!response.ok) {
               throw new Error('Error al cargar los vestidos');
            }
            const data = await response.json();
            setVestidos(data);
         } catch (err) {
            setError(err.message);
         } finally {
            setLoading(false);
         }
      };

      fetchVestidos();
   }, []);

   if (loading) return <div className="loading">Cargando vestidos...</div>;
   if (error) return <div className="error">Error: {error}</div>;

   return (
      <div className="vestidos-container">
         <h1 className="page-title">Galería de Vestidos</h1>
         <div className="vestidos-grid">
            {vestidos.length > 0 ? (
               vestidos.map((vestido) => (
                  <VestidoCard key={vestido.id} vestido={vestido} />
               ))
            ) : (
               <p className="no-data">No hay vestidos disponibles en este momento.</p>
            )}
         </div>
      </div>
   );
};

export default Vestidos;
