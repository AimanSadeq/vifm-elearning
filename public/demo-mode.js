// VIFM eLearning - Demo Mode Engine
// Intercepts ALL Supabase + API calls. Zero real DB access.
(function() {
    'use strict';

    // ── 1. Detect Demo Mode ────────────────────────────────────
    var urlParams = new URLSearchParams(window.location.search);
    var isDemoFromUrl = urlParams.get('demo') === 'true';
    var demoRole = urlParams.get('role') || sessionStorage.getItem('elearn-demo-role') || 'learner';
    var isExited = urlParams.get('exited') === 'true';
    var isRootOrLogin = window.location.pathname === '/' || window.location.pathname.indexOf('/login') !== -1;

    if (isDemoFromUrl) {
        sessionStorage.setItem('elearn-demo', 'true');
        sessionStorage.setItem('elearn-demo-role', demoRole);
    }
    if (isExited) { sessionStorage.removeItem('elearn-demo'); sessionStorage.removeItem('elearn-demo-role'); return; }
    if (isRootOrLogin && !isDemoFromUrl) { sessionStorage.removeItem('elearn-demo'); sessionStorage.removeItem('elearn-demo-role'); }

    var isDemo = sessionStorage.getItem('elearn-demo') === 'true';
    if (!isDemo) {
        injectTryDemoButton();
        return;
    }

    demoRole = sessionStorage.getItem('elearn-demo-role') || 'learner';
    window.ELEARN_DEMO = true;
    window.ELEARN_DEMO_ROLE = demoRole;

    // ── 2. Ensure ?demo=true in URL ───────────────────────────
    if (!isDemoFromUrl) {
        try {
            var newUrl = new URL(window.location.href);
            newUrl.searchParams.set('demo', 'true');
            history.replaceState(null, '', newUrl.toString());
        } catch(e) {}
    }

    // SPA navigation
    var origPushState = history.pushState.bind(history);
    history.pushState = function(s, t, url) {
        if (url && typeof url === 'string' && url.indexOf('demo=true') === -1) {
            try { var u = new URL(url, window.location.origin); u.searchParams.set('demo', 'true'); url = u.pathname + u.search + u.hash; } catch(e) {}
        }
        return origPushState(s, t, url);
    };

    // ── 3. Demo Data Store ────────────────────────────────────
    var STORE_KEY = 'elearn_demo_store';
    var seed = window.ELEARN_DEMO_DATA || {};

    function getStore() {
        var stored = localStorage.getItem(STORE_KEY);
        if (stored) { try { return JSON.parse(stored); } catch(e) {} }
        var store = {
            courses: seed.courses ? JSON.parse(JSON.stringify(seed.courses)) : [],
            enrollments: seed.enrollments ? JSON.parse(JSON.stringify(seed.enrollments)) : [],
            certificates: seed.certificates ? JSON.parse(JSON.stringify(seed.certificates)) : [],
            notifications: seed.notifications ? JSON.parse(JSON.stringify(seed.notifications)) : []
        };
        localStorage.setItem(STORE_KEY, JSON.stringify(store));
        return store;
    }
    function saveStore(s) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

    function getUser() {
        return demoRole === 'super_admin' ? seed.adminUser : seed.currentUser;
    }

    // ── 4. Intercept fetch() ──────────────────────────────────
    var originalFetch = window.fetch;
    window.fetch = function(url, options) {
        var urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        if (urlStr.indexOf('supabase.co/rest/v1/') !== -1) return handleRest(urlStr, options);
        if (urlStr.indexOf('supabase.co/auth/v1/') !== -1) return handleAuth(urlStr, options);
        if (urlStr.indexOf('supabase.co/realtime/') !== -1) return ok({});
        if (urlStr.indexOf('supabase.co/storage/') !== -1) return ok({ signedUrl: '#', publicUrl: '#' });
        if (urlStr.indexOf('/api/') !== -1) return handleApi(urlStr, options);
        return originalFetch.apply(this, arguments);
    };

    function ok(data, contentType) {
        return Promise.resolve(new Response(JSON.stringify(data), {
            status: 200, headers: { 'Content-Type': contentType || 'application/json', 'content-range': '0-50/50' }
        }));
    }

    // ── Auth Handler ──────────────────────────────────────────
    function handleAuth(url) {
        var user = getUser();
        var session = {
            access_token: 'demo-token', refresh_token: 'demo-refresh',
            token_type: 'bearer', expires_in: 86400,
            expires_at: Math.floor(Date.now() / 1000) + 86400,
            user: { id: user.id, email: user.email, role: 'authenticated', user_metadata: { full_name: user.full_name }, app_metadata: { role: user.role }, aud: 'authenticated', created_at: user.created_at }
        };
        return ok(session);
    }

    // ── REST Handler ──────────────────────────────────────────
    function handleRest(url, options) {
        var method = (options && options.method) ? options.method.toUpperCase() : 'GET';
        var store = getStore();
        var user = getUser();
        var body = null;
        if (options && options.body) { try { body = JSON.parse(options.body); } catch(e) {} }
        var tableMatch = url.match(/\/rest\/v1\/([a-z_]+)/);
        var table = tableMatch ? tableMatch[1] : '';
        var acceptHeader = options && options.headers && (typeof options.headers.get === 'function' ? options.headers.get('Accept') : options.headers['Accept'] || options.headers['accept']);
        var isSingle = acceptHeader && acceptHeader.indexOf('vnd.pgrst.object') !== -1;

        function respond(data) {
            if (isSingle && Array.isArray(data)) {
                var single = data[0] || null;
                return Promise.resolve(new Response(JSON.stringify(single), {
                    status: single ? 200 : 406,
                    headers: { 'Content-Type': 'application/vnd.pgrst.object+json' }
                }));
            }
            return ok(data);
        }

        if (table === 'profiles') {
            if (url.indexOf('id=eq.' + user.id) !== -1) return respond([user]);
            return respond(seed.profiles || [user]);
        }
        if (table === 'courses') {
            if (method === 'POST') { var c = Object.assign({ id: 'demo-c-' + Date.now() }, body); store.courses.push(c); saveStore(store); return respond([c]); }
            return respond(store.courses);
        }
        if (table === 'categories') return respond(seed.categories || []);
        if (table === 'enrollments') {
            if (method === 'POST') { var e = Object.assign({ id: 'demo-e-' + Date.now(), user_id: user.id }, body); store.enrollments.push(e); saveStore(store); return respond([e]); }
            var enrs = store.enrollments.filter(function(e) { return e.user_id === user.id; });
            return respond(enrs);
        }
        if (table === 'modules' || table === 'lessons') return respond([]);
        if (table === 'lesson_progress') {
            if (method === 'POST' || method === 'PATCH') return respond([body || {}]);
            return respond([]);
        }
        if (table === 'certificates') return respond(store.certificates);
        if (table === 'notifications') {
            if (method === 'PATCH') return respond([]);
            return respond(store.notifications);
        }
        if (table === 'quiz_attempts' || table === 'quizzes' || table === 'quiz_questions') return respond([]);
        if (table === 'forum_posts') {
            if (method === 'POST') return respond([Object.assign({ id: 'demo-fp-' + Date.now() }, body)]);
            return respond([]);
        }
        if (table === 'webinars' || table === 'webinar_registrations') return respond([]);
        if (table === 'payments') return respond([]);
        if (table === 'subscriptions' || table === 'subscription_plan_configs') return respond([]);
        if (table === 'vouchers' || table === 'promo_codes') return respond([]);
        if (table === 'learning_paths' || table === 'learning_path_enrollments') return respond([]);
        if (table === 'designations' || table === 'designation_tiers' || table === 'cpe_categories') return respond([]);
        if (table === 'lesson_bookmarks' || table === 'watch_statistics') return respond([]);
        return respond([]);
    }

    // ── API Handler ───────────────────────────────────────────
    function handleApi(url, options) {
        var method = (options && options.method) ? options.method.toUpperCase() : 'GET';
        var user = getUser();
        var store = getStore();

        if (url.match(/\/api\/auth\/callback/)) return ok({ success: true });
        if (url.match(/\/api\/auth\/ensure-profile/)) return ok({ success: true, profile: user });
        if (url.match(/\/api\/video\/progress/)) {
            if (method === 'POST') return ok({ success: true });
            return ok({ progress_seconds: 0, total_watch_time_seconds: 0, watched_segments: [], is_completed: false });
        }
        if (url.match(/\/api\/video\/signed-url/)) return ok({ signedUrl: '#demo-video' });
        if (url.match(/\/api\/lessons.*complete/)) return ok({ success: true });
        if (url.match(/\/api\/quizzes/)) return ok({ success: true, data: [] });
        if (url.match(/\/api\/forums/)) return ok({ success: true, data: [] });
        if (url.match(/\/api\/payments/)) return ok({ success: true });
        if (url.match(/\/api\/webhooks/)) return ok({ received: true });
        if (url.match(/\/api\/vouchers/)) return ok({ success: true, valid: false });
        if (url.match(/\/api\/admin/)) return ok({ success: true, data: [] });
        if (url.match(/\/api\/notifications/)) return ok({ success: true, data: store.notifications });
        return ok({ success: true, data: [] });
    }

    // ── 5. Demo Banner ────────────────────────────────────────
    function injectBanner() {
        if (document.getElementById('elearn-demo-banner')) return;
        var roleLabel = demoRole === 'super_admin' ? 'Admin View' : 'Learner View';
        var banner = document.createElement('div');
        banner.id = 'elearn-demo-banner';
        banner.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;">' +
            '<span>&#127891;</span>' +
            '<span><strong>DEMO MODE</strong> — All changes saved locally only</span>' +
            '<span style="background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">' + roleLabel + '</span>' +
            '<button id="elearn-demo-exit-btn" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:white;padding:3px 10px;border-radius:4px;font-size:11px;cursor:pointer;font-weight:600;">Exit Demo</button>' +
            '</div>';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;text-align:center;padding:8px 16px;font-size:13px;font-family:system-ui,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,0.3);';
        if (document.body) {
            document.body.insertBefore(banner, document.body.firstChild);
            document.body.style.paddingTop = banner.offsetHeight + 'px';
        }
        var exitBtn = document.getElementById('elearn-demo-exit-btn');
        if (exitBtn) exitBtn.addEventListener('click', function(e) { e.preventDefault(); doExit(); });
    }

    function doExit() {
        sessionStorage.removeItem('elearn-demo');
        sessionStorage.removeItem('elearn-demo-role');
        localStorage.removeItem(STORE_KEY);
        window.location.href = '/en/login?exited=true';
    }
    window.ELEARN_exitDemo = doExit;

    // ── 6. Init ───────────────────────────────────────────────
    function init() {
        injectBanner();
        var check = setInterval(function() {
            if (document.body && !document.getElementById('elearn-demo-banner')) injectBanner();
        }, 500);
        setTimeout(function() { clearInterval(check); }, 15000);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else if (document.body) init();
    else document.addEventListener('DOMContentLoaded', init);

    // ── Try Demo Button ───────────────────────────────────────
    function injectTryDemoButton() {
        function addButton() {
            if (document.getElementById('elearn-demo-entry')) return;
            var btn = document.createElement('div');
            btn.id = 'elearn-demo-entry';
            btn.innerHTML = '<button id="elearn-try-demo-btn" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;border:none;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 4px 15px rgba(37,99,235,0.4);transition:all 0.2s;">' +
                '<span>&#127891;</span><span>Try Demo</span><span style="background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:4px;font-size:10px;">No Login</span></button>';
            btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;';
            document.body.appendChild(btn);

            document.getElementById('elearn-try-demo-btn').addEventListener('click', function() {
                sessionStorage.setItem('elearn-demo', 'true');
                sessionStorage.setItem('elearn-demo-role', 'learner');
                window.location.href = '/en/courses?demo=true';
            });
        }

        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(addButton, 500); });
        else setTimeout(addButton, 500);
        var check = setInterval(function() { if (document.body && !document.getElementById('elearn-demo-entry')) addButton(); }, 1000);
        setTimeout(function() { clearInterval(check); }, 15000);
    }

})();
