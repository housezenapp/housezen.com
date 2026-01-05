/**
 * Autenticación adaptada para inquilino en aplicación unificada
 * NO inicializa auth por sí mismo, usa el auth unificado del padre
 */

async function handleInquilinoSession(session) {
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
        const appContent = document.getElementById('app-content');
        const loginPage = document.getElementById('login-page');
        
        if (appContent) {
            appContent.style.display = 'block';
        }
        if (loginPage) {
            loginPage.style.display = 'none';
        }

        const fullName = currentUser.user_metadata?.full_name || "Usuario";
        const firstName = fullName.split(' ')[0];
        const userEmail = currentUser.email || '';

        const userNameEl = document.getElementById('user-name');
        const profileNameEl = document.getElementById('profile-name');
        const profileEmailEl = document.getElementById('profile-email');

        if (userNameEl) userNameEl.innerText = firstName;
        if (profileNameEl) profileNameEl.value = fullName;
        if (profileEmailEl) profileEmailEl.value = userEmail;

        // Asegurar que el perfil existe con rol inquilino
        const { error: upsertError } = await _supabase
            .from('perfiles')
            .upsert({
                id: currentUser.id,
                email: userEmail,
                nombre: fullName,
                rol: 'inquilino'
            }, {
                onConflict: 'id',
                ignoreDuplicates: false
            });

        if (upsertError) {
            console.error('Error creating/updating profile:', upsertError);
        }

        // Cargar el perfil completo
        const { data: currentProfile, error: profileError } = await _supabase
            .from('perfiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (profileError) {
            console.error('Error loading profile:', profileError);
        }

        // Cargar la propiedad vinculada
        const { data: vinculacion, error: vinculacionError } = await _supabase
            .from('perfil_propiedades')
            .select('codigo_propiedad')
            .eq('id_perfil_inquilino', currentUser.id)
            .maybeSingle();

        if (vinculacionError) {
            console.error('Error loading property link:', vinculacionError);
        }

        // Si hay vinculación, obtener los datos de la propiedad
        let propiedadData = null;
        if (vinculacion && vinculacion.codigo_propiedad) {
            const { data: propiedad, error: propError } = await _supabase
                .from('propiedades')
                .select('id, direccion_completa')
                .eq('id', vinculacion.codigo_propiedad)
                .maybeSingle();

            if (propError) {
                console.error('Error loading property:', propError);
            } else {
                propiedadData = propiedad;
            }
        }

        // Verificar si el perfil está completo
        const isProfileComplete = currentProfile && currentProfile.telefono && vinculacion && vinculacion.codigo_propiedad && propiedadData;
        
        const setupModal = document.getElementById('setup-modal');
        if (!isProfileComplete && setupModal) {
            setupModal.style.display = 'flex';
        } else if (setupModal) {
            setupModal.style.display = 'none';
            
            // Cargar datos de la propiedad
            const incAddress = document.getElementById('inc-address');
            const userAddress = document.getElementById('user-address');
            const userReference = document.getElementById('user-reference');
            const incPhone = document.getElementById('inc-phone');
            const userPhone = document.getElementById('user-phone');

            if (propiedadData) {
                if (incAddress) incAddress.value = propiedadData.direccion_completa;
                if (userAddress) userAddress.value = propiedadData.direccion_completa;
                if (userReference) userReference.value = vinculacion.codigo_propiedad;
            }

            if (currentProfile && currentProfile.telefono) {
                if (incPhone) incPhone.value = currentProfile.telefono;
                if (userPhone) userPhone.value = currentProfile.telefono;
            }
        }
    } catch (err) {
        console.error('Error in handleInquilinoSession:', err);
        const appContent = document.getElementById('app-content');
        const setupModal = document.getElementById('setup-modal');
        if (appContent) appContent.style.display = 'block';
        if (setupModal) setupModal.style.display = 'flex';
    }
}

// Función para recargar datos del usuario
async function reloadInquilinoUserData() {
    try {
        if (!window.currentUser) {
            const { data: { session } } = await _supabase.auth.getSession();
            if (session) window.currentUser = session.user;
            else return;
        }

        const { data: currentProfile } = await _supabase
            .from('perfiles')
            .select('*')
            .eq('id', window.currentUser.id)
            .maybeSingle();

        const { data: vinculacion } = await _supabase
            .from('perfil_propiedades')
            .select('codigo_propiedad')
            .eq('id_perfil_inquilino', window.currentUser.id)
            .maybeSingle();

        let propiedadData = null;
        if (vinculacion && vinculacion.codigo_propiedad) {
            const { data: propiedad } = await _supabase
                .from('propiedades')
                .select('id, direccion_completa')
                .eq('id', vinculacion.codigo_propiedad)
                .maybeSingle();
            propiedadData = propiedad;
        }

        const incAddress = document.getElementById('inc-address');
        const incPhone = document.getElementById('inc-phone');

        if (propiedadData && incAddress) {
            incAddress.value = propiedadData.direccion_completa;
        }

        if (currentProfile && currentProfile.telefono && incPhone) {
            incPhone.value = currentProfile.telefono;
        }
    } catch (err) {
        console.error('Error recargando datos:', err);
    }
}

// Escuchar cambios de sesión desde el auth unificado
if (window._supabase) {
    window._supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && window.router && window.router.currentRole === 'inquilino') {
            window.currentUser = session.user;
            await handleInquilinoSession(session);
            
            if (event === 'TOKEN_REFRESHED') {
                await reloadInquilinoUserData();
            }
        }
    });
}
