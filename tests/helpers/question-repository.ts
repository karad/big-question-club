import type { Answer, Question } from '../../src/domain/question';
import type { QuestionRepository, SubmitResult } from '../../src/repositories/question-repository';

export function createInMemoryQuestionRepository({
  question,
  answers = [],
}: {
  question: Question;
  answers?: Answer[];
}): QuestionRepository {
  const storedAnswers = [...answers];
  return {
    async getQuestion(id) {
      return id === question.id ? question : null;
    },
    async submit(questionId, userId, input, now): Promise<SubmitResult> {
      if (questionId !== question.id) return { kind: 'missing' };
      if (storedAnswers.some((answer) => answer.userId === userId)) return { kind: 'duplicate' };
      const answer: Answer = {
        id: `answer-${storedAnswers.length + 1}`,
        questionId,
        userId,
        body: input.answer,
        excerpt: input.excerpt,
        createdAt: now,
      };
      storedAnswers.push(answer);
      return { kind: 'submitted', answer };
    },
    async getMine(questionId, userId) {
      return (
        storedAnswers.find(
          (answer) => answer.questionId === questionId && answer.userId === userId,
        ) ?? null
      );
    },
    async countAnswers(questionId) {
      return storedAnswers.filter((answer) => answer.questionId === questionId).length;
    },
    async listExcerpts(questionId) {
      return storedAnswers
        .filter((answer) => answer.questionId === questionId)
        .map(({ id, excerpt }) => ({ id, excerpt }));
    },
    async getAnswerBody(questionId, answerId) {
      return (
        storedAnswers.find((answer) => answer.questionId === questionId && answer.id === answerId)
          ?.body ?? null
      );
    },
  };
}

export function createAnswer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: 'answer-1',
    questionId: 'question-1',
    userId: 'user-1',
    body: 'A private answer body.',
    excerpt: 'A one-line excerpt.',
    createdAt: 10,
    ...overrides,
  };
}

export const openQuestion: Question = {
  id: 'question-1',
  body: 'What makes an answer useful?',
  closesAt: 100,
  createdAt: 0,
};
