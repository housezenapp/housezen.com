/**
 * HOUSEZEN - ESTADÍSTICAS (CASERO)
 */

window.loadStats = async function() {
  const container = document.getElementById('page-estadisticas');
  if (!container) return;

  try {
    renderLoadingState(container);
    await checkAndRefreshSession();

    // Obtener estadísticas
    const stats = await getStatistics();

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Estadísticas</h2>
          <p class="card-subtitle">Resumen de tu actividad</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Propiedades</span>
              <span class="stat-icon">🏢</span>
            </div>
            <div class="stat-value">${stats.totalPropiedades}</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Incidencias</span>
              <span class="stat-icon">📨</span>
            </div>
            <div class="stat-value">${stats.totalIncidencias}</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Pendientes</span>
              <span class="stat-icon">⏳</span>
            </div>
            <div class="stat-value">${stats.pendientes}</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Resueltas</span>
              <span class="stat-icon">✅</span>
            </div>
            <div class="stat-value">${stats.resueltas}</div>
          </div>
        </div>

        <div style="margin-top: var(--spacing-xl);">
          <h3 style="margin-bottom: var(--spacing-md); font-size: 1.125rem;">Incidencias por urgencia</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-label">Alta</span>
                <span class="stat-icon">🔴</span>
              </div>
              <div class="stat-value">${stats.urgenciaAlta}</div>
            </div>
            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-label">Media</span>
                <span class="stat-icon">🟡</span>
              </div>
              <div class="stat-value">${stats.urgenciaMedia}</div>
            </div>
            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-label">Baja</span>
                <span class="stat-icon">🟢</span>
              </div>
              <div class="stat-value">${stats.urgenciaBaja}</div>
            </div>
          </div>
        </div>
      </div>
    `;

  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    container.innerHTML = '<div class="card"><p style="color: var(--error);">Error al cargar estadísticas</p></div>';
  }
};

async function getStatistics() {
  try {
    // Propiedades
    const { data: propiedades } = await window._supabase
      .from('propiedades')
      .select('id')
      .eq('perfil_id', window.currentUser.id);

    // Inquilinos vinculados
    const { data: vinculaciones } = await window._supabase
      .from('perfil_propiedades')
      .select('id_perfil_inquilino')
      .eq('id_perfil_casero', window.currentUser.id);

    const inquilinoIds = vinculaciones?.map(v => v.id_perfil_inquilino) || [];

    // Incidencias
    const { data: incidencias } = await window._supabase
      .from('incidencias')
      .select('estado, urgencia')
      .in('user_id', inquilinoIds.length > 0 ? inquilinoIds : ['']);

    const totalIncidencias = incidencias?.length || 0;
    const pendientes = incidencias?.filter(i => i.estado === 'pendiente').length || 0;
    const resueltas = incidencias?.filter(i => i.estado === 'resuelta').length || 0;
    const urgenciaAlta = incidencias?.filter(i => i.urgencia === 'alta').length || 0;
    const urgenciaMedia = incidencias?.filter(i => i.urgencia === 'media').length || 0;
    const urgenciaBaja = incidencias?.filter(i => i.urgencia === 'baja').length || 0;

    return {
      totalPropiedades: propiedades?.length || 0,
      totalIncidencias,
      pendientes,
      resueltas,
      urgenciaAlta,
      urgenciaMedia,
      urgenciaBaja
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      totalPropiedades: 0,
      totalIncidencias: 0,
      pendientes: 0,
      resueltas: 0,
      urgenciaAlta: 0,
      urgenciaMedia: 0,
      urgenciaBaja: 0
    };
  }
}

console.log('%c🏠 Landlord Stats Module', 'color: #2A9D8F; font-weight: bold');
