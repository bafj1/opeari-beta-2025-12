
import { normalizeArea, normalizeVisibility } from '../src/utils/location';

console.log("Verifying Normalization Logic...");

const areaTests = [
    { input: null, expected: 'Nearby' },
    { input: undefined, expected: 'Nearby' },
    { input: '', expected: 'Nearby' },
    { input: '   ', expected: 'Nearby' },
    { input: '0', expected: 'Nearby' },
    { input: '000', expected: 'Nearby' },
    { input: '00000', expected: 'Nearby' },
    { input: 'Noe Valley', expected: 'Noe Valley' },
    { input: '  SOMA  ', expected: 'SOMA' },
    { input: 94110, expected: '94110' },
    { input: 0, expected: 'Nearby' },
];

let failed = 0;

console.log("\n--- Area Normalization ---");
areaTests.forEach(({ input, expected }, idx) => {
    const actual = normalizeArea(input as any); // Cast for testing
    if (actual !== expected) {
        console.error(`[FAIL] Test #${idx}: Input '${input}' -> Expected '${expected}', got '${actual}'`);
        failed++;
    } else {
        console.log(`[PASS] Test #${idx}: Input '${input}' -> '${actual}'`);
    }
});

const visTests = [
    { input: null, expected: 'Village only' },
    { input: undefined, expected: 'Village only' },
    { input: 'village_only', expected: 'Village only' },
    { input: 'VILLAGE_ONLY', expected: 'Village only' },
    { input: 'public', expected: 'Public' },
    { input: 'PUBLIC', expected: 'Public' },
    { input: 'friends', expected: 'Village only' }, // Fallback case
];

console.log("\n--- Visibility Normalization ---");
visTests.forEach(({ input, expected }, idx) => {
    const actual = normalizeVisibility(input);
    if (actual !== expected) {
        console.error(`[FAIL] Test #${idx}: Input '${input}' -> Expected '${expected}', got '${actual}'`);
        failed++;
    } else {
        console.log(`[PASS] Test #${idx}: Input '${input}' -> '${actual}'`);
    }
});

if (failed > 0) {
    console.error(`\n${failed} tests failed.`);
    process.exit(1);
} else {
    console.log("\nAll tests passed!");
    process.exit(0);
}
