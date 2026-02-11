'use client';

import { useState, useCallback } from 'react';
import type { Position } from '@/lib/game/types';

export function useAssam() {
  const [isMoving, setIsMoving] = useState(false);
  const [movePath, setMovePath] = useState<Position[]>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);

  const animateMove = useCallback(
    async (path: Position[], onComplete?: () => void) => {
      setIsMoving(true);
      setMovePath(path);
      setCurrentPathIndex(0);

      for (let i = 1; i < path.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        setCurrentPathIndex(i);
      }

      setIsMoving(false);
      onComplete?.();
    },
    []
  );

  const currentAnimPosition =
    movePath.length > 0 ? movePath[currentPathIndex] : null;

  return {
    isMoving,
    currentAnimPosition,
    animateMove,
    movePath,
    currentPathIndex,
  };
}
