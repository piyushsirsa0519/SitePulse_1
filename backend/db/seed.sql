-- ============================================================================
-- Site Pulse — Seed Data SQL
-- Seeds the 3 prototype projects and their current trade states (as of 2026-10-01)
-- ============================================================================

-- NOTE ON DATA INTEGRITY & MOCK LIMITATION:
-- CURRENT MOCK STATE vs HISTORICAL DAILY UPDATE DATA:
-- The prototype dataset contains a SINGLE CURRENT SNAPSHOT of progress for each trade (as of 2026-10-01).
-- It does NOT contain a historical time series of daily updates prior to 2026-10-01.
-- Per Phase 6 guidelines, we insert the current state as a single snapshot update for date 2026-10-01
-- without fabricating non-existent past daily logs.

-- 1. Insert Default Organization
INSERT INTO organizations (id, name)
VALUES ('org-apex-retail', 'Apex Retail Fitouts')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Default Users (with deterministic Supabase Auth test UUIDs)
-- NOTE: In production, supabase_auth_id values correspond to real auth.users UUIDs in Supabase.
INSERT INTO users (id, supabase_auth_id, organization_id, email, full_name, role)
VALUES 
    ('usr-admin-01',    '11111111-1111-1111-1111-111111111111', 'org-apex-retail', 'executive@apexfitouts.com', 'Executive Fitout Manager', 'admin'),
    ('usr-engineer-01', '22222222-2222-2222-2222-222222222222', 'org-apex-retail', 'engineer@apexfitouts.com',  'Site Engineer',            'site_engineer'),
    ('usr-viewer-01',   '33333333-3333-3333-3333-333333333333', 'org-apex-retail', 'viewer@apexfitouts.com',    'Client Viewer',            'viewer')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Projects
INSERT INTO projects (id, organization_id, name, location, start_date, deadline, status)
VALUES 
    ('prj-biryani-blues', 'org-apex-retail', 'Biryani Blues - Gurugram', 'Gurugram', '2026-09-01', '2026-10-25', 'active'),
    ('prj-chai-point',     'org-apex-retail', 'Cafe Chai Point - Delhi',     'Delhi',    '2026-09-05', '2026-10-30', 'active'),
    ('prj-ptal-homeware',  'org-apex-retail', 'P.TAL Homeware - Hyderabad', 'Hyderabad', '2026-09-10', '2026-11-15', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Trades for Biryani Blues (prj-biryani-blues)
INSERT INTO trades (id, project_id, name, planned_pct, default_workers_required)
VALUES
    ('trd-bb-civil',      'prj-biryani-blues', 'Civil',      90.00, 12),
    ('trd-bb-electrical', 'prj-biryani-blues', 'Electrical', 75.00, 8),
    ('trd-bb-lighting',   'prj-biryani-blues', 'Lighting',   60.00, 6),
    ('trd-bb-carpentry',  'prj-biryani-blues', 'Carpentry',  40.00, 10),
    ('trd-bb-painting',   'prj-biryani-blues', 'Painting',   20.00, 5)
ON CONFLICT (id) DO NOTHING;

-- Snapshot Daily Update for Biryani Blues (Date: 2026-10-01)
INSERT INTO daily_updates (id, trade_id, date, progress_pct, workers_present, workers_required, reason, created_by)
VALUES
    ('upd-bb-civil-01',      'trd-bb-civil',      '2026-10-01', 92.00, 12, 12, 'On Track', 'usr-admin-01'),
    ('upd-bb-electrical-01', 'trd-bb-electrical', '2026-10-01', 75.00, 8,  8,  'On Track', 'usr-admin-01'),
    ('upd-bb-lighting-01',   'trd-bb-lighting',   '2026-10-01', 65.00, 6,  6,  'On Track', 'usr-admin-01'),
    ('upd-bb-carpentry-01',  'trd-bb-carpentry',  '2026-10-01', 42.00, 10, 10, 'On Track', 'usr-admin-01'),
    ('upd-bb-painting-01',   'trd-bb-painting',   '2026-10-01', 22.00, 5,  5,  'On Track', 'usr-admin-01')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Trades for Cafe Chai Point (prj-chai-point)
INSERT INTO trades (id, project_id, name, planned_pct, default_workers_required)
VALUES
    ('trd-cp-civil',      'prj-chai-point', 'Civil',      95.00, 10),
    ('trd-cp-electrical', 'prj-chai-point', 'Electrical', 80.00, 9),
    ('trd-cp-lighting',   'prj-chai-point', 'Lighting',   50.00, 6),
    ('trd-cp-carpentry',  'prj-chai-point', 'Carpentry',  60.00, 8),
    ('trd-cp-painting',   'prj-chai-point', 'Painting',   15.00, 4)
ON CONFLICT (id) DO NOTHING;

-- Snapshot Daily Update for Cafe Chai Point (Date: 2026-10-01)
INSERT INTO daily_updates (id, trade_id, date, progress_pct, workers_present, workers_required, reason, created_by)
VALUES
    ('upd-cp-civil-01',      'trd-cp-civil',      '2026-10-01', 95.00, 10, 10, 'On Track',                 'usr-admin-01'),
    ('upd-cp-electrical-01', 'trd-cp-electrical', '2026-10-01', 52.00, 4,  9,  'Material Delay',           'usr-admin-01'),
    ('upd-cp-lighting-01',   'trd-cp-lighting',   '2026-10-01', 35.00, 3,  6,  'Waiting on Another Trade', 'usr-admin-01'),
    ('upd-cp-carpentry-01',  'trd-cp-carpentry',  '2026-10-01', 64.00, 8,  8,  'On Track',                 'usr-admin-01'),
    ('upd-cp-painting-01',   'trd-cp-painting',   '2026-10-01', 15.00, 4,  4,  'On Track',                 'usr-admin-01')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Trades for P.TAL Homeware (prj-ptal-homeware)
INSERT INTO trades (id, project_id, name, planned_pct, default_workers_required)
VALUES
    ('trd-pt-civil',      'prj-ptal-homeware', 'Civil',      70.00, 14),
    ('trd-pt-electrical', 'prj-ptal-homeware', 'Electrical', 45.00, 6),
    ('trd-pt-lighting',   'prj-ptal-homeware', 'Lighting',   25.00, 4),
    ('trd-pt-carpentry',  'prj-ptal-homeware', 'Carpentry',  55.00, 8),
    ('trd-pt-painting',   'prj-ptal-homeware', 'Painting',   10.00, 3)
ON CONFLICT (id) DO NOTHING;

-- Snapshot Daily Update for P.TAL Homeware (Date: 2026-10-01)
INSERT INTO daily_updates (id, trade_id, date, progress_pct, workers_present, workers_required, reason, created_by)
VALUES
    ('upd-pt-civil-01',      'trd-pt-civil',      '2026-10-01', 42.00, 5,  14, 'Labour Shortage',          'usr-admin-01'),
    ('upd-pt-electrical-01', 'trd-pt-electrical', '2026-10-01', 45.00, 6,  6,  'On Track',                 'usr-admin-01'),
    ('upd-pt-lighting-01',   'trd-pt-lighting',   '2026-10-01', 20.00, 2,  4,  'Waiting on Another Trade', 'usr-admin-01'),
    ('upd-pt-carpentry-01',  'trd-pt-carpentry',  '2026-10-01', 64.00, 9,  8,  'On Track',                 'usr-admin-01'),
    ('upd-pt-painting-01',   'trd-pt-painting',   '2026-10-01', 10.00, 3,  3,  'On Track',                 'usr-admin-01')
ON CONFLICT (id) DO NOTHING;
