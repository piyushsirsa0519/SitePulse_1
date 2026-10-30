/**
 * Site Pulse — Supabase Auth Client Module
 * Manages Supabase browser authentication session, sign-in, and sign-out.
 * Production Safety: Dev mock fallback is strictly restricted to local development environments (localhost/127.0.0.1).
 */

const SitePulseAuth = (() => {
    let supabaseClient = null;
    let currentSession = null;

    // Helper to determine if frontend is running on local development host
    function isLocalhost() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '';
    }

    // Development mock token credentials mapping (local development only)
    const DEV_MOCK_TOKENS = {
        'executive@apexfitouts.com': 'mock-token-admin',
        'engineer@apexfitouts.com':  'mock-token-engineer',
        'viewer@apexfitouts.com':    'mock-token-viewer'
    };

    function init() {
        const config = window.SITE_PULSE_CONFIG || {};
        if (window.supabase && config.SUPABASE_URL && config.SUPABASE_URL !== 'https://your-project.supabase.co') {
            try {
                supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
            } catch (err) {
                console.warn('⚠️ Supabase client initialization warning:', err.message);
            }
        }

        // Restore mock test session ONLY in local development
        if (isLocalhost() && !supabaseClient) {
            const savedMockToken = localStorage.getItem('site_pulse_mock_token');
            if (savedMockToken) {
                currentSession = {
                    access_token: savedMockToken,
                    user: { email: localStorage.getItem('site_pulse_mock_email') || 'executive@apexfitouts.com' }
                };
            }
        }
    }

    async function signIn(email, password) {
        if (!email || !password) {
            throw new Error('Please enter both email and password.');
        }

        // 1. Production / Configured Flow: Real Supabase Auth
        if (supabaseClient) {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) {
                throw new Error(error.message);
            }
            currentSession = data.session;
            return currentSession;
        }

        // 2. Local Development Fallback (STRICTLY restricted to localhost / 127.0.0.1)
        if (isLocalhost()) {
            const mockToken = DEV_MOCK_TOKENS[email.trim().toLowerCase()];
            if (mockToken) {
                currentSession = {
                    access_token: mockToken,
                    user: { email: email.trim() }
                };
                localStorage.setItem('site_pulse_mock_token', mockToken);
                localStorage.setItem('site_pulse_mock_email', email.trim());
                return currentSession;
            }
            throw new Error('Invalid email or password. (For local dev mode, try: executive@apexfitouts.com / password)');
        }

        // 3. In non-local / production environment without Supabase config, fail safely
        throw new Error('Authentication service is unconfigured for this environment.');
    }

    async function signOut() {
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }
        currentSession = null;
        localStorage.removeItem('site_pulse_mock_token');
        localStorage.removeItem('site_pulse_mock_email');
    }

    function getAccessToken() {
        return currentSession ? currentSession.access_token : null;
    }

    function getSession() {
        return currentSession;
    }

    return {
        init,
        signIn,
        signOut,
        getAccessToken,
        getSession
    };
})();

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
    SitePulseAuth.init();
});
