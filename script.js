/**
 * Site Pulse — Live Project Tracker
 * Retail Fitout Construction Management System
 * Frontend Core (Integrated with Express Backend API & Supabase Auth)
 */

// Application State Store (Single Source of Truth)
const SitePulseState = {
    theme: localStorage.getItem('site_pulse_theme') || 'dark',
    activeProjectId: 'prj-biryani-blues',
    user: null,
    organization: null,
    portfolio: [],
    currentDashboard: null,
    isLoading: false,
    error: null
};

// Initialize App on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initClock();
    setupEventListeners();
    checkAuthAndLoadApp();
    console.log('⚡ Site Pulse Application Initialized successfully.');
});

/**
 * Initialize Light / Dark Theme Mode
 */
function initTheme() {
    const currentTheme = SitePulseState.theme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
}

function toggleTheme() {
    const newTheme = SitePulseState.theme === 'dark' ? 'light' : 'dark';
    SitePulseState.theme = newTheme;
    localStorage.setItem('site_pulse_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;
    if (theme === 'dark') {
        themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        themeBtn.title = 'Switch to Light Theme';
    } else {
        themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        themeBtn.title = 'Switch to Dark Theme';
    }
}

/**
 * Live Navigation Header Clock
 */
function initClock() {
    const clockEl = document.getElementById('clock-time');
    if (!clockEl) return;

    function updateTime() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    
    updateTime();
    setInterval(updateTime, 1000);
}

/**
 * Setup Core Event Listeners
 */
function setupEventListeners() {
    // Theme toggle button
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Dropdown change listener
    const projectDropdown = document.getElementById('project-dropdown');
    if (projectDropdown) {
        projectDropdown.addEventListener('change', (e) => {
            selectProject(e.target.value);
        });
    }

    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Post Daily Update button
    const openUpdateBtn = document.getElementById('open-daily-update-btn');
    if (openUpdateBtn) {
        openUpdateBtn.addEventListener('click', openDailyUpdateModal);
    }

    // Modal Close Buttons
    const closeUpdateModalBtn = document.getElementById('close-update-modal-btn');
    if (closeUpdateModalBtn) {
        closeUpdateModalBtn.addEventListener('click', closeDailyUpdateModal);
    }

    const cancelUpdateBtn = document.getElementById('cancel-update-btn');
    if (cancelUpdateBtn) {
        cancelUpdateBtn.addEventListener('click', closeDailyUpdateModal);
    }

    // Modal Backdrop click to close
    const updateModal = document.getElementById('daily-update-modal');
    if (updateModal) {
        updateModal.addEventListener('click', (e) => {
            if (e.target === updateModal) {
                closeDailyUpdateModal();
            }
        });
    }

    // Submit All Updates button
    const submitAllBtn = document.getElementById('submit-all-updates-btn');
    if (submitAllBtn) {
        submitAllBtn.addEventListener('click', handleDailyUpdateSubmit);
    }

    // Listen for unauthorized 401 events
    document.addEventListener('sitepulse:unauthorized', () => {
        console.warn('⚠️ Session expired or unauthorized. Returning to login.');
        handleLogout();
    });
}

/**
 * Check Authentication Session & Load API Data
 */
async function checkAuthAndLoadApp() {
    const session = SitePulseAuth.getSession();
    const loginModal = document.getElementById('login-modal');
    const userBadge = document.getElementById('user-profile-badge');
    const logoutBtn = document.getElementById('logout-btn');

    if (!session) {
        if (loginModal) loginModal.style.display = 'flex';
        if (userBadge) userBadge.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        return;
    }

    try {
        SitePulseState.isLoading = true;

        // 1. Load User Profile & Organization (GET /me)
        const meData = await SitePulseAPI.getMe();
        SitePulseState.user = meData.user;
        SitePulseState.organization = meData.organization;

        // Render User Profile Badge & Daily Update Button Role Access
        if (userBadge) {
            document.getElementById('user-name-display').textContent = meData.user.name || meData.user.email;
            document.getElementById('user-role-display').textContent = meData.user.role;
            userBadge.style.display = 'flex';
        }
        if (logoutBtn) logoutBtn.style.display = 'flex';
        if (loginModal) loginModal.style.display = 'none';

        // Role-based visibility: admin, manager, site_engineer can post updates; viewer cannot
        const openUpdateBtn = document.getElementById('open-daily-update-btn');
        const canSubmitUpdate = ['admin', 'manager', 'site_engineer'].includes(meData.user.role);
        if (openUpdateBtn) {
            openUpdateBtn.style.display = canSubmitUpdate ? 'inline-flex' : 'none';
        }

        // 2. Load Portfolio Summary (GET /portfolio)
        const portfolioData = await SitePulseAPI.getPortfolio();
        SitePulseState.portfolio = portfolioData;

        // Default active project to first item if current is invalid
        if (portfolioData.length > 0 && !portfolioData.find(p => p.id === SitePulseState.activeProjectId)) {
            SitePulseState.activeProjectId = portfolioData[0].id;
        }

        renderProjectSelector();
        renderPortfolioView();

        // 3. Load Active Project Dashboard (GET /projects/:id/dashboard)
        await loadProjectDashboard(SitePulseState.activeProjectId);

    } catch (err) {
        console.error('❌ Failed to load application data:', err);
        if (err.statusCode === 401) {
            handleLogout();
        } else {
            showGlobalError(`Failed to connect to Site Pulse server: ${err.message}`);
        }
    } finally {
        SitePulseState.isLoading = false;
    }
}

/**
 * Handle Login Form Submission
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('login-submit-btn');
    const errorAlert = document.getElementById('login-error-alert');

    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
        if (errorAlert) errorAlert.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';
        }

        await SitePulseAuth.signIn(email, password);
        await checkAuthAndLoadApp();
    } catch (err) {
        if (errorAlert) {
            errorAlert.textContent = err.message || 'Login failed. Please check credentials.';
            errorAlert.style.display = 'block';
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Sign In</span> <i class="fa-solid fa-arrow-right"></i>';
        }
    }
}

/**
 * Handle Logout
 */
async function handleLogout() {
    await SitePulseAuth.signOut();
    SitePulseState.user = null;
    SitePulseState.organization = null;
    SitePulseState.portfolio = [];
    SitePulseState.currentDashboard = null;

    const loginModal = document.getElementById('login-modal');
    const userBadge = document.getElementById('user-profile-badge');
    const logoutBtn = document.getElementById('logout-btn');
    const openUpdateBtn = document.getElementById('open-daily-update-btn');

    if (loginModal) loginModal.style.display = 'flex';
    if (userBadge) userBadge.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (openUpdateBtn) openUpdateBtn.style.display = 'none';
}

/**
 * Load Active Project Dashboard from Backend API
 */
async function loadProjectDashboard(projectId) {
    try {
        renderDashboardLoadingState();
        const dashboardData = await SitePulseAPI.getProjectDashboard(projectId);
        SitePulseState.currentDashboard = dashboardData;
        SitePulseState.activeProjectId = projectId;

        renderProjectOverview();
        renderTradesTable();
        renderBottleneckAnalysis();
    } catch (err) {
        console.error(`❌ Failed to load dashboard for project ${projectId}:`, err);
        if (err.statusCode === 404) {
            showDashboardError('Project not found or does not belong to your organization.');
        } else {
            showDashboardError(`Unable to load project dashboard: ${err.message}`);
        }
    }
}

/**
 * Select Active Project and Update UI
 */
async function selectProject(projectId) {
    SitePulseState.activeProjectId = projectId;
    
    // Sync tab button active states
    document.querySelectorAll('.project-tab-btn').forEach(btn => {
        if (btn.getAttribute('data-project-id') === projectId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Sync dropdown
    const dropdownSelect = document.getElementById('project-dropdown');
    if (dropdownSelect) dropdownSelect.value = projectId;

    // Fetch and render project dashboard
    await loadProjectDashboard(projectId);
    renderPortfolioView();
}

/**
 * Render Project Selector (Tabs and Dropdown) using API Portfolio Data
 */
function renderProjectSelector() {
    const tabsContainer = document.getElementById('project-tabs');
    const dropdownSelect = document.getElementById('project-dropdown');

    if (!tabsContainer || !dropdownSelect) return;

    tabsContainer.innerHTML = '';
    dropdownSelect.innerHTML = '';

    const projects = SitePulseState.portfolio || [];

    projects.forEach(project => {
        const isActive = project.id === SitePulseState.activeProjectId;

        // Render Tab Button
        const tabBtn = document.createElement('button');
        tabBtn.className = `project-tab-btn ${isActive ? 'active' : ''}`;
        tabBtn.setAttribute('data-project-id', project.id);
        tabBtn.innerHTML = `
            <i class="fa-solid fa-store"></i>
            <span>${project.name}</span>
            <span class="tab-badge">${project.delayDays > 0 ? project.delayDays + 'd late' : 'On Track'}</span>
        `;
        tabBtn.addEventListener('click', () => selectProject(project.id));
        tabsContainer.appendChild(tabBtn);

        // Render Dropdown Option
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = `${project.name} (${project.city})`;
        option.selected = isActive;
        dropdownSelect.appendChild(option);
    });
}

/**
 * Render Executive Project Overview Card directly from Backend API Response
 */
function renderProjectOverview() {
    const container = document.getElementById('project-overview-container');
    if (!container) return;

    const db = SitePulseState.currentDashboard;
    if (!db || !db.project || !db.metrics) return;

    const project = db.project;
    const metrics = db.metrics;

    const formattedStart = new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedDeadline = new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    container.innerHTML = `
        <article class="overview-card">
            <!-- Overview Card Header -->
            <div class="overview-card-header">
                <div class="header-meta">
                    <div class="project-title-row">
                        <h2>${project.name}</h2>
                        <span class="city-badge">
                            <i class="fa-solid fa-location-dot"></i> ${project.location}
                        </span>
                    </div>
                    <div class="date-range-badge">
                        <i class="fa-regular fa-calendar-check"></i>
                        <span>Start: <strong>${formattedStart}</strong></span>
                        <span>•</span>
                        <span>Target Finish: <strong>${formattedDeadline}</strong></span>
                    </div>
                </div>

                <div class="header-status-badge ${metrics.statusClass}">
                    <i class="fa-solid ${metrics.healthStatus === 'On Track' ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i>
                    <span>${metrics.healthStatus}</span>
                </div>
            </div>

            <!-- Overview Card Body: Metric Blocks -->
            <div class="overview-card-body">
                <!-- Metric 1: Overall Completion -->
                <div class="metric-block">
                    <div class="metric-block-header">
                        <span class="metric-label">
                            <i class="fa-solid fa-chart-line"></i> Overall Progress
                        </span>
                        <div class="metric-icon-wrapper">
                            <i class="fa-solid fa-percent"></i>
                        </div>
                    </div>
                    <div class="metric-value-large">
                        ${metrics.overallActual}<span class="metric-unit">%</span>
                    </div>
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill ${metrics.overallActual >= metrics.overallPlanned ? 'accent-green' : 'accent-orange'}" style="width: ${metrics.overallActual}%"></div>
                    </div>
                    <div class="metric-subtext">
                        <span>Target: <strong>${metrics.overallPlanned}%</strong></span>
                        <span style="color: ${metrics.variance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
                            ${metrics.variance >= 0 ? '+' : ''}${metrics.variance}% variance
                        </span>
                    </div>
                </div>

                <!-- Metric 2: Timeline Schedule -->
                <div class="metric-block">
                    <div class="metric-block-header">
                        <span class="metric-label">
                            <i class="fa-solid fa-business-time"></i> Project Timeline
                        </span>
                        <div class="metric-icon-wrapper">
                            <i class="fa-solid fa-stopwatch"></i>
                        </div>
                    </div>
                    <div class="metric-value-large">
                        ${metrics.daysElapsed} <span class="metric-unit">/ ${metrics.totalProjectDays} days</span>
                    </div>
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill accent-blue" style="width: ${metrics.timeElapsedPct}%"></div>
                    </div>
                    <div class="metric-subtext">
                        <span>Schedule Elapsed: <strong>${metrics.timeElapsedPct}%</strong></span>
                        <span>${metrics.daysRemaining} days left</span>
                    </div>
                </div>

                <!-- Metric 3: Trade Status Breakdown -->
                <div class="metric-block">
                    <div class="metric-block-header">
                        <span class="metric-label">
                            <i class="fa-solid fa-list-check"></i> Active Trades
                        </span>
                        <div class="metric-icon-wrapper">
                            <i class="fa-solid fa-users-gear"></i>
                        </div>
                    </div>
                    <div class="metric-value-large">
                        ${metrics.totalTrades} <span class="metric-unit">Trades Total</span>
                    </div>
                    <div class="trade-summary-mini">
                        <div class="trade-mini-badge ok">
                            <i class="fa-solid fa-check"></i> ${metrics.onTrackTradesCount} On Track
                        </div>
                        <div class="trade-mini-badge ${metrics.delayedTradesCount > 0 ? 'issue' : 'ok'}">
                            <i class="fa-solid fa-triangle-exclamation"></i> ${metrics.delayedTradesCount} Delayed
                        </div>
                    </div>
                    <div class="metric-subtext">
                        <span>Execution Status</span>
                        <span>${metrics.delayedTradesCount === 0 ? 'All Trades Normal' : metrics.delayedTradesCount + ' Trade(s) flagged'}</span>
                    </div>
                </div>

                <!-- Metric 4: On-Site Workforce -->
                <div class="metric-block">
                    <div class="metric-block-header">
                        <span class="metric-label">
                            <i class="fa-solid fa-user-group"></i> Active Workforce
                        </span>
                        <div class="metric-icon-wrapper">
                            <i class="fa-solid fa-hard-hat"></i>
                        </div>
                    </div>
                    <div class="metric-value-large">
                        ${metrics.totalWorkersPresent} <span class="metric-unit">/ ${metrics.totalWorkersRequired} On Site</span>
                    </div>
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill ${metrics.totalWorkersPresent >= metrics.totalWorkersRequired ? 'accent-green' : 'accent-orange'}" style="width: ${Math.min(100, Math.round((metrics.totalWorkersPresent / metrics.totalWorkersRequired) * 100))}%"></div>
                    </div>
                    <div class="metric-subtext">
                        <span>Workforce Deficit: <strong>${metrics.totalWorkersRequired - metrics.totalWorkersPresent > 0 ? (metrics.totalWorkersRequired - metrics.totalWorkersPresent) + ' workers short' : 'Fully Staffed'}</strong></span>
                    </div>
                </div>
            </div>
        </article>
    `;
}

/**
 * Trade Category Icons Map
 */
const TradeIconsMap = {
    'Civil': 'fa-solid fa-person-digging',
    'Electrical': 'fa-solid fa-bolt',
    'Lighting': 'fa-solid fa-lightbulb',
    'Carpentry': 'fa-solid fa-hammer',
    'Painting': 'fa-solid fa-paint-roller'
};

/**
 * Render Trades Breakdown Table for Selected Project directly from API Response
 */
function renderTradesTable() {
    const container = document.getElementById('trades-breakdown-container');
    if (!container) return;

    const db = SitePulseState.currentDashboard;
    if (!db || !db.trades) return;

    const bottleneck = db.bottleneck;

    let bannerHtml = '';
    if (bottleneck) {
        bannerHtml = `
            <div class="bottleneck-banner alert">
                <div class="banner-content">
                    <span class="banner-icon"><i class="fa-solid fa-triangle-exclamation"></i></span>
                    <div>
                        <strong>⚠️ Bottleneck:</strong> <span class="banner-text-highlight">${bottleneck.tradeName}</span> is <strong>${bottleneck.gapPercentage}%</strong> behind schedule due to <strong>${bottleneck.reason}</strong>.
                    </div>
                </div>
                <span class="banner-action-tag">Action Required</span>
            </div>
        `;
    } else {
        bannerHtml = `
            <div class="bottleneck-banner success">
                <div class="banner-content">
                    <span class="banner-icon"><i class="fa-solid fa-circle-check"></i></span>
                    <div>
                        <strong>✅ All trades are on track.</strong> All active trade execution targets are currently being met.
                    </div>
                </div>
                <span class="banner-action-tag">Normal Operation</span>
            </div>
        `;
    }

    let rowsHtml = '';

    db.trades.forEach(trade => {
        const actualPct = trade.progress_pct ?? trade.actual ?? 0;
        const plannedPct = trade.planned_pct ?? trade.planned ?? 0;
        const gap = plannedPct - actualPct;

        let statusLabel = 'On Track';
        let statusClass = 'on-track';
        let statusIcon = 'fa-circle-check';
        let barColorClass = 'accent-green';

        if (actualPct < plannedPct) {
            if (gap <= 10) {
                statusLabel = 'Slightly Behind';
                statusClass = 'slightly-behind';
                statusIcon = 'fa-circle-exclamation';
                barColorClass = 'accent-orange';
            } else {
                statusLabel = 'Behind';
                statusClass = 'behind';
                statusIcon = 'fa-triangle-exclamation';
                barColorClass = 'accent-red';
            }
        }

        const iconClass = TradeIconsMap[trade.name] || 'fa-solid fa-screwdriver-wrench';
        const reason = trade.reason || 'On Track';
        const showReasonTag = (statusLabel !== 'On Track') && reason && reason !== 'On Track';

        const workersPresent = trade.workers_present ?? trade.workersPresent ?? 0;
        const workersRequired = trade.workers_required ?? trade.workersRequired ?? 0;
        const isWorkerShortage = workersPresent < workersRequired;

        let manpowerDisplay = '';
        if (workersRequired > 0) {
            const manpowerPct = Math.round((workersPresent / workersRequired) * 100);
            manpowerDisplay = `<strong>${workersPresent}</strong> / ${workersRequired} <span class="headcount-subtext">(${manpowerPct}%)</span>`;
        } else {
            manpowerDisplay = `<strong>${workersPresent}</strong> / 0 <span class="headcount-subtext">(N/A)</span>`;
        }

        rowsHtml += `
            <tr>
                <td>
                    <div class="trade-identity">
                        <div class="trade-icon-avatar">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="trade-title-text">
                            <span class="trade-name">${trade.name}</span>
                            <span class="trade-category">Execution Package</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="progress-comparison-container">
                        <div class="progress-stats-labels">
                            <span class="actual-pct-label">Actual: <strong>${actualPct}%</strong></span>
                            <span class="planned-pct-label">Plan: <strong>${plannedPct}%</strong></span>
                        </div>
                        <div class="dual-progress-track" title="Actual: ${actualPct}% | Plan Target: ${plannedPct}%">
                            <div class="dual-progress-actual ${barColorClass}" style="width: ${actualPct}%;"></div>
                            <div class="target-marker-line" style="left: ${plannedPct}%;" title="Planned Target: ${plannedPct}%"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="headcount-badge ${isWorkerShortage ? 'shortage' : ''}" title="${workersPresent} present out of ${workersRequired} required workers">
                        <i class="fa-solid fa-users"></i>
                        <span>${manpowerDisplay}</span>
                    </div>
                </td>
                <td>
                    <div class="status-cell-wrapper">
                        <span class="trade-status-pill ${statusClass}">
                            <i class="fa-solid ${statusIcon}"></i>
                            <span>${statusLabel}</span>
                        </span>
                        ${showReasonTag ? `
                            <span class="reason-tag ${statusLabel === 'Slightly Behind' ? 'warning' : ''}">
                                <i class="fa-solid fa-tag"></i> ${reason}
                            </span>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });

    container.innerHTML = `
        ${bannerHtml}
        <article class="trades-card">
            <div class="trades-card-header">
                <div class="trades-card-title">
                    <i class="fa-solid fa-list-check"></i>
                    <h3>Trade Breakdown & Execution Status</h3>
                </div>
                <div class="trades-legend">
                    <div class="legend-item">
                        <span class="legend-color-actual"></span>
                        <span>Actual Completed %</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-marker-target"></span>
                        <span>Planned Target Marker</span>
                    </div>
                </div>
            </div>

            <div class="table-responsive-wrapper">
                <table class="trades-table">
                    <thead>
                        <tr>
                            <th>Trade Package</th>
                            <th>Progress (Actual vs Target)</th>
                            <th>On-Site Workforce</th>
                            <th>Execution Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        </article>
    `;
}

/**
 * Render Bottleneck Schedule Forecast & Recommendation Section directly from API Response
 */
function renderBottleneckAnalysis() {
    const container = document.getElementById('bottleneck-analysis-container');
    if (!container) return;

    const db = SitePulseState.currentDashboard;
    if (!db || !db.forecast || !db.recommendation) return;

    const projection = db.forecast;
    const rec = db.recommendation;
    const bottleneck = db.bottleneck;

    if (!projection || !projection.hasBottleneck || !rec || !rec.hasBottleneck) {
        container.innerHTML = `
            <article class="bottleneck-analysis-card success">
                <div class="analysis-card-header">
                    <div class="analysis-card-title">
                        <i class="fa-solid fa-square-poll-vertical"></i>
                        <h3>Bottleneck Projection & Resource Recommendation</h3>
                    </div>
                </div>
                <div class="analysis-card-body">
                    <div class="analysis-box">
                        <div class="analysis-box-header">
                            <span>Linear Completion Pace</span>
                            <i class="fa-solid fa-gauge-high"></i>
                        </div>
                        <p class="analysis-statement">
                            <strong>Projected completion: On track</strong> (${projection ? projection.formattedDeadline : ''}). All trades are operating on or ahead of target schedule.
                        </p>
                    </div>

                    <div class="analysis-box">
                        <div class="analysis-box-header">
                            <span>Resource Action Plan</span>
                            <i class="fa-solid fa-user-check"></i>
                        </div>
                        <div class="recommendation-badge-box ok">
                            <div class="rec-icon-wrapper">
                                <i class="fa-solid fa-circle-check"></i>
                            </div>
                            <div class="rec-details">
                                <span class="rec-title">Optimal Resource Allocation</span>
                                <span class="rec-description">No action required — all trades are on track.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        `;
        return;
    }

    let paceStatement = '';
    if (projection.isUnavailable) {
        paceStatement = `Projection unavailable — insufficient progress history for <strong>${projection.bottleneckName}</strong>.`;
    } else if (projection.delayDays > 0) {
        paceStatement = `At current pace, <strong>${projection.bottleneckName}</strong> will finish on <strong>${projection.formattedProjectedDate}</strong> (Deadline: ${projection.formattedDeadline}), which is <span class="overdue-highlight">${projection.statusText}</span>.`;
    } else {
        paceStatement = `At current pace, <strong>${projection.bottleneckName}</strong> will finish on <strong>${projection.formattedProjectedDate}</strong> (Deadline: ${projection.formattedDeadline}), which is <strong>${projection.statusText}</strong>.`;
    }

    let recommendationHtml = '';
    if (rec.isManpower) {
        recommendationHtml = `
            <div class="recommendation-badge-box manpower">
                <div class="rec-icon-wrapper">
                    <i class="fa-solid fa-user-plus"></i>
                </div>
                <div class="rec-details">
                    <span class="rec-title">${rec.actionText}</span>
                    <span class="rec-description">${rec.manpowerText}</span>
                </div>
            </div>
        `;
    } else {
        let iconClass = 'fa-lightbulb';
        const lowerReason = rec.reason ? rec.reason.toLowerCase() : '';
        if (lowerReason.includes('material')) iconClass = 'fa-truck-fast';
        else if (lowerReason.includes('rework') || lowerReason.includes('quality')) iconClass = 'fa-wrench';
        else if (lowerReason.includes('weather') || lowerReason.includes('access')) iconClass = 'fa-road-barrier';

        recommendationHtml = `
            <div class="recommendation-badge-box material">
                <div class="rec-icon-wrapper">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
                <div class="rec-details">
                    <span class="rec-title">${rec.actionText}</span>
                    ${rec.supportingText ? `<span class="rec-description">${rec.supportingText}</span>` : ''}
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <article class="bottleneck-analysis-card alert">
            <div class="analysis-card-header">
                <div class="analysis-card-title">
                    <i class="fa-solid fa-chart-line"></i>
                    <h3>Bottleneck Projection & Resource Recommendation (${bottleneck ? bottleneck.tradeName : ''})</h3>
                </div>
            </div>
            <div class="analysis-card-body">
                <div class="analysis-box">
                    <div class="analysis-box-header">
                        <span>Pace & Finish Forecast</span>
                        <i class="fa-solid fa-stopwatch-20"></i>
                    </div>
                    <p class="analysis-statement">
                        ${paceStatement}
                    </p>
                </div>

                <div class="analysis-box">
                    <div class="analysis-box-header">
                        <span>Smart Action Recommendation</span>
                        <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    ${recommendationHtml}
                </div>
            </div>
        </article>
    `;
}

/**
 * Render Always-Visible Global Portfolio View directly from API Portfolio Data
 */
function renderPortfolioView() {
    const container = document.getElementById('portfolio-view-container');
    if (!container) return;

    const portfolioData = SitePulseState.portfolio || [];

    let itemsHtml = '';

    portfolioData.forEach((item, index) => {
        const isSelected = item.id === SitePulseState.activeProjectId;
        const delayBadgeClass = item.delayDays > 0 ? 'behind' : 'ontrack';

        itemsHtml += `
            <div class="portfolio-item rank-${index + 1} ${isSelected ? 'active-selected' : ''}" data-project-id="${item.id}">
                <div class="portfolio-item-meta">
                    <div class="portfolio-rank-badge">#${index + 1}</div>
                    <div class="portfolio-item-info">
                        <span class="portfolio-project-name">
                            ${item.name}
                            <span class="city-badge"><i class="fa-solid fa-location-dot"></i> ${item.city || item.location}</span>
                        </span>
                        <div class="portfolio-subdetails">
                            <span class="portfolio-bottleneck-text">
                                <i class="fa-solid fa-triangle-exclamation" style="color: ${item.delayDays > 0 ? 'var(--accent-red)' : (item.bottleneckName !== 'None' ? 'var(--accent-orange)' : 'var(--accent-green)')}"></i>
                                Bottleneck: <strong>${item.bottleneckName}</strong> ${item.bottleneckName !== 'None' ? `(${item.bottleneckReason})` : ''}
                            </span>
                            <span class="portfolio-date-text">
                                Finish: <strong>${item.projectedDateStr}</strong> | Deadline: <strong>${item.deadlineStr}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                <div class="portfolio-item-stats">
                    <span class="delay-pill ${delayBadgeClass}">
                        <i class="fa-solid ${item.delayDays > 0 ? 'fa-clock' : 'fa-circle-check'}"></i>
                        ${item.statusText}
                    </span>

                    ${item.needsUrgentManpower ? `
                        <span class="urgent-manpower-badge">
                            <i class="fa-solid fa-triangle-exclamation"></i> Needs Urgent Manpower
                        </span>
                    ` : ''}

                    <span class="select-project-hint">
                        <span>Inspect</span> <i class="fa-solid fa-arrow-right"></i>
                    </span>
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <article class="portfolio-card">
            <div class="portfolio-card-header">
                <div class="portfolio-card-title">
                    <i class="fa-solid fa-briefcase"></i>
                    <h3>Portfolio View — All Fitout Projects Summary</h3>
                </div>
                <span class="portfolio-subtitle-tag">Sorted by Delay Severity (Worst First)</span>
            </div>

            <div class="portfolio-grid">
                ${itemsHtml}
            </div>
        </article>
    `;

    // Attach click handlers to portfolio items
    container.querySelectorAll('.portfolio-item').forEach(itemEl => {
        itemEl.addEventListener('click', () => {
            const pid = itemEl.getAttribute('data-project-id');
            if (pid) selectProject(pid);
        });
    });
}

function renderDashboardLoadingState() {
    const overviewContainer = document.getElementById('project-overview-container');
    if (overviewContainer) {
        overviewContainer.innerHTML = `
            <div class="overview-card" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.8rem; color: var(--accent-orange);"></i>
                <p style="margin-top: 0.75rem; font-weight: 600;">Loading project analytics from Site Pulse server...</p>
            </div>
        `;
    }
}

function showDashboardError(msg) {
    const overviewContainer = document.getElementById('project-overview-container');
    if (overviewContainer) {
        overviewContainer.innerHTML = `
            <div class="overview-card" style="padding: 2rem; border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.08);">
                <div style="display: flex; align-items: center; gap: 0.85rem; color: var(--accent-red);">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.5rem;"></i>
                    <strong>${msg}</strong>
                </div>
            </div>
        `;
    }
}

function showGlobalError(msg) {
    console.error('Global Error:', msg);
}

/**
 * ==========================================================================
 * PHASE 10 — DAILY UPDATE WORKFLOW HANDLERS
 * ==========================================================================
 */

/**
 * Open Daily Site Update Modal for Active Project
 */
function openDailyUpdateModal() {
    const modal = document.getElementById('daily-update-modal');
    if (!modal) return;

    const db = SitePulseState.currentDashboard;
    if (!db || !db.project) {
        showGlobalError('No project active or project data not loaded.');
        return;
    }

    const modalTitle = document.getElementById('update-modal-project-title');
    if (modalTitle) {
        modalTitle.textContent = `Post Daily Site Update — ${db.project.name}`;
    }

    // Set default log date to browser local date (YYYY-MM-DD)
    const dateInput = document.getElementById('update-date-input');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    const alertEl = document.getElementById('update-status-alert');
    if (alertEl) {
        alertEl.style.display = 'none';
        alertEl.className = 'update-status-alert';
        alertEl.textContent = '';
    }

    renderUpdateTradeCards();
    modal.style.display = 'flex';
}

/**
 * Close Daily Site Update Modal
 */
function closeDailyUpdateModal() {
    const modal = document.getElementById('daily-update-modal');
    if (modal) modal.style.display = 'none';
}

/**
 * Render Trade Cards inside Daily Update Modal
 */
function renderUpdateTradeCards() {
    const container = document.getElementById('update-trades-list');
    if (!container) return;

    const db = SitePulseState.currentDashboard;
    if (!db || !db.trades || db.trades.length === 0) {
        container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No trades available for this project.</div>`;
        return;
    }

    let cardsHtml = '';

    db.trades.forEach(trade => {
        const actualPct = trade.progress_pct ?? trade.actual ?? 0;
        const plannedPct = trade.planned_pct ?? trade.planned ?? 0;
        const workersPresent = trade.workers_present ?? trade.workersPresent ?? 0;
        const workersRequired = trade.workers_required ?? trade.workersRequired ?? 0;
        const reason = trade.reason || 'On Track';
        const notes = trade.notes || '';
        const iconClass = TradeIconsMap[trade.name] || 'fa-solid fa-screwdriver-wrench';

        const reasons = [
            'On Track',
            'Material Delay',
            'Labour Shortage',
            'Waiting on Another Trade',
            'Rework / Quality Issue',
            'Site Access / Weather'
        ];

        let reasonOptionsHtml = '';
        reasons.forEach(r => {
            const selected = r === reason ? 'selected' : '';
            reasonOptionsHtml += `<option value="${r}" ${selected}>${r}</option>`;
        });

        cardsHtml += `
            <div class="update-trade-card" data-trade-id="${trade.id}" data-trade-name="${trade.name}">
                <div class="update-trade-header">
                    <div class="trade-identity">
                        <div class="trade-icon-avatar">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="trade-title-text">
                            <span class="trade-name">${trade.name}</span>
                            <span class="trade-category">Execution Target: <strong>${plannedPct}%</strong></span>
                        </div>
                    </div>
                    <div class="update-trade-current-badge">
                        <span>Current Progress: <strong>${actualPct}%</strong></span>
                    </div>
                </div>

                <div class="update-input-grid">
                    <div class="update-form-group">
                        <label for="progress-${trade.id}"><i class="fa-solid fa-percent"></i> Progress %</label>
                        <input type="number" id="progress-${trade.id}" class="form-input update-progress-input" min="0" max="100" step="1" value="${actualPct}" placeholder="0-100">
                    </div>

                    <div class="update-form-group">
                        <label for="present-${trade.id}"><i class="fa-solid fa-user-check"></i> Workers Present</label>
                        <input type="number" id="present-${trade.id}" class="form-input update-present-input" min="0" step="1" value="${workersPresent}" placeholder="Present">
                    </div>

                    <div class="update-form-group">
                        <label for="required-${trade.id}"><i class="fa-solid fa-users"></i> Workers Required</label>
                        <input type="number" id="required-${trade.id}" class="form-input update-required-input" min="0" step="1" value="${workersRequired}" placeholder="Required">
                    </div>

                    <div class="update-form-group">
                        <label for="reason-${trade.id}"><i class="fa-solid fa-tag"></i> Reason / Delay Status</label>
                        <select id="reason-${trade.id}" class="form-input update-reason-select">
                            ${reasonOptionsHtml}
                        </select>
                    </div>

                    <div class="update-form-group full-width">
                        <label for="notes-${trade.id}"><i class="fa-regular fa-comment-dots"></i> Site Notes / Remarks (Optional)</label>
                        <input type="text" id="notes-${trade.id}" class="form-input update-notes-input" value="${escapeHtml(notes)}" placeholder="Add observations or notes for site team...">
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = cardsHtml;
}

/**
 * Handle Submission of Trade Daily Updates
 */
async function handleDailyUpdateSubmit() {
    const projectId = SitePulseState.activeProjectId;
    const alertEl = document.getElementById('update-status-alert');
    const submitBtn = document.getElementById('submit-all-updates-btn');

    if (!projectId) return;

    // 1. Validate Log Date
    const dateInput = document.getElementById('update-date-input');
    const dateStr = dateInput ? dateInput.value.trim() : '';

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        showUpdateAlert('Please specify a valid update date in YYYY-MM-DD format.', 'error');
        return;
    }

    // Reject future dates compared to local browser date
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (dateStr > todayStr) {
        showUpdateAlert('Daily update date cannot be in the future.', 'error');
        return;
    }

    // 2. Validate Trade Inputs
    const tradeCards = document.querySelectorAll('.update-trade-card');
    if (tradeCards.length === 0) {
        showUpdateAlert('No trade rows found to update.', 'error');
        return;
    }

    const updatesToSubmit = [];
    let validationError = null;

    tradeCards.forEach(card => {
        if (validationError) return;

        const tradeId = card.getAttribute('data-trade-id');
        const tradeName = card.getAttribute('data-trade-name');
        
        const progInput = card.querySelector('.update-progress-input');
        const presentInput = card.querySelector('.update-present-input');
        const requiredInput = card.querySelector('.update-required-input');
        const reasonSelect = card.querySelector('.update-reason-select');
        const notesInput = card.querySelector('.update-notes-input');

        const progressPct = Number(progInput ? progInput.value : NaN);
        const workersPresent = Number(presentInput ? presentInput.value : NaN);
        const workersRequired = Number(requiredInput ? requiredInput.value : NaN);
        const reason = reasonSelect ? reasonSelect.value : 'On Track';
        const notes = notesInput ? notesInput.value.trim() : '';

        if (isNaN(progressPct) || progressPct < 0 || progressPct > 100) {
            validationError = `${tradeName}: Progress % must be between 0 and 100.`;
            return;
        }

        if (isNaN(workersPresent) || workersPresent < 0) {
            validationError = `${tradeName}: Workers Present must be a non-negative number.`;
            return;
        }

        if (isNaN(workersRequired) || workersRequired < 0) {
            validationError = `${tradeName}: Workers Required must be a non-negative number.`;
            return;
        }

        updatesToSubmit.push({
            tradeId,
            tradeName,
            updateData: {
                tradeId,
                date: dateStr,
                progressPct,
                workersPresent,
                workersRequired,
                reason,
                notes
            }
        });
    });

    if (validationError) {
        showUpdateAlert(`Validation Error: ${validationError}`, 'error');
        return;
    }

    // 3. Perform Submissions
    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting Updates...';
        }

        showUpdateAlert('Submitting trade updates to server...', 'info');

        let successCount = 0;
        let failCount = 0;
        const errorMessages = [];

        for (const item of updatesToSubmit) {
            try {
                await SitePulseAPI.createDailyUpdate(projectId, item.updateData);
                successCount++;
            } catch (err) {
                failCount++;
                console.error(`❌ Failed to submit update for ${item.tradeName}:`, err);
                errorMessages.push(`${item.tradeName}: ${err.message}`);
            }
        }

        // 4. Handle Results and Dashboard Reload
        if (successCount > 0) {
            // Re-fetch active project dashboard & portfolio to recalculate metrics from backend
            await loadProjectDashboard(projectId);
            const portfolioData = await SitePulseAPI.getPortfolio();
            SitePulseState.portfolio = portfolioData;
            renderPortfolioView();
        }

        if (failCount === 0) {
            showUpdateAlert(`✅ Successfully submitted ${successCount} trade update(s)! Project analytics recalculated.`, 'success');
            setTimeout(() => {
                closeDailyUpdateModal();
            }, 1200);
        } else if (successCount > 0) {
            showUpdateAlert(`⚠️ Partially saved (${successCount} succeeded, ${failCount} failed). Errors: ${errorMessages.join(' | ')}`, 'warning');
        } else {
            showUpdateAlert(`❌ Failed to submit updates. ${errorMessages.join(' | ')}`, 'error');
        }

    } catch (err) {
        showUpdateAlert(`Submission error: ${err.message}`, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Submit All Trade Updates</span>';
        }
    }
}

/**
 * Display Lightweight Status Notification Banner in Modal
 */
function showUpdateAlert(msg, type = 'info') {
    const alertEl = document.getElementById('update-status-alert');
    if (!alertEl) return;

    alertEl.style.display = 'block';
    alertEl.className = `update-status-alert ${type}`;
    alertEl.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-xmark' : (type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'))}"></i> <span>${msg}</span>`;
}

/**
 * Utility HTML Escaper
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

