import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Rentas() {
   const {id} = useParams();
   const navigate = useNavigate();
   const [renta, setRenta] = useState(null);

   useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const fetchRenta = async () => {
         try {
            const response = await fetch(`/api/renta/${id}`, {
               headers: {
                  'Authorization': `Bearer ${token}`
               }
            });
            if (!response.ok) {
               throw new Error('No se pudo cargar la renta');
            }
            const data = await response.json();
            setRenta(data);
         } catch (err) {
            setError(err.message);
         } finally {
            setLoading(false);
         }
      };

      fetchRenta();
   }, [id]);

   return(
      <div>
         <h1>Renta {id}</h1>
      </div>
   )
}