# Sistema de Gestión de Actas y Garantías - Google Apps Script

Este proyecto es un sistema completo de gestión de actas de entrega, garantías de notebooks y procesamiento de imágenes mediante OCR, desarrollado en Google Apps Script.

## 🚀 Características Principales

### 📧 Sistema de Notificaciones de Garantías
- Monitoreo automático de garantías próximas a vencer (1 y 3 meses)
- Envío automático de emails con información detallada
- Sistema de logs para evitar duplicados
- Formateo de fechas en español

### 📄 Generación de Actas de Entrega
- Creación automática de actas desde plantillas de Google Docs
- Conversión a PDF con nombre y fecha del usuario
- Gestión de stock de mouses y adaptadores de red
- Búsqueda automática de archivos en Google Drive

### 🔍 Integración con InvGate
- Conexión automática con la API de InvGate
- Búsqueda de incidentes y solicitudes
- Carga automática de usuarios pendientes
- Decodificación de entidades HTML

### 🖼️ Procesamiento de Imágenes con OCR
- Procesamiento automático de imágenes subidas
- Extracción de texto mediante OCR de Google Drive
- Creación de PDFs con nombre y fecha extraídos
- Limpieza automática de carpetas temporales

## 📁 Estructura del Proyecto

```
├── config.js          # Configuración y credenciales
├── garantias.js       # Funciones de garantías y emails
├── actas.js           # Funciones de generación de actas
├── invgate.js         # Funciones de integración con InvGate
├── ocr.js             # Funciones de OCR y procesamiento de imágenes
└── README.md          # Documentación del proyecto
```

## ⚙️ Configuración

### 1. Archivo de Configuración (`config.js`)

Antes de usar el sistema, debes configurar el archivo `config.js` con tus credenciales:

```javascript
// Configuración de Email
const CONFIG_EMAIL = {
  EMAIL_ADDRESS: 'TU_EMAIL@DOMINIO.COM',
  EMAIL_SUBJECT: 'Notificación de garantías próximas a vencer'
};

// Configuración de Google Drive - IDs de carpetas
const CONFIG_DRIVE = {
  FOLDER_BORRAR: 'TU_ID_CARPETA_BORRAR',
  FOLDER_NORMAL: 'TU_ID_CARPETA_NORMAL',
  FOLDER_ACTAS_FIRMADAS: 'TU_ID_CARPETA_ACTAS_FIRMADAS',
  FOLDER_IMAGENES_ORIGEN: 'TU_ID_CARPETA_IMAGENES_ORIGEN',
  FOLDER_IMAGENES_DESTINO: 'TU_ID_CARPETA_IMAGENES_DESTINO'
};

// Configuración de InvGate API
const CONFIG_INVGATE = {
  URL_BASE: 'https://TU_DOMINIO.invgate.net/api/v1/',
  ENDPOINT_VISTA: 'incidents.by.view',
  VISTA_ID: 20,
  USUARIO: 'TU_USUARIO_INVGATE',
  CONTRASENA: 'TU_CONTRASENA_INVGATE'
};

// Configuración de plantillas
const CONFIG_TEMPLATES = {
  TEMPLATE_ID: 'TU_ID_DOCUMENTO_PLANTILLA'
};
```

### 2. Hojas de Cálculo Requeridas

El sistema requiere las siguientes hojas en tu Google Sheets:

- **Garantia Notebooks**: Para el seguimiento de garantías
- **mailLog**: Para el registro de emails enviados
- **Actas de entrega**: Para la gestión de actas
- **StockBD**: Para el control de inventario
- **PDFActasFirmadas**: Para el procesamiento de imágenes

## 🛠️ Instalación

### 1. Crear un nuevo proyecto en Google Apps Script

1. Ve a [script.google.com](https://script.google.com)
2. Crea un nuevo proyecto
3. Copia y pega cada archivo en el orden correcto

### 2. Orden de Inclusión de Archivos

En Google Apps Script, incluye los archivos en este orden:

1. `config.js` - Configuración y variables
2. `garantias.js` - Funciones de garantías
3. `actas.js` - Funciones de actas
4. `invgate.js` - Funciones de InvGate
5. `ocr.js` - Funciones de OCR

### 3. Configurar Permisos

El sistema requiere los siguientes permisos:
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive`
- `https://www.googleapis.com/auth/documents`
- `https://www.googleapis.com/auth/script.external_request`

## 📋 Funciones Disponibles

### Funciones de Garantías
- `enviarMail()` - Envía notificaciones de garantías próximas a vencer

### Funciones de Actas
- `generarActaManual()` - Genera actas de entrega desde plantillas
- `buscarYActualizarLinks()` - Busca y actualiza links de archivos
- `buscarYActualizarLinks2()` - Versión mejorada de búsqueda de links
- `generarActaManual2()` - Versión alternativa de generación de actas

### Funciones de InvGate
- `buscarIngresos()` - Busca ingresos desde la API de InvGate

### Funciones de OCR
- `ejecutarSecuencia()` - Ejecuta la secuencia completa de procesamiento
- `procesarImagenesConOCRDrive()` - Procesa imágenes con OCR
- `cargarImagenesDesdeCarpeta()` - Carga imágenes desde carpeta de origen
- `limpiarCarpetaConPermisos()` - Limpia carpetas temporales

## 🔧 Uso

### 1. Configurar Credenciales
Edita `config.js` con tus credenciales y IDs de carpetas.

### 2. Ejecutar Funciones
Las funciones se pueden ejecutar desde:
- El editor de Google Apps Script
- Triggers automáticos
- Menús personalizados en Google Sheets

### 3. Triggers Recomendados
- **Garantías**: Mensual para verificar vencimientos
- **InvGate**: Diario para buscar nuevos ingresos
- **OCR**: Según necesidad para procesar imágenes

## 📝 Notas Importantes

### Seguridad
- **NUNCA** subas el archivo `config.js` con credenciales reales a GitHub
- Usa variables de entorno o archivos de configuración separados
- Revisa regularmente los permisos de las APIs

### Limitaciones
- Google Apps Script tiene límites de tiempo de ejecución
- Las APIs tienen cuotas diarias
- El OCR puede no ser 100% preciso en todas las imágenes

### Mantenimiento
- Revisa regularmente los logs de ejecución
- Actualiza las credenciales cuando sea necesario
- Monitorea el uso de las APIs

## 🤝 Contribuciones

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

## 🔄 Historial de Versiones

- **v1.0.0** - Versión inicial con todas las funcionalidades básicas
- Separación en módulos para mejor mantenimiento
- Sistema de configuración centralizado
- Documentación completa

---

**Desarrollado con ❤️ para Google Apps Script** 