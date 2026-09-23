import {
    MidiCC,
    MoveMainButton,
    MoveUp,
    MoveDown,
    MoveLeft,
    MoveRight,
    MovePlay,
    MoveKnob1,
    MoveKnob2,
    MoveKnob8,
    MoveRow1,
    MoveRow4,
    MoveSteps,
    MovePads,
    Black,
    White,
    BrightRed,
    BrightGreen,
    DeepGreen,
    DarkGrey,
    AzureBlue,
    BrightOrange,
    HotMagenta,
    WhiteLedDim,
    WhiteLedBright
} from '/data/UserData/schwung/shared/constants.mjs';
import {
    isNoiseMessage,
    isCapacitiveTouchMessage,
    decodeDelta,
    setLED,
    setButtonLED
} from '/data/UserData/schwung/shared/input_filter.mjs';
import {
    SnakeGame,
    READY,
    RUNNING,
    PAUSED,
    GAME_OVER,
    WON
} from './game-v0.2.4.mjs';
import { SCALES, ROOT_NAMES, noteForFood, notePacket } from './music-v0.3.1.mjs';

const BOARD_WIDTH = 8;
const BOARD_HEIGHT = 4;

const game = new SnakeGame(BOARD_WIDTH, BOARD_HEIGHT);
const pressedButtons = new Set();
let nextMoveAt = 0;
let ledState = '';
let needsLedResync = true;
let selectedTrack = 0;
let selectedScale = 0;
let selectedRoot = 0;
let activeNote = null;

function sendNote(on, channel, note) {
    return typeof move_midi_inject_to_move === 'function'
        && move_midi_inject_to_move(notePacket(on, channel, note));
}

function releaseActiveNote() {
    if (!activeNote) return true;
    if (!sendNote(false, activeNote.channel, activeNote.note)) return false;
    activeNote = null;
    return true;
}

function playFoodNote(now) {
    if (!releaseActiveNote()) return;
    const channel = selectedTrack;
    const note = noteForFood(game.score, selectedScale, selectedRoot);
    if (sendNote(true, channel, note)) {
        activeNote = { channel, note, endsAt: now + 160 };
    }
}

function cellToPad(cell) {
    const physicalRow = BOARD_HEIGHT - 1 - cell.y;
    return MovePads[physicalRow * BOARD_WIDTH + cell.x];
}

function padColor(pad) {
    if (game.food && cellToPad(game.food) === pad) return BrightRed;
    for (let index = 0; index < game.snake.length; index++) {
        if (cellToPad(game.snake[index]) === pad) return index === 0 ? BrightGreen : DeepGreen;
    }
    return Black;
}

function drawPads() {
    if (game.status === GAME_OVER) {
        for (const pad of MovePads) setLED(pad, BrightRed, needsLedResync);
        needsLedResync = false;
        return;
    }
    if (game.status === WON) {
        for (const pad of MovePads) setLED(pad, White, needsLedResync);
        needsLedResync = false;
        return;
    }
    for (const pad of MovePads) setLED(pad, padColor(pad), needsLedResync);
    needsLedResync = false;
}

function drawSnakeArt(x, y) {
    // A small pixel snake with an S-shaped body, eye, and forked tongue.
    fill_rect(x + 10, y + 5, 20, 5, 1);
    fill_rect(x + 6, y + 8, 5, 8, 1);
    fill_rect(x + 10, y + 13, 18, 5, 1);
    fill_rect(x + 25, y + 16, 5, 8, 1);
    fill_rect(x + 8, y + 21, 20, 5, 1);
    fill_rect(x + 4, y + 23, 5, 2, 1);
    // Head is intentionally larger than the body so it reads at 128x64.
    fill_rect(x + 27, y + 2, 10, 10, 1);
    fill_rect(x + 35, y + 5, 4, 5, 1);
    set_pixel(x + 33, y + 5, 0);
    fill_rect(x + 39, y + 8, 4, 1, 1);
    set_pixel(x + 43, y + 7, 1);
    set_pixel(x + 43, y + 9, 1);
}

function drawGame() {
    clear_screen();
    const title = game.status === GAME_OVER ? 'GAME OVER' : game.status === WON ? 'YOU WIN!' : 'SNAKE';
    print(Math.floor((128 - text_width(title)) / 2), 4, title, 1);
    fill_rect(0, 15, 128, 1, 1);
    drawSnakeArt(3, 18);
    print(55, 21, `SCORE ${game.score}`, 1);
    print(55, 33, `BEST  ${game.bestScore}`, 1);

    if (game.status === READY) print(55, 45, 'ARROWS/K1/K8', 1);
    else if (game.status === PAUSED) print(55, 45, 'PLAY: RESUME', 1);
    else if (game.status === GAME_OVER || game.status === WON) print(55, 45, 'JOG: RETRY', 1);
    else print(55, 45, 'RED = FOOD', 1);
    fill_rect(0, 53, 128, 1, 1);
    const keyLabel = `TRACK ${selectedTrack + 1}  ${ROOT_NAMES[selectedRoot]} ${SCALES[selectedScale].name}`;
    print(Math.floor((128 - text_width(keyLabel)) / 2), 55, keyLabel, 1);

    drawPads();
}

function updateButtonLEDs() {
    const nextState = `${game.status}:${selectedTrack}:${selectedScale}:${selectedRoot}`;
    if (nextState === ledState) return;
    const force = ledState === '';
    ledState = nextState;

    setButtonLED(MoveUp, WhiteLedDim, force);
    setButtonLED(MoveDown, WhiteLedDim, force);
    setButtonLED(MoveLeft, WhiteLedDim, force);
    setButtonLED(MoveRight, WhiteLedDim, force);
    setButtonLED(MovePlay, game.status === RUNNING ? WhiteLedDim : WhiteLedBright, force);
    setButtonLED(MoveKnob1, AzureBlue, force);
    setButtonLED(MoveKnob2, HotMagenta, force);
    setButtonLED(MoveKnob8, BrightOrange, force);
    // Track button presses and LEDs belong to Move; passthrough selects its
    // native track so MIDI In = Auto can receive Snake's food notes there.
    for (let index = 0; index < SCALES.length; index++) {
        setLED(MoveSteps[index], index === selectedScale ? White : DarkGrey, force);
    }
}

function steer(direction) {
    const wasReady = game.status === READY;
    if (game.setDirection(direction) && wasReady) {
        nextMoveAt = Date.now() + game.moveIntervalMs;
    }
}

globalThis.onMidiMessageInternal = function (data) {
    if (isNoiseMessage(data) || isCapacitiveTouchMessage(data)) return;
    const type = data[0] & 0xF0;
    if (type === 0x90 && data[2] > 0) {
        const scaleIndex = MoveSteps.indexOf(data[1]);
        if (scaleIndex >= 0 && scaleIndex < SCALES.length) {
            selectedScale = scaleIndex;
            updateButtonLEDs();
        }
        return;
    }
    if (type !== MidiCC) return;

    const cc = data[1];
    const value = data[2];
    if (cc === MoveKnob2) {
        const delta = decodeDelta(value);
        if (delta !== 0) {
            selectedRoot = ((selectedRoot + delta) % ROOT_NAMES.length + ROOT_NAMES.length) % ROOT_NAMES.length;
            updateButtonLEDs();
        }
        return;
    }
    if (cc === MoveKnob1 || cc === MoveKnob8) {
        const delta = decodeDelta(value);
        if (delta !== 0) {
            steer(cc === MoveKnob1
                ? (delta > 0 ? 'right' : 'left')
                : (delta > 0 ? 'down' : 'up'));
            updateButtonLEDs();
        }
        return;
    }
    if (value === 0) {
        pressedButtons.delete(cc);
        return;
    }
    if (pressedButtons.has(cc)) return;
    pressedButtons.add(cc);

    if (cc === MoveUp) steer('up');
    else if (cc === MoveDown) steer('down');
    else if (cc === MoveLeft) steer('left');
    else if (cc === MoveRight) steer('right');
    else if (cc >= MoveRow4 && cc <= MoveRow1) selectedTrack = MoveRow1 - cc;
    else if (cc === MovePlay || cc === MoveMainButton) {
        game.togglePause();
        nextMoveAt = Date.now() + game.moveIntervalMs;
    }
    updateButtonLEDs();
};

globalThis.onMidiMessageExternal = function () {};

globalThis.init = function () {
    releaseActiveNote();
    game.reset();
    pressedButtons.clear();
    selectedTrack = 0;
    selectedScale = 0;
    selectedRoot = 0;
    nextMoveAt = Date.now() + game.moveIntervalMs;
    ledState = '';
    needsLedResync = true;
    updateButtonLEDs();
    drawGame();
};

globalThis.tick = function () {
    const now = Date.now();
    if (activeNote && now >= activeNote.endsAt) releaseActiveNote();
    if (game.status === RUNNING && now >= nextMoveAt) {
        const oldScore = game.score;
        game.advance();
        if (game.score > oldScore) playFoodNote(now);
        nextMoveAt = now + game.moveIntervalMs;
        updateButtonLEDs();
    }
    drawGame();
};

globalThis.onUnload = function () {
    releaseActiveNote();
};
