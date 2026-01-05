/**
 * HOUSEZEN - SISTEMA DE AUTENTICACIÓN UNIFICADO
 * Maneja login con Google, detección de roles y flujo de usuarios
 */

// ========================================
// LOGIN CON GOOGLE
// ========================================
window.loginWithGoogle = async function() {
  try {
    showLoading(true);

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
    showLoading(false);
  }
};

// ========================================
// LOGOUT
// ========================================
window.logout = async function() {
  try {
    showLoading(true);

    // Cerrar sesión en Supabase
    const { error } = await window._supabase.auth.signOut();
    if (error) throw error;

    // Limpiar variables globales
    window.currentUser = null;
    window.userRole = null;
    window.userProfile = null;

    // Limpiar almacenamiento local
    localStorage.clear();
    sessionStorage.clear();

    // Recargar página para volver al login
    window.location.reload();
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    showToast('Error al cerrar sesión', 'error');
    showLoading(false);
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
// CREAR O ACTUALIZAR PERFIL
// ========================================
async function createOrUpdateProfile(user) {
  try {
    const { data, error } = await window._supabase
      .from('perfiles')
      .upsert({
        id: user.id,
        email: user.email,
        nombre: user.user_metadata?.full_name || user.email.split('@')[0],
        // No establecemos rol aquí - lo hará el usuario con el selector
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
      // No hay sesión, mostrar login
      showLoginPage();
      return;
    }

    showLoading(true);
    const user = session.user;
    window.currentUser = user;

    console.log('%c👤 Usuario autenticado', 'color: #10B981; font-weight: bold', user.email);

    // Crear o actualizar perfil
    await createOrUpdateProfile(user);

    // Obtener rol del usuario
    const profile = await getRoleFromDB(user.id);

    if (!profile || !profile.rol) {
      // Usuario nuevo o sin rol - mostrar selector
      console.log('%c🎭 Usuario sin rol - mostrando selector', 'color: #F59E0B; font-weight: bold');
      showRoleSelector();
      showLoading(false);
      return;
    }

    // Usuario con rol definido
    window.userRole = profile.rol;
    window.userProfile = profile;

    console.log('%c🎭 Rol del usuario:', 'color: #3B82F6; font-weight: bold', profile.rol);

    // Cargar interfaz según el rol
    loadAppByRole(profile.rol);
    showLoading(false);
  } catch (error) {
    console.error('Error manejando sesión:', error);
    showToast('Error al cargar la sesión', 'error');
    showLoading(false);
  }
}

// ========================================
// CARGAR APP SEGÚN ROL
// ========================================
function loadAppByRole(role) {
  // Ocultar página de login
  document.getElementById('login-page').classList.remove('active');

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
  if (selector) {
    selector.classList.add('active');
  }
}

function hideRoleSelector() {
  const selector = document.getElementById('role-selector');
  if (selector) {
    selector.classList.remove('active');
  }
}

// ========================================
// MOSTRAR PÁGINA DE LOGIN
// ========================================
function showLoginPage() {
  document.getElementById('login-page').classList.add('active');
  document.getElementById('app-content').style.display = 'none';
  hideRoleSelector();
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
          showLoginPage();
          break;

        case 'TOKEN_REFRESHED':
          console.log('%c✅ Token refrescado', 'color: #10B981');
          break;

        case 'USER_UPDATED':
          console.log('%c📝 Usuario actualizado', 'color: #F59E0B');
          break;
      }
    });

    // Verificar sesión existente
    const { data: { session }, error } = await window._supabase.auth.getSession();

    if (error) throw error;

    if (session) {
      await handleUserSession(session);
    } else {
      showLoginPage();
      showLoading(false);
    }

    // Configurar verificación periódica de sesión (cada 5 minutos)
    setInterval(checkAndRefreshSession, 300000);

    // Listener de visibilidad para verificar sesión al volver a la pestaña
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        await checkAndRefreshSession();
      }
    });

  } catch (error) {
    console.error('Error inicializando auth:', error);
    showToast('Error al inicializar la autenticación', 'error');
    showLoginPage();
    showLoading(false);
  }
};

// ========================================
// LOGGING Y DEBUG
// ========================================
console.log('%c🏠 HouseZen Auth', 'color: #2A9D8F; font-weight: bold; font-size: 14px');
console.log('%cSistema de autenticación unificado cargado', 'color: #636E72');
