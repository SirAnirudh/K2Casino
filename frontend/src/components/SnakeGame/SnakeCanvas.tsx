import React, { useEffect, useRef } from 'react';
import { GameState } from './SnakeEngine';

interface SnakeCanvasProps {
    gameState: GameState;
    gridSize: number;
}

const SnakeCanvas: React.FC<SnakeCanvasProps> = ({ gameState, gridSize }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cellSize = canvas.width / gridSize;

        // Clear canvas
        ctx.fillStyle = '#052c16'; // Deep Felt Green
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid (subtle)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(canvas.width, i * cellSize);
            ctx.stroke();
        }

        // Draw food (Golden Coin)
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(217, 119, 6, 0.8)';
        ctx.fillStyle = '#fbbf24'; // Golden Yellow
        ctx.beginPath();
        ctx.arc(
            gameState.food.x * cellSize + cellSize / 2,
            gameState.food.y * cellSize + cellSize / 2,
            cellSize * 0.4,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Coin detail
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Coin symbol
        ctx.fillStyle = '#d97706';
        ctx.font = `bold ${cellSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', gameState.food.x * cellSize + cellSize / 2, gameState.food.y * cellSize + cellSize / 2);

        ctx.shadowBlur = 0;

        // Draw snake
        gameState.snake.forEach((segment, index) => {
            const isHead = index === 0;

            if (isHead) {
                // Gold Head
                ctx.shadowBlur = 20;
                ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
                ctx.fillStyle = '#f59e0b';
            } else {
                // Emerald Body
                const greenValue = 110 - (index * 2);
                ctx.fillStyle = `rgb(6, ${Math.max(greenValue, 46)}, 59)`;
                ctx.shadowBlur = 0;
            }

            // Rounded rectangles for snake
            const padding = 2;
            const x = segment.x * cellSize + padding;
            const y = segment.y * cellSize + padding;
            const size = cellSize - padding * 2;
            const radius = 4;

            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + size - radius, y);
            ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
            ctx.lineTo(x + size, y + size - radius);
            ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
            ctx.lineTo(x + radius, y + size);
            ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();

            // Border for segments
            ctx.strokeStyle = isHead ? '#fff' : 'rgba(217, 119, 6, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        ctx.shadowBlur = 0;
    }, [gameState, gridSize]);

    return (
        <canvas
            ref={canvasRef}
            width={600}
            height={600}
            style={{
                border: '3px solid var(--color-accent-red)',
                boxShadow: 'var(--shadow-glow-red)',
                background: '#0a0a0a',
            }}
        />
    );
};

export default SnakeCanvas;
