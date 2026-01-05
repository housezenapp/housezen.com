/**
 * HOUSEZEN - ROUTER DINÁMICO POR ROLES
 * Sistema de navegación que cambia según el rol del usuario
 */

// ========================================
// CONFIGURACIÓN DE RUTAS POR ROL
// ========================================
const ROUTES = {
  inquilino: [
    {
      id: 'nueva-incidencia',
      label: 'Nueva Incidencia',
      icon: '➕',
      module: 'tenant/incidents-create',
      default: true
    },
    {
      id: 'mis-incidencias',
      label: 'Mis Reportes',
      icon: '📋',
      module: 'tenant/incidents-list'
    },
    {
      id: 'mi-vivienda',
      label: 'Mi Vivienda',
      icon: '🏠',
      module: 'tenant/housing'
    },
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: '👤',
      module: 'shared/profile'
    }
  ],

  casero: [
    {
      id: 'propiedades',
      label: 'Mis Propiedades',
      icon: '🏢',
      module: 'landlord/properties',
      default: true
    },
    {
      id: 'incidencias-recibidas',
      label: 'Incidencias',
      icon: '📨',
      module: 'landlord/incidents-received'
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      icon: '📊',
      module: 'landlord/stats'
    },
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: '👤',
      module: 'shared/profile'
    }
  ]
};

// Variable global de rutas activas
window.currentRoutes = null;

// ========================================
// INICIALIZAR ROUTER
// ========================================
window.initRouter = function(userRole) {
  console.log('%c🛣️ Inicializando router', 'color: #3B82F6; font-weight: bold', `Rol: ${userRole}`);

  if (!ROUTES[userRole]) {
    console.error('Rol no válido:', userRole);
    showToast('Error: Rol no válido', 'error');
    return;
  }

  const routes = ROUTES[userRole];
  window.currentRoutes = routes;

  // Renderizar navegación
  renderNavigation(routes);

  // Configurar event listeners
  setupNavigationListeners(routes);

  // Renderizar páginas
  renderPages(routes);

  // Navegar a la ruta por defecto
  const defaultRoute = routes.find(r => r.default) || routes[0];
  navigateTo(defaultRoute.id);
};

// ========================================
// RENDERIZAR NAVEGACIÓN
// ========================================
function renderNavigation(routes) {
  const navMenu = document.getElementById('nav-menu');
  if (!navMenu) {
    console.error('Elemento nav-menu no encontrado');
    return;
  }

  navMenu.innerHTML = '';

  routes.forEach(route => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.dataset.page = route.id;

    li.innerHTML = `
      <span class="nav-icon">${route.icon}</span>
      <span class="nav-label">${route.label}</span>
    `;

    navMenu.appendChild(li);
  });

  console.log('%c📋 Navegación renderizada', 'color: #10B981', `${routes.length} rutas`);
}

// ========================================
// CONFIGURAR LISTENERS DE NAVEGACIÓN
// ========================================
function setupNavigationListeners(routes) {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const pageId = item.dataset.page;
      if (pageId) {
        navigateTo(pageId);
      }
    });
  });
}

// ========================================
// RENDERIZAR PÁGINAS
// ========================================
function renderPages(routes) {
  const pagesContainer = document.getElementById('pages-container');
  if (!pagesContainer) {
    console.error('Elemento pages-container no encontrado');
    return;
  }

  pagesContainer.innerHTML = '';

  routes.forEach(route => {
    const pageDiv = document.createElement('div');
    pageDiv.id = `page-${route.id}`;
    pageDiv.className = 'page';

    // Contenido inicial (se llenará con el módulo correspondiente)
    pageDiv.innerHTML = `
      <div class="card">
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Cargando ${route.label}...</p>
        </div>
      </div>
    `;

    pagesContainer.appendChild(pageDiv);
  });

  console.log('%c📄 Páginas renderizadas', 'color: #10B981', `${routes.length} páginas`);
}

// ========================================
// NAVEGAR A UNA RUTA
// ========================================
window.navigateTo = function(pageId) {
  console.log('%c🧭 Navegando a:', 'color: #F59E0B', pageId);

  // Ocultar todas las páginas
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => {
    page.classList.remove('active');
  });

  // Mostrar página solicitada
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add('active');

    // Scroll al inicio
    window.scrollTo(0, 0);
  } else {
    console.error(`Página no encontrada: page-${pageId}`);
    return;
  }

  // Actualizar navegación activa
  updateActiveNav(pageId);

  // Cerrar sidebar en móvil
  closeSidebar();

  // Cargar datos de la página
  loadPageData(pageId);
};

// ========================================
// ACTUALIZAR NAVEGACIÓN ACTIVA
// ========================================
function updateActiveNav(pageId) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.dataset.page === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// ========================================
// CARGAR DATOS DE LA PÁGINA
// ========================================
function loadPageData(pageId) {
  // Buscar la ruta actual
  if (!window.currentRoutes) return;

  const route = window.currentRoutes.find(r => r.id === pageId);
  if (!route) return;

  // Llamar a la función de carga según el módulo
  switch (pageId) {
    // INQUILINO
    case 'nueva-incidencia':
      if (window.initNewIncidentPage) {
        window.initNewIncidentPage();
      }
      break;

    case 'mis-incidencias':
      if (window.loadTenantIncidents) {
        window.loadTenantIncidents();
      }
      break;

    case 'mi-vivienda':
      if (window.loadHousingInfo) {
        window.loadHousingInfo();
      }
      break;

    // CASERO
    case 'propiedades':
      if (window.loadProperties) {
        window.loadProperties();
      }
      break;

    case 'incidencias-recibidas':
      if (window.loadLandlordIncidents) {
        window.loadLandlordIncidents();
      }
      break;

    case 'estadisticas':
      if (window.loadStats) {
        window.loadStats();
      }
      break;

    // COMPARTIDO
    case 'perfil':
      if (window.loadProfile) {
        window.loadProfile();
      }
      break;

    default:
      console.log(`No hay función de carga para: ${pageId}`);
  }
}

// ========================================
// HELPER: CERRAR SIDEBAR (Móvil)
// ========================================
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('menu-overlay');

  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

// ========================================
// OBTENER RUTA ACTUAL
// ========================================
window.getCurrentRoute = function() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return null;

  const pageId = activePage.id.replace('page-', '');
  return window.currentRoutes?.find(r => r.id === pageId) || null;
};

// ========================================
// LOGGING
// ========================================
console.log('%c🏠 HouseZen Router', 'color: #2A9D8F; font-weight: bold; font-size: 14px');
console.log('%cRouter dinámico cargado', 'color: #636E72');
