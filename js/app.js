/**
 * Punto de entrada principal de la aplicación unificada
 */

function initializeApp() {
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2A9D8F;');
    console.log('%c🏠 HOUSEZEN UNIFIED - Inicializando...', 'background: #2A9D8F; color: white; padding: 10px; border-radius: 4px; font-weight: bold; font-size: 16px;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2A9D8F;');

    // Inicializar autenticación
    setTimeout(() => {
        initializeAuth();
    }, 100);
}

// Función auxiliar para mostrar toast
function showToast(text) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    if (toast && toastText) {
        toastText.innerText = text;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

window.showToast = showToast;

window.onload = initializeApp;
