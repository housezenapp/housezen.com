/**
 * js/incidents.js - Gestión y Logística de Incidencias
 * Adaptado para compatibilidad global y vinculación por perfil_propiedades
 */

async function loadIncidents() {
    const container = document.getElementById('incidents-logistics-container');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <div class="empty-state-text">Cargando incidencias...</div>
        </div>
    `;

    let timeoutId = setTimeout(() => {
        if (container && container.querySelector('.loading-state')) {
            console.warn('⏱️ Timeout al cargar incidencias');
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-clock"></i>
                    <div class="empty-state-text">La carga está tardando demasiado</div>
                    <button class="submit-btn" style="margin-top: 20px; max-width: 250px;" onclick="window.loadIncidents()">
                        <i class="fa-solid fa-rotate"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }, 10000); // 10 segundos

    try {
        // Verificar y sincronizar sesión antes de cargar datos
        if (!window.currentUser) {
            console.warn('⚠️ loadIncidents: No hay currentUser, intentando obtener sesión...');
            try {
                const { data: { session }, error: sessionError } = await window._supabase.auth.getSession();
                if (session && !sessionError) {
                    window.currentUser = session.user;
                    console.log('✅ Sesión recuperada:', window.currentUser.id);
                } else {
                    console.error('❌ No hay sesión válida:', sessionError);
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fa-solid fa-exclamation-triangle"></i>
                            <div class="empty-state-text">Sesión expirada. Por favor, recarga la página.</div>
                        </div>
                    `;
                    if (typeof window.forceLogout === 'function') {
                        await window.forceLogout();
                    }
                    return;
                }
            } catch (err) {
                console.error('❌ Error obteniendo sesión:', err);
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                        <div class="empty-state-text">Error: No se pudo obtener la sesión. Por favor, recarga la página.</div>
                    </div>
                `;
                return;
            }
        }

        // Verificar sesión antes de cargar datos (refrescar token si es necesario)
        console.log('🔍 Verificando sesión antes de cargar incidencias...');
        const { data: { session: currentSession }, error: sessionError } = await window._supabase.auth.getSession();
        
        if (sessionError || !currentSession) {
            console.error('❌ No hay sesión válida:', sessionError);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <div class="empty-state-text">Sesión expirada. Por favor, recarga la página.</div>
                </div>
            `;
            if (typeof window.forceLogout === 'function') {
                await window.forceLogout();
            }
            return;
        }

        window.currentUser = currentSession.user;
        console.log('✅ Sesión válida encontrada:', currentSession.user.email);

        // Forzar refresh de sesión para reactivar la conexión
        console.log('🔄 Refrescando sesión para reactivar conexión...');
        try {
            const { data: { session: refreshedSession }, error: refreshError } = await window._supabase.auth.refreshSession();
            if (!refreshError && refreshedSession) {
                window.currentUser = refreshedSession.user;
                console.log('✅ Sesión refrescada exitosamente');
            } else {
                console.warn('⚠️ Error al refrescar sesión (continuando con sesión anterior):', refreshError);
            }
        } catch (refreshErr) {
            console.warn('⚠️ Excepción al refrescar sesión (continuando):', refreshErr);
        }

        // Verificar que Supabase esté inicializado
        if (!window._supabase) {
            console.error('❌ loadIncidents: Supabase no está inicializado');
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <div class="empty-state-text">Error: La conexión a la base de datos no está disponible. Recarga la página.</div>
                </div>
            `;
            return;
        }

        let incidents = [];

        // Uso de variables globales del objeto window
        const _supabase = window._supabase;
        const currentUser = window.currentUser;
        const isAdmin = window.isAdmin;
        
        console.log('📡 loadIncidents: Consultando incidencias. Usuario:', currentUser.id, 'Admin:', isAdmin);

        if (isAdmin) {
            console.log('📡 loadIncidents: Consultando todas las incidencias (admin)');
            const { data, error: adminError } = await _supabase
                .from('incidencias')
                .select('*')
                .order('created_at', { ascending: false });

            console.log('📡 loadIncidents (admin): Respuesta recibida. Datos:', data?.length || 0, 'Error:', adminError);

            if (adminError) {
                console.error('❌ loadIncidents: Error al consultar incidencias (admin):', adminError);
                // Si el error es de autenticación, forzar cierre de sesión
                if (adminError.message && (adminError.message.includes('JWT') || adminError.message.includes('session') || adminError.message.includes('auth') || adminError.message.includes('401') || adminError.message.includes('Unauthorized'))) {
                    console.error('❌ Error de autenticación:', adminError);
                    if (typeof window.forceLogout === 'function') {
                        await window.forceLogout();
                    }
                    return;
                }
                // Mostrar error específico
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                        <div class="empty-state-text">Error al cargar incidencias: ${adminError.message || 'Error desconocido'}</div>
                    </div>
                `;
                return;
            }

            incidents = data || [];
        } else {
            // 1. Obtener los IDs de los inquilinos vinculados al casero actual
            console.log('📡 loadIncidents: Consultando vinculaciones para casero:', currentUser.id);
            const { data: vinculaciones, error: vError } = await _supabase
                .from('perfil_propiedades')
                .select('id_perfil_inquilino')
                .eq('id_perfil_casero', currentUser.id);
            
            console.log('📡 loadIncidents: Vinculaciones recibidas:', vinculaciones?.length || 0, 'Error:', vError);

            if (vError) {
                // Si el error es de autenticación, forzar cierre de sesión
                if (vError.message && (vError.message.includes('JWT') || vError.message.includes('session') || vError.message.includes('auth') || vError.message.includes('401') || vError.message.includes('Unauthorized'))) {
                    console.error('❌ Error de autenticación:', vError);
                    if (typeof window.forceLogout === 'function') {
                        await window.forceLogout();
                    }
                    return;
                }
                // Mostrar error específico
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                        <div class="empty-state-text">Error al cargar datos: ${vError.message || 'Error desconocido'}</div>
                    </div>
                `;
                return;
            }

            // Verificación de seguridad: Si no hay inquilinos vinculados
            if (!vinculaciones || vinculaciones.length === 0) {
                if (document.getElementById('stat-urgent')) document.getElementById('stat-urgent').textContent = '0';
                if (document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = '0';
                if (document.getElementById('stat-progress')) document.getElementById('stat-progress').textContent = '0';
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-user-slash"></i>
                        <div class="empty-state-text">No tienes inquilinos vinculados todavía</div>
                    </div>
                `;
                return;
            }

            const inquilinoIds = vinculaciones.map(v => v.id_perfil_inquilino);
            console.log('📡 loadIncidents: IDs de inquilinos:', inquilinoIds);

            // 2. Consulta incidencias buscando por el user_id del inquilino
            if (inquilinoIds.length === 0) {
                if (document.getElementById('stat-urgent')) document.getElementById('stat-urgent').textContent = '0';
                if (document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = '0';
                if (document.getElementById('stat-progress')) document.getElementById('stat-progress').textContent = '0';
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-user-slash"></i>
                        <div class="empty-state-text">No tienes inquilinos vinculados todavía</div>
                    </div>
                `;
                return;
            }

            console.log('📡 loadIncidents: Consultando incidencias para inquilinos');
            const { data, error: iError } = await _supabase
                .from('incidencias')
                .select('*')
                .in('user_id', inquilinoIds)
                .order('created_at', { ascending: false });
            
            console.log('📡 loadIncidents: Incidencias recibidas:', data?.length || 0, 'Error:', iError);

            if (iError) {
                console.error('❌ loadIncidents: Error al consultar incidencias:', iError);
                // Si el error es de autenticación, forzar cierre de sesión
                if (iError.message && (iError.message.includes('JWT') || iError.message.includes('session') || iError.message.includes('auth') || iError.message.includes('401') || iError.message.includes('Unauthorized'))) {
                    console.error('❌ Error de autenticación:', iError);
                    if (typeof window.forceLogout === 'function') {
                        await window.forceLogout();
                    }
                    return;
                }
                // Mostrar error específico
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                        <div class="empty-state-text">Error al cargar incidencias: ${iError.message || 'Error desconocido'}</div>
                    </div>
                `;
                return;
            }

            incidents = data || [];
        }

        // Actualizar contadores del dashboard
        const urgentes = incidents.filter(i => i.urgencia === 'alta' && i.estado !== 'Solucionado').length;
        const pendientes = incidents.filter(i => i.estado === 'Reportada').length;
        const enProceso = incidents.filter(i =>
            i.estado !== 'Reportada' && i.estado !== 'Solucionado'
        ).length;

        if (document.getElementById('stat-urgent')) document.getElementById('stat-urgent').textContent = urgentes;
        if (document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = pendientes;
        if (document.getElementById('stat-progress')) document.getElementById('stat-progress').textContent = enProceso;

        if (incidents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-home"></i>
                    <div class="empty-state-text">No hay incidencias vinculadas a tus inquilinos</div>
                </div>
            `;
            return;
        }

        // Aplicar filtros de la UI
        const filterEstado = document.getElementById('filter-estado') ? document.getElementById('filter-estado').value : '';
        const filterUrgencia = document.getElementById('filter-urgencia') ? document.getElementById('filter-urgencia').value : '';

        let filteredIncidents = [...incidents];

        if (filterEstado) {
            filteredIncidents = filteredIncidents.filter(i => i.estado === filterEstado);
        }

        if (filterUrgencia) {
            filteredIncidents = filteredIncidents.filter(i => i.urgencia === filterUrgencia);
        }

        if (filteredIncidents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-filter"></i>
                    <div class="empty-state-text">No se encontraron incidencias con estos filtros</div>
                </div>
            `;
            return;
        }

        console.log('✅ loadIncidents: Renderizando', filteredIncidents.length, 'incidencias');
        renderIncidentsList(filteredIncidents);

    } catch (error) {
        console.error('❌ loadIncidents: Error general:', error);
        
        // Verificar si es un error de autenticación
        const errorMessage = error?.message || error?.toString() || '';
        const isAuthError = errorMessage.includes('JWT') || 
                           errorMessage.includes('session') || 
                           errorMessage.includes('auth') ||
                           errorMessage.includes('401') ||
                           errorMessage.includes('Unauthorized');
        
        if (isAuthError) {
            if (typeof window.forceLogout === 'function') {
                await window.forceLogout();
            }
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <div class="empty-state-text">Error al cargar las incidencias. Recarga la página.</div>
                </div>
            `;
            if (typeof window.showToast === 'function') window.showToast('Error al cargar las incidencias');
        }
    } finally {
        // Asegurar que el timeout se cancele y el loading se desactive
        if (timeoutId) clearTimeout(timeoutId);
    }
}

function renderIncidentsList(incidents) {
    const container = document.getElementById('incidents-logistics-container');
    if (!container) return;

    const html = incidents.map(inc => `
        <div class="incident-card urgency-${inc.urgencia}" onclick="showIncidentDetail('${inc.id}')">
            <div class="incident-header">
                <div class="incident-title">${inc.titulo}</div>
                <span class="status-badge status-${inc.estado.replace(/ /g, '-')}" data-estado="${inc.estado}">${inc.estado}</span>
            </div>
            <div class="incident-info">
                <div class="incident-info-row">
                    <i class="fa-solid fa-user"></i>
                    <span>${inc.nombre_inquilino || 'Sin nombre'}</span>
                </div>
                <div class="incident-info-row">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${inc.direccion || 'Sin dirección'}</span>
                </div>
                <div class="incident-info-row">
                    <i class="fa-solid fa-tag"></i>
                    <span>${inc.categoria}</span>
                </div>
            </div>
            <div class="incident-footer">
                <span>${formatDate(inc.created_at)}</span>
                <span class="urgency-badge urgency-${inc.urgencia}">${inc.urgencia.toUpperCase()}</span>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

async function showIncidentDetail(incidentId) {
    const modal = document.getElementById('incident-detail-modal');
    const content = document.getElementById('incident-detail-content');

    if (!modal || !content) return;

    content.innerHTML = `
        <div class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
        </div>
    `;

    modal.classList.add('active');

    try {
        const _supabase = window._supabase;
        const currentUser = window.currentUser;

        const { data: incident } = await _supabase
            .from('incidencias')
            .select('*')
            .eq('id', incidentId)
            .single();

        if (!incident) {
            if (typeof window.showToast === 'function') window.showToast('Incidencia no encontrada');
            return;
        }

        const { data: historial } = await _supabase
            .from('historial_estados')
            .select('*')
            .eq('incidencia_id', incidentId)
            .order('created_at', { ascending: true });

        const { data: tecnicos } = await _supabase
            .from('tecnicos')
            .select('*')
            .eq('casero_id', currentUser.id)
            .eq('activo', true);

        renderIncidentDetail(incident, historial, tecnicos);

    } catch (error) {
        console.error('Error loading incident detail:', error);
        if (typeof window.showToast === 'function') window.showToast('Error al cargar el detalle');
    }
}

function renderIncidentDetail(incident, historial, tecnicos) {
    const content = document.getElementById('incident-detail-content');
    if (!content) return;

    const estados = [
        'Reportada',
        'Asignación de Pago',
        'En manos del Técnico',
        'Reparación en Curso',
        'Presupuesto Pendiente',
        'Solucionado'
    ];

    const currentStateIndex = estados.indexOf(incident.estado);

    const stepperHtml = estados.map((estado, index) => {
        const isCompleted = index < currentStateIndex;
        const isActive = index === currentStateIndex;
        const stepClass = isCompleted ? 'completed' : (isActive ? 'active' : '');

        const historialItem = historial?.find(h => h.estado_nuevo === estado);
        const timeDisplay = historialItem
            ? formatDate(historialItem.created_at)
            : isActive
                ? 'En curso...'
                : 'Pendiente';

        return `
            <div class="stepper-step ${stepClass}">
                <div class="step-icon">
                    ${isCompleted ? '<i class="fa-solid fa-check"></i>' : (index + 1)}
                </div>
                <div class="step-content">
                    <div class="step-title">${estado}</div>
                    <div class="step-time">${timeDisplay}</div>
                    ${historialItem && historialItem.notas ? `<div class="step-notes">${historialItem.notas}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    const tecnicoOptions = tecnicos && tecnicos.length > 0
        ? tecnicos.map(t => `<option value="${t.id}" ${incident.tecnico_id === t.id ? 'selected' : ''}>${t.nombre} - ${t.especialidad}</option>`).join('')
        : '<option value="">No hay técnicos disponibles</option>';

    const html = `
        <div style="padding: 25px;">
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Inquilino</div>
                    <div class="info-value">${incident.nombre_inquilino || 'Sin nombre'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${incident.email_inquilino || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Teléfono</div>
                    <div class="info-value">${incident.telefono || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Dirección</div>
                    <div class="info-value">${incident.direccion || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Categoría</div>
                    <div class="info-value">${incident.categoria}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Urgencia</div>
                    <div class="info-value">
                        <span class="urgency-badge urgency-${incident.urgencia}">${incident.urgencia.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div style="margin: 20px 0;">
                <h4 style="font-weight: 800; margin-bottom: 10px; color: var(--text-light); font-size: 0.85rem; text-transform: uppercase;">Descripción</h4>
                <p style="color: var(--text-main); line-height: 1.6;">${incident.descripcion}</p>
            </div>

            ${incident.notas_casero ? `
                <div style="margin: 20px 0;">
                    <h4 style="font-weight: 800; margin-bottom: 10px; color: var(--text-light); font-size: 0.85rem; text-transform: uppercase;">Notas del Casero</h4>
                    <p style="color: var(--text-main); line-height: 1.6; background: var(--primary-light); padding: 12px; border-radius: var(--radius-md);">${incident.notas_casero}</p>
                </div>
            ` : ''}

            <div style="margin: 30px 0;">
                <h4 style="font-weight: 800; margin-bottom: 20px; color: var(--secondary); font-size: 1.1rem;">Trazabilidad de la Incidencia</h4>
                <div class="stepper">
                    ${stepperHtml}
                </div>
            </div>

            ${incident.estado === 'Reportada' ? `
                <div class="action-section">
                    <h4>Asignar Responsable de Pago</h4>
                    <div class="action-buttons">
                        <button class="action-btn primary" onclick="asignarResponsable('${incident.id}', 'Casero')">
                            <i class="fa-solid fa-user-tie"></i> Casero
                        </button>
                        <button class="action-btn primary" onclick="asignarResponsable('${incident.id}', 'Inquilino')">
                            <i class="fa-solid fa-user"></i> Inquilino
                        </button>
                        <button class="action-btn primary" onclick="asignarResponsable('${incident.id}', 'Seguro')">
                            <i class="fa-solid fa-shield"></i> Seguro
                        </button>
                    </div>
                </div>
            ` : ''}

            ${incident.estado === 'Asignación de Pago' && incident.responsable_pago ? `
                <div class="action-section">
                    <h4>Responsable: ${incident.responsable_pago}</h4>
                    <div style="margin-top: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 700; font-size: 0.85rem;">Asignar Técnico</label>
                        <select id="tecnico-select" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--radius-md); margin-bottom: 10px;">
                            <option value="">Selecciona un técnico...</option>
                            ${tecnicoOptions}
                        </select>
                        <button class="action-btn success" onclick="asignarTecnico('${incident.id}')">
                            <i class="fa-solid fa-toolbox"></i> Asignar y Avanzar
                        </button>
                    </div>
                </div>
            ` : ''}

            ${incident.estado === 'En manos del Técnico' ? `
                <div class="action-section">
                    <h4>Técnico Asignado</h4>
                    <div class="action-buttons">
                        <button class="action-btn primary" onclick="avanzarEstado('${incident.id}', 'Reparación en Curso')">
                            <i class="fa-solid fa-gear"></i> Iniciar Reparación
                        </button>
                    </div>
                </div>
            ` : ''}

            ${incident.estado === 'Reparación en Curso' ? `
                <div class="action-section">
                    <h4>Solicitar Presupuesto</h4>
                    <div style="margin-top: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 700; font-size: 0.85rem;">Monto (€)</label>
                        <input type="number" id="presupuesto-monto" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--radius-md); margin-bottom: 10px;" placeholder="0.00" step="0.01">
                        <label style="display: block; margin-bottom: 8px; font-weight: 700; font-size: 0.85rem;">Descripción</label>
                        <textarea id="presupuesto-descripcion" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--radius-md); margin-bottom: 10px; min-height: 80px;" placeholder="Descripción del presupuesto..."></textarea>
                        <button class="action-btn primary" onclick="enviarPresupuesto('${incident.id}')">
                            <i class="fa-solid fa-file-invoice-dollar"></i> Enviar Presupuesto
                        </button>
                    </div>
                </div>
            ` : ''}

            ${incident.estado === 'Presupuesto Pendiente' && incident.presupuesto_estado === 'pendiente' ? `
                <div class="action-section">
                    <h4>Presupuesto Enviado</h4>
                    <div class="info-grid" style="margin: 15px 0;">
                        <div class="info-item">
                            <div class="info-label">Monto</div>
                            <div class="info-value">${incident.presupuesto_monto} €</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Estado</div>
                            <div class="info-value">Pendiente de aceptación</div>
                        </div>
                    </div>
                    ${incident.presupuesto_descripcion ? `<p style="color: var(--text-main); margin-bottom: 15px;">${incident.presupuesto_descripcion}</p>` : ''}
                    <div class="action-buttons">
                        <button class="action-btn success" onclick="gestionarPresupuesto('${incident.id}', 'aceptado')">
                            <i class="fa-solid fa-check"></i> Aceptar
                        </button>
                        <button class="action-btn danger" onclick="gestionarPresupuesto('${incident.id}', 'rechazado')">
                            <i class="fa-solid fa-times"></i> Rechazar
                        </button>
                    </div>
                </div>
            ` : ''}

            ${incident.presupuesto_estado === 'aceptado' && incident.estado !== 'Solucionado' ? `
                <div class="action-section">
                    <h4>Presupuesto Aceptado</h4>
                    <p style="color: var(--success); font-weight: 700; margin-bottom: 15px;">Presupuesto de ${incident.presupuesto_monto}€ aceptado</p>
                    <div class="action-buttons">
                        <button class="action-btn success" onclick="avanzarEstado('${incident.id}', 'Solucionado')">
                            <i class="fa-solid fa-check-circle"></i> Marcar como Solucionado
                        </button>
                    </div>
                </div>
            ` : ''}

            ${incident.estado === 'Solucionado' ? `
                <div class="action-section" style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border: 2px solid var(--success);">
                    <h4 style="color: var(--success);">
                        <i class="fa-solid fa-check-circle"></i> Incidencia Solucionada
                    </h4>
                    <p style="color: var(--text-main); margin-top: 10px;">Esta incidencia ha sido completada exitosamente.</p>
                </div>
            ` : ''}

            <div style="margin-top: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 700; font-size: 0.85rem;">Notas Internas del Casero</label>
                <textarea id="notas-casero" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--radius-md); min-height: 80px;">${incident.notas_casero || ''}</textarea>
                <button class="action-btn primary" style="margin-top: 10px;" onclick="guardarNotas('${incident.id}')">
                    <i class="fa-solid fa-save"></i> Guardar Notas
                </button>
            </div>
        </div>
    `;

    content.innerHTML = html;
}

// Funciones globales asignadas al objeto window para compatibilidad onclick

window.asignarResponsable = async (incidentId, responsable) => {
    try {
        const _supabase = window._supabase;
        const currentUser = window.currentUser;

        const { error: updateError } = await _supabase
            .from('incidencias')
            .update({
                responsable_pago: responsable,
                estado: 'Asignación de Pago'
            })
            .eq('id', incidentId);

        if (updateError) throw updateError;

        await _supabase
            .from('historial_estados')
            .insert({
                incidencia_id: incidentId,
                estado_anterior: 'Reportada',
                estado_nuevo: 'Asignación de Pago',
                notas: `Responsable de pago asignado: ${responsable}`,
                cambiado_por: currentUser.id
            });

        if (typeof window.showToast === 'function') window.showToast(`Responsable asignado: ${responsable}`);
        showIncidentDetail(incidentId);
        loadIncidents();
    } catch (error) {
        console.error('Error:', error);
        if (typeof window.showToast === 'function') window.showToast('Error al asignar responsable');
    }
};

window.asignarTecnico = async (incidentId) => {
    const tecnicoId = document.getElementById('tecnico-select').value;
    if (!tecnicoId) {
        if (typeof window.showToast === 'function') window.showToast('Selecciona un técnico');
        return;
    }

    try {
        const _supabase = window._supabase;
        const currentUser = window.currentUser;

        const { data: tecnico } = await _supabase
            .from('tecnicos')
            .select('nombre')
            .eq('id', tecnicoId)
            .single();

        const { error: updateError } = await _supabase
            .from('incidencias')
            .update({
                tecnico_id: tecnicoId,
                estado: 'En manos del Técnico'
            })
            .eq('id', incidentId);

        if (updateError) throw updateError;

        await _supabase
            .from('historial_estados')
            .insert({
                incidencia_id: incidentId,
                estado_anterior: 'Asignación de Pago',
                estado_nuevo: 'En manos del Técnico',
                notas: `Técnico asignado: ${tecnico.nombre}`,
                cambiado_por: currentUser.id
            });

        if (typeof window.showToast === 'function') window.showToast('Técnico asignado correctamente');
        showIncidentDetail(incidentId);
        loadIncidents();
    } catch (error) {
        console.error('Error:', error);
        if (typeof window.showToast === 'function') window.showToast('Error al asignar técnico');
    }
};

window.avanzarEstado = async (incidentId, nuevoEstado) => {
    try {
        const _supabase = window._supabase;
        const currentUser = window.currentUser;

        const { data: incident } = await _supabase
            .from('incidencias')
            .select('estado')
            .eq('id', incidentId)
            .single();

        const { error: updateError } = await _supabase
            .from('incidencias')
            .update({ estado: nuevoEstado })
            .eq('id', incidentId);

        if (updateError) throw updateError;

        await _supabase
            .from('historial_estados')
            .insert({
                incidencia_id: incidentId,
                estado_anterior: incident.estado,
                estado_nuevo: nuevoEstado,
                cambiado_por: currentUser.id
            });

        if (typeof window.showToast === 'function') window.showToast('Estado actualizado correctamente');
        showIncidentDetail(incidentId);
        loadIncidents();
    } catch (error) {
        console.error('Error:', error);
        if (typeof window.showToast === 'function') window.showToast('Error al actualizar estado');
    }
};

window.enviarPresupuesto = async (incidentId) => {
    const monto = document.getElementById('presupuesto-monto').value;
    const descripcion = document.getElementById('presupuesto-descripcion').value;

    if (!monto || parseFloat(monto) <= 0) {
        if (typeof window.showToast === 'function') window.showToast('Introduce un monto válido');
        return;
    }

    try {
        const _supabase = window._supabase;
        const currentUser = window.currentUser;

        const { error: updateError } = await _supabase
            .from('incidencias')
            .update({
                presupuesto_monto: parseFloat(monto),
                presupuesto_descripcion: descripcion,
                presupuesto_estado: 'pendiente',
                estado: 'Presupuesto Pendiente'
            })
            .eq('id', incidentId);

        if (updateError) throw updateError;

        await _supabase
            .from('historial_estados')
            .insert({
                incidencia_id: incidentId,
                estado_anterior: 'Reparación en Curso',
                estado_nuevo: 'Presupuesto Pendiente',
                notas: `Presupuesto enviado: ${monto}€`,
                cambiado_por: currentUser.id
            });

        if (typeof window.showToast === 'function') window.showToast('Presupuesto enviado correctamente');
        showIncidentDetail(incidentId);
        loadIncidents();
    } catch (error) {
        console.error('Error:', error);
        if (typeof window.showToast === 'function') window.showToast('Error al enviar presupuesto');
    }
};

window.gestionarPresupuesto = async (incidentId, decision) => {
    try {
        const _supabase = window._supabase;
        const currentUser = window.currentUser;

        const { error: updateError } = await _supabase
            .from('incidencias')
            .update({ presupuesto_estado: decision })
            .eq('id', incidentId);

        if (updateError) throw updateError;

        const mensaje = decision === 'aceptado'
            ? 'Presupuesto aceptado - Se procederá con el pago'
            : 'Presupuesto rechazado - Se debe negociar';

        await _supabase
            .from('historial_estados')
            .insert({
                incidencia_id: incidentId,
                estado_anterior: 'Presupuesto Pendiente',
                estado_nuevo: 'Presupuesto Pendiente',
                notas: mensaje,
                cambiado_por: currentUser.id
            });

        if (typeof window.showToast === 'function') window.showToast(decision === 'aceptado' ? 'Presupuesto aceptado' : 'Presupuesto rechazado');
        showIncidentDetail(incidentId);
        loadIncidents();
    } catch (error) {
        console.error('Error:', error);
        if (typeof window.showToast === 'function') window.showToast('Error al gestionar presupuesto');
    }
};

window.guardarNotas = async (incidentId) => {
    const notas = document.getElementById('notas-casero').value;
    try {
        const _supabase = window._supabase;
        const { error } = await _supabase
            .from('incidencias')
            .update({ notas_casero: notas })
            .eq('id', incidentId);

        if (error) throw error;
        if (typeof window.showToast === 'function') window.showToast('Notas guardadas');
    } catch (error) {
        console.error('Error:', error);
        if (typeof window.showToast === 'function') window.showToast('Error al guardar notas');
    }
};

window.closeIncidentDetailModal = () => {
    const modal = document.getElementById('incident-detail-modal');
    if (modal) modal.classList.remove('active');
    loadIncidents();
};

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Exposición global de funciones principales
window.loadIncidents = loadIncidents;
window.showIncidentDetail = showIncidentDetail;
window.renderIncidentsList = renderIncidentsList;
window.renderIncidentDetail = renderIncidentDetail;
