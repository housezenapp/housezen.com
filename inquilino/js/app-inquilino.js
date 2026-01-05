/**
 * Inicialización de la aplicación de inquilino
 */

function initializeInquilinoApp() {
    console.log('🏠 Inicializando aplicación de Inquilino...');
    
    setupPriorityButtons();
    
    const incidentForm = document.getElementById('incidentForm');
    if (incidentForm) {
        incidentForm.onsubmit = handleSubmit;
    }

    // Configurar eventos de radio buttons para categoría "Otros"
    const otrosRadios = document.querySelectorAll('input[name="category"]');
    otrosRadios.forEach(radio => {
        radio.addEventListener('click', function() {
            handleRadioClick(this);
        });
    });

    const otrosSelect = document.getElementById('otros-select');
    if (otrosSelect) {
        otrosSelect.addEventListener('change', selectOtrosCategory);
    }

    // Cargar datos iniciales
    if (window.currentUser && window._supabase) {
        handleInquilinoSession({ user: window.currentUser });
    }

    // Verificar instalación PWA
    checkInstallation();

    console.log('✅ Aplicación de Inquilino inicializada');
}

// Exponer función globalmente
window.initializeInquilinoApp = initializeInquilinoApp;

// Si ya estamos cargados cuando se ejecuta este script, inicializar inmediatamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeInquilinoApp);
} else {
    // Si el DOM ya está listo, esperar un momento para que todo se cargue
    setTimeout(initializeInquilinoApp, 100);
}
