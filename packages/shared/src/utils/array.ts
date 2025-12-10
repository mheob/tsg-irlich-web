/**
 * Shuffles an array using the Fisher-Yates shuffle algorithm.
 *
 * @param array - The array to shuffle.
 * @returns The shuffled array.
 */
export function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const index = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[index]] = [shuffled[index], shuffled[i]];
	}
	return shuffled;
}
