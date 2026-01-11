/**
 * Inicialización de la aplicación de inquilino
 */

function initializeInquilinoApp() {
    console.log('🏠 Inicializando aplicación de Inquilino...');
    
    // Asegurar que no haya login-page visible cuando se carga desde el sistema unificado
    const loginPage = document.getElementById('login-page');
    const appContent = document.getElementById('app-content');
    if (loginPage && appContent && window.currentUser) {
        loginPage.style.display = 'none';
        if (appContent.style.display === 'none') {
            appContent.style.display = 'block';
        }
    }
    
    setupPriorityButtons();
    
    const incidentForm = document.getElementById('incidentForm');
    if (incidentForm) {
        incidentForm.onsubmit = handleSubmit;
    }

    // Configurar eventos de radio buttons y labels para categoría
    const categoryOptions = document.querySelectorAll('.cat-option');
    categoryOptions.forEach(option => {
        const radio = option.querySelector('input[name="category"]');
        if (radio) {
            // Agregar listener al label para capturar el click
            option.addEventListener('click', function(e) {
                // Guardar el estado ANTES de que el evento nativo del label marque el radio
                const wasChecked = radio.checked;
                
                // Permitir que el evento nativo ocurra primero
                setTimeout(() => {
                    // Si el radio ya estaba marcado antes del click, desmarcarlo
                    if (wasChecked && radio.checked) {
                        radio.checked = false;
                        lastRadioChecked = null;
                        
                        // Limpiar todos los radios del grupo para asegurar que ninguno esté marcado
                        const allRadios = document.querySelectorAll('input[name="category"]');
                        allRadios.forEach(r => r.checked = false);
                        
                        // Si es "Otros", ocultar dropdown y limpiar
                        const dropdown = document.getElementById('otros-dropdown');
                        const selectedDisplay = document.getElementById('otros-selected');
                        const otrosSelect = document.getElementById('otros-select');
                        if (dropdown) dropdown.style.display = 'none';
                        if (selectedDisplay) selectedDisplay.style.display = 'none';
                        if (otrosSelect) otrosSelect.selectedIndex = 0;
                        if (radio.id === 'otros-radio') {
                            radio.value = 'Otros';
                        }
                    } else if (radio.checked && !wasChecked) {
                        // Si se marcó (no estaba marcado antes), procesar normalmente
                        handleRadioClick(radio);
                    }
                }, 0);
            });
            
            // También agregar listener al radio directamente para manejar cambios
            radio.addEventListener('change', function() {
                if (this.checked) {
                    handleRadioClick(this);
                }
            });
        }
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
