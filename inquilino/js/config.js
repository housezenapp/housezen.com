const SUPABASE_URL = 'https://ebkubuxrzgmenmcjyima.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6fp2CquDO9YZlBrT4jVa9Q_q4hd7AzA';

// Configurar Supabase con opciones de auto-refresh y mejor manejo de red
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    global: {
        headers: {
            'x-client-info': 'housezen-web'
        }
    }
});

// Exponer _supabase globalmente
window._supabase = _supabase;

// Función para re-inicializar el cliente de Supabase
function reinitializeSupabaseClient() {
    console.log('%c🔄 Re-inicializando cliente de Supabase...', 'color: #9B59B6; font-weight: bold;');
    try {
        // Guardar la sesión actual antes de recrear el cliente
        const oldClient = window._supabase;
        let savedSession = null;
        if (oldClient) {
            // Intentar obtener la sesión del cliente anterior
            oldClient.auth.getSession().then(({ data: { session } }) => {
                savedSession = session;
            }).catch(() => {
                // Si falla, continuar de todas formas
            });
        }

        // Crear nuevo cliente
        window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            },
            global: {
                headers: {
                    'x-client-info': 'housezen-web'
                }
            }
        });

        console.log('%c✅ Cliente de Supabase re-inicializado', 'color: green;');
        return true;
    } catch (err) {
        console.error('%c❌ Error re-inicializando cliente:', 'color: red;', err);
        return false;
    }
}

// Exponer función globalmente
window.reinitializeSupabaseClient = reinitializeSupabaseClient;

// Función para reconectar Supabase completamente (crear nueva instancia)
function reconnectSupabase() {
    console.log('%c🔄 Reconectando Supabase - Creando nueva instancia...', 'color: #9B59B6; font-weight: bold;');
    
    try {
        // Limpiar suscripciones de Realtime si existen para evitar saturar memoria
        if (window._supabase) {
            try {
                // Intentar limpiar canales de Realtime
                const realtime = window._supabase.realtime;
                if (realtime && typeof realtime.removeAllChannels === 'function') {
                    realtime.removeAllChannels();
                    console.log('%c🧹 Suscripciones de Realtime limpiadas', 'color: #3498DB;');
                }
            } catch (realtimeError) {
                console.warn('%c⚠️ Error limpiando Realtime (continuando):', 'color: orange;', realtimeError);
            }
        }

        // Paso 1: Poner el objeto a null
        window._supabase = null;
        console.log('%c✅ Cliente anterior eliminado', 'color: green;');

        // Paso 2: Crear nueva instancia con createClient
        if (typeof supabase === 'undefined') {
            console.error('%c❌ Librería de Supabase no disponible', 'color: red;');
            return false;
        }

        window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            },
            global: {
                headers: {
                    'x-client-info': 'housezen-web'
                }
            }
        });

        console.log('%c✅ Nuevo cliente de Supabase creado', 'color: green; font-weight: bold;');
        return true;
    } catch (err) {
        console.error('%c❌ Error reconectando Supabase:', 'color: red; font-weight: bold;', err);
        return false;
    }
}

// Exponer función globalmente
window.reconnectSupabase = reconnectSupabase;

let currentUser = null;
let authInitialized = false;
