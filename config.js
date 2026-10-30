/**
 * Site Pulse — Frontend Environment & API Configuration
 */

window.SITE_PULSE_CONFIG = {
    // API Base URL (Points to Express backend)
    API_BASE_URL: (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') || window.location.protocol === 'file:' || !window.location.hostname)
        ? 'http://localhost:3000'
        : '',

    // Supabase Public Configuration (Anon Key only — NEVER include Service Role Key)
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-supabase-anon-key'
};
