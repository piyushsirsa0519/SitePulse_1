process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
    calculateProjectMetrics,
    getProjectBottleneck,
    calculateProjectedCompletion,
    getRecommendation,
    calculatePortfolioRisk
} = require('../src/analytics/index.js');

// Standard Reference Today Date (Matching baseline test: 2026-10-01)
const TODAY = new Date('2026-10-01T00:00:00.000Z');

// Baseline Prototype Mock Data
const MOCK_PROJECTS = [
    {
        id: 'prj-biryani-blues',
        name: 'Biryani Blues - Gurugram',
        city: 'Gurugram',
        startDate: '2026-09-01',
        deadline: '2026-10-25',
        trades: [
            { name: 'Civil', planned: 90, actual: 92, workersPresent: 12, workersRequired: 12, reason: 'On Track' },
            { name: 'Electrical', planned: 75, actual: 75, workersPresent: 8, workersRequired: 8, reason: 'On Track' },
            { name: 'Lighting', planned: 60, actual: 65, workersPresent: 6, workersRequired: 6, reason: 'On Track' },
            { name: 'Carpentry', planned: 40, actual: 42, workersPresent: 10, workersRequired: 10, reason: 'On Track' },
            { name: 'Painting', planned: 20, actual: 22, workersPresent: 5, workersRequired: 5, reason: 'On Track' }
        ]
    },
    {
        id: 'prj-chai-point',
        name: 'Cafe Chai Point - Delhi',
        city: 'Delhi',
        startDate: '2026-09-05',
        deadline: '2026-10-30',
        trades: [
            { name: 'Civil', planned: 95, actual: 95, workersPresent: 10, workersRequired: 10, reason: 'On Track' },
            { name: 'Electrical', planned: 80, actual: 52, workersPresent: 4, workersRequired: 9, reason: 'Material Delay' },
            { name: 'Lighting', planned: 50, actual: 35, workersPresent: 3, workersRequired: 6, reason: 'Waiting on Another Trade' },
            { name: 'Carpentry', planned: 60, actual: 64, workersPresent: 8, workersRequired: 8, reason: 'On Track' },
            { name: 'Painting', planned: 15, actual: 15, workersPresent: 4, workersRequired: 4, reason: 'On Track' }
        ]
    },
    {
        id: 'prj-ptal-homeware',
        name: 'P.TAL Homeware - Hyderabad',
        city: 'Hyderabad',
        startDate: '2026-09-10',
        deadline: '2026-11-15',
        trades: [
            { name: 'Civil', planned: 70, actual: 42, workersPresent: 5, workersRequired: 14, reason: 'Labour Shortage' },
            { name: 'Electrical', planned: 45, actual: 45, workersPresent: 6, workersRequired: 6, reason: 'On Track' },
            { name: 'Lighting', planned: 25, actual: 20, workersPresent: 2, workersRequired: 4, reason: 'Waiting on Another Trade' },
            { name: 'Carpentry', planned: 55, actual: 60, workersPresent: 9, workersRequired: 8, reason: 'On Track' },
            { name: 'Painting', planned: 10, actual: 10, workersPresent: 3, workersRequired: 3, reason: 'On Track' }
        ]
    }
];

test('Project 1: Biryani Blues - Gurugram (Baseline Checks)', (t) => {
    const project = MOCK_PROJECTS[0];

    const metrics = calculateProjectMetrics(project, TODAY);
    assert.equal(metrics.overallActual, 59, 'Overall actual progress should be 59%');
    assert.equal(metrics.overallPlanned, 57, 'Overall planned progress should be 57%');
    assert.equal(metrics.variance, 2, 'Variance should be +2');
    assert.equal(metrics.healthStatus, 'On Track', 'Health status should be On Track');
    assert.equal(metrics.delayedTradesCount, 0, 'Delayed trades count should be 0');
    assert.equal(metrics.totalWorkersPresent, 41, 'Total workers present should be 41');
    assert.equal(metrics.totalWorkersRequired, 41, 'Total workers required should be 41');

    const bottleneck = getProjectBottleneck(project);
    assert.equal(bottleneck, null, 'Biryani Blues should have no bottleneck');

    const projection = calculateProjectedCompletion(project, TODAY);
    assert.equal(projection.hasBottleneck, false);
    assert.equal(projection.delayDays, 0);

    const rec = getRecommendation(project, TODAY);
    assert.equal(rec.hasBottleneck, false);
    assert.equal(rec.actionText, 'No action required — all trades are on track.');
});

test('Project 2: Cafe Chai Point - Delhi (Baseline Checks)', (t) => {
    const project = MOCK_PROJECTS[1];

    const metrics = calculateProjectMetrics(project, TODAY);
    assert.equal(metrics.overallActual, 52, 'Overall actual progress should be 52%');
    assert.equal(metrics.overallPlanned, 60, 'Overall planned progress should be 60%');
    assert.equal(metrics.variance, -8, 'Variance should be -8');
    assert.equal(metrics.healthStatus, 'Behind Schedule');
    assert.equal(metrics.delayedTradesCount, 2);

    const bottleneck = getProjectBottleneck(project);
    assert.notEqual(bottleneck, null);
    assert.equal(bottleneck.tradeName, 'Electrical');
    assert.equal(bottleneck.gapPercentage, 28);
    assert.equal(bottleneck.reason, 'Material Delay');

    const projection = calculateProjectedCompletion(project, TODAY);
    assert.equal(projection.hasBottleneck, true);
    assert.equal(projection.bottleneckName, 'Electrical');
    assert.equal(projection.delayDays, -5, 'Should project completion 5 days ahead of deadline');

    const rec = getRecommendation(project, TODAY);
    assert.equal(rec.hasBottleneck, true);
    assert.equal(rec.isManpower, false);
    assert.equal(rec.actionText, 'Recommended action: Expedite material delivery.');
});

test('Project 3: P.TAL Homeware - Hyderabad (Baseline Checks)', (t) => {
    const project = MOCK_PROJECTS[2];

    const metrics = calculateProjectMetrics(project, TODAY);
    assert.equal(metrics.overallActual, 35);
    assert.equal(metrics.overallPlanned, 41);
    assert.equal(metrics.variance, -6);
    assert.equal(metrics.healthStatus, 'Behind Schedule');
    assert.equal(metrics.delayedTradesCount, 2);

    const bottleneck = getProjectBottleneck(project);
    assert.notEqual(bottleneck, null);
    assert.equal(bottleneck.tradeName, 'Civil');
    assert.equal(bottleneck.gapPercentage, 28);
    assert.equal(bottleneck.reason, 'Labour Shortage');

    const projection = calculateProjectedCompletion(project, TODAY);
    assert.equal(projection.hasBottleneck, true);
    assert.equal(projection.bottleneckName, 'Civil');
    assert.equal(projection.delayDays, -16);

    const rec = getRecommendation(project, TODAY);
    assert.equal(rec.hasBottleneck, true);
    assert.equal(rec.isManpower, true);
    assert.equal(rec.extraWorkers, 0, 'Current formula yields 0 extra workers');
});

test('Portfolio Risk Aggregation & Sorting', (t) => {
    const sortedPortfolio = calculatePortfolioRisk(MOCK_PROJECTS, TODAY);

    assert.equal(sortedPortfolio.length, 3);
    assert.equal(sortedPortfolio[0].id, 'prj-biryani-blues', 'Highest delayDays (0) comes first');
    assert.equal(sortedPortfolio[1].id, 'prj-chai-point', 'Middle delayDays (-5) comes second');
    assert.equal(sortedPortfolio[2].id, 'prj-ptal-homeware', 'Lowest delayDays (-16) comes third');

    assert.equal(sortedPortfolio[0].needsUrgentManpower, false);
    assert.equal(sortedPortfolio[1].needsUrgentManpower, false);
    assert.equal(sortedPortfolio[2].needsUrgentManpower, false);
});

test('Canonical vs Legacy Field Compatibility', (t) => {
    const canonicalProject = {
        id: 'prj-canonical',
        name: 'Canonical Test Site',
        city: 'Mumbai',
        start_date: '2026-09-01',
        deadline: '2026-10-25',
        trades: [
            { name: 'Civil', planned_pct: 80, progress_pct: 50, workers_present: 5, workers_required: 10, reason: 'Labour Shortage' }
        ]
    };

    const metrics = calculateProjectMetrics(canonicalProject, TODAY);
    assert.equal(metrics.overallActual, 50);
    assert.equal(metrics.overallPlanned, 80);
    assert.equal(metrics.healthStatus, 'Behind Schedule', 'Variance is -30 (< -5) so Behind Schedule');

    const bottleneck = getProjectBottleneck(canonicalProject);
    assert.notEqual(bottleneck, null);
    assert.equal(bottleneck.tradeName, 'Civil');
    assert.equal(bottleneck.gapPercentage, 30);
});

test('Edge Case: Zero Progress / Zero Days Elapsed', (t) => {
    const zeroProgressProject = {
        id: 'prj-zero',
        name: 'Zero Start Site',
        city: 'Pune',
        startDate: '2026-10-01',
        deadline: '2026-11-01',
        trades: [
            { name: 'Civil', planned: 20, actual: 0, workersPresent: 0, workersRequired: 5, reason: 'Labour Shortage' }
        ]
    };

    const projection = calculateProjectedCompletion(zeroProgressProject, TODAY);
    assert.equal(projection.isUnavailable, true);
    assert.equal(projection.formattedProjectedDate, 'Unavailable');

    const rec = getRecommendation(zeroProgressProject, TODAY);
    assert.equal(rec.isUnavailable, true);
    assert.equal(rec.actionText, 'Manpower estimate unavailable — insufficient progress history.');
});
