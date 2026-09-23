export const READY = 'ready';
export const RUNNING = 'running';
export const PAUSED = 'paused';
export const GAME_OVER = 'game-over';
export const WON = 'won';

const DIRECTIONS = Object.freeze({
    up: Object.freeze({ x: 0, y: -1 }),
    down: Object.freeze({ x: 0, y: 1 }),
    left: Object.freeze({ x: -1, y: 0 }),
    right: Object.freeze({ x: 1, y: 0 })
});

function sameCell(a, b) {
    return a.x === b.x && a.y === b.y;
}

export class SnakeGame {
    constructor(width = 32, height = 13, random = Math.random) {
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 4 || height < 4) {
            throw new Error('Snake board must be at least 4x4');
        }
        this.width = width;
        this.height = height;
        this.random = random;
        this.bestScore = 0;
        this.reset();
    }

    reset() {
        const headX = Math.max(3, Math.floor(this.width / 3));
        const headY = Math.floor(this.height / 2);
        this.snake = [
            { x: headX, y: headY },
            { x: headX - 1, y: headY },
            { x: headX - 2, y: headY }
        ];
        this.direction = DIRECTIONS.right;
        this.queuedDirections = [];
        this.score = 0;
        this.status = READY;
        this.food = this.placeFood();
    }

    start() {
        if (this.status === GAME_OVER || this.status === WON) this.reset();
        this.status = RUNNING;
    }

    togglePause() {
        if (this.status === READY || this.status === GAME_OVER || this.status === WON) {
            this.start();
        } else if (this.status === RUNNING) {
            this.status = PAUSED;
        } else if (this.status === PAUSED) {
            this.status = RUNNING;
        }
    }

    setDirection(name) {
        const next = DIRECTIONS[name];
        if (!next || this.status === GAME_OVER || this.status === WON || this.queuedDirections.length >= 2) return false;
        const previous = this.queuedDirections.length > 0
            ? this.queuedDirections[this.queuedDirections.length - 1]
            : this.direction;
        if (next.x === previous.x && next.y === previous.y) return false;
        if (next.x === -previous.x && next.y === -previous.y) return false;
        this.queuedDirections.push(next);
        if (this.status === READY) this.status = RUNNING;
        return true;
    }

    get moveIntervalMs() {
        return Math.max(125, 500 - this.score * 25);
    }

    advance() {
        if (this.status !== RUNNING) return false;

        if (this.queuedDirections.length > 0) this.direction = this.queuedDirections.shift();
        const head = this.snake[0];
        const nextHead = {
            x: (head.x + this.direction.x + this.width) % this.width,
            y: (head.y + this.direction.y + this.height) % this.height
        };
        const ateFood = sameCell(nextHead, this.food);
        const collisionBody = ateFood ? this.snake : this.snake.slice(0, -1);
        const hitSelf = collisionBody.some(cell => sameCell(cell, nextHead));

        if (hitSelf) {
            this.status = GAME_OVER;
            this.bestScore = Math.max(this.bestScore, this.score);
            return true;
        }

        this.snake.unshift(nextHead);
        if (ateFood) {
            this.score += 1;
            this.bestScore = Math.max(this.bestScore, this.score);
            this.food = this.placeFood();
            if (!this.food) this.status = WON;
        } else {
            this.snake.pop();
        }
        return true;
    }

    placeFood() {
        const freeCells = this.width * this.height - this.snake.length;
        if (freeCells <= 0) return null;

        const start = Math.floor(this.random() * this.width * this.height);
        for (let offset = 0; offset < this.width * this.height; offset++) {
            const index = (start + offset) % (this.width * this.height);
            const cell = { x: index % this.width, y: Math.floor(index / this.width) };
            if (!this.snake.some(segment => sameCell(segment, cell))) return cell;
        }
        return null;
    }
}
