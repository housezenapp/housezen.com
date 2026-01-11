/**
 * Inicialización de la aplicación de casero
 */

function initializeCaseroApp() {
    console.log('🏢 Inicializando aplicación de Casero...');
    
    // Asegurar que el router.currentRole esté establecido
    if (window.router) {
        window.router.currentRole = 'casero';
    }
    
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
    // Esperar a que window.currentUser y window._supabase estén disponibles
    const tryInitializeData = async () => {
        // Esperar a que window._supabase esté disponible
        let attempts = 0;
        while (!window._supabase && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window._supabase) {
            console.error('❌ window._supabase no está disponible después de esperar');
            return;
        }
        
        // Si no hay currentUser todavía, intentar obtenerlo de la sesión
        if (!window.currentUser) {
            try {
                console.log('🔄 Obteniendo sesión...');
                const { data: { session }, error } = await window._supabase.auth.getSession();
                if (session && !error) {
                    window.currentUser = session.user;
                    console.log('✅ Sesión obtenida:', window.currentUser.id);
                } else {
                    console.warn('⚠️ No hay sesión activa:', error);
                    return;
                }
            } catch (err) {
                console.error('❌ Error obteniendo sesión:', err);
                return;
            }
        }

        if (window.currentUser && window._supabase) {
            console.log('✅ Inicializando datos de casero...');
            await handleCaseroSession({ user: window.currentUser });
            
            // Cargar datos de la página activa usando showPage
            setTimeout(() => {
                if (typeof window.showPage === 'function') {
                    const activePage = document.querySelector('.page.active');
                    const pageId = activePage ? activePage.id : null;
                    
                    if (pageId === 'page-incidencias' || !pageId) {
                        console.log('📄 Cargando página: incidencias');
                        window.showPage('incidencias');
                    } else if (pageId === 'page-propiedades') {
                        console.log('📄 Cargando página: propiedades');
                        window.showPage('propiedades');
                    } else if (pageId === 'page-perfil') {
                        console.log('📄 Cargando página: perfil');
                        window.showPage('perfil');
                    } else {
                        console.log('📄 Cargando página por defecto: incidencias');
                        window.showPage('incidencias');
                    }
                } else {
                    console.error('❌ showPage no está disponible');
                    // Fallback: llamar directamente a loadIncidents
                    if (typeof window.loadIncidents === 'function') {
                        console.log('📥 Cargando incidencias directamente...');
                        window.loadIncidents();
                    }
                }
            }, 300);
        }
    };

    // Esperar un momento para que todo esté listo antes de inicializar
    setTimeout(() => {
        tryInitializeData();
    }, 200);

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
