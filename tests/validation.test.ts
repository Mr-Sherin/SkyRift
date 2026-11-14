import test from 'node:test';
import assert from 'node:assert/strict';
import { runValidationSuite } from '../src/lib/validation';

test('SkyRift Physics & Astrodynamics Validation Suite (20 Sample Designs)', (t) => {
  const report = runValidationSuite();

  // Print the full results table to standard output as requested
  console.log('\n' + report.summaryTable + '\n');

  // Verify that every single comparison passes within 1% tolerance
  for (const result of report.results) {
    assert.ok(
      result.passed,
      `Validation FAILED for [${result.missionName}] ${result.designName} - ${result.metricLabel}: Game=${result.gameValue}${result.unit}, Textbook=${result.textbookValue}${result.unit}, Diff=${result.diffPct}% (exceeds ${result.tolerancePct}%)`
    );
    assert.ok(
      result.diffPct <= 1.0,
      `Deviation of ${result.diffPct}% exceeds 1% tolerance threshold for ${result.metricLabel}`
    );
  }

  assert.equal(report.failedCount, 0, `Expected 0 failed validations, but found ${report.failedCount}`);
  assert.equal(report.passedCount, 80, `Expected 80/80 passed validations, got ${report.passedCount}`);
  assert.ok(report.maxDiffPct <= 1.0, `Max deviation ${report.maxDiffPct}% exceeds 1%`);
});
