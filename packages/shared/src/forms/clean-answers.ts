import type { FormAnswer, FormGroupAnswer, FormGroupEntry } from './types';

const YEAR_LENGTH = 4;

function cleanAnswer<T extends FormAnswer | FormGroupAnswer>(answer: T): T {
	if (answer.retention === 'delete') {
		const copy = { ...answer };
		delete copy.value;
		delete copy.values;
		return copy;
	}

	if (answer.retention === 'year' && answer.value) {
		return { ...answer, value: answer.value.slice(0, YEAR_LENGTH) };
	}

	return answer;
}

function cleanEntry(entry: FormGroupEntry): FormGroupEntry {
	return { ...entry, answers: entry.answers.map((groupAnswer) => cleanAnswer(groupAnswer)) };
}

function cleanGroupEntries(answer: FormAnswer): FormAnswer {
	const entries = answer.entries?.map((entry) => cleanEntry(entry));

	return entries ? { ...answer, entries } : answer;
}

/**
 * Applies the retention of every answer: `delete` drops the value, `year` cuts a date to its year.
 * Answers inside group entries are cleaned the same way. The input stays untouched and cleaning an
 * already cleaned list changes nothing.
 *
 * @param answers - The stored answers of a submission.
 * @returns The cleaned copy of the answers.
 */
function cleanAnswers(answers: readonly FormAnswer[]): FormAnswer[] {
	return answers.map((answer) => cleanGroupEntries(cleanAnswer(answer)));
}

export { cleanAnswers };
