import { DICE_FACES } from './constants';
import type { DiceResult } from './types';

export function rollDice(): DiceResult {
  const index = Math.floor(Math.random() * DICE_FACES.length);
  const value = DICE_FACES[index];

  // Generate animation faces (random intermediate values)
  const faces: number[] = [];
  for (let i = 0; i < 10; i++) {
    faces.push(DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)]);
  }
  faces.push(value);

  return { value, faces };
}
