// Configuración unificada de Supabase
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
            'x-client-info': 'housezen-web-unified'
        }
    }
});

// Exponer _supabase globalmente para uso en módulos de inquilino y propietario
window._supabase = _supabase;

let currentUser = null;
let authInitialized = false;

// Exponer currentUser globalmente (se actualizará desde auth.js)
window.currentUser = currentUser;
