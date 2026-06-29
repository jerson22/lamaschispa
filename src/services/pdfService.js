const PDFDocument = require('pdfkit');
const fs = require('fs');

function crearPDFLigero() {
  const doc = new PDFDocument();

  // Guardar el archivo en el disco
  doc.pipe(fs.createWriteStream('recibo_rapido.pdf'));

  // Añadir contenido posicionándolo con coordenadas o flujo de texto
  doc.fontSize(25).text('Mi Tienda S.A.', 100, 80);
  
  doc.fontSize(12)
     .text('Fecha: 22/06/2026', 100, 120)
     .text('Cliente: Juan Pérez', 100, 140);

  // Dibujar una línea divisoria
  doc.moveTo(100, 170)
     .lineTo(500, 170)
     .stroke();

  doc.fontSize(16).text('Total a pagar: $150.00 MXN', 100, 200);

  // Finalizar el documento
  doc.end();
  console.log('¡PDF de alto rendimiento creado!');
}

crearPDFLigero();