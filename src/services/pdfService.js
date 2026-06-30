import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración necesaria en ES Modules para obtener las rutas de las carpetas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FUNCIÓN AUXILIAR: Convierte '2026-06-29' a 'Lunes, 29 de junio de 2026'
function formatearFechaTexto(fechaStr) {
   if (!fechaStr) return '';
   const fecha = new Date(fechaStr + 'T00:00:00');
   if (isNaN(fecha.getTime())) return fechaStr;

   const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
   const fechaFormateada = new Intl.DateTimeFormat('es-MX', opciones).format(fecha);

   // Capitaliza la primera letra (ej: "lunes" -> "Lunes")
   return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
}

export async function CrearReciboPDF(datosVenta) {
   // 1. Buscamos la ruta real de tu imagen en el disco duro
   const rutaImagen = path.join(__dirname, '../public/images/logo.png');
   const rutaImagenRedes = path.join(__dirname, './redes.png');
   
   // 2. Leemos el archivo y lo convertimos a formato Base64
   const logoBase64 = fs.readFileSync(rutaImagen).toString('base64');
   const logoRedesBase64 = fs.readFileSync(rutaImagenRedes).toString('base64');

   // Procesamiento para el recuadro numérico superior derecho
   let dia = '', mes = '', ano = '';
   if (datosVenta?.fechaRenta) {
      const fecha = new Date(datosVenta.fechaRenta + 'T00:00:00');
      if (!isNaN(fecha.getTime())) {
         dia = String(fecha.getDate()).padStart(2, '0');
         mes = String(fecha.getMonth() + 1).padStart(2, '0');
         ano = String(fecha.getFullYear());
      }
   }

   // Formatear las fechas largas para el cuerpo del recibo
   const fechaEntregaTexto = formatearFechaTexto(datosVenta.fechaEntrega);
   const fechaDevolucionTexto = formatearFechaTexto(datosVenta.fechaDevolucion || datosVenta.fechaEntrega);
   const fechaAjustesTexto = formatearFechaTexto(datosVenta.fechaAjustes || datosVenta.fechaAjustes);

   const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
   });   
   const page = await browser.newPage();   
   const htmlContenido = `
      <html>
         <head>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
            <style>
               body{
                  font-family: "Poppins", sans-serif;
                  margin: 0;
                  padding: 0;
                  border: 10px solid #fcb624;
               }
               .contenedor{
                  padding: 40px;
               }
               .header-container {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  width: 100%;
                  font-family: 'Arial', sans-serif;
                  box-sizing: border-box;
               }

               .logo-texto {
                  color: #e63380; 
                  font-size: 42px;
                  font-weight: bold;
                  font-family: 'Brush Script MT', cursive, sans-serif; 
                  line-height: 1;
               }

               .subtitulo-texto {
                  color: #f1b426; 
                  font-size: 26px;
                  font-weight: bold;
                  font-style: italic;
                  margin-top: 5px;
               }

               .tabla-recibo {
                  width: 240px;
                  border: 2px solid #e63380;
                  background-color: #ffffff;
               }

               .fila-superior {
                  padding: 5px 10px;
                  font-size: 24px;
                  font-weight: bold;
                  font-style: italic;
                  border-bottom: 2px solid #e63380;
               }

               .fila-inferior {
                  display: flex;
                  height: 60px; 
               }

               .columna-fecha {
                  flex: 1;
                  text-align: center;
                  font-size: 11px;
                  color: #888888;
                  padding-top: 3px;
               }

               .columna-fecha:not(:last-child) {
                  border-right: 2px solid #e63380;
               }
            </style>
         </head>
         <body>
            <div class="contenedor">
               <div class="header-container">
                  <div class="header-left">
                     <div class="logo-texto"><img src="data:image/png;base64,${logoBase64}" width="300"></div>
                     <div class="subtitulo-texto">Recibo de Dinero</div>
                  </div>

                  <div class="header-right">
                     <div class="tabla-recibo">
                        <div class="fila-superior">
                           No. ${datosVenta.productId}
                        </div>
                        <div class="fila-inferior">
                           <div class="columna-fecha">Día<br><p style="font-weight:bold; font-size: 26px; color: black; margin:0;">${dia}</p></div>
                           <div class="columna-fecha">Mes<br><p style="font-weight:bold; font-size: 26px; color: black; margin:0;">${mes}</p></div>
                           <div class="columna-fecha">Año<br><p style="font-weight:bold; font-size: 26px; color: black; margin:0;">${ano}</p></div>
                        </div>
                     </div>
                  </div>

               </div>
               
               <div style="font-size: 25px; display: flex; align-items: baseline; width:100%; gap:10px; margin-top: 30px;">
                  <span style="white-space: nowrap;">Recibí de: </span>
                  <span style="flex-grow:1; border-bottom: 1px solid #000000; padding-bottom:2px;">${datosVenta.name}</span>
               </div>
               <div style="font-size: 25px; display: flex; align-items: baseline; width:100%; gap:10px; margin-top: 20px;">
                  <span style="white-space: nowrap;">Vestido: </span>
                  <span style="flex-grow:1; border-bottom: 1px solid #000000; padding-bottom:2px;">${datosVenta.nombreVestido}</span>
               </div>
            
               <div style="background-color:#eb4b9b; margin-top: 30px; padding: 20px 40px; color:white; font-size:25px; font-weight: bold; display: flex; align-items: center; gap: 60px;">
                  <div style="display: flex; align-items: center; gap: 15px;">
                     <span>Anticipo:</span>
                     <span style="background-color: rgba(255, 255, 255, 0.25); width: 160px; height: 50px; display: inline-flex; align-items: center; justify-content: center;">
                        $${datosVenta.anticipoTotal}
                     </span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 15px;">
                     <span>Restan:</span>
                     <span style="background-color: rgba(255, 255, 255, 0.25); width: 160px; height: 50px; display: inline-flex; align-items: center; justify-content: center;">
                        $${datosVenta.diferenciaAPagar}
                     </span>
                  </div>
               </div>
               <div style="margin-top:15px; text-align: center; font-size: 25px; font-weight: bold; font-style: italic; padding: 20px 40px; ">
                  Horario para recoger tu vestido: 1 p.m. a 8 p.m.
               </div>
               
               <div style="margin-top:20px; background-color: #fbdbeb; text-align: left; font-size: 25px; padding: 20px 40px">
                  Fecha de entrega: ${fechaEntregaTexto}
               </div>
               <div style="margin-top:20px; background-color: #fbdbeb; text-align: left; font-size: 25px; padding: 20px 40px">
                  Fecha de devolución: ${fechaDevolucionTexto}
               </div>
               <div style="margin-top:20px; background-color: #fbdbeb; text-align: left; font-size: 25px; padding: 20px 40px">
                  Fecha de ajustes: ${fechaAjustesTexto}
               </div>
               
               <div style="font-size:12px; text-align:center; margin-top:30px; font-style:italic;">
                  En caso de cancelación por parte del cliente, <strong>el anticipo del 50% del costo total de la renta no será
                  reembolsable</strong>. El vestido deberá ser <strong>devuelto en la fecha acordada</strong>. En <strong>caso de retraso</strong>
                  , se aplicará <strong>una multa de $150.00 por cada día de atraso</strong>. Cualquier daño, mancha irreparable o pérdida en la prenda
                  generará un cargo adicional equivalente al costo de reparación o, en su caso, al valor comercial del
                  vestido. En caso de solicitar <strong>cambio de vestido</strong>, se aplicará un <strong>cargo de $250.00</strong>, más la diferencia
                  correspondiente si el nuevo vestido tiene un costo mayor.
               </div>
               
               <div style="margin-top:10px; text-align: center;">
                  <img src="data:image/png;base64,${logoRedesBase64}" width="500">
               </div>
            </div>
         </body>
      </html>
   `;

   await page.setContent(htmlContenido);

   const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
   });

   await browser.close();
   return pdfBuffer;
}