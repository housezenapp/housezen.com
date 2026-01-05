/**
 * Inicialización de la aplicación de casero
 */

function initializeCaseroApp() {
    console.log('🏢 Inicializando aplicación de Casero...');
    
    // Configurar eventos
    if (typeof window.setupEventListeners === 'function') {
        window.setupEventListeners();
    }

    // Activar listener para detectar cuando la pestaña vuelve a estar activa
    if (typeof window.setupVisibilityListener === 'function') {
        window.setupVisibilityListener();
    }

    // Cargar datos iniciales si hay sesión
    if (window.currentUser && window._supabase) {
        handleCaseroSession({ user: window.currentUser });
        
        // Cargar datos de la página activa
        setTimeout(async () => {
            const activePage = document.querySelector('.page.active');
            const pageId = activePage ? activePage.id : null;
            
            if (pageId === 'page-incidencias' || !pageId) {
                if (typeof window.loadIncidents === 'function') {
                    await window.loadIncidents();
                }
            } else if (pageId === 'page-propiedades') {
                if (typeof window.loadProperties === 'function') {
                    await window.loadProperties();
                }
            } else if (pageId === 'page-perfil') {
                if (typeof window.loadProfile === 'function') {
                    await window.loadProfile();
                }
            }
        }, 200);
    }

    console.log('✅ Aplicación de Casero inicializada');
}

// Exponer función globalmente
window.initializeCaseroApp = initializeCaseroApp;

// Si ya estamos cargados cuando se ejecuta este script, inicializar inmediatamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCaseroApp);
} else {
    // Si el DOM ya está listo, esperar un momento para que todo se cargue
    setTimeout(initializeCaseroApp, 100);
}
