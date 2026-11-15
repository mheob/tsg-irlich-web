/** An entry of a list together with a React key no sibling shares. */
interface KeyedEntry<T> {
	key: string;
	value: T;
}

/**
 * Pairs every entry of a list with a React key that no other entry of the list shares. A list the
 * editors fill in can hold the same text, or the same reference, twice, and siblings with the same
 * key make React drop or mix up one of them. The key is the entry's id behind the number of its
 * occurrence (`1:Fahren`, `2:Fahren`), so it stays the same as long as the entries do, and an id
 * that itself ends in a number cannot clash with another one.
 *
 * @param entries - The entries in their order.
 * @param getId - What tells an entry apart, such as the text or the document id.
 * @returns The entries in the same order, each with its key.
 */
function withUniqueKeys<T>(entries: readonly T[], getId: (entry: T) => string): KeyedEntry<T>[] {
	const occurrences = new Map<string, number>();

	return entries.map((value) => {
		const id = getId(value);
		const occurrence = (occurrences.get(id) ?? 0) + 1;
		occurrences.set(id, occurrence);

		return { key: `${occurrence}:${id}`, value };
	});
}

export { withUniqueKeys };
