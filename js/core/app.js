/**
 * HOUSEZEN - ORQUESTADOR PRINCIPAL
 * Inicializa y coordina todos los módulos de la aplicación
 */

// ========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ========================================
async function initializeApp() {
  console.log('%c════════════════════════════════════════', 'color: #2A9D8F; font-weight: bold');
  console.log('%c🏠 HOUSEZEN - INICIO DE APLICACIÓN', 'color: #2A9D8F; font-weight: bold; font-size: 16px');
  console.log('%c════════════════════════════════════════', 'color: #2A9D8F; font-weight: bold');

  try {
    // Mostrar loading inicial
    showLoading(true);

    // 1. Verificar dependencias
    checkDependencies();

    // 2. Inicializar autenticación
    console.log('%c🔐 Paso 1: Inicializando autenticación...', 'color: #3B82F6; font-weight: bold');
    await window.initAuth();

    // 3. La aplicación continuará desde auth.js según el estado de la sesión

    console.log('%c✅ Aplicación inicializada correctamente', 'color: #10B981; font-weight: bold');
  } catch (error) {
    console.error('%c❌ Error crítico al inicializar:', 'color: #EF4444; font-weight: bold', error);
    showToast('Error al inicializar la aplicación', 'error');
    showLoading(false);
  }
}

// ========================================
// VERIFICAR DEPENDENCIAS
// ========================================
function checkDependencies() {
  const dependencies = [
    { name: 'Supabase Client', check: () => window._supabase },
    { name: 'Login Function', check: () => window.loginWithGoogle },
    { name: 'Logout Function', check: () => window.logout },
    { name: 'Router', check: () => window.initRouter },
    { name: 'UI Functions', check: () => window.showToast },
  ];

  let allOk = true;

  dependencies.forEach(dep => {
    if (!dep.check()) {
      console.error(`❌ Dependencia faltante: ${dep.name}`);
      allOk = false;
    } else {
      console.log(`✅ ${dep.name}`);
    }
  });

  if (!allOk) {
    throw new Error('Faltan dependencias críticas');
  }

  console.log('%c✅ Todas las dependencias están disponibles', 'color: #10B981');
}

// ========================================
// INFORMACIÓN DE DEBUG
// ========================================
window.getAppInfo = function() {
  return {
    version: '1.0.0',
    environment: window.location.hostname === 'localhost' ? 'development' : 'production',
    currentUser: window.currentUser?.email || 'No autenticado',
    userRole: window.userRole || 'Sin rol',
    currentRoute: window.getCurrentRoute()?.id || 'Ninguna',
    supabaseConnected: !!window._supabase,
    timestamp: new Date().toISOString()
  };
};

// Exponer función de debug en consola
window.debugHouseZen = function() {
  console.table(window.getAppInfo());

  console.group('%c🔍 Estado de la Sesión', 'color: #3B82F6; font-weight: bold');
  console.log('Usuario:', window.currentUser);
  console.log('Perfil:', window.userProfile);
  console.log('Rol:', window.userRole);
  console.groupEnd();

  console.group('%c🛣️ Router', 'color: #F59E0B; font-weight: bold');
  console.log('Rutas actuales:', window.currentRoutes);
  console.log('Ruta activa:', window.getCurrentRoute());
  console.groupEnd();
};

// ========================================
// MANEJO DE ERRORES GLOBALES
// ========================================
window.addEventListener('error', (event) => {
  console.error('%c⚠️ Error Global:', 'color: #EF4444; font-weight: bold', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('%c⚠️ Promise Rechazada:', 'color: #EF4444; font-weight: bold', event.reason);
});

// ========================================
// INICIALIZAR CUANDO EL DOM ESTÉ LISTO
// ========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// ========================================
// MENSAJE DE BIENVENIDA EN CONSOLA
// ========================================
console.log('%c════════════════════════════════════════', 'color: #2A9D8F');
console.log('%c🏠 HouseZen v1.0.0', 'color: #2A9D8F; font-weight: bold; font-size: 18px');
console.log('%cGestión Integral de Viviendas', 'color: #636E72; font-style: italic');
console.log('%c════════════════════════════════════════', 'color: #2A9D8F');
console.log('%cComandos disponibles:', 'color: #3B82F6; font-weight: bold');
console.log('%c- debugHouseZen()', 'color: #636E72', '→ Ver estado de la aplicación');
console.log('%c- getAppInfo()', 'color: #636E72', '→ Información de la app');
console.log('%c════════════════════════════════════════', 'color: #2A9D8F');
