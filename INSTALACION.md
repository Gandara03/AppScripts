# 📋 Instrucciones de Instalación

## ⚠️ IMPORTANTE - Seguridad

**NUNCA subas el archivo `config.js` con credenciales reales a GitHub.**

## 🚀 Pasos para Instalar

### 1. Clonar el Repositorio
```bash
git clone [URL_DEL_REPOSITORIO]
cd appsscript
```

### 2. Configurar Credenciales
1. **Copia el archivo de ejemplo:**
   ```bash
   cp config.example.js config.js
   ```

2. **Edita `config.js` con tus credenciales reales:**
   - Reemplaza `TU_EMAIL@DOMINIO.COM` con tu email
   - Reemplaza `TU_ID_CARPETA_BORRAR` con el ID de tu carpeta
   - Reemplaza `TU_DOMINIO.invgate.net` con tu dominio de InvGate
   - Reemplaza `TU_USUARIO_INVGATE` con tu usuario
   - Reemplaza `TU_CONTRASENA_INVGATE` con tu contraseña
   - Reemplaza `TU_ID_DOCUMENTO_PLANTILLA` con el ID de tu plantilla

### 3. Crear Proyecto en Google Apps Script

1. Ve a [script.google.com](https://script.google.com)
2. Crea un nuevo proyecto
3. **IMPORTANTE:** Incluye los archivos en este orden exacto:

   ```
   1. config.js (con tus credenciales reales)
   2. garantias.js
   3. actas.js
   4. invgate.js
   5. ocr.js
   ```

### 4. Configurar Permisos

El sistema solicitará los siguientes permisos:
- ✅ **Spreadsheets**: Para acceder a las hojas de cálculo
- ✅ **Drive**: Para crear y gestionar archivos
- ✅ **Documents**: Para crear documentos de Google Docs
- ✅ **External requests**: Para conectar con APIs externas

### 5. Verificar Hojas de Cálculo

Asegúrate de tener estas hojas en tu Google Sheets:
- `Garantia Notebooks`
- `mailLog`
- `Actas de entrega`
- `StockBD`
- `PDFActasFirmadas`

## 🔒 Verificación de Seguridad

Antes de subir a GitHub, verifica que:

- ✅ `config.js` esté en `.gitignore`
- ✅ No haya credenciales reales en ningún archivo
- ✅ Solo `config.example.js` esté en el repositorio
- ✅ `AppScripts.js` (archivo original) NO esté incluido

## 🧪 Pruebas

1. **Función de Garantías:**
   - Ejecuta `enviarMail()` para probar notificaciones

2. **Función de Actas:**
   - Ejecuta `generarActaManual()` para crear actas

3. **Función de InvGate:**
   - Ejecuta `buscarIngresos()` para conectar con la API

4. **Función de OCR:**
   - Ejecuta `ejecutarSecuencia()` para procesar imágenes

## 🆘 Solución de Problemas

### Error: "CONFIG_SHEETS is not defined"
- Verifica que `config.js` esté incluido PRIMERO en Google Apps Script

### Error: "Folder not found"
- Verifica que los IDs de carpetas en `config.js` sean correctos

### Error: "Authentication failed"
- Verifica usuario y contraseña de InvGate en `config.js`

### Error: "Sheet not found"
- Verifica que los nombres de hojas en `config.js` coincidan con tu Google Sheets

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Google Apps Script
2. Verifica que todas las credenciales estén correctas
3. Asegúrate de que los archivos estén en el orden correcto

---

**¡Recuerda: Nunca subas credenciales reales a GitHub!** 🚫🔐 