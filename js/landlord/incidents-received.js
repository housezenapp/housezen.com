/**
 * HOUSEZEN - INCIDENCIAS RECIBIDAS (CASERO)
 */

window.loadLandlordIncidents = async function() {
  const container = document.getElementById('page-incidencias-recibidas');
  if (!container) return;

  try {
    renderLoadingState(container);
    await checkAndRefreshSession();

    // Obtener IDs de inquilinos vinculados
    const { data: vinculaciones } = await window._supabase
      .from('perfil_propiedades')
      .select('id_perfil_inquilino')
      .eq('id_perfil_casero', window.currentUser.id);

    const inquilinoIds = vinculaciones?.map(v => v.id_perfil_inquilino) || [];

    // Obtener incidencias
    const { data, error } = await window._supabase
      .from('incidencias')
      .select('*')
      .in('user_id', inquilinoIds.length > 0 ? inquilinoIds : ['']) // Evitar query vacío
      .order('created_at', { ascending: false });

    if (error) throw error;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Incidencias Recibidas</h2>
          <p class="card-subtitle">${data?.length || 0} incidencia${data?.length !== 1 ? 's' : ''}</p>
        </div>
        <div class="incidents-list" id="landlord-incidents-list"></div>
      </div>
    `;

    if (!data || data.length === 0) {
      renderEmptyState(
        document.getElementById('landlord-incidents-list'),
        '📨',
        'Sin incidencias',
        'No has recibido incidencias de tus inquilinos'
      );
      return;
    }

    const listContainer = document.getElementById('landlord-incidents-list');
    listContainer.innerHTML = data.map(inc => `
      <div class="incident-card">
        <div class="incident-header">
          <h3 class="incident-title">${inc.titulo}</h3>
          ${getStatusBadge(inc.estado)}
        </div>
        <p class="incident-description">${inc.descripcion}</p>
        <div class="incident-meta">
          <span class="incident-meta-item">
            <span>👤</span>
            <span>${inc.nombre_inquilino}</span>
          </span>
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

console.log('%c🏠 Landlord Incidents Module', 'color: #2A9D8F; font-weight: bold');
