export const SCALES = Object.freeze([
    Object.freeze({ name: 'MAJOR', intervals: Object.freeze([0, 2, 4, 5, 7, 9, 11]) }),
    Object.freeze({ name: 'MINOR', intervals: Object.freeze([0, 2, 3, 5, 7, 8, 10]) }),
    Object.freeze({ name: 'PENTA', intervals: Object.freeze([0, 2, 4, 7, 9]) }),
    Object.freeze({ name: 'BLUES', intervals: Object.freeze([0, 3, 5, 6, 7, 10]) })
]);

export const ROOT_NAMES = Object.freeze([
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
]);

export function noteForFood(score, scaleIndex = 0, root = 0) {
    const scale = SCALES[scaleIndex] || SCALES[0];
    const step = Math.max(0, score - 1);
    const octave = Math.floor(step / scale.intervals.length);
    const degree = step % scale.intervals.length;
    return Math.min(127, 60 + root + octave * 12 + scale.intervals[degree]);
}

export function notePacket(on, channel, note) {
    if (!Number.isInteger(channel) || channel < 0 || channel > 15) {
        throw new RangeError('MIDI channel must be 0-15');
    }
    return on
        ? [0x29, 0x90 | channel, note, 100]
        : [0x28, 0x80 | channel, note, 0];
}
