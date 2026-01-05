/**
 * HOUSEZEN - LISTA DE INCIDENCIAS (INQUILINO)
 */

window.loadTenantIncidents = async function() {
  const container = document.getElementById('page-mis-incidencias');
  if (!container) return;

  try {
    renderLoadingState(container);
    await checkAndRefreshSession();

    const { data, error } = await window._supabase
      .from('incidencias')
      .select('*')
      .eq('user_id', window.currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      renderEmptyState(container, '📋', 'Sin incidencias', 'Aún no has reportado ninguna incidencia');
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Mis Reportes</h2>
          <p class="card-subtitle">${data.length} incidencia${data.length !== 1 ? 's' : ''}</p>
        </div>
        <div class="incidents-list" id="incidents-list"></div>
      </div>
    `;

    const listContainer = document.getElementById('incidents-list');
    listContainer.innerHTML = data.map(inc => `
      <div class="incident-card">
        <div class="incident-header">
          <h3 class="incident-title">${inc.titulo}</h3>
          ${getStatusBadge(inc.estado)}
        </div>
        <p class="incident-description">${inc.descripcion}</p>
        <div class="incident-meta">
          <span class="incident-meta-item">
            <span>${getCategoryIcon(inc.categoria)}</span>
            <span>${getCategoryLabel(inc.categoria)}</span>
          </span>
          <span class="incident-meta-item">
            ${getUrgencyBadge(inc.urgencia)}
          </span>
          <span class="incident-meta-item">
            <span>🕐</span>
            <span>${formatDate(inc.created_at)}</span>
          </span>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error cargando incidencias:', error);
    container.innerHTML = '<div class="card"><p style="color: var(--error);">Error al cargar incidencias</p></div>';
  }
};

console.log('%c🏠 Tenant Incidents List Module', 'color: #2A9D8F; font-weight: bold');
