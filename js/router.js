/**
 * Router para cargar las aplicaciones según el rol del usuario
 */

const router = {
    currentApp: null,
    currentRole: null,

    async loadApp(role) {
        this.currentRole = role;
        
        // Limpiar contenido anterior
        const container = document.getElementById('app-container');
        if (!container) return;

        // Determinar la ruta según el rol
        const appPath = role === 'inquilino' ? 'inquilino/index.html' : 'propietario/index.html';

        try {
            // Cargar el HTML de la aplicación correspondiente
            const response = await fetch(appPath);
            if (!response.ok) {
                throw new Error(`No se pudo cargar la aplicación: ${response.statusText}`);
            }

            let html = await response.text();
            
            // Corregir rutas relativas de CSS y otros recursos según el rol
            const basePath = role === 'inquilino' ? 'inquilino/' : 'propietario/';
            
            // Reemplazar referencias a styles.css y otros recursos
            html = html.replace(/href="styles\.css"/g, `href="${basePath}styles.css"`);
            html = html.replace(/href="js\//g, `href="${basePath}js/`);
            html = html.replace(/src="js\//g, `src="${basePath}js/`);
            
            // Crear un contenedor temporal para parsear el HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Extraer y cargar los estilos CSS del head
            const headContent = tempDiv.querySelector('head');
            if (headContent) {
                const links = headContent.querySelectorAll('link[rel="stylesheet"]');
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href) {
                        // Corregir la ruta si es necesaria
                        const correctedHref = href.startsWith('http') ? href : 
                                             href.startsWith('/') ? href : 
                                             `${basePath}${href}`;
                        
                        // Verificar si ya está cargado usando el href corregido
                        if (!document.querySelector(`link[href="${correctedHref}"]`)) {
                            const newLink = document.createElement('link');
                            newLink.rel = 'stylesheet';
                            newLink.href = correctedHref;
                            document.head.appendChild(newLink);
                            console.log(`✅ CSS cargado: ${correctedHref}`);
                        }
                    }
                });
            }

            // Extraer el contenido del body
            const bodyContent = tempDiv.querySelector('body');
            if (bodyContent) {
                container.innerHTML = bodyContent.innerHTML;
            } else {
                container.innerHTML = html;
            }

            // Cargar los scripts de la aplicación (sin config.js porque ya está en el raíz)
            await this.loadAppScripts(role);

            // Inicializar la aplicación después de cargar los scripts
            setTimeout(() => {
                if (role === 'inquilino' && typeof window.initializeInquilinoApp === 'function') {
                    window.initializeInquilinoApp();
                } else if (role === 'casero' && typeof window.initializeCaseroApp === 'function') {
                    window.initializeCaseroApp();
                }
            }, 100);

            this.currentApp = role;
            console.log(`✅ Aplicación ${role} cargada correctamente`);

        } catch (error) {
            console.error('Error cargando aplicación:', error);
            container.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h2>Error al cargar la aplicación</h2>
                    <p>${error.message}</p>
                    <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #2A9D8F; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Recargar
                    </button>
                </div>
            `;
        }
    },

    async loadAppScripts(role) {
        // config.js ya está cargado en el index.html principal, no necesitamos cargarlo de nuevo

        // Cargar scripts según el rol (sin config.js porque usamos el del raíz)
        const scriptsToLoad = role === 'inquilino' 
            ? [
                'inquilino/js/ui.js',
                'inquilino/js/profile.js',
                'inquilino/js/incidents.js',
                'inquilino/js/auth-inquilino.js',
                'inquilino/js/app-inquilino.js'
            ]
            : [
                'propietario/js/properties.js',
                'propietario/js/incidents.js',
                'propietario/js/profile.js',
                'propietario/js/ui.js',
                'propietario/js/diagnostic.js',
                'propietario/js/auth-casero.js',
                'propietario/js/app-casero.js'
            ];

        // Cargar scripts secuencialmente
        for (const scriptPath of scriptsToLoad) {
            try {
                await this.loadScript(scriptPath);
            } catch (error) {
                console.error(`Error cargando script ${scriptPath}:`, error);
            }
        }
    },

    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar si el script ya está cargado
            const existingScript = document.querySelector(`script[data-src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.setAttribute('data-src', src);
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
};

window.router = router;
