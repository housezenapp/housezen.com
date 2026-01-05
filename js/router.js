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
            
            // Usar DOMParser para parsear el HTML completo (incluye head y body)
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extraer y cargar los estilos CSS del head ANTES de inyectar el body
            const headLinks = doc.head.querySelectorAll('link[rel="stylesheet"]');
            headLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (!href) return;
                
                let correctedHref = href;
                
                // Procesar solo rutas relativas (no URLs absolutas ni CDN)
                if (!href.startsWith('http') && !href.startsWith('//')) {
                    if (href.startsWith('/')) {
                        // Ruta absoluta desde la raíz - mantenerla
                        correctedHref = href;
                    } else {
                        // Ruta relativa - agregar el basePath
                        correctedHref = `${basePath}${href}`;
                    }
                    
                    console.log(`🔗 Procesando CSS: "${href}" -> "${correctedHref}"`);
                    
                    // Verificar si ya está cargado usando múltiples métodos
                    const existingByHref = document.querySelector(`link[href="${correctedHref}"]`);
                    const existingByData = document.querySelector(`link[data-app-css="${correctedHref}"]`);
                    
                    if (!existingByHref && !existingByData) {
                        const newLink = document.createElement('link');
                        newLink.rel = 'stylesheet';
                        newLink.href = correctedHref;
                        newLink.setAttribute('data-app-css', correctedHref);
                        newLink.onerror = () => {
                            console.error(`❌ Error cargando CSS: ${correctedHref}`);
                        };
                        newLink.onload = () => {
                            console.log(`✅ CSS cargado exitosamente: ${correctedHref}`);
                        };
                        document.head.appendChild(newLink);
                    } else {
                        console.log(`⏭️ CSS ya cargado: ${correctedHref}`);
                    }
                } else {
                    // URLs absolutas (CDN) - cargar directamente
                    const existingLink = document.querySelector(`link[href="${href}"]`);
                    if (!existingLink) {
                        const newLink = document.createElement('link');
                        newLink.rel = 'stylesheet';
                        newLink.href = href;
                        document.head.appendChild(newLink);
                    }
                }
            });

            // Extraer el contenido del body
            const bodyContent = doc.body;
            if (bodyContent) {
                let bodyHTML = bodyContent.innerHTML;
                
                // Corregir cualquier ruta relativa que quede en el HTML del body
                // (por si hay scripts inline o referencias en atributos)
                bodyHTML = bodyHTML.replace(/href=["']styles\.css["']/g, `href="${basePath}styles.css"`);
                bodyHTML = bodyHTML.replace(/src=["']js\//g, `src="${basePath}js/`);
                
                container.innerHTML = bodyHTML;
            } else {
                // Fallback: procesar el HTML manualmente
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

            // Si config.js ya está cargado globalmente, no cargarlo de nuevo
            if (src.includes('config.js') && window._supabase) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.setAttribute('data-src', src);
            script.onload = () => {
                console.log(`✅ Script cargado: ${src}`);
                resolve();
            };
            script.onerror = (error) => {
                console.error(`❌ Error cargando script: ${src}`, error);
                reject(error);
            };
            document.head.appendChild(script);
        });
    }
};

window.router = router;
