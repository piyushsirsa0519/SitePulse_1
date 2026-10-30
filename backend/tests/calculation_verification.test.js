/**
 * Site Pulse — Phase 11 Calculation Verification Test Suite
 * Comprehensive automated verification of analytics functions against real daily-update scenarios.
 */

process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    calculateProjectMetrics,
    getProjectBottleneck,
    calculateProjectedCompletion,
    getRecommendation,
    calculatePortfolioRisk
} = require('../src/analytics/index');

const { createOrUpdateDailyUpdate } = require('../src/services/updateService');
const { getProjectDashboardData, getFullProjectData } = require('../src/services/projectService');

const TEST_ORG_ID = 'org-apex-retail';
const MOCK_USER = { id: 'usr-admin-01', role: 'admin', organizationId: TEST_ORG_ID };
const REF_DATE = new Date('2026-10-01T00:00:00.000Z');

/**
 * 1. PROTOTYPE BASELINE REGRESSION (Unmodified Baseline Checks)
 */
test('1. Baseline Regression: Biryani Blues baseline metrics match expected prototype output', async () => {
    const dashboard = await getProjectDashboardData('prj-biryani-blues', TEST_ORG_ID, REF_DATE);
    assert.ok(dashboard);
    assert.equal(dashboard.project.name, 'Biryani Blues - Gurugram');
    assert.equal(dashboard.metrics.overallPlanned, 57);
    assert.equal(dashboard.metrics.overallActual, 59);
    assert.equal(dashboard.metrics.variance, 2);
    assert.equal(dashboard.metrics.healthStatus, 'On Track');
    assert.equal(dashboard.bottleneck, null);
    assert.equal(dashboard.forecast.delayDays, 0);
});

test('2. Baseline Regression: Cafe Chai Point baseline metrics match expected prototype output', async () => {
    const dashboard = await getProjectDashboardData('prj-chai-point', TEST_ORG_ID, REF_DATE);
    assert.ok(dashboard);
    assert.equal(dashboard.project.name, 'Cafe Chai Point - Delhi');
    assert.equal(dashboard.metrics.overallPlanned, 60);
    assert.equal(dashboard.metrics.overallActual, 52);
    assert.equal(dashboard.metrics.variance, -8);
    assert.equal(dashboard.metrics.healthStatus, 'Behind Schedule');
    assert.equal(dashboard.bottleneck.tradeName, 'Electrical');
    assert.equal(dashboard.bottleneck.gapPercentage, 28);
});

test('3. Baseline Regression: P.TAL Homeware baseline metrics match expected prototype output', async () => {
    const dashboard = await getProjectDashboardData('prj-ptal-homeware', TEST_ORG_ID, REF_DATE);
    assert.ok(dashboard);
    assert.equal(dashboard.project.name, 'P.TAL Homeware - Hyderabad');
    assert.equal(dashboard.metrics.overallPlanned, 41);
    assert.equal(dashboard.metrics.overallActual, 36);
    assert.equal(dashboard.metrics.variance, 36 - 41); // -5
    assert.equal(dashboard.metrics.healthStatus, 'Behind Schedule');
    assert.equal(dashboard.bottleneck.tradeName, 'Civil');
    assert.equal(dashboard.bottleneck.gapPercentage, 28);
});

/**
 * 2. CONTROLLED DAILY UPDATE SCENARIOS
 */
test('Scenario A — Progress increases: Updating trade actual progress recalculates overall actual & variance', async () => {
    const logDate = '2026-10-01';
    
    // Update Carpentry on Biryani Blues from 42% to 60%
    await createOrUpdateDailyUpdate({
        projectId: 'prj-biryani-blues',
        tradeId: 'trd-bb-carpentry',
        date: logDate,
        progressPct: 60,
        workersPresent: 10,
        workersRequired: 10,
        reason: 'On Track',
        notes: 'Scenario A update',
        user: MOCK_USER
    });

    const dashboard = await getProjectDashboardData('prj-biryani-blues', TEST_ORG_ID, REF_DATE);
    
    // Sum of actuals: Civil(92) + Electrical(75) + Lighting(65) + Carpentry(60) + Painting(22) = 314 / 5 = 62.8 -> 63%
    assert.equal(dashboard.metrics.overallActual, 63);
    assert.equal(dashboard.metrics.overallPlanned, 57);
    assert.equal(dashboard.metrics.variance, 63 - 57); // +6
});

test('Scenario B — Progress falls behind plan: Actual progress significantly lower than plan', async () => {
    const logDate = '2026-10-01';

    // Set Civil on Biryani Blues to 20/90
    await createOrUpdateDailyUpdate({
        projectId: 'prj-biryani-blues',
        tradeId: 'trd-bb-civil',
        date: logDate,
        progressPct: 20,
        workersPresent: 4,
        workersRequired: 12,
        reason: 'Labour Shortage',
        notes: 'Scenario B update',
        user: MOCK_USER
    });

    const dashboard = await getProjectDashboardData('prj-biryani-blues', TEST_ORG_ID, REF_DATE);
    
    // Sum of actuals: Civil(20) + Electrical(75) + Lighting(65) + Carpentry(60) + Painting(22) = 242 / 5 = 48.4 -> 48%
    // Overall planned: 57%
    assert.equal(dashboard.metrics.overallActual, 48);
    assert.equal(dashboard.metrics.overallPlanned, 57);
    assert.equal(dashboard.metrics.variance, -9);
    assert.equal(dashboard.metrics.healthStatus, 'Behind Schedule'); // variance < -5
    assert.equal(dashboard.bottleneck.tradeName, 'Civil');
    assert.equal(dashboard.bottleneck.gapPercentage, 70); // 90 - 20
});

test('Scenario C — Progress catches up: Actual progress meets/exceeds planned target', async () => {
    const logDate = '2026-10-01';

    // Restore Civil on Biryani Blues back to 90% (matching plan 90%)
    await createOrUpdateDailyUpdate({
        projectId: 'prj-biryani-blues',
        tradeId: 'trd-bb-civil',
        date: logDate,
        progressPct: 90,
        workersPresent: 12,
        workersRequired: 12,
        reason: 'On Track',
        notes: 'Scenario C update',
        user: MOCK_USER
    });

    // Reset Carpentry back to 40% (matching plan 40%)
    await createOrUpdateDailyUpdate({
        projectId: 'prj-biryani-blues',
        tradeId: 'trd-bb-carpentry',
        date: logDate,
        progressPct: 40,
        workersPresent: 10,
        workersRequired: 10,
        reason: 'On Track',
        notes: 'Scenario C update',
        user: MOCK_USER
    });

    const dashboard = await getProjectDashboardData('prj-biryani-blues', TEST_ORG_ID, REF_DATE);
    
    assert.equal(dashboard.metrics.overallActual, 58);
    assert.equal(dashboard.metrics.overallPlanned, 57);
    assert.equal(dashboard.metrics.variance, 1);
    assert.equal(dashboard.metrics.healthStatus, 'On Track');
    assert.equal(dashboard.bottleneck, null);
});

test('Scenario D — Workforce changes: Modifying workersPresent and workersRequired', async () => {
    const logDate = '2026-10-01';

    // Set Cafe Chai Point Civil trade: actual 25%, planned 95%, workersPresent 10, workersRequired 12, reason 'Labour Shortage'
    await createOrUpdateDailyUpdate({
        projectId: 'prj-chai-point',
        tradeId: 'trd-cp-civil',
        date: logDate,
        progressPct: 25,
        workersPresent: 10,
        workersRequired: 12,
        reason: 'Labour Shortage',
        notes: 'Scenario D update',
        user: MOCK_USER
    });

    const dashboard = await getProjectDashboardData('prj-chai-point', TEST_ORG_ID, REF_DATE);
    
    assert.equal(dashboard.bottleneck.tradeName, 'Civil');
    assert.equal(dashboard.recommendation.isManpower, true);
    assert.equal(dashboard.recommendation.workersPresent, 10);
    assert.equal(dashboard.recommendation.workersRequired, 12);
});

test('Scenario E — Reason changes: Testing Material Delay, Quality Rework, Weather Access', async () => {
    const mockProject = {
        id: 'prj-test',
        startDate: '2026-09-01',
        deadline: '2026-10-31',
        trades: [
            { id: 't1', name: 'Civil', planned_pct: 80, progress_pct: 40, workers_present: 5, workers_required: 10, reason: 'Material Delay' }
        ]
    };

    const recMaterial = getRecommendation(mockProject, REF_DATE);
    assert.equal(recMaterial.actionText, 'Recommended action: Expedite material delivery.');
    assert.equal(recMaterial.isManpower, false);

    mockProject.trades[0].reason = 'Rework / Quality Issue';
    const recRework = getRecommendation(mockProject, REF_DATE);
    assert.equal(recRework.actionText, 'Recommended action: Resolve rework / quality issue before increasing manpower.');
    assert.equal(recRework.isManpower, false);

    mockProject.trades[0].reason = 'Site Access / Weather';
    const recWeather = getRecommendation(mockProject, REF_DATE);
    assert.equal(recWeather.actionText, 'Recommended action: Resolve site access / weather constraint.');
    assert.equal(recWeather.isManpower, false);
});

test('Scenario F — Multiple trades updated simultaneously', async () => {
    const mockProject = {
        id: 'prj-test-f',
        startDate: '2026-09-01',
        deadline: '2026-10-31',
        trades: [
            { id: 't1', name: 'Trade 1', planned_pct: 60, progress_pct: 40, workers_present: 5, workers_required: 5, reason: 'On Track' },
            { id: 't2', name: 'Trade 2', planned_pct: 80, progress_pct: 30, workers_present: 4, workers_required: 6, reason: 'Labour Shortage' }
        ]
    };

    const metrics = calculateProjectMetrics(mockProject, REF_DATE);
    assert.equal(metrics.overallPlanned, 70); // (60+80)/2
    assert.equal(metrics.overallActual, 35); // (40+30)/2
    assert.equal(metrics.variance, -35);
    
    const bottleneck = getProjectBottleneck(mockProject);
    assert.equal(bottleneck.tradeName, 'Trade 2'); // Gap: 80-30=50 vs 60-40=20
    assert.equal(bottleneck.gapPercentage, 50);
});

/**
 * 3. BOTTLENECK TIE BEHAVIOR
 */
test('3. Bottleneck Tie Behavior: Resolves deterministically to the first trade in array', () => {
    const projectWithTie = {
        id: 'prj-tie',
        trades: [
            { id: 't-alpha', name: 'Alpha Trade', planned_pct: 60, progress_pct: 30, reason: 'Labour Shortage' }, // Gap = 30
            { id: 't-beta', name: 'Beta Trade', planned_pct: 80, progress_pct: 50, reason: 'Labour Shortage' }   // Gap = 30
        ]
    };

    const bottleneck = getProjectBottleneck(projectWithTie);
    assert.ok(bottleneck);
    assert.equal(bottleneck.tradeName, 'Alpha Trade');
    assert.equal(bottleneck.gapPercentage, 30);
});

/**
 * 4. FORECAST MODEL VERIFICATION
 */
test('4. Forecast Verification: Linear velocity, zero velocity, and ahead/behind pace', () => {
    const testToday = new Date('2026-09-16'); // 15 days elapsed from 2026-09-01
    
    // 4.1 Normal Positive Velocity
    const projNormal = {
        startDate: '2026-09-01',
        deadline: '2026-10-01', // 30 total project days
        trades: [
            { id: 't1', name: 'Civil', planned_pct: 60, progress_pct: 50, reason: 'On Track' }
        ]
    };
    const forecastNormal = calculateProjectedCompletion(projNormal, testToday);
    assert.equal(forecastNormal.isUnavailable, false);
    assert.equal(forecastNormal.delayDays, 0);

    // 4.2 Zero Velocity (0% actual)
    const projZero = {
        startDate: '2026-09-01',
        deadline: '2026-10-01',
        trades: [
            { id: 't1', name: 'Civil', planned_pct: 60, progress_pct: 0, reason: 'On Track' }
        ]
    };
    const forecastZero = calculateProjectedCompletion(projZero, testToday);
    assert.equal(forecastZero.isUnavailable, true);
    assert.equal(forecastZero.formattedProjectedDate, 'Unavailable');

    // 4.3 Behind Pace (15% in 15 days = 1%/day. Remaining 85% takes 85 days -> Nov 20, deadline Oct 1 -> ~50 days delayed)
    const projSlow = {
        startDate: '2026-09-01',
        deadline: '2026-10-01',
        trades: [
            { id: 't1', name: 'Civil', planned_pct: 60, progress_pct: 15, reason: 'On Track' }
        ]
    };
    const forecastSlow = calculateProjectedCompletion(projSlow, testToday);
    assert.equal(forecastSlow.isUnavailable, false);
    assert.ok(forecastSlow.delayDays > 0);
});

/**
 * 5. PORTFOLIO RISK SORTING VERIFICATION
 */
test('5. Portfolio Risk Verification: Sorted by delayDays DESC, maxGap DESC, originalIndex ASC', () => {
    const projects = [
        { id: 'p1', name: 'Project 1', startDate: '2026-09-01', deadline: '2026-10-01', trades: [{ id: 't1', name: 'Civil', planned_pct: 80, progress_pct: 40, reason: 'Site Delays' }] }, // gap 40, slow
        { id: 'p2', name: 'Project 2', startDate: '2026-09-01', deadline: '2026-10-01', trades: [{ id: 't2', name: 'Civil', planned_pct: 90, progress_pct: 10, reason: 'Site Delays' }] }, // gap 80, very slow
        { id: 'p3', name: 'Project 3', startDate: '2026-09-01', deadline: '2026-10-01', trades: [{ id: 't3', name: 'Civil', planned_pct: 50, progress_pct: 50, reason: 'On Track' }] }     // gap 0, on track
    ];

    const sorted = calculatePortfolioRisk(projects, new Date('2026-09-16'));
    assert.equal(sorted.length, 3);
    assert.equal(sorted[0].id, 'p2'); // Highest delay
    assert.equal(sorted[1].id, 'p1'); // Second highest delay
    assert.equal(sorted[2].id, 'p3'); // On track (0 delay)
});

/**
 * 7. EDGE CASES VERIFICATION
 */
test('7. Edge Cases: Zero progress, 100% progress, actual > planned, zero days elapsed, workers=0', () => {
    const startDate = new Date('2026-09-01'); // Start date = Today -> 0 days elapsed

    // 7.1 Zero Days Elapsed
    const projZeroDays = {
        startDate: '2026-09-01',
        deadline: '2026-10-01',
        trades: [{ id: 't1', name: 'Civil', planned_pct: 10, progress_pct: 0, workers_present: 0, workers_required: 5, reason: 'Labour Shortage' }]
    };
    const metricsZeroDays = calculateProjectMetrics(projZeroDays, startDate);
    assert.equal(metricsZeroDays.daysElapsed, 0);

    const forecastZeroDays = calculateProjectedCompletion(projZeroDays, startDate);
    assert.equal(forecastZeroDays.isUnavailable, true);

    const recZeroDays = getRecommendation(projZeroDays, startDate);
    assert.equal(recZeroDays.isUnavailable, true);

    // 7.2 100% Progress
    const projCompleted = {
        startDate: '2026-09-01',
        deadline: '2026-10-01',
        trades: [{ id: 't1', name: 'Civil', planned_pct: 100, progress_pct: 100, reason: 'On Track' }]
    };
    const bottleneckCompleted = getProjectBottleneck(projCompleted);
    assert.equal(bottleneckCompleted, null);

    // 7.3 Actual > Planned (Over-performance, actual=90, planned=80)
    const projAhead = {
        startDate: '2026-09-01',
        deadline: '2026-10-01',
        trades: [{ id: 't1', name: 'Civil', planned_pct: 80, progress_pct: 90, reason: 'On Track' }]
    };
    const bottleneckAhead = getProjectBottleneck(projAhead);
    assert.equal(bottleneckAhead, null);

    // 7.4 Workers Present > Workers Required (e.g. 15 present out of 10 required)
    const projOverstaffed = {
        startDate: '2026-09-01',
        deadline: '2026-10-01',
        trades: [{ id: 't1', name: 'Civil', planned_pct: 80, progress_pct: 50, workers_present: 15, workers_required: 10, reason: 'Labour Shortage' }]
    };
    const metricsOverstaffed = calculateProjectMetrics(projOverstaffed, new Date('2026-09-15'));
    assert.equal(metricsOverstaffed.totalWorkersPresent, 15);
    assert.equal(metricsOverstaffed.totalWorkersRequired, 10);
});
