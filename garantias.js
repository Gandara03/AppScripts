// FUNCIONES DE GARANTÍAS Y ENVÍO DE EMAILS
// Este archivo contiene todas las funciones relacionadas con el manejo de garantías
// y el envío automático de notificaciones por email

// Importar configuración
// Nota: En Google Apps Script, incluye este archivo antes que garantias.js

/**
 * Función principal para enviar emails de notificación de garantías
 * Verifica garantías próximas a vencer y envía notificaciones por email
 */
function enviarMail() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEETS.HOJA_GARANTIAS);
  var data = sheet.getDataRange().getValues();
  var emailAddress = CONFIG_EMAIL.EMAIL_ADDRESS;
  var subject = CONFIG_EMAIL.EMAIL_SUBJECT;

  var hoy = new Date();
  var mesActual = hoy.getMonth() + 1;
  var añoActual = hoy.getFullYear();

  var registrosEnviadosEsteMes = obtenerRegistrosEnviadosEsteMes();

  var garantiasProximas1Mes = [];
  var garantiasProximas3Meses = [];

  for (var i = 1; i < data.length; i++) {
    var numeroSerie = data[i][1];
    var fechaVencimiento = new Date(data[i][2]);
    
    var cell = sheet.getRange(i + 1, 2);  
    var richText = cell.getRichTextValue();
    var url = richText ? richText.getLinkUrl() : '';

    var mesesRestantes = calcularMesesRestantes(hoy, fechaVencimiento);

    if (mesesRestantes === 1 && !registrosEnviadosEsteMes[numeroSerie]) {
      garantiasProximas1Mes.push({
        nombreUsuario: data[i][0],
        numeroSerie: numeroSerie,
        fechaVencimiento: fechaVencimiento,
        fechaExtension: new Date(data[i][3]),
        url: url
      });
    } else if (mesesRestantes === 3 && !registrosEnviadosEsteMes[numeroSerie]) {
      garantiasProximas3Meses.push({
        nombreUsuario: data[i][0],
        numeroSerie: numeroSerie,
        fechaVencimiento: fechaVencimiento,
        fechaExtension: new Date(data[i][3]),
        url: url
      });
    }
  }

  var message = construirMensaje(garantiasProximas1Mes, garantiasProximas3Meses);

  if (message !== '') {
    enviarCorreo(emailAddress, subject, message);
    registrarEnviosMailLog(garantiasProximas1Mes, garantiasProximas3Meses);
  } else {
    Logger.log('No se encontraron garantías próximas a vencer en 1 mes o 3 meses.');
  }
}

/**
 * Obtiene los registros de emails enviados en el mes actual
 * para evitar duplicados
 */
function obtenerRegistrosEnviadosEsteMes() {
  var mesActual = (new Date()).getMonth() + 1;
  var añoActual = (new Date()).getFullYear();

  var mailLogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEETS.HOJA_MAIL_LOG);
  var mailLogData = mailLogSheet.getDataRange().getValues();

  var registrosEnviadosEsteMes = {};

  for (var i = 1; i < mailLogData.length; i++) {
    var numeroSerie = mailLogData[i][0];
    var fechaEnvio = new Date(mailLogData[i][1]);
    var mesEnvio = fechaEnvio.getMonth() + 1;
    var añoEnvio = fechaEnvio.getFullYear();

    if (mesEnvio === mesActual && añoEnvio === añoActual) {
      registrosEnviadosEsteMes[numeroSerie] = true;
    }
  }

  return registrosEnviadosEsteMes;
}

/**
 * Calcula los meses restantes hasta el vencimiento de una garantía
 */
function calcularMesesRestantes(fechaActual, fechaVencimiento) {
  var mesesRestantes = (fechaVencimiento.getFullYear() - fechaActual.getFullYear()) * 12;
  mesesRestantes -= fechaActual.getMonth() + 1;
  mesesRestantes += fechaVencimiento.getMonth() + 1;
  return mesesRestantes;
}

/**
 * Construye el mensaje HTML para el email con las garantías próximas a vencer
 */
function construirMensaje(garantiasProximas1Mes, garantiasProximas3Meses) {
  var message = '';

  if (garantiasProximas1Mes.length > 0) {
    message += '<p>La garantía de las siguientes notebooks vence en 1 mes:</p>';
    message += construirTablaGarantias(garantiasProximas1Mes);
  }

  if (garantiasProximas3Meses.length > 0) {
    if (message !== '') {
      message += '<br><br>';
    }
    message += '<p>La garantía de las siguientes notebooks vence en 3 meses:</p>';
    message += construirTablaGarantias(garantiasProximas3Meses);
  }

  return message;
}

/**
 * Construye una tabla HTML con la información de las garantías
 */
function construirTablaGarantias(garantias) {
  var tabla = '<table border="1" style="border-collapse: collapse; width: 100%;">';
  tabla += '<tr>';
  tabla += '<th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Nombre del Usuario</th>';
  tabla += '<th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Serial</th>';
  tabla += '<th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Vencimiento Garantía</th>';
  tabla += '<th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Extensión de Garantía</th>';
  tabla += '<th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Más Información</th>';
  tabla += '</tr>';

  for (var i = 0; i < garantias.length; i++) {
    var nombreUsuario = garantias[i].nombreUsuario;
    var numeroSerie = garantias[i].numeroSerie;
    var fechaVencimiento = formatDate(garantias[i].fechaVencimiento);
    var fechaExtension = formatDate(garantias[i].fechaExtension);
    var url = garantias[i].url;

    tabla += '<tr>';
    tabla += '<td style="padding: 8px;">' + nombreUsuario + '</td>';
    tabla += '<td style="padding: 8px;">' + numeroSerie + '</td>';
    tabla += '<td style="padding: 8px;">' + fechaVencimiento + '</td>';
    tabla += '<td style="padding: 8px;">' + fechaExtension + '</td>';
    tabla += '<td style="padding: 8px;"><a href="' + url + '" style="background-color: #0000ff; color: white; padding: 5px 10px; text-align: center; text-decoration: none; display: inline-block;">Más información</a></td>';
    tabla += '</tr>';
  }

  tabla += '</table>';
  return tabla;
}

/**
 * Envía el correo electrónico usando MailApp
 */
function enviarCorreo(emailAddress, subject, message) {
  MailApp.sendEmail({
    to: emailAddress,
    subject: subject,
    htmlBody: message
  });

  Logger.log('Email enviado a: ' + emailAddress);
  Logger.log('Asunto: ' + subject);
}

/**
 * Registra los envíos de email en el log para evitar duplicados
 */
function registrarEnviosMailLog(garantiasProximas1Mes, garantiasProximas3Meses) {
  var hoy = new Date();
  var mailLogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEETS.HOJA_MAIL_LOG);

  for (var i = 0; i < garantiasProximas1Mes.length; i++) {
    registrarEnvioMailLog(mailLogSheet, garantiasProximas1Mes[i].numeroSerie, hoy);
  }

  for (var j = 0; j < garantiasProximas3Meses.length; j++) {
    registrarEnvioMailLog(mailLogSheet, garantiasProximas3Meses[j].numeroSerie, hoy);
  }
}

/**
 * Registra un envío individual en el log de emails
 */
function registrarEnvioMailLog(sheet, numeroSerie, fechaEnvio) {
  sheet.appendRow([numeroSerie, fechaEnvio]);
}

/**
 * Formatea una fecha en formato legible en español
 */
function formatDate(date) {
  var options = { year: 'numeric', month: 'long'};
  return date.toLocaleDateString('es-ES', options);
} 