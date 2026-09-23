import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOT_NAMES, noteForFood, notesForFood, notePacket, notePackets } from '../src/music-v0.4.0.mjs';

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

test('major and minor chord progressions follow the selected root', () => {
    assert.deepEqual([1, 2, 3, 4, 5].map(score => notesForFood(score, 0, 0, true)), [
        [60, 64, 67], [65, 69, 72], [67, 71, 74], [69, 72, 76], [60, 64, 67]
    ]);
    assert.deepEqual(notesForFood(1, 1, 6, true), [66, 69, 73]);
    assert.deepEqual(notesForFood(1, 2, 0, true), [60, 64, 69]);
    assert.deepEqual(notesForFood(1, 3, 0, true), [60, 65, 67]);
    assert.deepEqual(notesForFood(1, 0, 0, false), [60]);
});

test('a chord sends paired note-on and note-off packets on one track', () => {
    assert.deepEqual(notePackets(true, 1, [60, 64, 67]), [
        0x29, 0x91, 60, 100, 0x29, 0x91, 64, 100, 0x29, 0x91, 67, 100
    ]);
    assert.deepEqual(notePackets(false, 1, [60, 64, 67]), [
        0x28, 0x81, 60, 0, 0x28, 0x81, 64, 0, 0x28, 0x81, 67, 0
    ]);
});
