// FUNCIONES DE INTEGRACIÓN CON INVGATE API
// Este archivo contiene todas las funciones relacionadas con la API de InvGate
// para buscar y procesar incidentes automáticamente

// Importar configuración
// Nota: En Google Apps Script, incluye este archivo antes que invgate.js

/**
 * Función principal para buscar ingresos desde la API de InvGate
 * Obtiene incidentes de una vista específica y los procesa para agregar usuarios
 */
function buscarIngresos() {
  const URL_BASE = CONFIG_INVGATE.URL_BASE;
  const ENDPOINT_VISTA = CONFIG_INVGATE.ENDPOINT_VISTA;
  const VISTA_ID = CONFIG_INVGATE.VISTA_ID;
  const urlVista = `${URL_BASE}${ENDPOINT_VISTA}?view_id=${VISTA_ID}`;
  const usuario = CONFIG_INVGATE.USUARIO;
  const contrasena = CONFIG_INVGATE.CONTRASENA;
  const encabezadoAuth = "Basic " + Utilities.base64Encode(usuario + ":" + contrasena);
  const opciones = {
    method: "get",
    headers: { "Authorization": encabezadoAuth },
    muteHttpExceptions: true
  };

  try {
    const respuesta = UrlFetchApp.fetch(urlVista, opciones);
    const textoRespuesta = respuesta.getContentText();
    Logger.log("Texto de Respuesta (Vista): " + textoRespuesta);
    const respuestaJson = JSON.parse(textoRespuesta);
    const idsSolicitudes = respuestaJson.requestIds;

    if (idsSolicitudes && idsSolicitudes.length > 0) {
      const ENDPOINT_INCIDENTES = "incidents";
      const paramsIds = idsSolicitudes.map(id => `ids[]=${id}`).join("&");
      const urlIncidentes = `${URL_BASE}${ENDPOINT_INCIDENTES}?${paramsIds}`;
      const respuestaIncidentes = UrlFetchApp.fetch(urlIncidentes, opciones);
      const textoRespuestaIncidentes = respuestaIncidentes.getContentText();
      Logger.log("Texto de Respuesta (Incidentes): " + textoRespuestaIncidentes);
      const incidentes = JSON.parse(textoRespuestaIncidentes);

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      let usuariosPendientes = [];

      for (let id in incidentes) {
        const incidente = incidentes[id];
        const descripcion = incidente.description;
        const titulo = incidente.title;

        const nombreMatch = descripcion.match(/<td>Nombre y apellido<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
        const sectorMatch = descripcion.match(/<td>Sector<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
        const puestoMatch = descripcion.match(/<td>Puesto<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
        const tipoPcMatch = descripcion.match(/<td>Tipo de PC<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
        const fechaMatch = titulo.match(/\((\d{2}\/\d{2}\/\d{4})\)/);

        Logger.log("Título: " + titulo);
        Logger.log("Descripción: " + descripcion);
        Logger.log("Fecha extraída: " + (fechaMatch ? fechaMatch[1] : "No encontrada"));

        if (nombreMatch && sectorMatch && fechaMatch) {
          const nombre = decodeHtmlEntities(nombreMatch[1]).replace(/\s*\(.*?\)\s*$/, "");
          const sector = decodeHtmlEntities(sectorMatch[1]);
          const puesto = puestoMatch ? decodeHtmlEntities(puestoMatch[1]) : "";
          const tipoPc = tipoPcMatch ? decodeHtmlEntities(tipoPcMatch[1]) : "";
          const fecha = fechaMatch[1];
          const [dia, mes, año] = fecha.split("/");
          const fechaIncidente = new Date(`${año}-${mes}-${dia}`);
          fechaIncidente.setHours(0, 0, 0, 0);

          if (fechaIncidente >= hoy) {
            if (/PC<\/td>\s*<td[^>]*>SI/i.test(descripcion)) {
              if (!existeEnHoja(nombre, fecha)) {
                usuariosPendientes.push({ id, nombre, sector, fecha, puesto, tipoPc });
              }
            }
          }
        }
      }

      if (usuariosPendientes.length > 0) {
        agregarUsuariosPendientes(usuariosPendientes);
        Logger.log("Usuarios cargados automáticamente: " + JSON.stringify(usuariosPendientes));
      } else {
        Logger.log("No hay nuevos ingresos disponibles para hoy o los próximos días.");
      }
    } else {
      Logger.log("No se encontraron IDs de solicitudes en la respuesta.");
    }
  } catch (error) {
    Logger.log("Error al obtener datos: " + error);
  }
}

/**
 * Agrega usuarios pendientes a la hoja de actas de entrega
 * @param {Array} usuariosPendientes - Array de usuarios a agregar
 */
function agregarUsuariosPendientes(usuariosPendientes) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEETS.HOJA_ACTAS);
  if (!hoja) {
    Logger.log("No se encontró la hoja 'Actas de entrega'");
    return;
  }
  let siguienteFila = hoja.getLastRow() + 1;
  if (siguienteFila < 5) siguienteFila = 5; // Empieza después de los encabezados

  usuariosPendientes.forEach(usuario => {
    hoja.getRange(siguienteFila, 1).setValue(usuario.fecha);  // Columna A: Fecha
    hoja.getRange(siguienteFila, 2).setValue(usuario.nombre); // Columna B: Usuario
    hoja.getRange(siguienteFila, 3).setValue(usuario.sector); // Columna C: Sector
    const url = `${CONFIG_INVGATE.URL_BASE.replace('/api/v1/', '')}/requests/show/index/id/${usuario.id}`;
    hoja.getRange(siguienteFila, 4).setFormula(`=HYPERLINK("${url}"; "${usuario.id}")`);  // Columna D: N° Ticket
    hoja.getRange(siguienteFila, 6).setValue(usuario.tipoPc); // Columna F: Tipo de PC
    hoja.getRange(siguienteFila, 10).setValue("Generar Acta"); // Columna J
    siguienteFila++;
  });
}

/**
 * Verifica si un usuario ya existe en la hoja de actas
 * @param {string} nombre - Nombre del usuario a verificar
 * @param {string} fecha - Fecha del incidente
 * @return {boolean} - True si el usuario ya existe, false en caso contrario
 */
function existeEnHoja(nombre, fecha) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEETS.HOJA_ACTAS);
  const datos = hoja.getDataRange().getValues();
  const nombreNormalizado = nombre.trim().toLowerCase();
  const fechaNormalizada = fecha.trim();

  for (let i = 4; i < datos.length; i++) { // Empieza en la fila 5 (índice 4)
    const fechaHoja = Utilities.formatDate(new Date(datos[i][0]), Session.getScriptTimeZone(), "dd/MM/yyyy").trim();
    const nombreHoja = (datos[i][1] || "").trim().toLowerCase();
    if (fechaHoja === fechaNormalizada && nombreHoja === nombreNormalizado) {
      return true;
    }
  }
  return false;
}

/**
 * Decodifica entidades HTML comunes en español
 * @param {string} str - String con entidades HTML
 * @return {string} - String decodificado
 */
function decodeHtmlEntities(str) {
  if (!str) return "";
  return str.replace(/&#(x?)([0-9A-Fa-f]+);/g, function(match, isHex, code) {
    return String.fromCharCode(isHex ? parseInt(code, 16) : parseInt(code, 10));
  }).replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&uuml;/g, "ü")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
} 