import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { AiOutlineClear } from "react-icons/ai";

const Vestidos = () => {
   const [vestidos, setVestidos] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const [searchTerm, setSearchTerm] = useState('');
   const [selectedColor, setSelectedColor] = useState('');
   const [selectedTalla, setSelectedTalla] = useState('');
   const [selectedSilueta, setSelectedSilueta] = useState('');
   const [selectedMangas, setSelectedMangas] = useState('');

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

   const uniqueColors = [...new Set(vestidos.map(v => v.color).filter(Boolean))].sort((a, b) => a.localeCompare(b));
   const uniqueTallas = [...new Set(vestidos.map(v => v.talla).filter(Boolean))].sort((a, b) => parseInt(a) - parseInt(b));
   const uniqueSiluetas = [...new Set(vestidos.map(v => v.silueta).filter(Boolean))];
   const uniqueMangas = [...new Set(vestidos.map(v => v.mangas).filter(Boolean))];

   const vestidosFiltrados = vestidos.filter((vestido) => {
      const matchesSearch =
         vestido.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (vestido.descripcion && vestido.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesColor = selectedColor === '' || vestido.color === selectedColor;
      const matchesTalla = selectedTalla === '' || vestido.talla === selectedTalla;
      const matchesSilueta = selectedSilueta === '' || vestido.silueta === selectedSilueta;
      const matchesMangas = selectedMangas === '' || vestido.mangas === selectedMangas;

      return matchesSearch && matchesColor && matchesTalla && matchesSilueta && matchesMangas;
   });

   if (loading) return <div className="loading">Cargando vestidos...</div>;
   if (error) return <div className="error">Error: {error}</div>;

   const mayus = (texto) => {
      if (!texto) return '';
      return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
   };
   
   const clearFilters = ()=>{
      setSelectedColor('');
      setSelectedTalla('');
      setSelectedSilueta('');
      setSelectedMangas('');
      setSearchTerm('');
   };

   return (
      <div className="vestidos-container">
         <h1 className="page-title">Galería de Vestidos</h1>

         <div className="filtros-container">
            <input
               type="text"
               className="filtro-input"
               placeholder="Buscar por nombre o descripción..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select className="filtro-select" value={selectedTalla} onChange={(e) => setSelectedTalla(e.target.value)}>
               <option value="">Tallas</option>
               {uniqueTallas.map(talla => (
                  <option key={talla} value={talla}>{talla.toUpperCase()}</option>
               ))}
            </select>

            <select className="filtro-select" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
               <option value="">Colores</option>
               {uniqueColors.map(color => (
                  <option key={color} value={color}>{mayus(color)}</option>
               ))}
            </select>

            <select className="filtro-select" value={selectedSilueta} onChange={(e) => setSelectedSilueta(e.target.value)}>
               <option value="">Siluetas</option>
               {uniqueSiluetas.map(silueta => (
                  <option key={silueta} value={silueta}>Corte {mayus(silueta)}</option>
               ))}
            </select>

            <select className="filtro-select" value={selectedMangas} onChange={(e) => setSelectedMangas(e.target.value)}>
               <option value="">Mangas</option>
               {uniqueMangas.map(mangas => (
                  <option key={mangas} value={mangas}>{mayus(mangas)}</option>
               ))}
            </select>
            <button className="filtro-btn" onClick={clearFilters}>
               <AiOutlineClear />
               <span>Limpiar</span>
            </button>
         </div>

         <div className="vestidos-grid">
            {vestidosFiltrados.length > 0 ? (
               vestidosFiltrados.map((vestido) => (
                  <ProductCard key={vestido.id} product={vestido} />
               ))
            ) : (
               <p className="no-data">No se encontraron vestidos con esos filtros.</p>
            )}
         </div>
      </div>
   );
};

export default Vestidos;
