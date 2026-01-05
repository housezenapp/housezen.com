/**
 * HOUSEZEN - GESTIÓN DE PROPIEDADES (CASERO)
 */

window.loadProperties = async function() {
  const container = document.getElementById('page-propiedades');
  if (!container) return;

  try {
    renderLoadingState(container);
    await checkAndRefreshSession();

    const { data, error } = await window._supabase
      .from('propiedades')
      .select('*')
      .eq('perfil_id', window.currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Mis Propiedades</h2>
          <p class="card-subtitle">${data?.length || 0} propiedad${data?.length !== 1 ? 'es' : ''}</p>
        </div>

        <button class="btn btn-primary" onclick="showAddPropertyModal()" style="margin-bottom: var(--spacing-lg);">
          ➕ Añadir Propiedad
        </button>

        <div class="properties-grid" id="properties-grid"></div>
      </div>
    `;

    if (!data || data.length === 0) {
      document.getElementById('properties-grid').innerHTML = `
        <div style="grid-column: 1 / -1;">
          <div class="empty-state">
            <div class="empty-state-icon">🏢</div>
            <h3 class="empty-state-title">Sin propiedades</h3>
            <p class="empty-state-text">Añade tu primera propiedad para empezar</p>
          </div>
        </div>
      `;
      return;
    }

    const grid = document.getElementById('properties-grid');
    grid.innerHTML = data.map(prop => `
      <div class="property-card">
        <div class="property-header">
          <h3 class="property-name">${prop.nombre_propiedad || 'Sin nombre'}</h3>
        </div>
        <p class="property-address">📍 ${prop.direccion_completa}</p>
        <div>
          <p class="property-code-label">Código de vinculación</p>
          <div class="property-code" onclick="copyToClipboard('${prop.codigo_vinculacion}')">
            ${prop.codigo_vinculacion}
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error cargando propiedades:', error);
    container.innerHTML = '<div class="card"><p style="color: var(--error);">Error al cargar propiedades</p></div>';
  }
};

window.showAddPropertyModal = function() {
  showToast('Funcionalidad en desarrollo: Crear propiedad', 'info');
};

console.log('%c🏠 Landlord Properties Module', 'color: #2A9D8F; font-weight: bold');
