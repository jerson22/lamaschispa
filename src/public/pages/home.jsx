export default function Home() {
   return (
      <>
         <div style={{
            // backgroundImage: 'linear-gradient(rgba(249, 168, 212, 0.7), rgba(249, 168, 212, 0.4)), url(/images/flores2.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: 'calc(100vh - 80px)', // Restamos la altura aproximada del navbar
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '40px 10px' // Padding para que en móvil no pegue a los bordes
         }}>
            <div className="home-container" style={{
               backgroundColor: 'rgba(247, 247, 247, 0.4)',
            }}>
               <h1>✨Nacidas para Brillar✨</h1>
               <p>En La Más Chispa celebramos la belleza en todas sus formas. Nuestro local está pensado para mujeres auténticas, seguras y radiantes, con una colección de vestidos que realzan cada curva y cada momento especial. Aquí no solo encuentras moda: encuentras actitud, confianza y el brillo que te hace única.</p>
               <p>Porque sabemos que la elegancia no tiene talla, hemos creado un espacio donde las tallas extra son protagonistas y cada diseño está hecho para que te sientas espectacular. Desde eventos glamorosos hasta celebraciones íntimas, siempre tendrás un vestido que te acompañe a brillar.</p>
            </div>
         </div>
      </>
   )
}