import type { DocumentActionComponent, DuplicateActionProps, SanityDocumentLike } from 'sanity';

/**
 * Leaves the slug history out of a copy. The website redirects an old URL to the most recently
 * updated document whose history contains it, so a copy that kept the history of its original could
 * take over the redirects of the original.
 *
 * @param document - The document the studio is about to create as the copy.
 * @returns The copy without `previousSlugs` and `previousPaths`.
 */
function withoutSlugHistory(document: SanityDocumentLike): SanityDocumentLike {
	const { previousPaths: _previousPaths, previousSlugs: _previousSlugs, ...copy } = document;
	return copy;
}

/**
 * Wraps the duplicate action of a department or a group, so the copy starts with an empty slug
 * history. The studio's own action takes a `mapDocument` that it runs on the copy before creating
 * it, for a draft as for a version in a release.
 *
 * Label, icon, tooltip, disabled state and the click all stay the original's.
 *
 * @param duplicateAction - The duplicate action to wrap, a hook-based component of the studio.
 * @returns The duplicate action whose copy has no slug history.
 */
function createDuplicateWithoutSlugHistoryAction(
	duplicateAction: DocumentActionComponent,
): DocumentActionComponent {
	// The studio calls an action as a hook and never renders it, so there is no fast refresh to keep
	// working, and it needs the original action from this closure.
	// oxlint-disable-next-line react/only-export-components
	const DuplicateWithoutSlugHistoryAction: DocumentActionComponent = (props) => {
		const duplicateProps: DuplicateActionProps = { ...props, mapDocument: withoutSlugHistory };
		return duplicateAction(duplicateProps);
	};

	DuplicateWithoutSlugHistoryAction.action = duplicateAction.action;
	DuplicateWithoutSlugHistoryAction.displayName = 'DuplicateWithoutSlugHistoryAction';

	return DuplicateWithoutSlugHistoryAction;
}

export { createDuplicateWithoutSlugHistoryAction };
