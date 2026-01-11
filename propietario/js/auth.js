
/**
 * js/auth.js - Gestión de Autenticación Global
 */

async function initAuth() {
    console.log("🕵️ Vigilante de sesión activado...");

    // 1. Escuchar cambios en la sesión (Login/Logout/Retorno de Google/Token Refresh)
    window._supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("🔔 Cambio de estado detectado:", event);

        if (session) {
            console.log("✅ Usuario detectado:", session.user.email);
            window.currentUser = session.user;

            // Actualizar interfaz
            await updateUserDisplay(session.user);

            // Cambiar de pantalla de Login a App
            const loginPage = document.getElementById('login-page');
            const appContent = document.getElementById('app-content');

            if (loginPage && appContent) {
                loginPage.classList.add('hidden');
                appContent.classList.remove('hidden');
                console.log("🖥️ Pantalla cambiada a la APP");
                
                // Si acabamos de entrar o refrescamos token, cargar datos
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (window.showPage) window.showPage('incidencias');
                }
            }
        } else {
            // Si no hay sesión, asegurar que estamos en login
            window.currentUser = null;
            const loginPage = document.getElementById('login-page');
            const appContent = document.getElementById('app-content');
            if (loginPage && appContent) {
                loginPage.classList.remove('hidden');
                appContent.classList.add('hidden');
            }
        }
    });

    // 2. Verificación inmediata (por si ya hay una sesión activa al refrescar)
    console.log("🔍 Verificando sesión...");
    let session, sessionError;
    try {
        const result = await window._supabase.auth.getSession();
        session = result.data?.session;
        sessionError = result.error;
    } catch (e) {
        console.error("❌ Excepción al obtener sesión:", e);
        sessionError = e;
        window.captureError("initAuth.getSession", e.message || "Excepción al obtener sesión", {
            stack: e.stack
        });
    }

    if (session && !sessionError) {
        console.log("🏠 Sesión previa recuperada");

        // Verificar que la sesión sigue siendo válida
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        if (timeUntilExpiry < 60) { // Si expira en menos de 1 minuto, cerrar sesión
            console.log("⚠️ Sesión expirada, cerrando...");
            await forceLogout();
            return;
        }

        window.currentUser = session.user;
        await updateUserDisplay(session.user); // Esto inicializa window.isAdmin
        
        // Cambiar de pantalla de Login a App si hay sesión
        const loginPage = document.getElementById('login-page');
        const appContent = document.getElementById('app-content');
        
        if (loginPage && appContent) {
            loginPage.classList.add('hidden');
            appContent.classList.remove('hidden');
            console.log("🖥️ Pantalla cambiada a la APP (sesión recuperada)");
            
            // Esperar un momento para que todos los scripts se hayan cargado
            setTimeout(async () => {
                // Verificar nuevamente la sesión antes de cargar
                const hasValidSession = await checkAndRefreshSession();
                if (!hasValidSession) {
                    return; // forceLogout ya fue llamado
                }
                
                // Verificar si el contenedor está vacío o tiene estado de carga persistente
                const incidentsContainer = document.getElementById('incidents-logistics-container');
                const propertiesContainer = document.getElementById('properties-container');
                
                const activePage = document.querySelector('.page.active');
                const pageId = activePage ? activePage.id : null;
                
                // Cargar datos según la página activa
                if (pageId === 'page-incidencias' || !pageId) {
                    // Si no hay contenido o solo hay loading, cargar incidencias
                    if (!incidentsContainer || !incidentsContainer.innerHTML.trim() || incidentsContainer.querySelector('.loading-state')) {
                        console.log("📥 Cargando incidencias (sesión recuperada)...");
                        if (typeof window.loadIncidents === 'function') {
                            await window.loadIncidents();
                        } else if (typeof window.showPage === 'function') {
                            window.showPage('incidencias');
                        }
                    }
                } else if (pageId === 'page-propiedades') {
                    if (!propertiesContainer || !propertiesContainer.innerHTML.trim() || propertiesContainer.querySelector('.loading-state')) {
                        console.log("📥 Cargando propiedades (sesión recuperada)...");
                        if (typeof window.loadProperties === 'function') {
                            await window.loadProperties();
                        } else if (typeof window.showPage === 'function') {
                            window.showPage('propiedades');
                        }
                    }
                } else {
                    // Usar showPage como fallback
                    if (typeof window.showPage === 'function') {
                        window.showPage('incidencias');
                    }
                }
            }, 200); // Aumentar a 200ms para dar más tiempo
        }
    } else {
        // No hay sesión válida, asegurar que estamos en login
        window.currentUser = null;
        const loginPage = document.getElementById('login-page');
        const appContent = document.getElementById('app-content');
        if (loginPage && appContent) {
            loginPage.classList.remove('hidden');
            appContent.classList.add('hidden');
        }
    }

    authInitialized = true;
}

// Actualiza el nombre del usuario en la interfaz
async function updateUserDisplay(user) {
    // Nombre en el sidebar
    const sidebarUsername = document.getElementById('sidebar-username');
    if (sidebarUsername) {
        const userName = user.user_metadata?.full_name || user.email;
        sidebarUsername.textContent = userName;
    }

    // Email en el formulario de perfil
    const perfilEmail = document.getElementById('perfil-email');
    if (perfilEmail) {
        perfilEmail.value = user.email;
    }

    // Asegurar que el perfil existe en la base de datos
    await createOrUpdateCaseroProfile(user);
}

// Crea o actualiza el perfil en la tabla 'perfiles'
async function createOrUpdateCaseroProfile(user) {
    try {
        const perfilData = {
            id: user.id,
            email: user.email,
            nombre: user.user_metadata?.full_name || null,
            rol: 'casero'
        };

        // Verificamos si existe
        const { data: existing } = await window._supabase
            .from('perfiles')
            .select('id, rol')
            .eq('id', user.id)
            .maybeSingle();

        if (existing) {
            await window._supabase
                .from('perfiles')
                .update({ email: perfilData.email, nombre: perfilData.nombre, rol: perfilData.rol })
                .eq('id', user.id);
            console.log("✅ Perfil sincronizado");

            // Establecer isAdmin basado en el rol existente
            window.isAdmin = existing.rol === 'admin';
        } else {
            await window._supabase
                .from('perfiles')
                .insert([perfilData]);
            console.log("✅ Perfil creado por primera vez");

            // Por defecto, los nuevos usuarios no son admin
            window.isAdmin = false;
        }

        console.log("👤 Usuario es admin:", window.isAdmin);
    } catch (error) {
        console.error("❌ Error sincronizando perfil:", error);
        // En caso de error, asumir que no es admin
        window.isAdmin = false;
    }
}

// --- FUNCIONES GLOBALES (Para que ui.js las vea) ---

window.loginWithGoogle = async () => {
    console.log("🚀 Lanzando inicio de sesión con Google...");
    
    // Verificar que Supabase esté inicializado
    if (!window._supabase) {
        const errorMsg = "❌ Supabase no está inicializado";
        console.error(errorMsg);
        window.captureError("loginWithGoogle", "Supabase no inicializado", {});
        throw new Error("La conexión a la base de datos no está disponible");
    }
    
    try {
        const redirectUrl = window.location.origin + window.location.pathname;
        console.log("📍 URL de redirección:", redirectUrl);
        
        const { data, error } = await window._supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl
            }
        });
        
        if (error) {
            console.error("❌ Error en el inicio de sesión:", error);
            window.captureError("loginWithGoogle", error.message || "Error desconocido", {
                code: error.status,
                details: error
            });
            throw error;
        }
        
        console.log("✅ Redirección a Google iniciada correctamente");
        return data;
    } catch (error) {
        console.error("❌ Error completo al iniciar sesión con Google:", error);
        window.captureError("loginWithGoogle", error.message || "Error desconocido", {
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
};

window.logout = async () => {
    console.log("👋 Cerrando sesión...");
    await window._supabase.auth.signOut();
    window.currentUser = null;
    location.reload(); // Recargamos para limpiar todo rastro de datos en memoria
};

// Función para forzar cierre de sesión cuando hay problemas
async function forceLogout() {
    console.log("🚨 Forzando cierre de sesión debido a problemas de autenticación...");
    window.currentUser = null;
    
    // Limpiar storage inmediatamente
    localStorage.clear();
    sessionStorage.clear();
    
    try {
        if (window._supabase) {
            await window._supabase.auth.signOut();
        }
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
    
    // Cambiar a pantalla de login
    const loginPage = document.getElementById('login-page');
    const appContent = document.getElementById('app-content');
    if (loginPage && appContent) {
        loginPage.classList.remove('hidden');
        appContent.classList.add('hidden');
    }
    
    if (window.showToast) {
        window.showToast("Sesión cerrada. Por favor, inicia sesión nuevamente.");
    }
}

// Función para verificar y refrescar la sesión (legacy, mantener por compatibilidad)
async function checkAndRefreshSession() {
    return await ensureValidToken();
}

// Función helper para verificar y refrescar token antes de queries
// Retorna true si la sesión es válida, false si no (y ya redirigió al login)
async function ensureValidToken() {
    try {
        if (!window._supabase) {
            console.error("❌ Supabase no está inicializado");
            await forceLogout();
            return false;
        }

        // Obtener sesión actual
        const { data: { session }, error: sessionError } = await window._supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error("❌ No hay sesión válida:", sessionError);
            await forceLogout();
            return false;
        }

        // Verificar expiración del token
        const expiresAt = session.expires_at; // timestamp en segundos
        const now = Math.floor(Date.now() / 1000); // timestamp actual en segundos
        const timeUntilExpiry = expiresAt - now; // segundos hasta expiración

        console.log("🔍 Token expira en:", timeUntilExpiry, "segundos");

        // Si el token está expirado o le quedan menos de 60 segundos, forzar refresh
        if (timeUntilExpiry < 60) {
            console.log("🔄 Token expirado o próximo a expirar, refrescando...");
            
            try {
                const { data: { session: newSession }, error: refreshError } = await window._supabase.auth.refreshSession();
                
                if (refreshError || !newSession) {
                    console.error("❌ Error al refrescar sesión:", refreshError);
                    await forceLogout();
                    return false;
                }

                // Actualizar usuario y sesión
                window.currentUser = newSession.user;
                console.log("✅ Token refrescado exitosamente");
                return true;
            } catch (refreshErr) {
                console.error("❌ Excepción al refrescar sesión:", refreshErr);
                await forceLogout();
                return false;
            }
        }

        // Token válido, actualizar usuario
        window.currentUser = session.user;
        return true;

    } catch (err) {
        console.error("❌ Error verificando token:", err);
        await forceLogout();
        return false;
    }
}

// Exponer función globalmente
window.ensureValidToken = ensureValidToken;
window.checkAndRefreshSession = checkAndRefreshSession;

// Listener para re-fetch inteligente al volver a la pestaña con re-inicialización
function setupVisibilityListener() {
    let wasHidden = false;

    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden && authInitialized && wasHidden) {
            console.log("👁️ Pestaña visible de nuevo - Verificando conexión y recargando datos");

            // Pausa de recuperación: esperar 500ms para que el SO recupere la conexión
            await new Promise(resolve => setTimeout(resolve, 500));

            // Debug de red
            console.log("🌐 Estado de red:", navigator.onLine ? "ONLINE" : "OFFLINE");

            // Reconectar Supabase antes de verificar sesión
            if (typeof window.reconnectSupabase === 'function') {
                const reconnected = window.reconnectSupabase();
                if (!reconnected) {
                    console.error("❌ No se pudo reconectar Supabase");
                    return;
                }
            }

            // Verificar que hay una sesión activa después de reconectar
            if (window._supabase && window.currentUser) {
                try {
                    // Verificar sesión con el nuevo cliente
                    const { data: { session } } = await window._supabase.auth.getSession();
                    if (!session) {
                        console.log("⚠️ No hay sesión activa al volver a la pestaña");
                        return;
                    }

                    console.log("✅ Sesión activa encontrada en nuevo cliente");
                    
                    // Re-disparar la función de carga de datos según la página activa
                    const activePage = document.querySelector('.page.active');
                    if (activePage) {
                        const pageId = activePage.id;
                        
                        if (pageId === 'page-incidencias' && typeof window.loadIncidents === 'function') {
                            await window.loadIncidents();
                        } else if (pageId === 'page-propiedades' && typeof window.loadProperties === 'function') {
                            await window.loadProperties();
                        } else if (pageId === 'page-perfil' && typeof window.loadProfile === 'function') {
                            window.loadProfile();
                        }
                    } else {
                        // Si no hay página activa, intentar cargar incidencias por defecto
                        if (typeof window.loadIncidents === 'function') {
                            await window.loadIncidents();
                        }
                    }
                } catch (err) {
                    console.error("❌ Error verificando sesión:", err);
                }
            }

        } else if (document.hidden) {
            console.log("😴 Pestaña oculta");
            wasHidden = true;
        }
    });

    console.log("✅ Listener de visibilidad configurado");
}

// Exponer funciones
window.initAuth = initAuth;
window.checkAndRefreshSession = checkAndRefreshSession;
window.setupVisibilityListener = setupVisibilityListener;
window.forceLogout = forceLogout;