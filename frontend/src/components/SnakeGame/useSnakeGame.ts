import { useEffect, useRef, useState, useCallback } from 'react';
import { SnakeEngine, Direction, GameState } from './SnakeEngine';

interface UseSnakeGameOptions {
    gridSize?: number;
    speed?: number;
    timeLimit?: number;
    clicksLimit?: number;
    targetScore?: number;
}

export const useSnakeGame = (options: UseSnakeGameOptions = {}) => {
    const { gridSize = 20, speed = 150, timeLimit = 0, clicksLimit = 0, targetScore = 0 } = options;
    const engineRef = useRef<SnakeEngine | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const gameLoopRef = useRef<number | null>(null);

    // Initialize engine
    useEffect(() => {
        engineRef.current = new SnakeEngine(gridSize, timeLimit, clicksLimit, targetScore);
        setGameState(engineRef.current.getState());

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [gridSize]); // Only re-initialize on gridSize changes

    // Update constraints dynamically without resetting engine
    useEffect(() => {
        if (engineRef.current) {
            engineRef.current.updateConstraints(timeLimit, clicksLimit, targetScore);
        }
    }, [timeLimit, clicksLimit, targetScore]);

    // Game loop
    useEffect(() => {
        if (!engineRef.current) return;

        let lastUpdate = Date.now();

        const gameLoop = () => {
            const now = Date.now();
            const delta = now - lastUpdate;

            // Fail-Fast: Check constraints at 60fps
            if (engineRef.current && !engineRef.current.getState().isGameOver && !engineRef.current.getState().isPaused) {
                // The engine already handles constraints in update().
                // However, we could force a movement update here if we wanted 
                // sub-tick enforcement, but let's keep it consistent with the movement speed for now.
            }

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
