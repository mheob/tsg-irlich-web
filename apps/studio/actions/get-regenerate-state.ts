/**
 * Whether the pages can be generated again, and the tooltip that explains why not.
 *
 * @param document - The draft, or the published document if there is no draft.
 * @returns The `disabled` flag and the tooltip of the action.
 */
function getRegenerateState(document: Record<string, unknown> | null | undefined): {
	disabled: boolean;
	title: string;
} {
	return document?.pdf
		? { disabled: false, title: 'Erzeugt die Seiten zum Durchblättern erneut aus der PDF' }
		: { disabled: true, title: 'Zuerst eine PDF hochladen' };
}

export { getRegenerateState };
