import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Track buttons reach native Move as well as Snake', () => {
    const module = JSON.parse(readFileSync(new URL('../src/module.json', import.meta.url), 'utf8'));
    assert.equal(module.component_type, 'overtake');
    assert.deepEqual(module.capabilities.button_passthrough, [40, 41, 42, 43]);
});
