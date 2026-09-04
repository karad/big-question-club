const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * Counts user-perceived characters in a string.
 * @param value - Text whose grapheme clusters should be counted.
 * @returns The number of grapheme clusters.
 */
export function countGraphemes(value: string): number {
  return [...graphemeSegmenter.segment(value)].length;
}
