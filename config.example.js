// ARCHIVO DE EJEMPLO DE CONFIGURACIÓN
// Copia este archivo como 'config.js' y reemplaza los valores con tus credenciales reales

// Configuración de Email
const CONFIG_EMAIL = {
  EMAIL_ADDRESS: 'tu-email@dominio.com', // Reemplaza con tu dirección de email
  EMAIL_SUBJECT: 'Notificación de garantías próximas a vencer'
};

// Configuración de Google Drive - IDs de carpetas
const CONFIG_DRIVE = {
  FOLDER_BORRAR: 'TU_ID_CARPETA_BORRAR', // ID de la carpeta "Actas PDF (se borra)"
  FOLDER_NORMAL: 'TU_ID_CARPETA_NORMAL', // ID de la carpeta donde se guardan las actas finales
  FOLDER_ACTAS_FIRMADAS: 'TU_ID_CARPETA_ACTAS_FIRMADAS', // ID de la carpeta de actas firmadas
  FOLDER_IMAGENES_ORIGEN: 'TU_ID_CARPETA_IMAGENES_ORIGEN', // ID de la carpeta de origen de imágenes
  FOLDER_IMAGENES_DESTINO: 'TU_ID_CARPETA_IMAGENES_DESTINO' // ID de la carpeta destino de imágenes
};

// Configuración de InvGate API
const CONFIG_INVGATE = {
  URL_BASE: 'https://TU_DOMINIO.invgate.net/api/v1/', // Reemplaza con tu dominio de InvGate
  ENDPOINT_VISTA: 'incidents.by.view',
  VISTA_ID: 20, // Reemplaza con tu ID de vista
  USUARIO: 'TU_USUARIO_INVGATE', // Reemplaza con tu usuario de InvGate
  CONTRASENA: 'TU_CONTRASENA_INVGATE' // Reemplaza con tu contraseña de InvGate
};

// Configuración de plantillas
const CONFIG_TEMPLATES = {
  TEMPLATE_ID: 'TU_ID_DOCUMENTO_PLANTILLA' // ID del documento de plantilla para actas
};

// Configuración de hojas de cálculo
const CONFIG_SHEETS = {
  HOJA_GARANTIAS: 'Garantia Notebooks',
  HOJA_MAIL_LOG: 'mailLog',
  HOJA_ACTAS: 'Actas de entrega',
  HOJA_STOCK: 'StockBD',
  HOJA_PDF_ACTAS: 'PDFActasFirmadas'
};

// Exportar configuración para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG_EMAIL,
    CONFIG_DRIVE,
    CONFIG_INVGATE,
    CONFIG_TEMPLATES,
    CONFIG_SHEETS
  };
} 