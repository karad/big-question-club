export type AnonymousParticipantVisual = {
  background: string;
  foreground: string;
  cells: ReadonlyArray<readonly [number, number]>;
};

const palettes = [
  { background: '#ffe8d8', foreground: '#a83800' },
  { background: '#f7dfc5', foreground: '#7a411f' },
  { background: '#ffdfbd', foreground: '#bd4700' },
  { background: '#f1e1cf', foreground: '#6d4933' },
] as const;

/**
 * Derives a stable anonymous avatar palette and pattern for an answer.
 * @param questionId - Identifier of the containing question.
 * @param answerId - Identifier of the answer.
 * @returns A deterministic visual identity for the participant.
 */
export function createAnonymousParticipantVisual(
  questionId: string,
  answerId: string,
): AnonymousParticipantVisual {
  let state = hash(`${questionId}\u001f${answerId}`);
  const palette = palettes[state % palettes.length] ?? palettes[0];
  const cells: Array<readonly [number, number]> = [];

  // Generate only the left half plus the center column so mirroring always produces a symmetric avatar.
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 3; x += 1) {
      state = next(state);
      if ((state & 3) === 0 && !(x === 2 && y === 2)) continue;
      cells.push([x, y]);
      if (x !== 2) cells.push([4 - x, y]);
    }
  }

  return { ...palette, cells };
}

function hash(value: string): number {
  let result = 2_166_136_261;
  for (const character of value) {
    result ^= character.codePointAt(0) ?? 0;
    result = Math.imul(result, 16_777_619);
  }
  return result >>> 0;
}

function next(value: number): number {
  let result = value || 0x9e3779b9;
  result ^= result << 13;
  result ^= result >>> 17;
  result ^= result << 5;
  return result >>> 0;
}
