const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function generarReciboConPlantilla(recibo, tipo, outputPath) {

   /* =========================
      1. Cargar plantilla PDF
   ========================= */
   const plantillaPath = path.join(__dirname, 'plantilla_recibo.pdf');
   const plantillaBytes = fs.readFileSync(plantillaPath);
   const pdfDoc = await PDFDocument.load(plantillaBytes);
   

   /* =========================
      2. Fuente
   ========================= */
   const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

   /* =========================
      3. Página
   ========================= */
   const page = pdfDoc.getPages()[0];
   const { width, height } = page.getSize();

   console.log('PAGE SIZE:', width, height);

   /* =========================
      4. MAPA DE COORDENADAS
   ========================= */

   const logoPath = path.join(app.getPath('userData'), 'logo.png');

   if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);

      page.drawImage(logoImage, {
         x: 46,
         y: height - 85,
         width: 50,
         height: 50
      });
   }

   const layout = {

      //Empresa

      empresa_nombre: { x: 110, y: height - 50 },
      empresa_nit:    { x: 110, y: height - 60 },
      empresa_direccion: { x: 110, y: height - 70 },
      empresa_telefono:  { x: 110, y: height - 80 },

      tipo:       { x: width - 75, y: height - 45 },
      numero:     { x: width - 90, y: height - 77 },
      fecha:      { x: width - 110, y: height - 99 },

      cliente:    { x: 46, y: height - 130 },
      entidad:    { x: 46, y: height - 173 },

      // Afiliación
      afi_mes:         { x: 65,  y: height - 225 },
      afi_ano:         { x: 95,  y: height - 225 },
      afi_afiliacion: { x: 180, y: height - 225 },
      afi_cc:          { x: 305, y: height - 225 },
      afi_concepto:   { x: 395, y: height - 223 },
      afi_valor:      { x: 520, y: height - 225 },

      // Póliza
      pol_mes:     { x: 65,  y: height - 259 },
      pol_ano:     { x: 95,  y: height - 259 },
      pol_ramo:    { x: 180, y: height - 259 },
      pol_numero:  { x: 305, y: height - 259 },
      pol_valor:   { x: 520, y: height - 259 },

      total:      { x: width - 120, y: 93 }
   };

   /* =========================
      5. ENCABEZADO
   ========================= */

   function formatearFechaPDF(fechaISO) {
      if (!fechaISO || !fechaISO.includes('-')) return '';
      const [y, m, d] = fechaISO.split('-');
      return `${d}/${m}/${y}`;
   }


   /* =========================
      EMPRESA DATOS 
   ========================= */

   const empresa = recibo.empresa || {};

   page.drawText(empresa.nombre || '', {
      ...layout.empresa_nombre,
      size: 10,
      font
   });

   page.drawText(`NIT: ${empresa.nit || ''}`, {
      ...layout.empresa_nit,
      size: 8,
      font
   });

   page.drawText(empresa.direccion || '', {
      ...layout.empresa_direccion,
      size: 8,
      font
   });

   page.drawText(`Tel: ${empresa.telefono || ''}`, {
      ...layout.empresa_telefono,
      size: 8,
      font
   });

   /* =========================
      RECIBO CABECERA   
   ========================= */


   const prefijo = 'B';
   const numeroRecibo = `${prefijo}-${recibo.id}`;

   page.drawText(tipo, {
      ...layout.tipo,
      size: 7,
      font,
      color: rgb(0, 0.4, 0.7)
   });

   page.drawText(numeroRecibo, {
      ...layout.numero,
      size: 10,
      font
   });

   page.drawText(formatearFechaPDF(recibo.fecha) || '', {
      ...layout.fecha,
      size: 10,
      font
   });

   page.drawText(recibo.cliente || '', {
      ...layout.cliente,
      size: 11,
      font
   });

   page.drawText(recibo.entidad || 'FUNERARIA', {
      ...layout.entidad,
      size: 10,
      font
   });

   /* =========================
      6. AFILIACIÓN
   ========================= */
   const afi = recibo.afiliacion || {};

   page.drawText(afi.mes || '',         { ...layout.afi_mes, size: 9, font });
   page.drawText(afi.ano || '',         { ...layout.afi_ano, size: 9, font });
   page.drawText(afi.afiliacion || '',  { ...layout.afi_afiliacion, size: 9, font });
   page.drawText(afi.cc || '',          { ...layout.afi_cc, size: 9, font });

   page.drawText(afi.concepto || '', {
      ...layout.afi_concepto,
      size: 6,
      font
   });

   page.drawText(String(afi.valor || ''), { ...layout.afi_valor, size: 9, font });

   /* =========================
      7. PÓLIZA
   ========================= */
   const pol = recibo.poliza || {};

   page.drawText(pol.mes || '',      { ...layout.pol_mes, size: 9, font });
   page.drawText(pol.ano || '',      { ...layout.pol_ano, size: 9, font });
   page.drawText(pol.ramo || '',     { ...layout.pol_ramo, size: 9, font });

   page.drawText(pol.numero || '', {
      ...layout.pol_numero,
      size: 7,
      font
   });

   page.drawText(String(pol.valor || ''), { ...layout.pol_valor, size: 9, font });

   /* =========================
      8. TOTAL
   ========================= */
   const totalFormateado = Number(recibo.total || 0).toLocaleString('es-CO');

   page.drawText(`$ ${totalFormateado}`, {
      ...layout.total,
      size: 12,
      font
   });

   /* =========================
      9. GUARDAR PDF
   ========================= */
   const pdfBytes = await pdfDoc.save();

   const fileName = `Recibo_${numeroRecibo}_${tipo}.pdf`;
   fs.writeFileSync(path.join(outputPath, fileName), pdfBytes);
}
module.exports = generarReciboConPlantilla;