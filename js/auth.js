/**
 * Sistema de Autenticación Unificado
 * Gestiona login, verificación de rol y redirección a la app correspondiente
 */

async function login() {
    const returnUrl = window.location.origin + window.location.pathname;

    const { data, error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: returnUrl
        }
    });

    if (error) {
        showToast("Error al iniciar sesión");
        return;
    }
}

async function logout() {
    console.log('%c🚪 Cerrando sesión...', 'background: #E74C3C; color: white; padding: 4px 8px; border-radius: 4px;');

    localStorage.clear();
    sessionStorage.clear();

    _supabase.auth.signOut().catch(err => {
        console.log('%c⚠️ Error al cerrar sesión en Supabase (ignorado):', 'color: orange;', err.message);
    });

    window.location.href = window.location.origin + window.location.pathname;
}

async function initializeAuth() {
    _supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('%c🔐 AUTH EVENT', 'background: #2A9D8F; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;', event);

        if (session) {
            currentUser = session.user;
            window.currentUser = session.user; // Sincronizar globalmente
            await handleUserSession(session);
        } else {
            currentUser = null;
            window.currentUser = null; // Sincronizar globalmente
            showLoginPage();
        }
    });

    try {
        console.log('%c🚀 Inicializando autenticación...', 'background: #264653; color: white; padding: 4px 8px; border-radius: 4px;');
        const { data: { session }, error } = await _supabase.auth.getSession();

        if (error) {
            console.error('%c❌ Error obteniendo sesión:', 'color: red; font-weight: bold;', error);
            showLoginPage();
            return;
        }

        if (session) {
            console.log('%c✓ Sesión existente encontrada', 'color: green;');
            currentUser = session.user;
            window.currentUser = session.user; // Sincronizar globalmente
            await handleUserSession(session);
        } else {
            console.log('%c⚠️ No hay sesión activa', 'color: orange;');
            window.currentUser = null; // Sincronizar globalmente
            showLoginPage();
        }
    } catch (err) {
        console.error('%c❌ Error inicializando auth:', 'color: red; font-weight: bold;', err);
        showLoginPage();
    }

    authInitialized = true;
}

async function handleUserSession(session) {
    try {
        currentUser = session.user;
        window.currentUser = session.user; // Sincronizar globalmente

        // Cargar perfil del usuario
        const { data: profile, error: profileError } = await _supabase
            .from('perfiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (profileError) {
            console.error('Error loading profile:', profileError);
        }

        // Si no existe perfil, crearlo
        if (!profile) {
            const fullName = currentUser.user_metadata?.full_name || "Usuario";
            const { error: upsertError } = await _supabase
                .from('perfiles')
                .upsert({
                    id: currentUser.id,
                    email: currentUser.email,
                    nombre: fullName
                    // NO establecemos rol aquí - se establecerá cuando el usuario seleccione
                }, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                });

            if (upsertError) {
                console.error('Error creating profile:', upsertError);
            }
        }

        // Verificar si tiene rol asignado
        const { data: updatedProfile } = await _supabase
            .from('perfiles')
            .select('rol')
            .eq('id', currentUser.id)
            .maybeSingle();

        const userRole = updatedProfile?.rol;

        if (!userRole) {
            // Mostrar pantalla de selección de rol
            showRoleSelectionPage();
        } else {
            // Redirigir a la app correspondiente según el rol
            loadAppForRole(userRole);
        }
    } catch (err) {
        console.error('Error in handleUserSession:', err);
        showLoginPage();
    }
}

async function selectRole(role) {
    if (!currentUser || !window.currentUser) {
        showToast("Error: No hay sesión activa");
        return;
    }

    try {
        // Actualizar el rol en el perfil
        const { error } = await _supabase
            .from('perfiles')
            .update({ rol: role === 'inquilino' ? 'inquilino' : 'casero' })
            .eq('id', currentUser.id);

        if (error) {
            console.error('Error updating role:', error);
            showToast("Error al actualizar el rol");
            return;
        }

        // Redirigir a la app correspondiente
        loadAppForRole(role === 'inquilino' ? 'inquilino' : 'casero');
    } catch (err) {
        console.error('Error selecting role:', err);
        showToast("Error al seleccionar el rol");
    }
}

function showLoginPage() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('role-selection-page').classList.add('hidden');
    document.getElementById('app-container').classList.add('hidden');
}

function showRoleSelectionPage() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('role-selection-page').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
}

function loadAppForRole(role) {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('role-selection-page').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');

    // El router se encargará de cargar la app correspondiente
    if (typeof window.router !== 'undefined' && window.router.loadApp) {
        window.router.loadApp(role);
    }
}

// Exponer funciones globalmente
window.login = login;
window.logout = logout;
window.selectRole = selectRole;
// window.currentUser ya se actualiza dinámicamente en initializeAuth y handleUserSession

// Exponer loginWithGoogle para compatibilidad con las apps originales
window.loginWithGoogle = login;
