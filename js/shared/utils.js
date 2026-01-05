/**
 * HOUSEZEN - UTILIDADES COMPARTIDAS
 * Funciones auxiliares reutilizables
 */

// ========================================
// GENERACIÓN DE IDs ÚNICOS
// ========================================
window.generateId = function() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ========================================
// VALIDACIÓN DE EMAIL
// ========================================
window.isValidEmail = function(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ========================================
// VALIDACIÓN DE TELÉFONO
// ========================================
window.isValidPhone = function(phone) {
  // Acepta formatos: +34123456789, 123456789, 123 456 789
  const phoneRegex = /^(\+?\d{1,3})?[\s-]?\d{9,}$/;
  return phoneRegex.test(phone);
};

// ========================================
// FORMATEO DE TEXTO
// ========================================
window.capitalize = function(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

window.truncate = function(str, maxLength = 50) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

// ========================================
// FORMATEO DE NÚMEROS
// ========================================
window.formatNumber = function(num) {
  if (typeof num !== 'number') return num;
  return new Intl.NumberFormat('es-ES').format(num);
};

window.formatCurrency = function(amount) {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

// ========================================
// DEBOUNCE
// ========================================
window.debounce = function(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ========================================
// SLEEP / DELAY
// ========================================
window.sleep = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// ========================================
// SANITIZACIÓN DE STRINGS
// ========================================
window.sanitizeHTML = function(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
};

// ========================================
// OBTENER PARÁMETROS DE URL
// ========================================
window.getUrlParams = function() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

window.getUrlParam = function(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
};

// ========================================
// STORAGE HELPERS
// ========================================
window.setLocalStorage = function(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error guardando en localStorage:', error);
    return false;
  }
};

window.getLocalStorage = function(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error leyendo de localStorage:', error);
    return null;
  }
};

window.removeLocalStorage = function(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error eliminando de localStorage:', error);
    return false;
  }
};

// ========================================
// DETECTAR DISPOSITIVO MÓVIL
// ========================================
window.isMobile = function() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// ========================================
// DOWNLOAD DE ARCHIVOS
// ========================================
window.downloadFile = function(content, filename, contentType = 'text/plain') {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

// ========================================
// FORMATO DE CATEGORÍAS
// ========================================
window.getCategoryIcon = function(category) {
  const icons = {
    'fontaneria': '🚰',
    'electricidad': '⚡',
    'electrodomesticos': '🔌',
    'cerrajeria': '🔑',
    'otros': '🔧'
  };
  return icons[category?.toLowerCase()] || '🔧';
};

window.getCategoryLabel = function(category) {
  const labels = {
    'fontaneria': 'Fontanería',
    'electricidad': 'Electricidad',
    'electrodomesticos': 'Electrodomésticos',
    'cerrajeria': 'Cerrajería',
    'otros': 'Otros'
  };
  return labels[category?.toLowerCase()] || category;
};

// ========================================
// ESTADOS DE INCIDENCIAS
// ========================================
window.getStatusLabel = function(status) {
  const labels = {
    'pendiente': 'Pendiente',
    'en_proceso': 'En Proceso',
    'resuelta': 'Resuelta',
    'rechazada': 'Rechazada'
  };
  return labels[status] || status;
};

window.getUrgencyLabel = function(urgency) {
  const labels = {
    'baja': 'Baja',
    'media': 'Media',
    'alta': 'Alta'
  };
  return labels[urgency] || urgency;
};

// ========================================
// LOGGING
// ========================================
console.log('%c🏠 HouseZen Utils', 'color: #2A9D8F; font-weight: bold; font-size: 14px');
console.log('%cUtilidades compartidas cargadas', 'color: #636E72');
