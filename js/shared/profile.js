/**
 * HOUSEZEN - GESTIÓN DE PERFIL (COMPARTIDO)
 * Módulo para editar perfil de usuario (inquilino o casero)
 */

// ========================================
// CARGAR DATOS DEL PERFIL
// ========================================
window.loadProfile = async function() {
  const container = document.getElementById('page-perfil');
  if (!container) return;

  try {
    renderLoadingState(container);

    // Verificar sesión
    await checkAndRefreshSession();

    if (!window.currentUser || !window.userProfile) {
      throw new Error('No hay usuario autenticado');
    }

    const profile = window.userProfile;

    // Renderizar formulario de perfil
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Mi Perfil</h2>
          <p class="card-subtitle">Información personal</p>
        </div>

        <form id="profile-form">
          <div class="form-group">
            <label class="form-label">Correo electrónico</label>
            <input
              type="email"
              class="form-input"
              value="${profile.email || ''}"
              disabled
            >
            <p class="form-hint">El email no se puede modificar</p>
          </div>

          <div class="form-group">
            <label class="form-label">Nombre completo</label>
            <input
              type="text"
              id="profile-nombre"
              class="form-input"
              value="${profile.nombre || ''}"
              required
            >
          </div>

          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input
              type="tel"
              id="profile-telefono"
              class="form-input"
              value="${profile.telefono || ''}"
              placeholder="+34 123 456 789"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Rol actual</label>
            <input
              type="text"
              class="form-input"
              value="${profile.rol === 'inquilino' ? 'Inquilino' : 'Propietario'}"
              disabled
            >
          </div>

          <button type="submit" class="btn btn-primary">
            💾 Guardar Cambios
          </button>
        </form>
      </div>
    `;

    // Configurar submit del formulario
    setupProfileForm();

  } catch (error) {
    console.error('Error cargando perfil:', error);
    container.innerHTML = `
      <div class="card">
        <p style="color: var(--error);">Error al cargar el perfil</p>
      </div>
    `;
  }
};

// ========================================
// CONFIGURAR FORMULARIO
// ========================================
function setupProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProfile();
  });
}

// ========================================
// GUARDAR PERFIL
// ========================================
async function saveProfile() {
  try {
    const nombre = document.getElementById('profile-nombre')?.value.trim();
    const telefono = document.getElementById('profile-telefono')?.value.trim();

    if (!nombre) {
      showToast('El nombre es obligatorio', 'warning');
      return;
    }

    showLoading(true);

    const { data, error } = await window._supabase
      .from('perfiles')
      .update({
        nombre,
        telefono: telefono || null
      })
      .eq('id', window.currentUser.id)
      .select()
      .single();

    if (error) throw error;

    // Actualizar perfil global
    window.userProfile = data;
    updateUserDisplay();

    showToast('Perfil actualizado correctamente', 'success');
    showLoading(false);

  } catch (error) {
    console.error('Error guardando perfil:', error);
    showToast('Error al guardar el perfil', 'error');
    showLoading(false);
  }
}

// ========================================
// LOGGING
// ========================================
console.log('%c🏠 HouseZen Profile Module', 'color: #2A9D8F; font-weight: bold');
