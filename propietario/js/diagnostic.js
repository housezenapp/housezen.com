/**
 * DIAGNÓSTICO COMPLETO - Para identificar el problema exacto
 */

window.runDiagnostic = async function() {
    console.log("═══════════════════════════════════════════════════");
    console.log("🔍 DIAGNÓSTICO COMPLETO");
    console.log("═══════════════════════════════════════════════════");
    
    const results = {
        timestamp: new Date().toISOString(),
        checks: {}
    };
    
    // 1. Verificar Supabase está inicializado
    console.log("\n1️⃣ Verificando Supabase...");
    results.checks.supabase = {
        exists: typeof window._supabase !== 'undefined',
        isObject: typeof window._supabase === 'object' && window._supabase !== null,
        hasAuth: typeof window._supabase?.auth !== 'undefined',
        hasFrom: typeof window._supabase?.from === 'function'
    };
    console.log("   ✅ Supabase existe:", results.checks.supabase.exists);
    console.log("   ✅ Supabase es objeto:", results.checks.supabase.isObject);
    console.log("   ✅ Tiene auth:", results.checks.supabase.hasAuth);
    console.log("   ✅ Tiene from:", results.checks.supabase.hasFrom);
    
    // 2. Verificar sesión
    console.log("\n2️⃣ Verificando sesión...");
    try {
        const { data: { session }, error } = await window._supabase.auth.getSession();
        results.checks.session = {
            exists: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id || null,
            email: session?.user?.email || null,
            expiresAt: session?.expires_at || null,
            expiresIn: session?.expires_at ? Math.floor((session.expires_at * 1000 - Date.now()) / 1000) : null,
            error: error ? error.message : null
        };
        console.log("   ✅ Sesión existe:", results.checks.session.exists);
        console.log("   ✅ Tiene usuario:", results.checks.session.hasUser);
        console.log("   ✅ User ID:", results.checks.session.userId);
        console.log("   ✅ Email:", results.checks.session.email);
        console.log("   ✅ Expira en (seg):", results.checks.session.expiresIn);
        if (error) console.log("   ❌ Error:", results.checks.session.error);
    } catch (e) {
        results.checks.session = { error: e.message };
        console.log("   ❌ Error al obtener sesión:", e.message);
    }
    
    // 3. Verificar currentUser global
    console.log("\n3️⃣ Verificando currentUser global...");
    results.checks.currentUser = {
        exists: typeof window.currentUser !== 'undefined',
        isObject: typeof window.currentUser === 'object' && window.currentUser !== null,
        id: window.currentUser?.id || null,
        matchesSession: window.currentUser?.id === results.checks.session?.userId
    };
    console.log("   ✅ currentUser existe:", results.checks.currentUser.exists);
    console.log("   ✅ currentUser es objeto:", results.checks.currentUser.isObject);
    console.log("   ✅ currentUser.id:", results.checks.currentUser.id);
    console.log("   ✅ Coincide con sesión:", results.checks.currentUser.matchesSession);
    
    // 4. Test de consulta simple a perfiles
    console.log("\n4️⃣ Test: Consultando tabla 'perfiles'...");
    try {
        const startTime = Date.now();
        const { data, error, status, statusText } = await window._supabase
            .from('perfiles')
            .select('id')
            .eq('id', results.checks.session?.userId || 'test')
            .limit(1);
        const duration = Date.now() - startTime;
        
        results.checks.testPerfiles = {
            success: !error,
            duration: duration + 'ms',
            status: status,
            statusText: statusText,
            dataLength: data?.length || 0,
            error: error ? {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            } : null
        };
        console.log("   ✅ Consulta completada:", !error ? "ÉXITO" : "FALLO");
        console.log("   ✅ Duración:", results.checks.testPerfiles.duration);
        console.log("   ✅ Status:", status, statusText);
        if (error) {
            console.log("   ❌ Error:", error.message);
            console.log("   ❌ Código:", error.code);
            console.log("   ❌ Detalles:", error.details);
        }
    } catch (e) {
        results.checks.testPerfiles = { error: e.message };
        console.log("   ❌ Excepción:", e.message);
    }
    
    // 5. Test de consulta a perfil_propiedades (la que falla)
    console.log("\n5️⃣ Test: Consultando tabla 'perfil_propiedades' (CASERO)...");
    try {
        const startTime = Date.now();
        const { data, error, status, statusText } = await window._supabase
            .from('perfil_propiedades')
            .select('id_perfil_inquilino')
            .eq('id_perfil_casero', results.checks.session?.userId || 'test');
        const duration = Date.now() - startTime;
        
        results.checks.testPerfilPropiedades = {
            success: !error,
            duration: duration + 'ms',
            status: status,
            statusText: statusText,
            dataLength: data?.length || 0,
            error: error ? {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            } : null
        };
        console.log("   ✅ Consulta completada:", !error ? "ÉXITO" : "FALLO");
        console.log("   ✅ Duración:", results.checks.testPerfilPropiedades.duration);
        console.log("   ✅ Status:", status, statusText);
        console.log("   ✅ Resultados:", data?.length || 0);
        if (error) {
            console.log("   ❌ Error:", error.message);
            console.log("   ❌ Código:", error.code);
            console.log("   ❌ Detalles:", error.details);
        }
    } catch (e) {
        results.checks.testPerfilPropiedades = { error: e.message };
        console.log("   ❌ Excepción:", e.message);
    }
    
    // 6. Test de consulta a propiedades
    console.log("\n6️⃣ Test: Consultando tabla 'propiedades'...");
    try {
        const startTime = Date.now();
        const { data, error, status, statusText } = await window._supabase
            .from('propiedades')
            .select('id')
            .eq('perfil_id', results.checks.session?.userId || 'test');
        const duration = Date.now() - startTime;
        
        results.checks.testPropiedades = {
            success: !error,
            duration: duration + 'ms',
            status: status,
            statusText: statusText,
            dataLength: data?.length || 0,
            error: error ? {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            } : null
        };
        console.log("   ✅ Consulta completada:", !error ? "ÉXITO" : "FALLO");
        console.log("   ✅ Duración:", results.checks.testPropiedades.duration);
        console.log("   ✅ Status:", status, statusText);
        if (error) {
            console.log("   ❌ Error:", error.message);
            console.log("   ❌ Código:", error.code);
        }
    } catch (e) {
        results.checks.testPropiedades = { error: e.message };
        console.log("   ❌ Excepción:", e.message);
    }
    
    // 7. Verificar estado de la UI
    console.log("\n7️⃣ Verificando estado de la UI...");
    const appContent = document.getElementById('app-content');
    const loginPage = document.getElementById('login-page');
    const loadingElements = document.querySelectorAll('.loading-state');
    
    results.checks.ui = {
        appContentVisible: appContent && !appContent.classList.contains('hidden'),
        loginPageVisible: loginPage && !loginPage.classList.contains('hidden'),
        loadingElementsCount: loadingElements.length,
        loadingTexts: Array.from(loadingElements).map(el => el.textContent?.trim()).filter(Boolean)
    };
    console.log("   ✅ app-content visible:", results.checks.ui.appContentVisible);
    console.log("   ✅ login-page visible:", results.checks.ui.loginPageVisible);
    console.log("   ✅ Elementos de carga:", results.checks.ui.loadingElementsCount);
    if (results.checks.ui.loadingTexts.length > 0) {
        console.log("   📝 Textos de carga:", results.checks.ui.loadingTexts);
    }
    
    console.log("\n═══════════════════════════════════════════════════");
    console.log("📊 RESUMEN DEL DIAGNÓSTICO:");
    console.log("═══════════════════════════════════════════════════");
    console.log(JSON.stringify(results, null, 2));
    console.log("═══════════════════════════════════════════════════");
    
    // Guardar resultados globalmente
    window.diagnosticResults = results;
    
    return results;
};
