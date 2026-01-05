/**
 * HOUSEZEN - COMPONENTES UI COMPARTIDOS
 * Funciones de interfaz de usuario reutilizables
 */

// ========================================
// TOAST NOTIFICATIONS
// ========================================
window.showToast = function(message, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  // Limpiar clases previas
  toast.className = 'toast';

  // Agregar clase de tipo
  if (type) {
    toast.classList.add(type);
  }

  // Establecer mensaje
  toast.textContent = message;

  // Mostrar toast
  toast.classList.add('show');

  // Ocultar después de la duración
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
};

// ========================================
// LOADING OVERLAY
// ========================================
window.showLoading = function(show = true) {
  const loading = document.getElementById('loading-overlay');
  if (!loading) return;

  if (show) {
    loading.classList.add('active');
  } else {
    loading.classList.remove('active');
  }
};

// ========================================
// NAVEGACIÓN DE PÁGINAS
// ========================================
window.showPage = function(pageId) {
  // Ocultar todas las páginas
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => {
    page.classList.remove('active');
  });

  // Mostrar página solicitada
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add('active');

    // Scroll al inicio
    window.scrollTo(0, 0);
  } else {
    console.error(`Página no encontrada: page-${pageId}`);
  }

  // Actualizar navegación activa
  updateActiveNav(pageId);

  // Cerrar sidebar en móvil
  closeSidebar();
};

// ========================================
// ACTUALIZAR NAVEGACIÓN ACTIVA
// ========================================
function updateActiveNav(pageId) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.dataset.page === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// ========================================
// TOGGLE SIDEBAR
// ========================================
window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('menu-overlay');

  if (!sidebar || !overlay) return;

  const isActive = sidebar.classList.contains('active');

  if (isActive) {
    closeSidebar();
  } else {
    openSidebar();
  }
};

function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('menu-overlay');

  if (sidebar) sidebar.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('menu-overlay');

  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

// ========================================
// MODALES
// ========================================
window.showModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.hideModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// Cerrar modal al hacer click en overlay
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    const modal = e.target.closest('.modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
});

// ========================================
// FORMATEO DE FECHAS
// ========================================
window.formatDate = function(dateString) {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Hace menos de 1 minuto
  if (diffMins < 1) return 'Ahora mismo';

  // Hace menos de 1 hora
  if (diffMins < 60) return `Hace ${diffMins} min`;

  // Hace menos de 24 horas
  if (diffHours < 24) return `Hace ${diffHours} h`;

  // Hace menos de 7 días
  if (diffDays < 7) return `Hace ${diffDays} días`;

  // Formato completo
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
};

window.formatDateTime = function(dateString) {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('es-ES', options);
};

// ========================================
// BADGES DE ESTADO
// ========================================
window.getStatusBadge = function(status) {
  const badges = {
    'pendiente': '<span class="badge badge-warning">Pendiente</span>',
    'en_proceso': '<span class="badge badge-info">En Proceso</span>',
    'resuelta': '<span class="badge badge-success">Resuelta</span>',
    'rechazada': '<span class="badge badge-error">Rechazada</span>'
  };

  return badges[status] || '<span class="badge">Desconocido</span>';
};

window.getUrgencyBadge = function(urgency) {
  const badges = {
    'baja': '<span class="badge badge-success">Baja</span>',
    'media': '<span class="badge badge-warning">Media</span>',
    'alta': '<span class="badge badge-error">Alta</span>'
  };

  return badges[urgency] || '<span class="badge">-</span>';
};

// ========================================
// VALIDACIÓN DE FORMULARIOS
// ========================================
window.validateForm = function(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;

  const inputs = form.querySelectorAll('[required]');
  let isValid = true;

  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('error');
      isValid = false;
    } else {
      input.classList.remove('error');
    }
  });

  return isValid;
};

// ========================================
// LIMPIAR FORMULARIO
// ========================================
window.clearForm = function(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.reset();

  // Limpiar errores
  const inputs = form.querySelectorAll('.error');
  inputs.forEach(input => {
    input.classList.remove('error');
  });
};

// ========================================
// CONFIRMACIÓN DE ACCIONES
// ========================================
window.confirmAction = function(message) {
  return confirm(message);
};

// ========================================
// ESTADOS VACÍOS
// ========================================
window.renderEmptyState = function(container, icon, title, text) {
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3 class="empty-state-title">${title}</h3>
      <p class="empty-state-text">${text}</p>
    </div>
  `;
};

// ========================================
// ESTADOS DE CARGA
// ========================================
window.renderLoadingState = function(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando...</p>
    </div>
  `;
};

// ========================================
// COPIAR AL PORTAPAPELES
// ========================================
window.copyToClipboard = function(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copiado al portapapeles', 'success');
    }).catch(() => {
      showToast('Error al copiar', 'error');
    });
  } else {
    // Fallback para navegadores antiguos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Copiado al portapapeles', 'success');
    } catch (err) {
      showToast('Error al copiar', 'error');
    }
    document.body.removeChild(textArea);
  }
};

// ========================================
// INICIALIZACIÓN DE EVENTOS UI
// ========================================
function initUIEvents() {
  // Botón de menú
  const menuBtn = document.getElementById('menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', toggleSidebar);
  }

  // Overlay de menú
  const menuOverlay = document.getElementById('menu-overlay');
  if (menuOverlay) {
    menuOverlay.addEventListener('click', closeSidebar);
  }

  // Botón de logout
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (confirmAction('¿Estás seguro de que quieres cerrar sesión?')) {
        window.logout();
      }
    });
  }

  // Botón de login con Google
  const btnGoogleLogin = document.getElementById('btn-google-login');
  if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', window.loginWithGoogle);
  }

  // Botones de selector de rol
  const roleButtons = document.querySelectorAll('.role-btn');
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      if (role) {
        window.saveUserRole(role);
      }
    });
  });

  console.log('%c🎨 UI Events', 'color: #3B82F6; font-weight: bold', 'Eventos de UI inicializados');
}

// Inicializar eventos cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUIEvents);
} else {
  initUIEvents();
}

// ========================================
// LOGGING
// ========================================
console.log('%c🏠 HouseZen UI', 'color: #2A9D8F; font-weight: bold; font-size: 14px');
console.log('%cComponentes UI compartidos cargados', 'color: #636E72');
