import { useEffect, useRef, useState, useCallback } from 'react';
import { SnakeEngine, Direction, GameState } from './SnakeEngine';

interface UseSnakeGameOptions {
    gridSize?: number;
    speed?: number;
}

export const useSnakeGame = (options: UseSnakeGameOptions = {}) => {
    const { gridSize = 20, speed = 150 } = options;
    const engineRef = useRef<SnakeEngine | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const gameLoopRef = useRef<number | null>(null);

    // Initialize engine
    useEffect(() => {
        engineRef.current = new SnakeEngine(gridSize);
        setGameState(engineRef.current.getState());

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [gridSize]);

    // Game loop
    useEffect(() => {
        if (!engineRef.current) return;

        let lastUpdate = Date.now();

        const gameLoop = () => {
            const now = Date.now();
            const delta = now - lastUpdate;

            if (delta >= speed) {
                const newState = engineRef.current!.update();
                setGameState({ ...newState });
                lastUpdate = now;
            }

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [speed]);

    const setDirection = useCallback((direction: Direction) => {
        engineRef.current?.setDirection(direction);
    }, []);

    const togglePause = useCallback(() => {
        engineRef.current?.togglePause();
        if (engineRef.current) {
            setGameState({ ...engineRef.current.getState() });
        }
    }, []);

    const reset = useCallback(() => {
        engineRef.current?.reset();
        if (engineRef.current) {
            setGameState({ ...engineRef.current.getState() });
        }
    }, []);

    const getDuration = useCallback(() => {
        return engineRef.current?.getDuration() || 0;
    }, []);

    return {
        gameState,
        setDirection,
        togglePause,
        reset,
        getDuration,
        gridSize,
    };
};
