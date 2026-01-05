# 🏠 HouseZen.com

**Plataforma unificada para gestión integral de viviendas**

HouseZen fusiona las funcionalidades de inquilinos y propietarios en una única aplicación con sistema de roles dinámico.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Base de Datos](#-base-de-datos)
- [Despliegue](#-despliegue)

---

## ✨ Características

### 🔐 Autenticación Unificada
- Login único con Google OAuth
- Detección automática de roles
- Selector de rol para usuarios nuevos
- Gestión de sesiones con auto-refresh

### 👥 Dos Perfiles en Uno

#### **Inquilino** 🏠
- Reportar nuevas incidencias
- Ver historial de reportes
- Vincular vivienda con código de referencia
- Gestionar perfil personal

#### **Propietario** 🏢
- Gestionar propiedades
- Ver incidencias recibidas
- Dashboard de estadísticas
- Generar códigos de vinculación

### 🎨 Interfaz Dinámica
- UI que cambia según el rol del usuario
- Navegación adaptativa
- Diseño responsive (móvil y escritorio)
- PWA instalable

---

## 🏗️ Arquitectura

### **Tecnologías**
- **Frontend**: Vanilla JavaScript (sin frameworks)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Autenticación**: Google OAuth
- **Estilos**: CSS3 con variables
- **PWA**: Service Worker + Manifest

### **Patrón de Diseño**
- Single Page Application (SPA)
- Router dinámico por roles
- Módulos separados por funcionalidad
- Componentes compartidos reutilizables

---

## 📁 Estructura del Proyecto

```
housezen.com/
├── index.html                      # Entrada principal
├── manifest.json                   # Configuración PWA
├── service-worker.js               # Service worker
│
├── styles/                         # Estilos CSS
│   ├── main.css                   # Variables y componentes globales
│   ├── login.css                  # Página de login
│   ├── role-selector.css          # Selector de rol
│   ├── tenant.css                 # Estilos de inquilino
│   └── landlord.css               # Estilos de propietario
│
├── js/
│   ├── core/                      # Núcleo de la aplicación
│   │   ├── config.js             # Configuración Supabase
│   │   ├── auth.js               # Sistema de autenticación
│   │   ├── router.js             # Router dinámico
│   │   └── app.js                # Orquestador principal
│   │
│   ├── shared/                    # Componentes compartidos
│   │   ├── ui.js                 # Funciones UI (toast, modal, etc.)
│   │   ├── utils.js              # Utilidades
│   │   └── profile.js            # Gestión de perfil
│   │
│   ├── tenant/                    # Módulos de inquilino
│   │   ├── incidents-create.js   # Crear incidencias
│   │   ├── incidents-list.js     # Lista de incidencias
│   │   └── housing.js            # Vinculación de vivienda
│   │
│   └── landlord/                  # Módulos de propietario
│       ├── properties.js          # Gestión de propiedades
│       ├── incidents-received.js  # Incidencias recibidas
│       └── stats.js               # Estadísticas
│
└── assets/                         # Recursos estáticos
    ├── icons/                     # Iconos PWA
    └── images/                    # Imágenes
```

---

## 🚀 Instalación

### Requisitos Previos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Cuenta de Supabase (ya configurada)
- Servidor web (para desarrollo local)

### Opción 1: Desarrollo Local

```bash
# Clonar o descargar el proyecto
cd housezen.com

# Servir con cualquier servidor HTTP
# Opción A: Python
python -m http.server 8000

# Opción B: Node.js
npx serve

# Opción C: PHP
php -S localhost:8000
```

Abrir en el navegador: `http://localhost:8000`

### Opción 2: GitHub Pages

1. Crear un repositorio en GitHub
2. Subir todos los archivos
3. Ir a Settings > Pages
4. Seleccionar la rama `main` como fuente
5. Guardar y esperar el despliegue

---

## ⚙️ Configuración

### 1. Supabase

El proyecto ya está configurado con las credenciales actuales en `js/core/config.js`:

```javascript
const SUPABASE_URL = 'https://ebkubuxrzgmenmcjyima.supabase.co';
const SUPABASE_ANON_KEY = 'tu-key-actual';
```

### 2. Google OAuth

Configurar en Supabase Dashboard:

1. **Authentication** > **Providers** > **Google**
2. Habilitar Google provider
3. Añadir URL de redirección:
   - Desarrollo: `http://localhost:8000`
   - Producción: `https://tu-dominio.github.io/housezen.com`

### 3. Base de Datos

Las tablas ya existen en Supabase:

- ✅ `perfiles` - Información de usuarios
- ✅ `propiedades` - Propiedades de caseros
- ✅ `perfil_propiedades` - Vinculación inquilino-propiedad
- ✅ `incidencias` - Reportes de incidencias

**No se requieren cambios en el esquema.**

---

## 📖 Uso

### Flujo de Usuario Nuevo

1. **Login**: Hacer clic en "Entrar con Google"
2. **Autorizar**: Permitir acceso a la cuenta de Google
3. **Selector de Rol**: Elegir "Soy Inquilino" o "Soy Propietario"
4. **Interfaz**: Se carga automáticamente la interfaz correspondiente

### Flujo de Usuario Existente

1. **Login**: Entrar con Google
2. **Auto-detección**: El sistema detecta el rol guardado
3. **Redirección**: Se carga directamente la interfaz apropiada

### Como Inquilino

1. **Vincular Vivienda**:
   - Ir a "Mi Vivienda"
   - Introducir código proporcionado por el propietario
   - Confirmar vinculación

2. **Reportar Incidencia**:
   - Ir a "Nueva Incidencia"
   - Seleccionar categoría y urgencia
   - Completar título y descripción
   - Enviar

3. **Ver Reportes**:
   - Ir a "Mis Reportes"
   - Ver historial completo

### Como Propietario

1. **Añadir Propiedad**:
   - Ir a "Mis Propiedades"
   - Hacer clic en "Añadir Propiedad"
   - Completar datos
   - Copiar código de vinculación

2. **Ver Incidencias**:
   - Ir a "Incidencias"
   - Ver todas las incidencias de inquilinos

3. **Estadísticas**:
   - Ir a "Estadísticas"
   - Ver métricas y resumen

---

## 🗄️ Base de Datos

### Tabla: `perfiles`

| Campo     | Tipo   | Descripción                |
|-----------|--------|----------------------------|
| id        | uuid   | ID del usuario (Supabase)  |
| email     | text   | Correo electrónico         |
| nombre    | text   | Nombre completo            |
| telefono  | text   | Teléfono de contacto       |
| rol       | text   | 'inquilino' o 'casero'     |

### Tabla: `propiedades`

| Campo              | Tipo   | Descripción                    |
|--------------------|--------|--------------------------------|
| id                 | uuid   | ID de la propiedad             |
| perfil_id          | uuid   | FK a perfiles (casero)         |
| nombre_propiedad   | text   | Nombre de la propiedad         |
| direccion_completa | text   | Dirección completa             |
| codigo_vinculacion | text   | Código único para inquilinos   |

### Tabla: `perfil_propiedades`

| Campo                | Tipo   | Descripción              |
|----------------------|--------|--------------------------|
| id_perfil_inquilino  | uuid   | FK a perfiles            |
| id_perfil_casero     | uuid   | FK a perfiles            |
| codigo_propiedad     | text   | FK a propiedades         |

### Tabla: `incidencias`

| Campo            | Tipo      | Descripción                     |
|------------------|-----------|---------------------------------|
| id               | uuid      | ID de la incidencia             |
| titulo           | text      | Título del reporte              |
| descripcion      | text      | Descripción detallada           |
| categoria        | text      | Categoría (fontanería, etc.)    |
| urgencia         | text      | Nivel: baja, media, alta        |
| estado           | text      | pendiente, en_proceso, resuelta |
| user_id          | uuid      | FK a perfiles (inquilino)       |
| propiedad_id     | uuid      | FK a propiedades                |
| nombre_inquilino | text      | Nombre del inquilino            |
| email_inquilino  | text      | Email del inquilino             |
| created_at       | timestamp | Fecha de creación               |

---

## 🌐 Despliegue

### GitHub Pages

1. **Preparar repositorio**:
```bash
git init
git add .
git commit -m "Initial commit - HouseZen unified"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/housezen.com.git
git push -u origin main
```

2. **Activar GitHub Pages**:
   - Settings > Pages
   - Source: Deploy from a branch
   - Branch: `main` / (root)
   - Save

3. **Configurar OAuth**:
   - Añadir URL en Supabase: `https://TU_USUARIO.github.io/housezen.com`

### Netlify / Vercel

1. Conectar repositorio
2. Build settings: Ninguno (es vanilla JS)
3. Publish directory: `/`
4. Deploy

---

## 🛠️ Desarrollo

### Debug en Consola

```javascript
// Ver estado de la aplicación
debugHouseZen()

// Ver información básica
getAppInfo()
```

### Estructura de Logs

La aplicación usa logging con colores para facilitar el debugging:
- 🏠 Verde: HouseZen general
- 🔐 Azul: Autenticación
- 🛣️ Naranja: Router
- ✅ Verde: Éxito
- ❌ Rojo: Errores

---

## 📝 Tareas Pendientes

- [ ] Implementar formulario completo de creación de propiedades
- [ ] Añadir sistema de notificaciones push
- [ ] Implementar chat inquilino-propietario
- [ ] Añadir subida de imágenes a incidencias
- [ ] Implementar gestión de estados de incidencias (casero)
- [ ] Añadir sistema de presupuestos
- [ ] Crear panel de administración
- [ ] Implementar multi-idioma

---

## 🤝 Contribuir

Este es un proyecto privado. Para sugerencias o problemas, contacta al desarrollador.

---

## 📄 Licencia

Copyright © 2025 HouseZen. Todos los derechos reservados.

---

## 👤 Autor

Desarrollado como parte de la fusión arquitectónica de HouseZen (inquilinos) y CaseroZen (propietarios).

**¡HouseZen - La gestión de viviendas, simplificada!** 🏠✨
