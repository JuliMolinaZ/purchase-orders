import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, degrees, PDFImage } from 'pdf-lib';
import { OrdenFormData } from '../validators/ordenSchema';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuración de colores según test.html
 */
const COLORS = {
  rojo: rgb(200 / 255, 0, 0),  // Rojo del encabezado #C80000
  blanco: rgb(1, 1, 1),
  negro: rgb(0, 0, 0),
  grisClaro: rgb(0.94, 0.94, 0.94),  // #F0F0F0
  grisMuyClaro: rgb(0.98, 0.98, 0.98),  // #FAFAFA
  grisTexto: rgb(0.47, 0.47, 0.47),  // #787878
  grisMuyOscuro: rgb(0.31, 0.31, 0.31),  // #505050
  marcaAgua: rgb(245 / 255, 245 / 255, 245 / 255),  // Marca de agua muy clara
  bordeGris: rgb(180 / 255, 180 / 255, 180 / 255),
  bordeGrisClaro: rgb(200 / 255, 200 / 255, 200 / 255),
};

/**
 * Dimensiones de página (Letter: 8.5 x 11 pulgadas = 215.9 x 279.4 mm)
 * Convertido a puntos: 612 x 792 puntos
 * 1mm = 2.83465 puntos
 */
const PAGE = {
  width: 612,  // 215.9 mm
  height: 792, // 279.4 mm
  marginX: 15 * 2.83465, // 15mm en puntos
  headerHeight: 20 * 2.83465, // 20mm en puntos
};

/**
 * Interfaz para las fuentes del PDF
 */
interface PDFFonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  timesItalic: PDFFont;
}

/**
 * Formatea una fecha al estilo largo (como en test.html)
 * Ejemplo: "15 de marzo de 2025"
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '__/__/____';

  try {
    const date = new Date(dateString + 'T00:00:00');

    if (isNaN(date.getTime())) {
      return '__/__/____';
    }

    const opciones: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-MX', opciones);
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '__/__/____';
  }
}

/**
 * Formatea una moneda mexicana (sin MXN al final)
 */
function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    return '$0.00';
  }
  
  try {
    const formatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
    
    // Remover "MXN" del final si existe
    return formatted.replace(/\s*MXN\s*$/, '');
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Normaliza y limpia el texto
 */
function normalizeText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  return String(text).replace(/\s+/g, ' ').trim();
}

/**
 * Divide texto en líneas que caben en el ancho especificado
 */
function wrapText(
  text: string | null | undefined,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  if (!text || typeof text !== 'string') return [];
  if (!font || typeof fontSize !== 'number' || typeof maxWidth !== 'number') return [];
  if (isNaN(fontSize) || isNaN(maxWidth) || fontSize <= 0 || maxWidth <= 0) return [];
  
  try {
    const normalizedText = normalizeText(text);
    if (!normalizedText) return [];

    const words = normalizedText.split(/\s+/).filter(word => word.trim().length > 0);
    if (words.length === 0) return [];

    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (!word || word.trim().length === 0) continue;

      const separator = currentLine ? ' ' : '';
      const testLine = currentLine + separator + word;
      
      let testWidth = 0;
      try {
        testWidth = font.widthOfTextAtSize(testLine, fontSize);
      } catch (error) {
        console.error('Error calculating width:', error);
        continue;
      }

      if (testWidth <= maxWidth || !currentLine) {
        currentLine = testLine;
      } else {
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        currentLine = word;
      }
    }

    if (currentLine && currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    return lines.filter(line => line && line.trim().length > 0);
  } catch (error) {
    console.error('Error in wrapText:', error);
    return [];
  }
}

/**
 * Dibuja marca de agua diagonal
 */
function drawWatermark(page: PDFPage, fonts: PDFFonts): void {
  const { width, height } = page.getSize();
  const centerX = width / 2;
  const centerY = height / 2;

  page.drawText('RUN SOLUTIONS', {
    x: centerX,
    y: centerY - 22 * 2.83465,
    size: 30,
    font: fonts.bold,
    color: COLORS.marcaAgua,
    rotate: degrees(35),
  });

  page.drawText('GRUPO NEARLINK 360', {
    x: centerX,
    y: centerY + 28 * 2.83465,
    size: 30,
    font: fonts.bold,
    color: COLORS.marcaAgua,
    rotate: degrees(35),
  });
}

/**
 * Dibuja el encabezado rojo con título y logo
 */
async function drawHeader(
  page: PDFPage,
  fonts: PDFFonts,
  pdfDoc: PDFDocument
): Promise<void> {
  const { width } = page.getSize();
  const headerHeight = PAGE.headerHeight;

  // Barra roja en la parte superior
  page.drawRectangle({
    x: 0,
    y: PAGE.height - headerHeight,
    width: width,
    height: headerHeight,
    color: COLORS.rojo,
  });

  // Título principal en blanco (centrado)
  const titleText = 'ORDEN DE AUTORIZACIÓN Y COMPRA';
  const titleWidth = fonts.bold.widthOfTextAtSize(titleText, 14);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: PAGE.height - 9 * 2.83465,
    size: 14,
    font: fonts.bold,
    color: COLORS.blanco,
  });

  // Subtítulo en blanco (centrado)
  const subtitleText = 'RUN SOLUTIONS | GRUPO NEARLINK 360';
  const subtitleWidth = fonts.bold.widthOfTextAtSize(subtitleText, 9);
  page.drawText(subtitleText, {
    x: (width - subtitleWidth) / 2,
    y: PAGE.height - 16 * 2.83465,
    size: 9,
    font: fonts.bold,
    color: COLORS.blanco,
  });

  // Logo en la esquina superior derecha
  // Intentar múltiples rutas posibles para encontrar el logo
  const cwd = process.cwd();
  const possiblePaths = [
    path.join(cwd, 'public', 'logo-r.png'),           // Desarrollo local
    path.join(cwd, 'logo-r.png'),                      // Alternativa
    path.join(cwd, '.next', 'standalone', 'public', 'logo-r.png'), // Next.js standalone
    '/app/public/logo-r.png',                          // Docker - ruta absoluta
    path.join('/app', 'public', 'logo-r.png'),         // Docker - path.join
    path.join(cwd, '..', 'public', 'logo-r.png'),      // Alternativa relativa
  ];

  let logoImage: PDFImage | null = null;
  let logoLoadedFrom = '';
  
  for (const logoPath of possiblePaths) {
    try {
      if (fs.existsSync(logoPath)) {
        const logoImageBytes = fs.readFileSync(logoPath);
        // Intentar como PNG primero
        try {
          logoImage = await pdfDoc.embedPng(logoImageBytes);
          logoLoadedFrom = logoPath;
          console.log('Logo PNG cargado exitosamente desde:', logoPath);
          break;
        } catch (pngError) {
          // Si falla PNG, intentar como JPEG
          try {
            logoImage = await pdfDoc.embedJpg(logoImageBytes);
            logoLoadedFrom = logoPath;
            console.log('Logo JPEG cargado exitosamente desde:', logoPath);
            break;
          } catch (jpgError) {
            console.warn('No se pudo cargar el logo como PNG ni JPEG desde:', logoPath);
            continue;
          }
        }
      }
    } catch (error) {
      // Continuar con la siguiente ruta
      continue;
    }
  }

  // Si se encontró el logo, dibujarlo
  if (logoImage) {
    try {
      const logoWidth = 42 * 2.83465;
      const logoHeight = 14 * 2.83465;
      const logoX = width - PAGE.marginX - logoWidth;
      const logoY = PAGE.height - 3 * 2.83465;

      page.drawImage(logoImage, {
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
      });
      console.log('Logo dibujado exitosamente en el PDF desde:', logoLoadedFrom);
    } catch (error) {
      console.error('Error dibujando logo en el PDF:', error);
    }
  } else {
    console.warn('⚠️ No se pudo cargar el logo. Rutas probadas:', possiblePaths);
    console.warn('Working directory:', cwd);
  }
}

/**
 * Función principal: Genera el PDF completo según formato de test.html
 */
export async function generateOrdenPdf(data: OrdenFormData): Promise<Uint8Array> {
  try {
    // Validar datos de entrada
    if (!data) {
      throw new Error('Los datos del formulario son requeridos');
    }

    if (!data.folio || !data.descripcion || !data.monto || !data.fechaCreacion || !data.autoriza) {
      throw new Error('Faltan campos requeridos en los datos del formulario');
    }

    // Validar tipoMonto
    const tipoMonto = data.tipoMonto && (data.tipoMonto === 'integrado' || data.tipoMonto === 'mas_iva') 
      ? data.tipoMonto 
      : 'mas_iva';
    
    const validatedData = {
      ...data,
      tipoMonto,
    };

    // Crear documento PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PAGE.width, PAGE.height]);

    // Cargar fuentes
    let fonts: PDFFonts;
    try {
      fonts = {
        regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
        bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
        timesItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
      };
    } catch (error) {
      console.error('Error loading fonts:', error);
      throw new Error('Error al cargar las fuentes del PDF');
    }

    // 1. Marca de agua (primero, para que quede detrás)
    drawWatermark(page, fonts);

    // 2. Encabezado rojo con logo
    await drawHeader(page, fonts, pdfDoc);

    // 3. Texto introductorio
    let y = PAGE.height - PAGE.headerHeight - 8 * 2.83465;
    page.drawText('Documento interno de autorización y compra.', {
      x: PAGE.marginX,
      y: y,
      size: 10,
      font: fonts.regular,
      color: COLORS.negro,
    });

    // 4. Bloque de datos principales
    y -= 8 * 2.83465;
    const metaBoxY = y;
    const metaBoxHeight = 32 * 2.83465;
    const contentWidth = PAGE.width - (PAGE.marginX * 2);
    
    // Dibujar borde del cuadro
    page.drawRectangle({
      x: PAGE.marginX,
      y: metaBoxY - metaBoxHeight,
      width: contentWidth,
      height: metaBoxHeight,
      borderColor: COLORS.bordeGris,
      borderWidth: 0.85,
    });

    // Contenido del cuadro - con más espacio para evitar cortes
    let boxY = metaBoxY - 7 * 2.83465;
    const col2X = PAGE.marginX + contentWidth / 2;
    const labelStartX = PAGE.marginX + 2 * 2.83465;

    // Línea 1: Folio y Fecha creación OC
    page.drawText('Folio:', {
      x: labelStartX,
      y: boxY,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });
    const folioText = normalizeText(validatedData.folio) || '________';
    const folioX = labelStartX + fonts.bold.widthOfTextAtSize('Folio:', 10) + 3 * 2.83465;
    page.drawText(folioText, {
      x: folioX,
      y: boxY,
      size: 10,
      font: fonts.regular,
      color: COLORS.negro,
    });

    page.drawText('Fecha creación OC:', {
      x: col2X,
      y: boxY,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });
    const fechaCreacionText = formatDate(validatedData.fechaCreacion);
    const fechaCreacionX = col2X + fonts.bold.widthOfTextAtSize('Fecha creación OC:', 10) + 3 * 2.83465;
    page.drawText(fechaCreacionText, {
      x: fechaCreacionX,
      y: boxY,
      size: 10,
      font: fonts.regular,
      color: COLORS.negro,
    });

    // Línea 2: Solicitante / Quien autoriza
    boxY -= 6 * 2.83465;
    page.drawText('Solicitante / Quien autoriza:', {
      x: labelStartX,
      y: boxY,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });
    const autorizaText = normalizeText(validatedData.autoriza) || '______________________';
    const autorizaX = labelStartX + fonts.bold.widthOfTextAtSize('Solicitante / Quien autoriza:', 10) + 3 * 2.83465;
    page.drawText(autorizaText, {
      x: autorizaX,
      y: boxY,
      size: 10,
      font: fonts.regular,
      color: COLORS.negro,
    });

    // Línea 3: Monto autorizado
    boxY -= 6 * 2.83465;
    page.drawText('Monto autorizado (MXN):', {
      x: labelStartX,
      y: boxY,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });
    const montoText = formatCurrency(validatedData.monto);
    const montoX = labelStartX + fonts.bold.widthOfTextAtSize('Monto autorizado (MXN):', 10) + 3 * 2.83465;
    page.drawText(montoText, {
      x: montoX,
      y: boxY,
      size: 10,
      font: fonts.regular,
      color: COLORS.negro,
    });

    // Línea 4: Fechas de pago
    boxY -= 6 * 2.83465;
    page.drawText('Fecha mínima de pago:', {
      x: labelStartX,
      y: boxY,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });
    const fechaMinText = validatedData.fechaMinPago ? formatDate(validatedData.fechaMinPago) : '__/__/____';
    const fechaMinX = labelStartX + fonts.bold.widthOfTextAtSize('Fecha mínima de pago:', 10) + 3 * 2.83465;
    page.drawText(fechaMinText, {
      x: fechaMinX,
      y: boxY,
      size: 10,
      font: fonts.regular,
      color: COLORS.negro,
    });

    page.drawText('Fecha máxima de pago:', {
      x: col2X,
      y: boxY,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });
    const fechaMaxText = validatedData.fechaMaxPago ? formatDate(validatedData.fechaMaxPago) : '__/__/____';
    const fechaMaxX = col2X + fonts.bold.widthOfTextAtSize('Fecha máxima de pago:', 10) + 3 * 2.83465;
    page.drawText(fechaMaxText, {
      x: fechaMaxX,
      y: boxY,
      size: 10,
      font: fonts.regular,
      color: COLORS.negro,
    });

    // Leyenda de fechas aproximadas
    y = metaBoxY - metaBoxHeight - 5 * 2.83465;
    const fechasLegend = 'Las fechas proporcionadas son aproximadas y siempre se recomienda considerar la fecha máxima de pago.';
    const fechasLines = wrapText(fechasLegend, fonts.regular, 8, contentWidth);
    fechasLines.forEach((line, index) => {
      page.drawText(line, {
        x: PAGE.marginX,
        y: y - (index * 9),
        size: 8,
        font: fonts.regular,
        color: COLORS.grisMuyOscuro,
      });
    });

    // 5. Sección DESCRIPCIÓN / CONCEPTO
    y -= (fechasLines.length * 9) + 8 * 2.83465;
    const descHeaderY = y;
    const descHeaderHeight = 7 * 2.83465;

    // Header gris
    page.drawRectangle({
      x: PAGE.marginX,
      y: descHeaderY - descHeaderHeight,
      width: contentWidth,
      height: descHeaderHeight,
      color: COLORS.grisClaro,
    });

    page.drawText('DESCRIPCIÓN / CONCEPTO', {
      x: PAGE.marginX + 2 * 2.83465,
      y: descHeaderY - 2 * 2.83465,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });

    // Cuadro de descripción
    const descBoxY = descHeaderY - descHeaderHeight;
    const descBoxHeight = 40 * 2.83465;
    page.drawRectangle({
      x: PAGE.marginX,
      y: descBoxY - descBoxHeight,
      width: contentWidth,
      height: descBoxHeight,
      borderColor: COLORS.bordeGrisClaro,
      borderWidth: 0.85,
    });

    const descLines = wrapText(
      normalizeText(validatedData.descripcion) || 'Sin descripción',
      fonts.regular,
      10,
      contentWidth - 6 * 2.83465
    );
    descLines.forEach((line, index) => {
      page.drawText(line, {
        x: PAGE.marginX + 3 * 2.83465,
        y: descBoxY - 7 * 2.83465 - (index * 12),
        size: 10,
        font: fonts.regular,
        color: COLORS.negro,
      });
    });

    // 6. Sección COMENTARIOS / NOTAS ADICIONALES
    y = descBoxY - descBoxHeight - 8 * 2.83465;
    const comHeaderY = y;
    const comHeaderHeight = 7 * 2.83465;

    // Header gris
    page.drawRectangle({
      x: PAGE.marginX,
      y: comHeaderY - comHeaderHeight,
      width: contentWidth,
      height: comHeaderHeight,
      color: COLORS.grisClaro,
    });

    page.drawText('COMENTARIOS / NOTAS ADICIONALES', {
      x: PAGE.marginX + 2 * 2.83465,
      y: comHeaderY - 2 * 2.83465,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });

    // Cuadro de comentarios
    const comBoxY = comHeaderY - comHeaderHeight;
    const comBoxHeight = 35 * 2.83465;
    page.drawRectangle({
      x: PAGE.marginX,
      y: comBoxY - comBoxHeight,
      width: contentWidth,
      height: comBoxHeight,
      borderColor: COLORS.bordeGrisClaro,
      borderWidth: 0.85,
    });

    const comentariosText = normalizeText(validatedData.comentarios) || 'Sin comentarios';
    const comLines = wrapText(
      comentariosText,
      fonts.regular,
      10,
      contentWidth - 6 * 2.83465
    );
    comLines.forEach((line, index) => {
      page.drawText(line, {
        x: PAGE.marginX + 3 * 2.83465,
        y: comBoxY - 7 * 2.83465 - (index * 12),
        size: 10,
        font: fonts.regular,
        color: COLORS.negro,
      });
    });

    // 7. Sección RESUMEN DE MONTOS
    y = comBoxY - comBoxHeight - 8 * 2.83465;
    const resumenHeaderY = y;
    const resumenHeaderHeight = 7 * 2.83465;

    // Header gris
    page.drawRectangle({
      x: PAGE.marginX,
      y: resumenHeaderY - resumenHeaderHeight,
      width: contentWidth,
      height: resumenHeaderHeight,
      color: COLORS.grisClaro,
    });

    page.drawText('RESUMEN DE MONTOS', {
      x: PAGE.marginX + 2 * 2.83465,
      y: resumenHeaderY - 2 * 2.83465,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });

    // Cuadro de resumen
    const resumenBoxY = resumenHeaderY - resumenHeaderHeight;
    const resumenBoxHeight = 18 * 2.83465;
    page.drawRectangle({
      x: PAGE.marginX,
      y: resumenBoxY - resumenBoxHeight,
      width: contentWidth,
      height: resumenBoxHeight,
      borderColor: COLORS.bordeGrisClaro,
      borderWidth: 0.85,
    });

    // Calcular montos
    let subtotal: number;
    let iva: number;
    let total: number;

    if (validatedData.tipoMonto === 'integrado') {
      total = validatedData.monto;
      subtotal = validatedData.monto / 1.16;
      iva = total - subtotal;
    } else {
      subtotal = validatedData.monto;
      iva = validatedData.monto * 0.16;
      total = subtotal + iva;
    }

    const labelX = PAGE.marginX + 3 * 2.83465;
    const valueX = PAGE.marginX + contentWidth - 3 * 2.83465;
    let ry = resumenBoxY - 6 * 2.83465;

    // Subtotal
    page.drawText('Subtotal:', {
      x: labelX,
      y: ry,
      size: 10,
      font: fonts.regular,
      color: COLORS.negro,
    });
    const subtotalText = formatCurrency(subtotal);
    const subtotalWidth = fonts.regular.widthOfTextAtSize(subtotalText, 10);
    page.drawText(subtotalText, {
      x: valueX - subtotalWidth,
      y: ry,
      size: 10,
      font: fonts.regular,
      color: COLORS.negro,
    });

    // IVA
    ry -= 5 * 2.83465;
    page.drawText('IVA 16%:', {
      x: labelX,
      y: ry,
      size: 10,
      font: fonts.regular,
      color: COLORS.negro,
    });
    const ivaText = formatCurrency(iva);
    const ivaWidth = fonts.regular.widthOfTextAtSize(ivaText, 10);
    page.drawText(ivaText, {
      x: valueX - ivaWidth,
      y: ry,
      size: 10,
      font: fonts.regular,
      color: COLORS.negro,
    });

    // Total
    ry -= 5 * 2.83465;
    page.drawText('Total:', {
      x: labelX,
      y: ry,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });
    const totalText = formatCurrency(total);
    const totalWidth = fonts.bold.widthOfTextAtSize(totalText, 10);
    page.drawText(totalText, {
      x: valueX - totalWidth,
      y: ry,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });

    // 8. Firma Dirección General - CALCULAR POSICIÓN DINÁMICAMENTE
    // Asegurar que haya suficiente espacio después del resumen
    const espacioMinimoFirma = 25 * 2.83465; // 25mm mínimo entre resumen y firma
    const firmaY = resumenBoxY - resumenBoxHeight - espacioMinimoFirma;
    const centerX = PAGE.width / 2;

    // Línea de firma
    page.drawLine({
      start: { x: centerX - 35 * 2.83465, y: firmaY },
      end: { x: centerX + 35 * 2.83465, y: firmaY },
      thickness: 0.85,
      color: COLORS.negro,
    });

    // "Dirección General" en cursiva sobre la línea
    const dirGenText = 'Dirección General';
    const dirGenWidth = fonts.timesItalic.widthOfTextAtSize(dirGenText, 14);
    page.drawText(dirGenText, {
      x: centerX - dirGenWidth / 2,
      y: firmaY + 1 * 2.83465,
      size: 14,
      font: fonts.timesItalic,
      color: COLORS.negro,
    });

    // "AUTORIZA" y "DIRECCIÓN GENERAL" debajo (centrados)
    const autorizaLabelText = 'AUTORIZA';
    const autorizaLabelWidth = fonts.bold.widthOfTextAtSize(autorizaLabelText, 10);
    page.drawText(autorizaLabelText, {
      x: centerX - autorizaLabelWidth / 2,
      y: firmaY - 6 * 2.83465,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });

    const dirGenBoldText = 'DIRECCIÓN GENERAL';
    const dirGenBoldWidth = fonts.bold.widthOfTextAtSize(dirGenBoldText, 10);
    page.drawText(dirGenBoldText, {
      x: centerX - dirGenBoldWidth / 2,
      y: firmaY - 12 * 2.83465,
      size: 10,
      font: fonts.bold,
      color: COLORS.negro,
    });

    // 9. Leyenda de confidencialidad - CALCULAR POSICIÓN DINÁMICAMENTE
    // Asegurar que haya suficiente espacio después de la firma
    const espacioMinimoLeyenda = 20 * 2.83465; // 20mm mínimo entre firma y leyenda
    const legendBoxY = firmaY - 12 * 2.83465 - espacioMinimoLeyenda; // Después de "DIRECCIÓN GENERAL"
    const legendBoxHeight = 20 * 2.83465;
    
    // Asegurar que la leyenda no quede muy arriba (mínimo 70mm desde abajo)
    const minLegendY = 70 * 2.83465;
    const finalLegendY = Math.max(legendBoxY, minLegendY);
    
    page.drawRectangle({
      x: PAGE.marginX,
      y: finalLegendY - legendBoxHeight,
      width: contentWidth,
      height: legendBoxHeight,
      color: COLORS.grisMuyClaro,
      borderColor: rgb(220 / 255, 220 / 255, 220 / 255),
      borderWidth: 0.85,
    });

    const legendText = 'ESTE ES UN DOCUMENTO CONFIDENCIAL Y DE USO INTERNO DE GRUPO NEARLINK 360 Y RUN SOLUTIONS. ' +
      'Es válido, tanto interna como externamente, como orden de compra y como soporte para la emisión de facturas y demás comprobantes fiscales relacionados. ' +
      'La aceptación y/o ejecución de esta orden de compra formaliza la relación comercial con RUN Solutions y Grupo Nearlink 360 y se rige por los contratos, acuerdos marco y términos y condiciones comerciales vigentes entre las partes.';
    
    const legendLines = wrapText(legendText, fonts.regular, 8, contentWidth - 6 * 2.83465);
    legendLines.forEach((line, index) => {
      page.drawText(line, {
        x: PAGE.marginX + 3 * 2.83465,
        y: finalLegendY - 7 * 2.83465 - (index * 9),
        size: 8,
        font: fonts.regular,
        color: COLORS.grisTexto,
      });
    });

    // Texto final (centrado)
    const finalText = 'Documento generado electrónicamente para fines de control interno.';
    const finalTextWidth = fonts.regular.widthOfTextAtSize(finalText, 8);
    page.drawText(finalText, {
      x: (PAGE.width - finalTextWidth) / 2,
      y: finalLegendY - legendBoxHeight - 5 * 2.83465,
      size: 8,
      font: fonts.regular,
      color: COLORS.grisTexto,
    });

    // Serializar el PDF
    try {
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error('Error serializing PDF:', error);
      throw new Error('Error al serializar el PDF: ' + (error instanceof Error ? error.message : String(error)));
    }
  } catch (error) {
    console.error('Error in generateOrdenPdf:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al generar el PDF: ' + String(error));
  }
}
