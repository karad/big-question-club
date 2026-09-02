export type FakeD1Result<T> = { success: boolean; results: T[] };

export function createD1Result<T>(results: T[] = []): FakeD1Result<T> {
  return { success: true, results };
}

export function createD1Failure(): FakeD1Result<never> {
  return { success: false, results: [] };
}
