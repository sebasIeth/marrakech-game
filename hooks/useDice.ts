'use client';

import { useState, useCallback } from 'react';

export function useDice() {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);

  const animateRoll = useCallback(
    async (faces: number[], finalValue: number) => {
      setIsRolling(true);

      for (let i = 0; i < faces.length - 1; i++) {
        setDisplayValue(faces[i]);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setDisplayValue(finalValue);
      setIsRolling(false);
    },
    []
  );

  return {
    isRolling,
    displayValue,
    animateRoll,
  };
}
