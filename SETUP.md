# 🚀 Guía de Configuración Rápida - HouseZen

## ✅ Checklist de Configuración

### 1. Configuración de Supabase

- [x] **Credenciales**: Ya configuradas en `js/core/config.js`
- [ ] **OAuth Redirect URL**: Añadir en Supabase Dashboard

  ```
  Authentication > URL Configuration > Redirect URLs

  Añadir:
  - http://localhost:8000 (desarrollo)
  - https://TU_USUARIO.github.io/housezen.com (producción)
  ```

- [x] **Tablas de Base de Datos**: Ya existen
  - `perfiles`
  - `propiedades`
  - `perfil_propiedades`
  - `incidencias`

- [x] **RLS Policies**: Ya configuradas

### 2. Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Seleccionar proyecto
3. APIs & Services > Credentials
4. Añadir URL autorizadas:
   - `http://localhost:8000`
   - `https://TU_USUARIO.github.io`
5. Verificar en Supabase que Google esté habilitado

### 3. Servidor de Desarrollo

Elegir una opción:

**Opción A - Python:**
```bash
cd housezen.com
python -m http.server 8000
```

**Opción B - Node.js:**
```bash
cd housezen.com
npx serve
```

**Opción C - PHP:**
```bash
cd housezen.com
php -S localhost:8000
```

Abrir: `http://localhost:8000`

### 4. Primera Prueba

1. ✅ Abrir la aplicación
2. ✅ Ver página de login
3. ✅ Hacer clic en "Entrar con Google"
4. ✅ Autorizar acceso
5. ✅ Debería aparecer el selector de rol
6. ✅ Seleccionar rol (inquilino o casero)
7. ✅ Verificar que se carga la interfaz correcta

---

## 🐛 Troubleshooting

### Error: "OAuth redirect URI mismatch"

**Solución:**
1. Ir a Supabase Dashboard
2. Authentication > URL Configuration
3. Añadir la URL exacta que aparece en el error

### Error: "Failed to fetch" en login

**Causas posibles:**
- No estás usando HTTPS (GitHub Pages) o localhost
- OAuth no está configurado en Supabase
- Google Provider no está habilitado

**Solución:**
1. Verificar que estás en localhost o HTTPS
2. Ir a Supabase > Authentication > Providers
3. Habilitar Google
4. Guardar credenciales de Google OAuth

### Error: "Session not found"

**Solución:**
- Limpiar caché del navegador
- Cerrar todas las pestañas
- Volver a abrir la aplicación
- Intentar login de nuevo

### El selector de rol no aparece

**Posibles causas:**
- El usuario ya tiene un rol asignado
- Error en la base de datos

**Solución:**
1. Abrir consola del navegador (F12)
2. Ejecutar: `debugHouseZen()`
3. Verificar el campo `userRole`
4. Si ya tiene rol, navegar manualmente

### Las rutas no funcionan

**Solución:**
- Verificar que todos los archivos JS se hayan cargado
- Abrir consola (F12) y buscar errores
- Verificar que el router se haya inicializado

---

## 📊 Verificar que Todo Funciona

### En la Consola del Navegador (F12)

```javascript
// Ver estado general
debugHouseZen()

// Debería mostrar:
// - currentUser: email del usuario
// - userRole: 'inquilino' o 'casero'
// - currentRoute: ruta activa
// - supabaseConnected: true
```

### Verificar Módulos Cargados

En la consola deberías ver:

```
🏠 HouseZen Config
🏠 HouseZen UI
🏠 HouseZen Auth
🛣️ HouseZen Router
🏠 HouseZen v1.0.0
```

Si falta alguno, revisar que el archivo se haya cargado en `index.html`.

---

## 🔧 Configuración Avanzada

### Cambiar Colores del Tema

Editar `styles/main.css`:

```css
:root {
  --primary: #2A9D8F;        /* Color principal */
  --primary-dark: #21867a;   /* Color oscuro */
  --primary-light: #E0F2F1;  /* Color claro */
}
```

### Añadir Nuevas Rutas

1. Editar `js/core/router.js`
2. Añadir en `ROUTES.inquilino` o `ROUTES.casero`:

```javascript
{
  id: 'nueva-ruta',
  label: 'Nueva Ruta',
  icon: '🆕',
  module: 'tenant/nuevo-modulo',
  default: false
}
```

3. Crear archivo del módulo
4. Implementar función de carga

### Service Worker (Caché)

Para actualizar la versión en caché:

1. Editar `service-worker.js`
2. Cambiar `CACHE_NAME`:

```javascript
const CACHE_NAME = 'housezen-v1.0.1'; // Incrementar versión
```

---

## 📱 Instalar como PWA

### En Android (Chrome)

1. Abrir la app en Chrome
2. Menú (⋮) > "Añadir a pantalla de inicio"
3. Confirmar

### En iOS (Safari)

1. Abrir la app en Safari
2. Botón "Compartir" (□↑)
3. "Añadir a pantalla de inicio"
4. Confirmar

### En Escritorio (Chrome/Edge)

1. Abrir la app
2. Icono de instalación en la barra de direcciones
3. Hacer clic en "Instalar"

---

## 🎯 Próximos Pasos

1. [ ] Probar login con varios usuarios
2. [ ] Probar flujo completo de inquilino
3. [ ] Probar flujo completo de casero
4. [ ] Crear al menos una propiedad
5. [ ] Vincular un inquilino
6. [ ] Crear una incidencia
7. [ ] Verificar que el casero la ve
8. [ ] Desplegar en GitHub Pages
9. [ ] Probar en móvil
10. [ ] Instalar como PWA

---

## 💡 Tips

- **Desarrollo**: Usa `console.log` para debug
- **Producción**: Los logs se verán en la consola del navegador
- **Errores de Supabase**: Revisar políticas RLS
- **OAuth**: Siempre usar localhost o HTTPS
- **Cache**: Hacer hard refresh (Ctrl+Shift+R) al actualizar código

---

## 📞 Soporte

Si algo no funciona:

1. Revisar consola del navegador (F12)
2. Ejecutar `debugHouseZen()`
3. Verificar configuración de Supabase
4. Limpiar caché y volver a intentar

---

**¡Listo para empezar!** 🚀
