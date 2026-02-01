export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Position = { x: number; y: number };

export interface GameState {
    snake: Position[];
    food: Position;
    direction: Direction;
    score: number;
    clicks: number;
    isGameOver: boolean;
    isPaused: boolean;
}

export class SnakeEngine {
    private gridSize: number;
    private state: GameState;
    private startTime: number;
    private timeLimit: number = 0;
    private clicksLimit: number = 0;
    private targetScore: number = 0;

    constructor(gridSize: number = 20, timeLimit: number = 0, clicksLimit: number = 0, targetScore: number = 0) {
        this.gridSize = gridSize;
        this.timeLimit = timeLimit;
        this.clicksLimit = clicksLimit;
        this.targetScore = targetScore;
        this.startTime = Date.now();
        this.state = this.initializeGame();
    }

    private initializeGame(): GameState {
        const centerX = Math.floor(this.gridSize / 2);
        const centerY = Math.floor(this.gridSize / 2);

        return {
            snake: [
                { x: centerX, y: centerY },
                { x: centerX - 1, y: centerY },
                { x: centerX - 2, y: centerY },
            ],
            food: this.generateFood([
                { x: centerX, y: centerY },
                { x: centerX - 1, y: centerY },
                { x: centerX - 2, y: centerY },
            ]),
            direction: 'RIGHT',
            score: 0,
            clicks: 0,
            isGameOver: false,
            isPaused: false,
        };
    }

    private generateFood(snake: Position[]): Position {
        let food: Position;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            food = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize),
            };
            attempts++;
        } while (
            attempts < maxAttempts &&
            snake.some((segment) => segment.x === food.x && segment.y === food.y)
        );

        return food;
    }

    public setDirection(newDirection: Direction): void {
        if (this.state.isGameOver || this.state.isPaused) return;

        // Prevent reversing direction
        const opposites: Record<Direction, Direction> = {
            UP: 'DOWN',
            DOWN: 'UP',
            LEFT: 'RIGHT',
            RIGHT: 'LEFT',
        };

        if (opposites[newDirection] !== this.state.direction) {
            this.state.direction = newDirection;
            this.state.clicks += 1;
        }
    }

    public togglePause(): void {
        if (!this.state.isGameOver) {
            this.state.isPaused = !this.state.isPaused;
        }
    }

    public update(): GameState {
        if (this.state.isGameOver || this.state.isPaused) {
            return this.state;
        }

        // Fail-Fast: Check Constraints
        const duration = this.getDuration();
        if (this.timeLimit > 0 && duration > this.timeLimit) {
            this.state.isGameOver = true;
            return this.state;
        }

        if (this.clicksLimit > 0 && this.state.clicks > this.clicksLimit) {
            this.state.isGameOver = true;
            return this.state;
        }

        const head = this.state.snake[0];
        let newHead: Position;

        // Calculate new head position based on direction
        switch (this.state.direction) {
            case 'UP':
                newHead = { x: head.x, y: head.y - 1 };
                break;
            case 'DOWN':
                newHead = { x: head.x, y: head.y + 1 };
                break;
            case 'LEFT':
                newHead = { x: head.x - 1, y: head.y };
                break;
            case 'RIGHT':
                newHead = { x: head.x + 1, y: head.y };
                break;
        }

        // Check wall collision
        if (
            newHead.x < 0 ||
            newHead.x >= this.gridSize ||
            newHead.y < 0 ||
            newHead.y >= this.gridSize
        ) {
            this.state.isGameOver = true;
            return this.state;
        }

        // Check self collision
        if (
            this.state.snake.some(
                (segment) => segment.x === newHead.x && segment.y === newHead.y
            )
        ) {
            this.state.isGameOver = true;
            return this.state;
        }

        // Add new head
        const newSnake = [newHead, ...this.state.snake];

        // Check food collision
        if (newHead.x === this.state.food.x && newHead.y === this.state.food.y) {
            this.state.score += 1;
            this.state.food = this.generateFood(newSnake);

            // Win-Fast: Immediate victory
            if (this.targetScore > 0 && this.state.score >= this.targetScore) {
                this.state.isGameOver = true;
                this.state.snake = newSnake;
                return this.state;
            }
        } else {
            // Remove tail if no food eaten
            newSnake.pop();
        }

        this.state.snake = newSnake;
        return this.state;
    }

    public getState(): GameState {
        return { ...this.state };
    }

    public getGridSize(): number {
        return this.gridSize;
    }

    public getDuration(): number {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    public reset(): void {
        this.startTime = Date.now();
        this.state = this.initializeGame();
    }

    public updateConstraints(timeLimit: number, clicksLimit: number, targetScore: number): void {
        this.timeLimit = timeLimit;
        this.clicksLimit = clicksLimit;
        this.targetScore = targetScore;
    }
}
