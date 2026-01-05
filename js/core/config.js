/**
 * HOUSEZEN - CONFIGURACIÓN DE SUPABASE
 * Archivo de configuración central para la conexión a Supabase
 */

// Credenciales de Supabase
const SUPABASE_URL = 'https://ebkubuxrzgmenmcjyima.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVia3VidXhyemdtZW5tY2p5aW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTExOTksImV4cCI6MjA4MjU2NzE5OX0.TwwlcvGnk_17IEtii1JxFBYVCUY6u_8ICo-rP6GjhYM';

// Inicializar cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Exportar cliente globalmente
window._supabase = supabaseClient;

// Variables globales de la aplicación
window.currentUser = null;
window.userRole = null;
window.userProfile = null;

// Logging de configuración
console.log('%c🏠 HouseZen Config', 'color: #2A9D8F; font-weight: bold; font-size: 14px');
console.log('%cSupabase URL:', 'color: #636E72', SUPABASE_URL);
console.log('%cSupabase Client:', 'color: #636E72', supabaseClient);
