/**
 * HOUSEZEN - CREAR INCIDENCIA (INQUILINO)
 * Módulo para reportar nuevas incidencias
 */

let selectedCategory = null;
let selectedUrgency = null;

// ========================================
// INICIALIZAR PÁGINA
// ========================================
window.initNewIncidentPage = async function() {
  const container = document.getElementById('page-nueva-incidencia');
  if (!container) return;

  try {
    await checkAndRefreshSession();

    // Obtener datos de vivienda vinculada
    const housingData = await getLinkedHousing();

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Nueva Incidencia</h2>
          <p class="card-subtitle">Reporta un problema en tu vivienda</p>
        </div>

        ${housingData ? renderHousingInfo(housingData) : ''}

        <form id="new-incident-form">
          <!-- Categoría -->
          <div class="form-group">
            <label class="form-label">Categoría *</label>
            <div class="category-grid" id="category-selector">
              <div class="category-card" data-category="fontaneria">
                <span class="category-icon">🚰</span>
                <span class="category-label">Fontanería</span>
              </div>
              <div class="category-card" data-category="electricidad">
                <span class="category-icon">⚡</span>
                <span class="category-label">Electricidad</span>
              </div>
              <div class="category-card" data-category="electrodomesticos">
                <span class="category-icon">🔌</span>
                <span class="category-label">Electrodomésticos</span>
              </div>
              <div class="category-card" data-category="cerrajeria">
                <span class="category-icon">🔑</span>
                <span class="category-label">Cerrajería</span>
              </div>
              <div class="category-card" data-category="otros">
                <span class="category-icon">🔧</span>
                <span class="category-label">Otros</span>
              </div>
            </div>
          </div>

          <!-- Título -->
          <div class="form-group">
            <label class="form-label">Título *</label>
            <input
              type="text"
              id="incident-title"
              class="form-input"
              placeholder="Ej: Gotera en el baño"
              required
            >
          </div>

          <!-- Descripción -->
          <div class="form-group">
            <label class="form-label">Descripción *</label>
            <textarea
              id="incident-description"
              class="form-textarea"
              placeholder="Describe el problema con el mayor detalle posible..."
              required
            ></textarea>
          </div>

          <!-- Urgencia -->
          <div class="form-group">
            <label class="form-label">Nivel de urgencia *</label>
            <div class="priority-buttons">
              <button type="button" class="priority-btn low" data-urgency="baja">
                <span>🟢</span> Baja
              </button>
              <button type="button" class="priority-btn medium" data-urgency="media">
                <span>🟡</span> Media
              </button>
              <button type="button" class="priority-btn high" data-urgency="alta">
                <span>🔴</span> Alta
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" id="submit-incident-btn">
            📤 Enviar Incidencia
          </button>
        </form>
      </div>
    `;

    setupIncidentForm();

  } catch (error) {
    console.error('Error inicializando formulario:', error);
    container.innerHTML = '<div class="card"><p style="color: var(--error);">Error al cargar el formulario</p></div>';
  }
};

// ========================================
// OBTENER VIVIENDA VINCULADA
// ========================================
async function getLinkedHousing() {
  try {
    const { data, error } = await window._supabase
      .from('perfil_propiedades')
      .select(`
        codigo_propiedad,
        propiedades:codigo_propiedad (
          direccion_completa
        )
      `)
      .eq('id_perfil_inquilino', window.currentUser.id)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error('Error obteniendo vivienda:', error);
    return null;
  }
}

// ========================================
// RENDERIZAR INFO DE VIVIENDA
// ========================================
function renderHousingInfo(data) {
  const address = data?.propiedades?.direccion_completa || 'No disponible';

  return `
    <div class="housing-info">
      <div class="housing-info-title">
        🏠 Tu vivienda
      </div>
      <div class="housing-info-details">
        <div class="housing-info-item">
          <span>📍 ${address}</span>
        </div>
      </div>
    </div>
  `;
}

// ========================================
// CONFIGURAR FORMULARIO
// ========================================
function setupIncidentForm() {
  // Selector de categorías
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedCategory = card.dataset.category;
    });
  });

  // Botones de urgencia
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedUrgency = btn.dataset.urgency;
    });
  });

  // Submit del formulario
  const form = document.getElementById('new-incident-form');
  if (form) {
    form.addEventListener('submit', handleIncidentSubmit);
  }
}

// ========================================
// ENVIAR INCIDENCIA
// ========================================
async function handleIncidentSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('incident-title')?.value.trim();
  const description = document.getElementById('incident-description')?.value.trim();

  if (!selectedCategory) {
    showToast('Selecciona una categoría', 'warning');
    return;
  }

  if (!selectedUrgency) {
    showToast('Selecciona el nivel de urgencia', 'warning');
    return;
  }

  if (!title || !description) {
    showToast('Completa todos los campos', 'warning');
    return;
  }

  try {
    showLoading(true);

    // Obtener vinculación de propiedad
    const { data: vinculacion } = await window._supabase
      .from('perfil_propiedades')
      .select('codigo_propiedad')
      .eq('id_perfil_inquilino', window.currentUser.id)
      .single();

    // Crear incidencia
    const { error } = await window._supabase
      .from('incidencias')
      .insert({
        titulo: title,
        descripcion: description,
        categoria: selectedCategory,
        urgencia: selectedUrgency,
        user_id: window.currentUser.id,
        propiedad_id: vinculacion?.codigo_propiedad || null,
        nombre_inquilino: window.userProfile?.nombre || window.currentUser.email,
        email_inquilino: window.currentUser.email,
        estado: 'pendiente'
      });

    if (error) throw error;

    showToast('Incidencia enviada correctamente', 'success');
    showLoading(false);

    // Navegar a mis incidencias
    setTimeout(() => {
      navigateTo('mis-incidencias');
    }, 1000);

  } catch (error) {
    console.error('Error enviando incidencia:', error);
    showToast('Error al enviar la incidencia', 'error');
    showLoading(false);
  }
}

console.log('%c🏠 Tenant Incidents Create Module', 'color: #2A9D8F; font-weight: bold');
