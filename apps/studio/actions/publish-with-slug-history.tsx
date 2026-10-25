import { useToast } from '@sanity/ui/toast';
import type { DocumentActionComponent, SanityClient, SanityDocument } from 'sanity';
import { useClient, useDocumentOperation } from 'sanity';

import { settle } from '@tsgi-web/shared';

import { getSlugHistoryPatch } from '@/utils/slug-history';

const SLUG_HISTORY_API_VERSION = '2026-10-01';

const DEPARTMENT_SLUGS_QUERY = '*[_id in $ids]{ _id, "slug": slug.current }';

/**
 * How long the lookup of the department slugs may take. The client's own limit is five minutes,
 * and the history is not worth keeping an editor waiting that long: publishing goes on without it.
 */
const DEPARTMENT_SLUGS_TIMEOUT_MS = 5000;

/** What an editor is told when the history could not be saved, and which field to fill in by hand. */
const DEPARTMENT_HISTORY_FAILED = {
	description: 'Bitte unter „Frühere Slugs“ von Hand eintragen.',
	title: 'Der frühere Slug konnte nicht gespeichert werden.',
};
const GROUP_HISTORY_FAILED = {
	description: 'Bitte unter „Frühere Adressen“ von Hand eintragen.',
	title: 'Die frühere Adresse konnte nicht gespeichert werden.',
};

/** The fields of a department or a group that its slug history reads. */
interface SlugHistoryDocument {
	department?: { _ref?: string };
	previousPaths?: string[];
	previousSlugs?: string[];
	slug?: { current?: string };
}

interface DepartmentSlug {
	_id: string;
	slug?: string | null;
}

interface ResolveSlugHistoryPatchOptions {
	client: Pick<SanityClient, 'fetch'>;
	draft: SanityDocument | null;
	published: SanityDocument | null;
	type: string;
}

/**
 * Reads the fields of a department or group document.
 *
 * @param document - A draft or published document of one of those types.
 * @returns The fields the slug history reads.
 */
function readDocument(document: SanityDocument): SlugHistoryDocument {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return document as SlugHistoryDocument;
}

/**
 * Works out what a draft has to remember about the published document before it replaces it. A
 * group's path needs the slugs of its departments, which are looked up in one request.
 *
 * @param options - The studio client and the type, the draft and the published document.
 * @param options.client - The client that looks up the departments.
 * @param options.draft - The draft that is about to be published.
 * @param options.published - The published document it replaces.
 * @param options.type - The type of the document.
 * @returns The fields to set on the draft, or `undefined` when there is nothing to remember.
 */
async function resolveSlugHistoryPatch({
	client,
	draft,
	published,
	type,
}: ResolveSlugHistoryPatchOptions): Promise<Record<string, string[]> | undefined> {
	if (!draft || !published) {
		return undefined;
	}

	const draftFields = readDocument(draft);
	const publishedFields = readDocument(published);

	if (type === 'department') {
		return getSlugHistoryPatch({
			draft: { previousSlugs: draftFields.previousSlugs, slug: draftFields.slug?.current },
			published: { slug: publishedFields.slug?.current },
			type,
		});
	}

	const draftDepartmentId = draftFields.department?._ref;
	const publishedDepartmentId = publishedFields.department?._ref;
	if (!draftDepartmentId || !publishedDepartmentId) {
		return undefined;
	}
	if (
		draftDepartmentId === publishedDepartmentId &&
		draftFields.slug?.current === publishedFields.slug?.current
	) {
		// The same department and the same slug make the same path, so there is nothing to look up.
		return undefined;
	}

	// References point at published documents, so the slugs are the ones the website serves.
	const departments = await client.fetch<DepartmentSlug[]>(
		DEPARTMENT_SLUGS_QUERY,
		{ ids: [publishedDepartmentId, draftDepartmentId] },
		{ perspective: 'published', timeout: DEPARTMENT_SLUGS_TIMEOUT_MS },
	);
	const getDepartmentSlug = (id: string): string | undefined =>
		departments.find((department) => department._id === id)?.slug ?? undefined;

	return getSlugHistoryPatch({
		draft: {
			departmentSlug: getDepartmentSlug(draftDepartmentId),
			previousPaths: draftFields.previousPaths,
			slug: draftFields.slug?.current,
		},
		published: {
			departmentSlug: getDepartmentSlug(publishedDepartmentId),
			slug: publishedFields.slug?.current,
		},
		type: 'group',
	});
}

/**
 * Wraps the publish action of a department or a group. Before the original runs, it records what
 * the published document was called (its slug, or for a group its `<department>/<group>` path), so
 * the website can redirect the old URL.
 *
 * Label, icon, shortcut, tone, dialog and disabled state all stay the original's; only `onHandle`
 * does something first. A history that cannot be worked out never blocks publishing.
 *
 * @param publishAction - The publish action to wrap, a hook-based component of the studio.
 * @returns The publish action that remembers former slugs.
 */
function createPublishWithSlugHistoryAction(
	publishAction: DocumentActionComponent,
): DocumentActionComponent {
	// Documents whose click still waits for the departments. The button stays enabled meanwhile, so
	// a second click must not publish a second time.
	const pendingIds = new Set<string>();

	// The studio calls an action as a hook and never renders it, so there is no fast refresh to keep
	// working, and it needs the original action and the pending ids from this closure.
	// oxlint-disable-next-line react/only-export-components
	const PublishWithSlugHistoryAction: DocumentActionComponent = (props) => {
		const original = publishAction(props);
		const client = useClient({ apiVersion: SLUG_HISTORY_API_VERSION });
		const { patch } = useDocumentOperation(props.id, props.type);
		const toast = useToast();

		const onHandleOriginal = original?.onHandle;
		if (!original || !onHandleOriginal) {
			return original;
		}

		return {
			...original,
			onHandle: async () => {
				if (pendingIds.has(props.id)) {
					return;
				}

				pendingIds.add(props.id);
				const outcome = await settle(
					resolveSlugHistoryPatch({
						client,
						draft: props.draft,
						published: props.published,
						type: props.type,
					}),
				);
				pendingIds.delete(props.id);

				if (outcome.ok) {
					if (outcome.value) {
						patch.execute([{ set: outcome.value }]);
					}
				} else {
					// Publishing goes on, so the editor has to hear that the history is theirs to fill in.
					console.warn('The slug history could not be worked out before publishing', outcome.error);
					toast.push({
						...(props.type === 'department' ? DEPARTMENT_HISTORY_FAILED : GROUP_HISTORY_FAILED),
						closable: true,
						status: 'warning',
					});
				}
				onHandleOriginal();
			},
		};
	};

	PublishWithSlugHistoryAction.action = publishAction.action;
	PublishWithSlugHistoryAction.displayName = 'PublishWithSlugHistoryAction';

	return PublishWithSlugHistoryAction;
}

export { createPublishWithSlugHistoryAction };
