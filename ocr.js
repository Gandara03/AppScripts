// FUNCIONES DE OCR Y PROCESAMIENTO DE IMÁGENES
// Este archivo contiene todas las funciones relacionadas con el procesamiento
// de imágenes mediante OCR para crear PDFs de actas firmadas

// Importar configuración
// Nota: En Google Apps Script, incluye este archivo antes que ocr.js

/**
 * Función principal que coordina la ejecución secuencial de las dos funciones clave
 * Primero busca imágenes nuevas y luego procesa estas imágenes con OCR
 */
function ejecutarSecuencia() {
  try {
    // Ejecutar la primera función
    cargarImagenesDesdeCarpeta();
    
    // Si llegamos aquí, funcion1 se ejecutó sin errores
    // Ahora ejecutamos la segunda función
    procesarImagenesConOCRDrive();
    
    // Mensaje de éxito completo
    SpreadsheetApp.getUi().alert('Ambas funciones se ejecutaron correctamente');
  } catch (error) {
    // Si hay algún error en funcion1 o funcion2
    SpreadsheetApp.getUi().alert('Proceso interrumpido: ' + error.message);
  }
}

/**
 * Procesa las imágenes registradas en la hoja de cálculo usando OCR
 * Para cada imagen, extrae el texto mediante OCR, busca el nombre y la fecha,
 * crea un PDF y lo guarda en la carpeta destino
 */
function procesarImagenesConOCRDrive() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEETS.HOJA_PDF_ACTAS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const url = data[i][0];
    if (!url) continue;
    
    // Extraer ID desde la URL
    const match = url.match(/[-\w]{25,}/);
    if (!match) {
      sheet.getRange(i + 1, 2).setValue("❌ URL inválida");
      continue;
    }
    const imagenId = match[0];
    
    try {
      const imagenFile = DriveApp.getFileById(imagenId);
      const blob = imagenFile.getBlob();
      
      // Crear Google Doc con OCR
      const resource = { title: 'OCR temporal' };
      const docOCR = Drive.Files.insert(resource, blob, { ocr: true });
      const texto = DocumentApp.openById(docOCR.id).getBody().getText();
      DriveApp.getFileById(docOCR.id).setTrashed(true);
      
      // Extraer nombre y fecha
      const nombre = extraerNombre(texto);
      const fecha = extraerFecha(texto);
      if (!nombre || !fecha) {
        sheet.getRange(i + 1, 2).setValue("❌ No se pudo extraer nombre o fecha");
        continue;
      }
      
      const fechaFormateada = Utilities.formatDate(new Date(fecha), "GMT", "dd-MM-yyyy");
      const nombrePDF = `${nombre} - ${fechaFormateada}.pdf`;
      
      // Convertir imagen a PDF usando el servicio PDF
      const pdfBlob = crearPDFSimple(blob, nombrePDF);
      
      // Guardar en la carpeta destino
      DriveApp.getFolderById(CONFIG_DRIVE.FOLDER_IMAGENES_DESTINO).createFile(pdfBlob);
      
      // Actualizar estado en hoja
      sheet.getRange(i + 1, 2).setValue(`✅ ${nombrePDF}`);
      
    } catch (e) {
      sheet.getRange(i + 1, 2).setValue(`⚠️ Error: ${e.message}`);
    }
  }
}

/**
 * Busca el patrón de nombre del empleado en el texto extraído por OCR
 * @param {string} texto - Texto extraído por OCR
 * @return {string|null} - Nombre encontrado o null si no se encuentra
 */
function extraerNombre(texto) {
  const match = texto.match(/Nombre del Empleado:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

/**
 * Busca el patrón de fecha en el texto extraído por OCR
 * Convierte el formato dd/mm/yy a formato ISO yyyy-mm-dd
 * @param {string} texto - Texto extraído por OCR
 * @return {string|null} - Fecha formateada o null si no la encuentra
 */
function extraerFecha(texto) {
  const match = texto.match(/Fecha\s*:\s*(\d{2}\/\d{2}\/\d{2})/);
  if (!match) return null;
  const partes = match[1].split('/');
  const año = '20' + partes[2];
  return `${año}-${partes[1]}-${partes[0]}`;
}

/**
 * Crea un PDF simple que contiene la imagen original
 * Convierte la imagen a base64 y la inserta en un documento HTML
 * que luego es convertido a PDF
 * @param {Blob} imageBlob - Blob de la imagen
 * @param {string} pdfName - Nombre para el archivo PDF
 * @return {Blob} - Blob del PDF creado
 */
function crearPDFSimple(imageBlob, pdfName) {
  // Crear un PDF con la imagen
  const pdfdoc = HtmlService.createHtmlOutput(
    `<img src="data:${imageBlob.getContentType()};base64,${Utilities.base64Encode(imageBlob.getBytes())}" style="width: 100%; max-width: 100%;">`
  );
  
  const pdfBlob = pdfdoc.getAs('application/pdf').setName(pdfName);
  return pdfBlob;
}

/**
 * Examina la carpeta origen en busca de archivos de imagen
 * Para cada imagen encontrada, verifica si ya está registrada en la hoja de cálculo
 * Si es nueva, añade su URL
 */
function cargarImagenesDesdeCarpeta() {
  const folder = DriveApp.getFolderById(CONFIG_DRIVE.FOLDER_IMAGENES_ORIGEN);
  const archivos = folder.getFiles();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Obtener todas las URLs existentes en la columna A
  const urlsExistentes = sheet.getRange("A2:A").getValues().flat().filter(url => url !== "");
  
  let nuevasImagenes = 0;
  let imagenesExistentes = 0;
  
  while (archivos.hasNext()) {
    const archivo = archivos.next();
    const mime = archivo.getMimeType();

    if (mime.startsWith("image/")) {
      const id = archivo.getId();
      const url = `https://drive.google.com/file/d/${id}/view`;
      
      // Verificar si la URL ya existe
      if (!urlsExistentes.includes(url)) {
        // Encontrar la primera fila vacía
        const ultimaFila = sheet.getLastRow();
        const filaDestino = ultimaFila < 2 ? 2 : ultimaFila + 1;
        
        sheet.getRange(filaDestino, 1).setValue(url);
        nuevasImagenes++;
      } else {
        imagenesExistentes++;
      }
    }
  }

  const mensaje = `✅ Proceso completado:
  - Nuevas imágenes agregadas: ${nuevasImagenes}
  - Imágenes ya existentes (no agregadas): ${imagenesExistentes}`;
  
  SpreadsheetApp.getUi().alert(mensaje);
}

/**
 * Limpia la carpeta de origen moviendo todos los archivos a la papelera
 * y limpia las celdas de la hoja PDFActasFirmadas desde la fila 2 en adelante
 */
function limpiarCarpetaConPermisos() {
  // Primera parte: limpiar archivos de Drive
  const carpeta = DriveApp.getFolderById(CONFIG_DRIVE.FOLDER_IMAGENES_ORIGEN);
  const archivos = carpeta.getFiles();
  let eliminados = 0;
  let errores = 0;

  while (archivos.hasNext()) {
    const archivo = archivos.next();

    try {
      archivo.setTrashed(true);
      Logger.log(`Movido a papelera: ${archivo.getName()}`);
      eliminados++;
    } catch (e) {
      Logger.log(`Error al mover ${archivo.getName()} a la papelera: ${e.message}`);
      errores++;
    }
  }

  // Segunda parte: limpiar celdas en la hoja PDFActasFirmadas
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName(CONFIG_SHEETS.HOJA_PDF_ACTAS);
    
    if (hoja) {
      // Obtener el número total de filas utilizadas en la hoja
      const ultimaFila = Math.max(2, hoja.getLastRow());
      
      // Si hay datos desde la fila 2, limpiar el rango
      if (ultimaFila >= 2) {
        // Limpiar las columnas A y B desde la fila 2 hacia abajo
        const rango = hoja.getRange(2, 1, ultimaFila - 1, 2);
        rango.clearContent();
        Logger.log("Celdas de las columnas A y B limpiadas desde la fila 2");
      }
    } else {
      Logger.log("No se encontró la hoja 'PDFActasFirmadas'");
      errores++;
    }
  } catch (e) {
    Logger.log(`Error al limpiar las celdas: ${e.message}`);
    errores++;
  }

  // Crear mensaje para el popup
  const mensaje = `✅ Limpieza completada:
  - Archivos movidos a la papelera: ${eliminados}
  - Celdas limpiadas en PDFActasFirmadas` + 
  (errores > 0 ? `
  - Errores encontrados: ${errores}` : "");
  
  // Mostrar popup con el resultado
  SpreadsheetApp.getUi().alert(mensaje);
  
  return {
    eliminados: eliminados,
    mensaje: `Se movieron a la papelera ${eliminados} archivo(s) y se limpiaron las celdas.` + (errores > 0 ? ` Hubo ${errores} error(es).` : "")
  };
} 