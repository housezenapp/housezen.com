/**
 * Inicialización de la aplicación de casero
 */

function initializeCaseroApp() {
    console.log('🏢 Inicializando aplicación de Casero...');
    
    // Asegurar que el login-page esté oculto cuando se carga desde el sistema unificado
    const loginPage = document.getElementById('login-page');
    const appContent = document.getElementById('app-content');
    if (loginPage && appContent && window.currentUser) {
        loginPage.classList.add('hidden');
        loginPage.style.display = 'none';
        appContent.classList.remove('hidden');
        appContent.style.display = 'block';
    }
    
    // Configurar eventos
    if (typeof window.setupEventListeners === 'function') {
        window.setupEventListeners();
    }

    // Activar listener para detectar cuando la pestaña vuelve a estar activa
    if (typeof window.setupVisibilityListener === 'function') {
        window.setupVisibilityListener();
    }

    // Cargar datos iniciales si hay sesión
    // Esperar a que window.currentUser esté disponible (puede tardar un poco si viene del auth unificado)
    const tryInitializeData = async () => {
        // Si no hay currentUser todavía, intentar obtenerlo de la sesión
        if (!window.currentUser && window._supabase) {
            try {
                const { data: { session } } = await window._supabase.auth.getSession();
                if (session) {
                    window.currentUser = session.user;
                }
            } catch (err) {
                console.error('Error obteniendo sesión:', err);
            }
        }

        if (window.currentUser && window._supabase) {
            await handleCaseroSession({ user: window.currentUser });
            
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
        } else {
            // Si después de 1 segundo no hay usuario, mostrar error
            setTimeout(() => {
                if (!window.currentUser) {
                    console.warn('⚠️ No se pudo obtener la sesión del usuario');
                    const incidentsContainer = document.getElementById('incidents-logistics-container');
                    const propertiesContainer = document.getElementById('properties-container');
                    if (incidentsContainer && incidentsContainer.querySelector('.loading-state')) {
                        incidentsContainer.innerHTML = `
                            <div class="empty-state">
                                <i class="fa-solid fa-exclamation-triangle"></i>
                                <div class="empty-state-text">Error: No se pudo cargar la sesión. Por favor, recarga la página.</div>
                            </div>
                        `;
                    }
                    if (propertiesContainer && propertiesContainer.querySelector('.loading-state')) {
                        propertiesContainer.innerHTML = `
                            <div class="empty-state">
                                <i class="fa-solid fa-exclamation-triangle"></i>
                                <div class="empty-state-text">Error: No se pudo cargar la sesión. Por favor, recarga la página.</div>
                            </div>
                        `;
                    }
                }
            }, 1000);
        }
    };

    // Intentar inicializar inmediatamente
    tryInitializeData();
    
    // Si no hay usuario todavía, intentar de nuevo después de un breve delay
    if (!window.currentUser) {
        setTimeout(tryInitializeData, 500);
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
