import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOT_NAMES, noteForFood, notePacket } from '../src/music-v0.3.1.mjs';

test('food notes follow the selected scale across octaves', () => {
    assert.deepEqual([1, 2, 3, 7, 8].map(score => noteForFood(score, 0)), [60, 62, 64, 71, 72]);
    assert.deepEqual([1, 2, 3].map(score => noteForFood(score, 1)), [60, 62, 63]);
    assert.deepEqual([1, 2, 6].map(score => noteForFood(score, 2)), [60, 62, 72]);
    assert.equal(ROOT_NAMES.length, 12);
    assert.deepEqual([1, 2, 3].map(score => noteForFood(score, 1, 6)), [66, 68, 69]);
    assert.equal(noteForFood(1, 0, 11), 71);
});

test('track channel appears in both cable-2 note packets', () => {
    assert.deepEqual(notePacket(true, 2, 64), [0x29, 0x92, 64, 100]);
    assert.deepEqual(notePacket(false, 2, 64), [0x28, 0x82, 64, 0]);
});
