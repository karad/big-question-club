import { describe, expect, it } from 'vitest';
import {
  createQuestionListPage,
  parsePage,
  QUESTION_PAGE_SIZE,
} from '../../src/domain/question-listing';

describe('question pagination', () => {
  it.each([
    [undefined, 1],
    ['', 1],
    ['0', 1],
    ['-1', 1],
    ['1.5', 1],
    ['2', 2],
    ['99999999999999999999', 1],
  ])('parses %s safely', (input, expected) => expect(parsePage(input)).toBe(expected));
  it('calculates stable page metadata for empty and boundary totals', () => {
    expect(createQuestionListPage([], 0, 1)).toMatchObject({
      pageSize: QUESTION_PAGE_SIZE,
      totalPages: 1,
    });
    expect(createQuestionListPage([], 21, 2)).toMatchObject({ page: 2, totalPages: 2 });
  });
});
