
// Registro del Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Calcular el scope basado en la ubicación actual
        const scope = window.location.pathname.replace(/\/[^/]*$/, '') + '/';
        const swPath = scope + 'sw.js';
        
        navigator.serviceWorker.register(swPath, { scope: scope })
            .then((reg) => {
                console.log("🚀 Service Worker registrado correctamente", reg.scope);
                
                // Verificar actualizaciones periódicamente
                setInterval(() => {
                    reg.update();
                }, 60000); // Cada minuto
                
                // Escuchar actualizaciones
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    console.log("🔄 Nueva versión del Service Worker encontrada");
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log("✅ Nueva versión lista. Recarga para actualizar.");
                            // Opcional: mostrar notificación al usuario
                            if (window.showToast) {
                                window.showToast("Nueva versión disponible. Recarga la app.");
                            }
                        }
                    });
                });
            })
            .catch((err) => {
                console.error("❌ Error al registrar el Service Worker:", err);
            });
    });
    
    // Detectar cuando se completa la instalación PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log("💾 PWA lista para instalar");
        e.preventDefault();
        window.deferredPrompt = e;
        
        // Opcional: mostrar botón de instalación personalizado
        // Puedes usar esto más tarde si quieres un botón custom
    });
    
    // Detectar cuando la PWA ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        console.log("📱 Ejecutándose como PWA instalada");
    }
}

/**
 * js/app.js - Orquestador Principal
 */

// 1. CONFIGURACIÓN DE SUPABASE (Disponible globalmente)
const SUPABASE_URL = 'https://ebkubuxrzgmenmcjyima.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVia3VidXhyemdtZW5tY2p5aW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTExOTksImV4cCI6MjA4MjU2NzE5OX0.TwwlcvGnk_17IEtii1JxFBYVCUY6u_8ICo-rP6GjhYM';

// Usamos la librería que ya debe estar cargada en el HTML
if (typeof supabase !== 'undefined') {
    window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
    console.log("✅ Supabase configurado con persistencia de sesión");
} else {
    console.error("❌ Error: La librería de Supabase no se ha cargado. Revisa tu index.html");
}

// Función de diagnóstico
function diagnosticCheck() {
    console.log("🔍 DIAGNÓSTICO INICIAL:");
    console.log("  - Supabase inicializado:", !!window._supabase);
    console.log("  - Supabase URL:", SUPABASE_URL);
    console.log("  - currentUser:", window.currentUser ? window.currentUser.id : "NO HAY");
    console.log("  - initAuth disponible:", typeof window.initAuth === 'function');
    console.log("  - loadProperties disponible:", typeof window.loadProperties === 'function');
    console.log("  - loadIncidents disponible:", typeof window.loadIncidents === 'function');
    console.log("  - checkAndRefreshSession disponible:", typeof window.checkAndRefreshSession === 'function');
    console.log("  - app-content visible:", !document.getElementById('app-content')?.classList.contains('hidden'));
    console.log("  - login-page visible:", !document.getElementById('login-page')?.classList.contains('hidden'));
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("✨ CaseroZen: Iniciando aplicación...");

    // Ejecutar diagnóstico
    diagnosticCheck();

    // 2. INICIALIZACIÓN
    // Llamamos a las funciones que ya están en el objeto 'window' 
    // porque las cargamos en los otros archivos JS
    if (typeof window.initAuth === 'function') {
        await window.initAuth();
        console.log("✅ initAuth completado");
        diagnosticCheck(); // Diagnóstico después de auth
    } else {
        console.error("❌ initAuth no está disponible!");
    }

    if (typeof window.setupEventListeners === 'function') {
        window.setupEventListeners();
    }

    // Activar listener para detectar cuando la pestaña vuelve a estar activa
    if (typeof window.setupVisibilityListener === 'function') {
        window.setupVisibilityListener();
    }

    // Verificar si hay una página activa pero sin datos cargados después de la inicialización
    setTimeout(() => {
        const appContent = document.getElementById('app-content');
        if (appContent && !appContent.classList.contains('hidden')) {
            const activePage = document.querySelector('.page.active');
            if (activePage) {
                const pageId = activePage.id;
                const hasLoadingState = activePage.querySelector('.loading-state');
                const hasContent = activePage.querySelector('.property-card, .incident-card, .empty-state:not(.loading-state)');

                // Si hay estado de carga pero no hay contenido, intentar cargar datos
                if (hasLoadingState && !hasContent) {
                    console.log(`⚠️ Página ${pageId} activa pero sin datos, intentando cargar...`);
                    if (pageId === 'page-incidencias' && typeof window.loadIncidents === 'function') {
                        window.loadIncidents();
                    } else if (pageId === 'page-propiedades' && typeof window.loadProperties === 'function') {
                        window.loadProperties();
                    }
                }
            }
        }
    }, 2000); // Aumentar a 2 segundos para dar más tiempo a la inicialización


    console.log("✅ Aplicación inicializada correctamente");
});
