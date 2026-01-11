// --- UTILIDADES ---
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menuOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function showPage(pageName) {
    console.log(`📄 Cambiando a página: ${pageName}`);
    
    // Verificar que tenemos una sesión válida antes de cambiar de página
    if (pageName !== 'login' && !window.currentUser) {
        console.error("⚠️ Intento de cambiar a página sin sesión activa");
        if (typeof window.forceLogout === 'function') {
            window.forceLogout();
        }
        return;
    }
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const page = document.getElementById(`page-${pageName}`);
    if (page) {
        page.classList.add('active');
        console.log(`✅ Página ${pageName} activada`);
    } else {
        console.error(`❌ No se encontró la página: page-${pageName}`);
    }

    const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        toggleSidebar();
    }

    // Cargar datos con un pequeño delay para asegurar que el DOM esté listo
    setTimeout(async () => {
        // Esperar a que window._supabase esté disponible
        if (!window._supabase) {
            let attempts = 0;
            while (!window._supabase && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            if (!window._supabase) {
                console.error('❌ window._supabase no está disponible en showPage');
                return;
            }
        }
        
        // Verificar que currentUser esté disponible antes de cargar datos
        if (!window.currentUser) {
            try {
                console.log('🔄 Obteniendo sesión en showPage...');
                const { data: { session }, error } = await window._supabase.auth.getSession();
                if (session && !error) {
                    window.currentUser = session.user;
                    console.log('✅ Sesión obtenida en showPage:', window.currentUser.id);
                } else {
                    console.warn('⚠️ No hay sesión activa en showPage:', error);
                    return;
                }
            } catch (err) {
                console.error('❌ Error obteniendo sesión en showPage:', err);
                return;
            }
        }

        if (pageName === 'incidencias') {
            if (typeof window.loadIncidents === 'function' && window.currentUser) {
                console.log("📥 Cargando incidencias...");
                await window.loadIncidents();
            } else if (!window.currentUser) {
                console.warn("⚠️ No hay usuario en sesión, no se pueden cargar incidencias");
            } else {
                console.error("❌ loadIncidents no está disponible");
            }
        } else if (pageName === 'propiedades') {
            if (typeof window.loadProperties === 'function' && window.currentUser) {
                console.log("📥 Cargando propiedades...");
                await window.loadProperties();
            } else if (!window.currentUser) {
                console.warn("⚠️ No hay usuario en sesión, no se pueden cargar propiedades");
            } else {
                console.error("❌ loadProperties no está disponible");
            }
        } else if (pageName === 'perfil') {
            if (typeof window.loadProfile === 'function') {
                window.loadProfile();
            }
        }
    }, 50);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// --- CONFIGURACIÓN DE EVENTOS (setupEventListeners) ---
function setupEventListeners() {
    console.log("Activando todos los manejadores de eventos...");

    // Tabs de Login/Registro
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            if (targetTab === 'login') {
                document.getElementById('loginForm').style.display = 'block';
                document.getElementById('registerForm').style.display = 'none';
            } else {
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('registerForm').style.display = 'block';
            }
        });
    });

    // Formularios de Email
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            if (typeof window.loginWithEmail === 'function') await window.loginWithEmail(email, password);
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-password-confirm').value;

            if (password !== confirmPassword) {
                showToast('Las contraseñas no coinciden');
                return;
            }
            if (password.length < 6) {
                showToast('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            if (typeof window.registerWithEmail === 'function') await window.registerWithEmail(email, password);
        });
    }

    // --- BOTÓN GOOGLE (Conexión Crítica de Bolt) ---
    const btnGoogle = document.getElementById('btnGoogleLogin');
    if (btnGoogle) {
        // Remover listeners previos si existen
        btnGoogle.replaceWith(btnGoogle.cloneNode(true));
        const btnGoogleNew = document.getElementById('btnGoogleLogin');
        
        // Función de manejo del click
        const handleGoogleLogin = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log("🔘 Botón Google clickeado");
            
            // Deshabilitar botón temporalmente para evitar múltiples clicks
            btnGoogleNew.disabled = true;
            btnGoogleNew.style.opacity = '0.6';
            btnGoogleNew.style.cursor = 'wait';
            
            try {
                if (typeof window.loginWithGoogle === 'function') {
                    console.log("✅ Función loginWithGoogle encontrada, ejecutando...");
                    await window.loginWithGoogle();
                } else {
                    console.error("❌ Función window.loginWithGoogle no encontrada");
                    alert("Error: La función de inicio de sesión no está disponible. Por favor, recarga la página.");
                }
            } catch (error) {
                console.error("❌ Error al iniciar sesión con Google:", error);
                alert("Error al iniciar sesión: " + (error.message || "Error desconocido"));
            } finally {
                // Rehabilitar botón después de un momento
                setTimeout(() => {
                    btnGoogleNew.disabled = false;
                    btnGoogleNew.style.opacity = '1';
                    btnGoogleNew.style.cursor = 'pointer';
                }, 2000);
            }
        };
        
        // Agregar listeners para móvil y escritorio
        btnGoogleNew.addEventListener('click', handleGoogleLogin);
        btnGoogleNew.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleGoogleLogin(e);
        });
        
        console.log("✅ Botón Google configurado correctamente");
    } else {
        console.error("❌ Botón btnGoogleLogin no encontrado en el DOM");
    }

    // MENÚ LATERAL Y LOGOUT
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);

    const overlay = document.getElementById('menuOverlay');
    if (overlay) overlay.addEventListener('click', toggleSidebar);

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.logout) window.logout();
        });
    }

    // NAVEGACIÓN
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            showPage(page);
        });
    });

    // PROPIEDADES Y PERFIL
    const btnAddProp = document.getElementById('btnAddProperty');
    if (btnAddProp) {
        btnAddProp.addEventListener('click', () => {
            if (typeof window.openPropertyModal === 'function') window.openPropertyModal();
        });
    }

    const closePropModalBtn = document.getElementById('closePropertyModal');
    if (closePropModalBtn) {
        closePropModalBtn.addEventListener('click', () => {
            if (typeof window.closePropertyModal === 'function') window.closePropertyModal();
        });
    }

    const propForm = document.getElementById('propertyForm');
    if (propForm) {
        propForm.addEventListener('submit', (e) => {
            if (typeof window.handlePropertySubmit === 'function') window.handlePropertySubmit(e);
        });
    }

    const perfilForm = document.getElementById('perfilForm');
    if (perfilForm) {
        perfilForm.addEventListener('submit', (e) => {
            if (typeof window.handleProfileSubmit === 'function') window.handleProfileSubmit(e);
        });
    }

    const closeIncModal = document.getElementById('closeIncidentModal');
    if (closeIncModal) {
        closeIncModal.addEventListener('click', () => {
            if (typeof window.closeIncidentDetailModal === 'function') window.closeIncidentDetailModal();
        });
    }

    // FILTROS
    const filterEstado = document.getElementById('filter-estado');
    if (filterEstado) filterEstado.addEventListener('change', () => {
        if (typeof window.loadIncidents === 'function') window.loadIncidents();
    });

    const filterUrgencia = document.getElementById('filter-urgencia');
    if (filterUrgencia) filterUrgencia.addEventListener('change', () => {
        if (typeof window.loadIncidents === 'function') window.loadIncidents();
    });
}

// Exposición global
window.showPage = showPage;
window.setupEventListeners = setupEventListeners;
window.showToast = showToast;
window.toggleSidebar = toggleSidebar;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
