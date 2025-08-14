// FUNCIONES DE GENERACIÓN DE ACTAS DE ENTREGA
// Este archivo contiene todas las funciones relacionadas con la creación
// y gestión de actas de entrega de materiales

// Importar configuración
// Nota: En Google Apps Script, incluye este archivo antes que actas.js

/**
 * Función principal para generar actas de entrega de forma manual
 * Procesa las filas marcadas con "Generar Acta" y crea documentos PDF
 */
function generarActaManual() {
  var hojaActas = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEETS.HOJA_ACTAS);
  var hojaStock = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEETS.HOJA_STOCK);
  var dataRange = hojaActas.getDataRange();
  var dataValues = dataRange.getValues();

  var actasGeneradas = false;

  // Obtener o crear las carpetas necesarias fuera del bucle
  var folderBorrar = DriveApp.getFolderById(CONFIG_DRIVE.FOLDER_BORRAR);
  var folderNormal = DriveApp.getFolderById(CONFIG_DRIVE.FOLDER_NORMAL);

  // Iterar sobre cada fila de datos
  for (var i = 1; i < dataValues.length; i++) {
    var fila = i + 1;
    var valorCelda = hojaActas.getRange(fila, 10).getValue();

    // Verificar si la celda dice "Generar Acta"
    if (valorCelda === "Generar Acta") {
      var nombreApellido = dataValues[i][1];
      var sector = dataValues[i][2];
      var modeloNTB = dataValues[i][5];
      var fechaEntrada = dataValues[i][0];
      var adaptadorRed = dataValues[i][6];
      var mouse = dataValues[i][7];

      // Convertir fecha a dd/mm/yy si es una fecha válida
      var fechaFormateada = '';
      if (fechaEntrada instanceof Date && !isNaN(fechaEntrada)) {
        var dia = ('0' + fechaEntrada.getDate()).slice(-2);
        var mes = ('0' + (fechaEntrada.getMonth() + 1)).slice(-2);
        var anio = fechaEntrada.getFullYear().toString().slice(-2);
        fechaFormateada = `${dia}/${mes}/${anio}`;
      }

      try {
        // Crear una copia del documento de plantilla
        var templateFile = DriveApp.getFileById(CONFIG_TEMPLATES.TEMPLATE_ID);
        var newDocFile = templateFile.makeCopy('Acta de Entrega de Materiales - ' + nombreApellido, folderBorrar);
        var newDocId = newDocFile.getId();
        var newDoc = DocumentApp.openById(newDocId);
        var body = newDoc.getBody();

        // Reemplazar los marcadores en el documento
        body.replaceText('{{NombreApellido}}', nombreApellido || '');
        body.replaceText('{{Sector}}', sector || '');

        if (modeloNTB && modeloNTB.trim() !== '') {
          body.replaceText('{{ModeloNTB}}', '• ' + modeloNTB);
        } else {
          body.replaceText('{{ModeloNTB}}', '');
        }

        if (fechaFormateada) {
          body.replaceText('{{FechaEntrada}}', fechaFormateada);
        } else {
          body.replaceText('{{FechaEntrada}}', '');
        }

        if (adaptadorRed && adaptadorRed.toLowerCase() !== "no") {
          body.replaceText('{{AdaptadorRed}}', '• Adaptador de red: ' + adaptadorRed);
        } else {
          body.replaceText('{{AdaptadorRed}}', '');
        }

        if (mouse && mouse.toLowerCase() !== "no") {
          body.replaceText('{{Mouse}}', '• Mouse: ' + mouse);
        } else {
          body.replaceText('{{Mouse}}', '');
        }

        // Guardar los cambios
        newDoc.saveAndClose();

        // Convertir el documento a PDF
        var pdf = DriveApp.getFileById(newDocId).getAs('application/pdf');
        var pdfFileName = 'Acta de Entrega de Materiales - ' + nombreApellido + '.pdf';

        // Verificar si ya existe un archivo con el mismo nombre y eliminarlo
        var existingFiles = folderNormal.getFilesByName(pdfFileName);
        while (existingFiles.hasNext()) {
          var file = existingFiles.next();
          file.setTrashed(true);
        }

        // Crear un archivo PDF en la carpeta especificada
        var pdfFileNormal = folderNormal.createFile(pdf);
        pdfFileNormal.setName(pdfFileName);

        // Pegar el URL del PDF en la columna I
        hojaActas.getRange(fila, 9).setValue(pdfFileNormal.getUrl());

        // Limpiar la columna J
        hojaActas.getRange(fila, 10).clearContent();

        // Actualizar stock de mouses y adaptadores
        try {
          if (mouse && mouse.toLowerCase() !== "no") {
            var stockMouses = hojaStock.getRange('B1').getValue();
            if (typeof stockMouses === 'number') {
              hojaStock.getRange('B1').setValue(stockMouses - 1);
            }
          }
          if (adaptadorRed && adaptadorRed.toLowerCase() !== "no") {
            var stockAdaptadores = hojaStock.getRange('B2').getValue();
            if (typeof stockAdaptadores === 'number') {
              hojaStock.getRange('B2').setValue(stockAdaptadores - 1);
            }
          }
        } catch (error) {
          Logger.log('Error al actualizar el stock: ' + error);
        }

        actasGeneradas = true;

      } catch (e) {
        Logger.log('Error generando el acta para la fila ' + fila + ': ' + e.message);
      }
    }
  }

  // Limpiar contenido de las celdas en la columna J
  hojaActas.getRange('J2:J').clearContent();

  // Vaciar la carpeta "Actas PDF (se borra)"
  var filesToDelete = folderBorrar.getFiles();
  while (filesToDelete.hasNext()) {
    var file = filesToDelete.next();
    file.setTrashed(true);
  }

  // Mostrar mensaje final al usuario
  if (actasGeneradas) {
    SpreadsheetApp.getUi().alert('Se han generado todas las actas exitosamente.');
  } else {
    SpreadsheetApp.getUi().alert('No hay actas marcadas para generar.');
  }
}

/**
 * Busca y actualiza links de archivos en la hoja de actas
 * Busca archivos en Google Drive cuyo nombre contenga el nombre del usuario
 */
function buscarYActualizarLinks() {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEETS.HOJA_ACTAS);
  var dataRange = hoja.getDataRange();
  var dataValues = dataRange.getValues();

  var folderId = CONFIG_DRIVE.FOLDER_ACTAS_FIRMADAS;
  var folder = DriveApp.getFolderById(folderId);

  // Iterar sobre cada fila de datos
  for (var i = 1; i < dataValues.length; i++) {
    var nombreBuscado = dataValues[i][1];
    var celda = hoja.getRange(i + 1, 5);
    var linkArchivo = celda.getValue();

    // Solo buscar y actualizar si la celda está vacía
    if (!linkArchivo) {
      var archivos = folder.getFiles();
      while (archivos.hasNext()) {
        var archivo = archivos.next();
        if (archivo.getName().indexOf(nombreBuscado) !== -1) {
          linkArchivo = archivo.getUrl();
          break;
        }
      }

      // Colocar el link si se encontró un archivo
      if (linkArchivo) {
        celda.setValue(linkArchivo);
      }
    }
  }
}

/**
 * Versión mejorada de búsqueda de links con búsqueda más eficiente
 */
function buscarYActualizarLinks2() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = spreadsheet.getSheetByName(CONFIG_SHEETS.HOJA_ACTAS);
    
    if (!hoja) {
      throw new Error('La hoja "Actas de entrega" no existe');
    }
    
    var dataRange = hoja.getDataRange();
    var dataValues = dataRange.getValues();
    
    if (dataValues.length < 3) {
      Logger.log('No hay suficientes datos para procesar');
      return;
    }
    
    var folderId = CONFIG_DRIVE.FOLDER_ACTAS_FIRMADAS;
    var folder = DriveApp.getFolderById(folderId);
    
    // Cargar todos los archivos en un mapa para búsqueda más eficiente
    var archivosMap = {};
    var archivosEnCarpeta = folder.getFiles();
    while (archivosEnCarpeta.hasNext()) {
      var archivo = archivosEnCarpeta.next();
      archivosMap[archivo.getName()] = archivo.getUrl();
    }
    
    var usuariosConActas = [];
    
    // Iterar sobre cada fila de datos desde la última hacia arriba
    for (var i = dataValues.length - 1; i >= 2; i--) {
      var nombreBuscado = (dataValues[i][1] || '').toString().trim();
      
      if (!nombreBuscado) continue;
      
      var celda = hoja.getRange(i + 1, 5);
      var linkActual = celda.getValue();
      
      if (!linkActual) {
        var fechaCell = dataValues[i][0];
        
        if (!(fechaCell instanceof Date) || isNaN(fechaCell.getTime())) {
          continue;
        }
        
        var dia = fechaCell.getDate().toString().padStart(2, '0');
        var mes = (fechaCell.getMonth() + 1).toString().padStart(2, '0');
        var anio = fechaCell.getFullYear();
        var fechaFormateada = dia + "-" + mes + "-" + anio;
        
        var patronExacto = nombreBuscado + " - " + fechaFormateada;
        
        for (var nombreArchivo in archivosMap) {
          if (nombreArchivo.indexOf(patronExacto) !== -1) {
            celda.setValue(archivosMap[nombreArchivo]);
            usuariosConActas.push(nombreBuscado + " (" + fechaFormateada + ")");
            break;
          }
        }
      }
    }
    
    // Mostrar popup con resultados
    if (usuariosConActas.length > 0) {
      var mensaje = "Se encontraron actas firmadas para los siguientes usuarios:\n\n" + 
                    usuariosConActas.join('\n');
      SpreadsheetApp.getUi().alert('Actas Encontradas', mensaje, SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      SpreadsheetApp.getUi().alert('Actas Encontradas', 'No se encontraron actas nuevas.', SpreadsheetApp.getUi().ButtonSet.OK);
    }
    
  } catch (error) {
    Logger.log('Error en buscarYActualizarLinks2: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Versión alternativa de generación de actas que busca links primero
 */
function generarActaManual2() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = spreadsheet.getSheetByName(CONFIG_SHEETS.HOJA_ACTAS);
    
    if (!hoja) {
      throw new Error('La hoja "Actas de entrega" no existe');
    }
    
    var dataRange = hoja.getDataRange();
    var dataValues = dataRange.getValues();
    
    if (dataValues.length < 3) {
      Logger.log('No hay suficientes datos para procesar');
      return;
    }
    
    var folderId = CONFIG_DRIVE.FOLDER_ACTAS_FIRMADAS;
    var folder = DriveApp.getFolderById(folderId);
    
    var linksEncontrados = false;
    var usuariosConLinks = [];
    
    // Iterar sobre cada fila de datos desde la última hacia arriba
    for (var i = dataValues.length - 1; i >= 2; i--) {
      var nombreBuscado = (dataValues[i][1] || '').toString().trim();
      
      if (!nombreBuscado) continue;
      
      var celda = hoja.getRange(i + 1, 5);
      var linkArchivo = celda.getValue();
      
      if (!linkArchivo) {
        var archivosEnCarpeta = folder.getFiles();
        
        while (archivosEnCarpeta.hasNext()) {
          var archivo = archivosEnCarpeta.next();
          if (archivo.getName().indexOf(nombreBuscado) !== -1) {
            linkArchivo = archivo.getUrl();
            celda.setValue(linkArchivo);
            
            linksEncontrados = true;
            usuariosConLinks.push(nombreBuscado);
            break;
          }
        }
      }
    }
    
    // Mostrar popup con resultados
    if (linksEncontrados) {
      var mensaje = "Se encontraron links de actas para los siguientes usuarios:\n\n" + 
                    usuariosConLinks.join('\n');
      SpreadsheetApp.getUi().alert('Links de Actas Encontrados', mensaje, SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      SpreadsheetApp.getUi().alert('Links de Actas', 'No se encontraron links nuevos.', SpreadsheetApp.getUi().ButtonSet.OK);
    }
    
  } catch (error) {
    Logger.log('Error en generarActaManual2: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
} 