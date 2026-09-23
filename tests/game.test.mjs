import test from 'node:test';
import assert from 'node:assert/strict';
import { SnakeGame, READY, RUNNING, PAUSED, GAME_OVER } from '../src/game-v0.2.4.mjs';

test('starts with a three-cell snake and food outside its body', () => {
    const game = new SnakeGame(10, 7, () => 0);
    assert.equal(game.status, READY);
    assert.equal(game.snake.length, 3);
    assert.ok(!game.snake.some(cell => cell.x === game.food.x && cell.y === game.food.y));
});

test('arrow input starts the game and advances the snake', () => {
    const game = new SnakeGame(10, 7, () => 0);
    assert.equal(game.setDirection('down'), true);
    assert.equal(game.status, RUNNING);
    game.advance();
    assert.deepEqual(game.snake[0], { x: 3, y: 4 });
});

test('buffers two quick turns in order and rejects reversals', () => {
    const game = new SnakeGame(10, 7, () => 0);
    game.start();
    assert.equal(game.setDirection('left'), false);
    assert.equal(game.setDirection('up'), true);
    assert.equal(game.setDirection('left'), true);
    assert.equal(game.setDirection('down'), false);
    game.advance();
    assert.deepEqual(game.snake[0], { x: 3, y: 2 });
    game.advance();
    assert.deepEqual(game.snake[0], { x: 2, y: 2 });
    assert.equal(game.setDirection('down'), true);
});

test('caps the turn buffer and frees one slot after each move', () => {
    const game = new SnakeGame(10, 7, () => 0);
    game.start();
    assert.equal(game.setDirection('up'), true);
    assert.equal(game.setDirection('left'), true);
    assert.equal(game.setDirection('down'), false);
    game.advance();
    assert.equal(game.setDirection('down'), true);
    game.advance();
    game.advance();
    assert.deepEqual(game.snake[0], { x: 2, y: 3 });
});

test('eating grows the snake and accelerates after every score', () => {
    const game = new SnakeGame(10, 7, () => 0.9);
    game.start();
    assert.equal(game.moveIntervalMs, 500);
    game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
    const oldLength = game.snake.length;
    game.advance();
    assert.equal(game.snake.length, oldLength + 1);
    assert.equal(game.score, 1);
    assert.equal(game.bestScore, 1);
    assert.equal(game.moveIntervalMs, 475);
    game.score = 100;
    assert.equal(game.moveIntervalMs, 125);
});

test('moving into the cell vacated by the tail is legal', () => {
    const game = new SnakeGame(8, 6, () => 0);
    game.snake = [
        { x: 2, y: 2 },
        { x: 2, y: 3 },
        { x: 1, y: 3 },
        { x: 1, y: 2 }
    ];
    game.direction = { x: -1, y: 0 };
    game.queuedDirections = [];
    game.status = RUNNING;
    game.food = { x: 7, y: 5 };
    game.advance();
    assert.equal(game.status, RUNNING);
    assert.deepEqual(game.snake[0], { x: 1, y: 2 });
});

test('crossing any edge wraps to the opposite side', () => {
    const horizontal = new SnakeGame(8, 4, () => 0);
    horizontal.snake = [{ x: 7, y: 1 }, { x: 6, y: 1 }, { x: 5, y: 1 }];
    horizontal.status = RUNNING;
    horizontal.food = { x: 3, y: 3 };
    horizontal.advance();
    assert.deepEqual(horizontal.snake[0], { x: 0, y: 1 });

    const vertical = new SnakeGame(8, 4, () => 0);
    vertical.snake = [{ x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }];
    vertical.direction = { x: 0, y: -1 };
    vertical.queuedDirections = [];
    vertical.status = RUNNING;
    vertical.food = { x: 7, y: 2 };
    vertical.advance();
    assert.deepEqual(vertical.snake[0], { x: 3, y: 3 });
});

test('body collisions still end the game', () => {
    const bodyGame = new SnakeGame(8, 6, () => 0);
    bodyGame.snake = [
        { x: 3, y: 2 },
        { x: 3, y: 3 },
        { x: 2, y: 3 },
        { x: 2, y: 2 },
        { x: 2, y: 1 }
    ];
    bodyGame.direction = { x: 0, y: 1 };
    bodyGame.queuedDirections = [];
    bodyGame.status = RUNNING;
    bodyGame.food = { x: 7, y: 5 };
    bodyGame.advance();
    assert.equal(bodyGame.status, GAME_OVER);
});

test('pause toggles and game over restarts with a clean score', () => {
    const game = new SnakeGame(8, 6, () => 0);
    game.togglePause();
    assert.equal(game.status, RUNNING);
    game.togglePause();
    assert.equal(game.status, PAUSED);
    game.togglePause();
    assert.equal(game.status, RUNNING);
    game.score = 4;
    game.status = GAME_OVER;
    game.togglePause();
    assert.equal(game.status, RUNNING);
    assert.equal(game.score, 0);
    assert.equal(game.snake.length, 3);
});
