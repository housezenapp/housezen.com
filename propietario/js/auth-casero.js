/**
 * Autenticación adaptada para casero en aplicación unificada
 * NO inicializa auth por sí mismo, usa el auth unificado del padre
 */

async function handleCaseroSession(session) {
    try {
        // currentUser ya debería estar establecido por el auth unificado
        if (!window.currentUser && session) {
            window.currentUser = session.user;
        }

        if (!window.currentUser) {
            console.error('No hay usuario en sesión');
            return;
        }

        const currentUser = window.currentUser;
        
        // Actualizar interfaz
        await updateUserDisplay(currentUser);

        // Cambiar de pantalla de Login a App
        const loginPage = document.getElementById('login-page');
        const appContent = document.getElementById('app-content');

        if (loginPage && appContent) {
            loginPage.classList.add('hidden');
            appContent.classList.remove('hidden');
            console.log("🖥️ Pantalla cambiada a la APP");
        }

        // Asegurar que el perfil existe con rol casero
        await createOrUpdateCaseroProfile(currentUser);
    } catch (err) {
        console.error('Error in handleCaseroSession:', err);
    }
}

// Actualiza el nombre del usuario en la interfaz
async function updateUserDisplay(user) {
    const sidebarUsername = document.getElementById('sidebar-username');
    if (sidebarUsername) {
        const userName = user.user_metadata?.full_name || user.email;
        sidebarUsername.textContent = userName;
    }

    const perfilEmail = document.getElementById('perfil-email');
    if (perfilEmail) {
        perfilEmail.value = user.email;
    }

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

            window.isAdmin = existing.rol === 'admin';
        } else {
            await window._supabase
                .from('perfiles')
                .insert([perfilData]);
            console.log("✅ Perfil creado por primera vez");

            window.isAdmin = false;
        }

        console.log("👤 Usuario es admin:", window.isAdmin);
    } catch (error) {
        console.error("❌ Error sincronizando perfil:", error);
        window.isAdmin = false;
    }
}

// Función para recargar datos del usuario cuando se refresca el token
async function reloadCaseroUserData() {
    try {
        if (!window.currentUser) {
            const { data: { session } } = await window._supabase.auth.getSession();
            if (session) {
                window.currentUser = session.user;
            } else {
                return;
            }
        }

        // Recargar datos de la página activa
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
    } catch (err) {
        console.error('Error recargando datos del casero:', err);
    }
}

// Escuchar cambios de sesión desde el auth unificado
if (window._supabase) {
    window._supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && window.router && window.router.currentRole === 'casero') {
            window.currentUser = session.user;
            await handleCaseroSession(session);
            
            if (event === 'TOKEN_REFRESHED') {
                // Recargar datos cuando se refresca el token
                await reloadCaseroUserData();
            } else if (event === 'SIGNED_IN') {
                if (window.showPage) window.showPage('incidencias');
            }
        }
    });
}
