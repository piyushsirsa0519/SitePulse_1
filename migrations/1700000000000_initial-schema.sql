-- Up Migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations Table
CREATE TABLE organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    supabase_auth_id UUID UNIQUE,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'project_manager',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_org_id ON users(organization_id);
CREATE INDEX idx_users_supabase_auth_id ON users(supabase_auth_id);

-- 3. Projects Table
CREATE TABLE projects (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    deadline DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_project_dates CHECK (deadline >= start_date)
);

CREATE INDEX idx_projects_org_id ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);

-- 4. Trades Table
CREATE TABLE trades (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    planned_start DATE,
    planned_end DATE,
    planned_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (planned_pct BETWEEN 0 AND 100),
    default_workers_required INTEGER NOT NULL DEFAULT 0 CHECK (default_workers_required >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_trade_name UNIQUE (project_id, name)
);

CREATE INDEX idx_trades_project_id ON trades(project_id);

-- 5. Daily Updates Table (Log of site progress & workforce per trade)
CREATE TABLE daily_updates (
    id VARCHAR(64) PRIMARY KEY,
    trade_id VARCHAR(64) NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    progress_pct NUMERIC(5,2) NOT NULL CHECK (progress_pct BETWEEN 0 AND 100),
    workers_present INTEGER NOT NULL CHECK (workers_present >= 0),
    workers_required INTEGER NOT NULL CHECK (workers_required >= 0),
    reason VARCHAR(255) NOT NULL DEFAULT 'On Track',
    notes TEXT,
    created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_trade_date UNIQUE (trade_id, date)
);

CREATE INDEX idx_daily_updates_trade_id ON daily_updates(trade_id);
CREATE INDEX idx_daily_updates_date ON daily_updates(date);

-- Down Migration
DROP TABLE IF EXISTS daily_updates CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
