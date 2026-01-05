/**
 * HOUSEZEN - SISTEMA DE AUTENTICACIÓN UNIFICADO
 * Maneja login con Google, detección de roles y flujo de usuarios
 */

let authInitialized = false;
let tokenExpiryInterval = null;

// ========================================
// LOGIN CON GOOGLE
// ========================================
window.loginWithGoogle = async function() {
  try {
    const { data, error } = await window._supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });

    if (error) throw error;

    // OAuth redirigirá automáticamente
  } catch (error) {
    console.error('Error en login:', error);
    showToast('Error al iniciar sesión con Google', 'error');
  }
};

// ========================================
// LOGOUT
// ========================================
window.logout = async function() {
  try {
    console.log('%c🚪 Cerrando sesión...', 'background: #E74C3C; color: white; padding: 4px 8px; border-radius: 4px;');

    // Limpiar storage inmediatamente
    localStorage.clear();
    sessionStorage.clear();

    // Intentar cerrar sesión en Supabase (fire and forget)
    window._supabase.auth.signOut().catch(err => {
      console.log('%c⚠️ Error al cerrar sesión en Supabase (ignorado):', 'color: orange;', err.message);
    });

    // Redirigir inmediatamente
    console.log('%c↩️ Redirigiendo al login...', 'color: #3498DB;');
    window.location.reload();
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    window.location.reload();
  }
};

// ========================================
// OBTENER ROL DESDE BASE DE DATOS
// ========================================
async function getRoleFromDB(userId) {
  try {
    const { data, error } = await window._supabase
      .from('perfiles')
      .select('rol, nombre, email, telefono')
      .eq('id', userId)
      .single();

    if (error) {
      // Si no existe el perfil, retornar null
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error obteniendo rol:', error);
    return null;
  }
}

// ========================================
// CREAR O ACTUALIZAR PERFIL (SIN ROL)
// ========================================
async function createOrUpdateProfile(user) {
  try {
    const { data, error } = await window._supabase
      .from('perfiles')
      .upsert({
        id: user.id,
        email: user.email,
        nombre: user.user_metadata?.full_name || user.email.split('@')[0],
        // NO establecemos rol aquí - lo hará el usuario con el selector
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creando/actualizando perfil:', error);
    throw error;
  }
}

// ========================================
// GUARDAR ROL DEL USUARIO
// ========================================
window.saveUserRole = async function(role) {
  try {
    if (!window.currentUser) {
      throw new Error('No hay usuario autenticado');
    }

    if (!['inquilino', 'casero'].includes(role)) {
      throw new Error('Rol inválido');
    }

    showLoading(true);

    // Actualizar rol en la base de datos
    const { data, error } = await window._supabase
      .from('perfiles')
      .update({ rol: role })
      .eq('id', window.currentUser.id)
      .select()
      .single();

    if (error) throw error;

    // Actualizar variables globales
    window.userRole = role;
    window.userProfile = data;

    // Ocultar selector de rol
    hideRoleSelector();

    // Cargar interfaz según el rol
    loadAppByRole(role);

    showToast(`Bienvenido como ${role === 'inquilino' ? 'Inquilino' : 'Propietario'}`, 'success');
    showLoading(false);
  } catch (error) {
    console.error('Error guardando rol:', error);
    showToast('Error al guardar el rol', 'error');
    showLoading(false);
  }
};

// ========================================
// MANEJAR SESIÓN DE USUARIO
// ========================================
async function handleUserSession(session) {
  try {
    if (!session || !session.user) {
      showLoginPage();
      return;
    }

    const user = session.user;
    window.currentUser = user;

    console.log('%c👤 Usuario autenticado', 'color: #10B981; font-weight: bold', user.email);

    // Crear o actualizar perfil (sin rol)
    await createOrUpdateProfile(user);

    // Obtener rol del usuario
    const profile = await getRoleFromDB(user.id);

    if (!profile || !profile.rol) {
      // Usuario nuevo o sin rol - mostrar selector
      console.log('%c🎭 Usuario sin rol - mostrando selector', 'color: #F59E0B; font-weight: bold');
      hideLoading();
      showRoleSelector();
      return;
    }

    // Usuario con rol definido
    window.userRole = profile.rol;
    window.userProfile = profile;

    console.log('%c🎭 Rol del usuario:', 'color: #3B82F6; font-weight: bold', profile.rol);

    // Cargar interfaz según el rol
    hideLoading();
    loadAppByRole(profile.rol);

  } catch (error) {
    console.error('Error manejando sesión:', error);
    showToast('Error al cargar la sesión', 'error');
    hideLoading();
    showLoginPage();
  }
}

// ========================================
// CARGAR APP SEGÚN ROL
// ========================================
function loadAppByRole(role) {
  // Ocultar página de login y selector
  document.getElementById('login-page').classList.remove('active');
  hideRoleSelector();

  // Mostrar contenido de la app
  document.getElementById('app-content').style.display = 'block';

  // Actualizar información del usuario en la UI
  updateUserDisplay();

  // Inicializar router con el rol del usuario
  if (window.initRouter) {
    window.initRouter(role);
  } else {
    console.error('Router no disponible');
  }
}

// ========================================
// ACTUALIZAR DISPLAY DEL USUARIO
// ========================================
function updateUserDisplay() {
  const profile = window.userProfile;
  const user = window.currentUser;

  if (!profile || !user) return;

  // Avatar en sidebar
  const avatar = document.getElementById('sidebar-user-avatar');
  if (avatar) {
    const initial = profile.nombre ? profile.nombre.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
    avatar.textContent = initial;
  }

  // Nombre en sidebar
  const userName = document.getElementById('sidebar-user-name');
  if (userName) {
    userName.textContent = profile.nombre || user.email;
  }

  // Badge de rol
  const roleBadge = document.getElementById('sidebar-user-role');
  if (roleBadge) {
    roleBadge.textContent = profile.rol === 'inquilino' ? 'Inquilino' : 'Propietario';
  }

  // Info en top bar
  const userInfo = document.getElementById('user-info');
  if (userInfo) {
    userInfo.textContent = profile.nombre || user.email;
  }
}

// ========================================
// MOSTRAR/OCULTAR SELECTOR DE ROL
// ========================================
function showRoleSelector() {
  const selector = document.getElementById('role-selector');
  const loginPage = document.getElementById('login-page');
  const appContent = document.getElementById('app-content');

  if (loginPage) loginPage.classList.remove('active');
  if (appContent) appContent.style.display = 'none';
  if (selector) selector.classList.add('active');
}

function hideRoleSelector() {
  const selector = document.getElementById('role-selector');
  if (selector) {
    selector.classList.remove('active');
  }
}

function hideLoading() {
  const loading = document.getElementById('loading-overlay');
  if (loading) {
    loading.classList.remove('active');
  }
}

// ========================================
// MOSTRAR PÁGINA DE LOGIN
// ========================================
function showLoginPage() {
  document.getElementById('login-page').classList.add('active');
  document.getElementById('app-content').style.display = 'none';
  hideRoleSelector();
  hideLoading();
}

// ========================================
// VERIFICAR Y REFRESCAR SESIÓN
// ========================================
async function checkAndRefreshSession() {
  try {
    const { data: { session }, error } = await window._supabase.auth.getSession();

    if (error) throw error;

    if (!session) {
      console.log('%c⚠️ Sesión expirada', 'color: #EF4444; font-weight: bold');
      showLoginPage();
      return null;
    }

    // Verificar tiempo de expiración
    const expiresAt = session.expires_at * 1000;
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // Si quedan menos de 5 minutos, refrescar
    if (timeUntilExpiry < 300000) {
      console.log('%c🔄 Refrescando sesión...', 'color: #F59E0B; font-weight: bold');
      const { data, error: refreshError } = await window._supabase.auth.refreshSession();

      if (refreshError) throw refreshError;

      return data.session;
    }

    return session;
  } catch (error) {
    console.error('Error verificando sesión:', error);
    return null;
  }
}

// ========================================
// LISTENER DE VISIBILIDAD (RECARGAR PÁGINA)
// ========================================
function setupVisibilityListener() {
  let wasHidden = false;

  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && authInitialized && wasHidden) {
      console.log('%c👁️ Pestaña visible de nuevo', 'background: #E67E22; color: white; padding: 4px 8px; border-radius: 4px;');
      console.log('%c🔄 Recargando página para reiniciar conexión...', 'color: #3498DB;');

      // IMPORTANTE: Recargar la página completa
      // Esto evita problemas de bloqueo con Supabase
      window.location.reload();
    } else if (document.hidden) {
      console.log('%c😴 Pestaña oculta', 'color: #95A5A6;');
      wasHidden = true;
    }
  });
}

// ========================================
// MONITOR DE EXPIRACIÓN DE TOKEN
// ========================================
function startTokenExpiryMonitor() {
  // Limpiar intervalo anterior si existe
  if (tokenExpiryInterval) {
    clearInterval(tokenExpiryInterval);
  }

  // Revisar el estado cada 30 segundos
  tokenExpiryInterval = setInterval(async () => {
    try {
      const { data: { session } } = await window._supabase.auth.getSession();

      if (session) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        const minutesLeft = Math.floor((expiresAt - now) / 1000 / 60);
        const secondsLeft = Math.floor((expiresAt - now) / 1000) % 60;

        if (minutesLeft <= 5) {
          console.log(`%c⏰ Token expira pronto: ${minutesLeft}m ${secondsLeft}s`, 'background: #E74C3C; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
        } else if (minutesLeft <= 15) {
          console.log(`%c⏰ Token expira en: ${minutesLeft}m ${secondsLeft}s`, 'background: #F39C12; color: white; padding: 4px 8px; border-radius: 4px;');
        }
      }
    } catch (err) {
      console.error('Error en monitor de expiración:', err);
    }
  }, 30000); // Cada 30 segundos
}

// ========================================
// INICIALIZAR AUTENTICACIÓN
// ========================================
window.initAuth = async function() {
  console.log('%c🔐 Inicializando autenticación...', 'color: #2A9D8F; font-weight: bold; font-size: 14px');

  try {
    // Listener de cambios de autenticación
    window._supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('%c🔔 Auth Event:', 'color: #3B82F6; font-weight: bold', event);

      switch (event) {
        case 'SIGNED_IN':
          await handleUserSession(session);
          break;

        case 'SIGNED_OUT':
          console.log('%c🚪 Evento SIGNED_OUT recibido', 'color: red; font-weight: bold');
          // Verificar si realmente no hay sesión
          const { data: { session: currentSession } } = await window._supabase.auth.getSession();
          if (!currentSession) {
            console.log('%c✓ Confirmado: no hay sesión, cerrando', 'color: red;');
            showLoginPage();
          } else {
            console.log('%c⚠️ Falsa alarma: sesión todavía existe, ignorando SIGNED_OUT', 'color: orange; font-weight: bold;');
          }
          break;

        case 'TOKEN_REFRESHED':
          console.log('%c✅ Token refrescado', 'color: #10B981');
          if (session) {
            window.currentUser = session.user;
          }
          break;

        case 'USER_UPDATED':
          console.log('%c📝 Usuario actualizado', 'color: #F59E0B');
          break;

        case 'USER_DELETED':
          console.log('%c🚪 Usuario eliminado', 'color: red; font-weight: bold');
          showLoginPage();
          break;
      }
    });

    // Verificar sesión existente
    const { data: { session }, error } = await window._supabase.auth.getSession();

    if (error) throw error;

    if (session) {
      console.log('%c✓ Sesión existente encontrada', 'color: green;');
      await handleUserSession(session);
    } else {
      console.log('%c⚠️ No hay sesión activa', 'color: orange;');
      showLoginPage();
    }

    authInitialized = true;

    // Configurar listener de visibilidad para recargar página
    setupVisibilityListener();

    // Iniciar monitor de expiración de token
    startTokenExpiryMonitor();

  } catch (error) {
    console.error('Error inicializando auth:', error);
    showToast('Error al inicializar la autenticación', 'error');
    showLoginPage();
  }
};

// ========================================
// FUNCIÓN DE DEBUG
// ========================================
window.getSessionInfo = async function() {
  const { data: { session }, error } = await window._supabase.auth.getSession();

  if (error) {
    console.error('%c❌ Error:', 'color: red; font-weight: bold;', error);
    return;
  }

  if (session) {
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const minutesLeft = Math.floor((expiresAt - now) / 1000 / 60);

    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2A9D8F;');
    console.log('%c📊 INFORMACIÓN DE SESIÓN ACTUAL', 'background: #2A9D8F; color: white; padding: 8px; border-radius: 4px; font-weight: bold; font-size: 14px;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2A9D8F;');
    console.log('');
    console.log('%c👤 Usuario:', 'font-weight: bold; color: #2A9D8F;', session.user.email);
    console.log('%c🆔 User ID:', 'font-weight: bold; color: #2A9D8F;', session.user.id);
    console.log('');
    console.log('%c⏰ Expiración:', 'font-weight: bold; color: #E67E22;');
    console.log('  • Expira el:', expiresAt.toLocaleString('es-ES'));
    console.log('  • Tiempo restante:', minutesLeft, 'minutos');
    console.log('');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2A9D8F;');

    return session;
  } else {
    console.log('%c⚠️ No hay sesión activa', 'background: orange; color: white; padding: 4px 8px; border-radius: 4px;');
    return null;
  }
};

// ========================================
// LOGGING
// ========================================
console.log('%c🏠 HouseZen Auth', 'color: #2A9D8F; font-weight: bold; font-size: 14px');
console.log('%cSistema de autenticación unificado cargado', 'color: #636E72');
