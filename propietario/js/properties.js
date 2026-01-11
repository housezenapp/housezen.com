/**
 * js/properties.js - Gestión de Datos de Propiedades
 */

// 1. Generador de código único (Interno)
function generatePropertyCode() {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    const letters = Array.from({length: 3}, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    return `${numbers}${letters}`;
}

// 2. Carga de propiedades desde Supabase
async function loadProperties() {
    const container = document.getElementById('properties-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Cargando tus propiedades...</div>';

    let timeoutId = setTimeout(() => {
        if (container && container.querySelector('.loading-state')) {
            console.warn('⏱️ Timeout al cargar propiedades');
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-clock"></i>
                    <div class="empty-state-text">La carga está tardando demasiado</div>
                    <button class="refresh-page-btn" onclick="window.location.reload();">
                        <i class="fa-solid fa-arrow-rotate-right"></i>
                        <span>Refrescar página</span>
                    </button>
                </div>
            `;
        }
    }, 5000); // 5 segundos

    try {
        // Verificar y sincronizar sesión antes de cargar datos
        if (!window.currentUser) {
            console.warn('⚠️ loadProperties: No hay currentUser, intentando obtener sesión...');
            try {
                const { data: { session }, error: sessionError } = await window._supabase.auth.getSession();
                if (session && !sessionError) {
                    window.currentUser = session.user;
                    console.log('✅ Sesión recuperada:', window.currentUser.id);
                } else {
                    console.error('❌ No hay sesión válida:', sessionError);
                    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><div class="empty-state-text">Sesión expirada. Por favor, recarga la página.</div></div>';
                    if (typeof window.forceLogout === 'function') {
                        await window.forceLogout();
                    }
                    return;
                }
            } catch (err) {
                console.error('❌ Error obteniendo sesión:', err);
                container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><div class="empty-state-text">Error: No se pudo obtener la sesión. Por favor, recarga la página.</div></div>';
                return;
            }
        }

        // Validación preventiva: Verificar y refrescar token antes de la query
        console.log('🔍 Verificando token antes de cargar propiedades...');
        
        if (typeof window.ensureValidToken === 'function') {
            const isValid = await window.ensureValidToken();
            if (!isValid) {
                // La función ya redirigió al login, solo limpiar timeout
                if (timeoutId) clearTimeout(timeoutId);
                return;
            }
        } else {
            // Fallback si la función no está disponible
            const { data: { session: currentSession }, error: sessionError } = await window._supabase.auth.getSession();
            if (sessionError || !currentSession) {
                console.error('❌ No hay sesión válida:', sessionError);
                if (timeoutId) clearTimeout(timeoutId);
                container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><div class="empty-state-text">Sesión expirada. Por favor, recarga la página.</div></div>';
                if (typeof window.forceLogout === 'function') {
                    await window.forceLogout();
                }
                return;
            }
            window.currentUser = currentSession.user;
        }

        console.log('✅ Token válido confirmado');

        // Verificar que Supabase esté inicializado
        if (!window._supabase) {
            console.error('❌ loadProperties: Supabase no está inicializado');
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><div class="empty-state-text">Error: La conexión a la base de datos no está disponible. Recarga la página.</div></div>';
            return;
        }

        console.log('📡 loadProperties: Consultando propiedades para usuario:', window.currentUser.id);

        // Hacer la query con timeout de 3 segundos
        const queryPromise = window._supabase
            .from('propiedades')
            .select('*')
            .eq('perfil_id', window.currentUser.id)
            .order('created_at', { ascending: false });

        let queryResult;
        try {
            queryResult = await Promise.race([
                queryPromise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Query timeout después de 3 segundos')), 3000)
                )
            ]);
        } catch (timeoutError) {
            // Si hay timeout, intentar refrescar sesión y reintentar una vez más
            console.warn('⏱️ Query timeout detectado, intentando refresh y reintento...');
            try {
                await window._supabase.auth.refreshSession();
                console.log('🔄 Sesión refrescada, reintentando query...');
                // Reintentar la query una vez más
                queryResult = await window._supabase
                    .from('propiedades')
                    .select('*')
                    .eq('perfil_id', window.currentUser.id)
                    .order('created_at', { ascending: false });
            } catch (retryError) {
                console.error('❌ Error al reintentar después de timeout:', retryError);
                throw timeoutError;
            }
        }

        const { data, error } = queryResult;

        console.log('📡 loadProperties: Respuesta recibida. Datos:', data?.length || 0, 'Error:', error);

        if (error) {
            // Si el error es de autenticación, forzar cierre de sesión
            if (error.message && (error.message.includes('JWT') || error.message.includes('session') || error.message.includes('auth') || error.message.includes('401') || error.message.includes('Unauthorized'))) {
                console.error('❌ Error de autenticación:', error);
                if (typeof window.forceLogout === 'function') {
                    await window.forceLogout();
                }
                return;
            }
            throw error;
        }
        renderProperties(data || []);
    } catch (error) {
        console.error('❌ Error al cargar propiedades:', error);
        // Verificar si es un error de autenticación
        if (error.message && (error.message.includes('JWT') || error.message.includes('session') || error.message.includes('auth') || error.message.includes('401') || error.message.includes('Unauthorized'))) {
            if (typeof window.forceLogout === 'function') {
                await window.forceLogout();
            }
        } else {
            container.innerHTML = '<p class="error-msg">Error al conectar con la base de datos. Recarga la página.</p>';
        }
    } finally {
        // Asegurar que el timeout se cancele y el loading se desactive
        if (timeoutId) clearTimeout(timeoutId);
    }
}

// 3. Renderizado
function renderProperties(properties) {
    const container = document.getElementById('properties-container');
    if (!container) return;
    
    if (properties.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-home"></i>
                <p>Aún no has registrado ninguna propiedad.</p>
                <small>Pulsa el botón "+" para empezar.</small>
            </div>
        `;
        return;
    }

    container.innerHTML = properties.map(prop => `
        <div class="property-card anim-fade-in">
            <div class="property-info">
                <h3>${prop.nombre_propiedad || 'Sin nombre'}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${prop.direccion_completa}</p>
                <div class="property-code">
                    <span>Código de vinculación:</span>
                    <strong class="copy-code" title="Click para copiar">${prop.codigo_vinculacion || prop.id}</strong>
                </div>
            </div>
            <div class="property-actions">
                <button class="icon-btn delete-btn" onclick="deleteProperty('${prop.id}')" title="Eliminar propiedad">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 4. Lógica del Modal
async function openPropertyModal() {
    const modal = document.getElementById('property-form-modal');
    const refInput = document.getElementById('property-reference');
    if (!modal) return;

    document.getElementById('propertyForm').reset();
    
    if (refInput) {
        refInput.value = generatePropertyCode();
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
}

function closePropertyModal() {
    const modal = document.getElementById('property-form-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// 5. Guardado
async function handlePropertySubmit(e) {
    if (e) e.preventDefault();

    if (!window.currentUser) {
        alert("Error: No se detectó sesión activa.");
        return;
    }

    const codigoVinculacion = document.getElementById('property-reference').value;

    const propertyData = {
        id: codigoVinculacion, 
        perfil_id: window.currentUser.id,
        nombre_propiedad: document.getElementById('property-name').value,
        direccion_completa: document.getElementById('property-address').value,
        codigo_vinculacion: codigoVinculacion
    };

    try {
        const { error } = await window._supabase
            .from('propiedades')
            .insert([propertyData]);

        if (error) throw error;

        closePropertyModal();
        loadProperties();
        if (window.showToast) window.showToast("Propiedad registrada");

    } catch (error) {
        console.error('❌ Error al guardar:', error);
        alert("Error al guardar: " + error.message);
    }
}

// --- EXPOSICIÓN GLOBAL ---
window.loadProperties = loadProperties;
window.openPropertyModal = openPropertyModal;
window.closePropertyModal = closePropertyModal;
window.handlePropertySubmit = handlePropertySubmit;

window.deleteProperty = async (id) => {
    if (!confirm("¿Eliminar propiedad?")) return;
    try {
        const { error } = await window._supabase
            .from('propiedades')
            .delete()
            .eq('id', id);
        if (error) throw error;
        loadProperties();
        if (window.showToast) window.showToast("Propiedad eliminada");
    } catch (error) {
        alert("Error al eliminar.");
    }
};
