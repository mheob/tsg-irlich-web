import { RiRefreshLine } from 'react-icons/ri';
import type { DocumentActionDescription, DocumentActionProps } from 'sanity';
import { useDocumentOperation } from 'sanity';

import { getRegenerateState } from './get-regenerate-state';

/**
 * Removes `render` from the document. The render webhook only fires while `render.source` differs
 * from the PDF, so this hands the document back to the render route: for a failed run, or one that
 * never finished because the platform cut it off.
 *
 * @param props - The document action props from the studio.
 * @returns The action description.
 */
function RegenerateEchoPagesAction(props: DocumentActionProps): DocumentActionDescription {
	const { patch } = useDocumentOperation(props.id, props.type);
	const { disabled, title } = getRegenerateState(props.draft ?? props.published);

	return {
		disabled: disabled || Boolean(patch.disabled),
		icon: RiRefreshLine,
		label: 'Seiten neu erzeugen',
		onHandle: () => {
			patch.execute([{ unset: ['render'] }]);
		},
		title,
	};
}

export { RegenerateEchoPagesAction };
