/**
 * HOUSEZEN - GESTIÓN DE VIVIENDA (INQUILINO)
 */

window.loadHousingInfo = async function() {
  const container = document.getElementById('page-mi-vivienda');
  if (!container) return;

  try {
    renderLoadingState(container);
    await checkAndRefreshSession();

    // Obtener vinculación actual
    const { data: vinculacion, error } = await window._supabase
      .from('perfil_propiedades')
      .select(`
        codigo_propiedad,
        propiedades:codigo_propiedad (
          nombre_propiedad,
          direccion_completa
        )
      `)
      .eq('id_perfil_inquilino', window.currentUser.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Mi Vivienda</h2>
          <p class="card-subtitle">Vinculación con la propiedad</p>
        </div>

        ${vinculacion ? renderLinkedHousing(vinculacion) : renderLinkForm()}
      </div>
    `;

    if (!vinculacion) {
      setupLinkForm();
    }

  } catch (error) {
    console.error('Error cargando vivienda:', error);
    container.innerHTML = '<div class="card"><p style="color: var(--error);">Error al cargar información</p></div>';
  }
};

function renderLinkedHousing(vinculacion) {
  const propiedad = vinculacion.propiedades;
  return `
    <div class="housing-info">
      <div class="housing-info-title">✅ Vivienda vinculada</div>
      <div class="housing-info-details">
        <div class="housing-info-item">
          <strong>🏠 ${propiedad.nombre_propiedad || 'Sin nombre'}</strong>
        </div>
        <div class="housing-info-item">
          📍 ${propiedad.direccion_completa}
        </div>
        <div class="housing-info-item">
          🔑 Código: <code>${vinculacion.codigo_propiedad}</code>
        </div>
      </div>
    </div>
    <p style="margin-top: var(--spacing-md); color: var(--text-secondary); font-size: 0.875rem;">
      Si necesitas cambiar la vinculación, contacta con tu propietario.
    </p>
  `;
}

function renderLinkForm() {
  return `
    <p style="margin-bottom: var(--spacing-lg); color: var(--text-secondary);">
      Introduce el código de referencia que te proporcionó tu propietario para vincular tu vivienda.
    </p>

    <form id="link-housing-form">
      <div class="form-group">
        <label class="form-label">Código de referencia *</label>
        <input
          type="text"
          id="reference-code"
          class="form-input"
          placeholder="Ej: PROP-ABC123"
          required
        >
        <p class="form-hint">El código te lo debe proporcionar el propietario de la vivienda</p>
      </div>

      <button type="submit" class="btn btn-primary">
        🔗 Vincular vivienda
      </button>
    </form>
  `;
}

function setupLinkForm() {
  const form = document.getElementById('link-housing-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await linkHousing();
  });
}

async function linkHousing() {
  try {
    const code = document.getElementById('reference-code')?.value.trim();

    if (!code) {
      showToast('Introduce un código de referencia', 'warning');
      return;
    }

    showLoading(true);

    // Verificar que la propiedad existe
    const { data: propiedad, error: propError } = await window._supabase
      .from('propiedades')
      .select('id, perfil_id')
      .eq('codigo_vinculacion', code)
      .single();

    if (propError || !propiedad) {
      showToast('Código de referencia no válido', 'error');
      showLoading(false);
      return;
    }

    // Crear vinculación
    const { error: linkError } = await window._supabase
      .from('perfil_propiedades')
      .insert({
        id_perfil_inquilino: window.currentUser.id,
        id_perfil_casero: propiedad.perfil_id,
        codigo_propiedad: code
      });

    if (linkError) throw linkError;

    showToast('Vivienda vinculada correctamente', 'success');
    showLoading(false);

    // Recargar página
    setTimeout(() => {
      window.loadHousingInfo();
    }, 1000);

  } catch (error) {
    console.error('Error vinculando vivienda:', error);
    showToast('Error al vincular la vivienda', 'error');
    showLoading(false);
  }
}

console.log('%c🏠 Tenant Housing Module', 'color: #2A9D8F; font-weight: bold');
