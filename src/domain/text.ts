const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

export function countGraphemes(value: string): number {
  return [...graphemeSegmenter.segment(value)].length;
}
