import type { Mutation, RestrictedClient, SanityDocument } from 'sanity/migrate';
import { at, createIfNotExists, defineMigration, patch, setIfMissing } from 'sanity/migrate';

const DRAFTS_PREFIX = 'drafts.';
const VERSIONS_PREFIX = 'versions.';

/** Every version of every FAQ, with the fields the assignment came from before WEB-431. */
const FAQ_QUERY = '*[_type == "faq"] { _id, departments[] { _ref }, question, sortOrder }';

/**
 * Sorts like GROQ's `order(sortOrder asc, question asc)` did: a missing sort order comes last, and
 * questions compare by code point.
 *
 * @param a - One FAQ.
 * @param b - The other FAQ.
 * @returns A negative number when `a` comes first, a positive one when `b` does.
 */
function compareFaqs(a: FaqVersion, b: FaqVersion): number {
	const bySortOrder =
		(a.sortOrder ?? Number.POSITIVE_INFINITY) - (b.sortOrder ?? Number.POSITIVE_INFINITY);
	if (bySortOrder !== 0 && !Number.isNaN(bySortOrder)) {
		return bySortOrder;
	}

	const questionA = a.question ?? '';
	const questionB = b.question ?? '';
	return Number(questionA > questionB) - Number(questionA < questionB);
}

/**
 * Builds the `faqs` of one version of a department from the FAQ that named it in their former
 * `departments` field (WEB-431).
 *
 * The published department only gets published questions, with their published assignment, so the
 * live website does not change through the migration. A draft takes the newest version of every
 * question; a question without a published version gets the weak reference the studio itself writes
 * into a draft, which publishing the department makes strong.
 *
 * @param input - What to build the list from.
 * @param input.departmentId - The published id of the department.
 * @param input.faqs - Every version of every FAQ.
 * @param input.forDraft - Whether the list is for the draft of the department.
 * @returns The references in their former order.
 */
function buildDepartmentFaqs({
	departmentId,
	faqs,
	forDraft,
}: {
	departmentId: string;
	faqs: readonly FaqVersion[];
	forDraft: boolean;
}): DepartmentFaqReference[] {
	const published = new Map<string, FaqVersion>();
	const drafts = new Map<string, FaqVersion>();
	for (const faq of faqs) {
		if (faq._id.startsWith(DRAFTS_PREFIX)) {
			drafts.set(faq._id.slice(DRAFTS_PREFIX.length), faq);
		} else if (!faq._id.startsWith(VERSIONS_PREFIX)) {
			published.set(faq._id, faq);
		}
	}

	const candidates = forDraft
		? [...new Set([...published.keys(), ...drafts.keys()])].map((id) => ({
				id,
				version: drafts.get(id) ?? published.get(id),
			}))
		: [...published].map(([id, version]) => ({ id, version }));

	return candidates
		.filter(({ version }) => version?.departments?.some(({ _ref }) => _ref === departmentId))
		.toSorted((a, b) => compareFaqs(a.version ?? { _id: a.id }, b.version ?? { _id: b.id }))
		.map(({ id }) =>
			published.has(id)
				? { _key: id, _ref: id, _type: 'reference' }
				: {
						_key: id,
						_ref: id,
						_strengthenOnPublish: { type: 'faq' },
						_type: 'reference',
						_weak: true,
					},
		);
}

/**
 * Compares two lists of references by their targets, their order and their strength.
 *
 * @param a - One list.
 * @param b - The other list.
 * @returns `true` when both would put the same questions on the page in the same order.
 */
function isSameFaqList(
	a: readonly DepartmentFaqReference[],
	b: readonly DepartmentFaqReference[],
): boolean {
	return (
		a.length === b.length &&
		a.every((ref, index) => ref._ref === b[index]?._ref && ref._weak === b[index]._weak)
	);
}

/**
 * Adds the draft a published department needs when its draft list differs from its own list, a
 * draft question or a changed assignment belonging to it. An existing draft got its list already.
 *
 * @param input - What to decide on.
 * @param input.client - The client in the raw perspective.
 * @param input.doc - The published department.
 * @param input.draftList - The list its draft would get.
 * @param input.list - The list the published department gets.
 * @returns The mutation that creates the draft, or nothing.
 */
async function getMissingDraft({
	client,
	doc,
	draftList,
	list,
}: {
	client: Pick<RestrictedClient, 'fetch'>;
	doc: SanityDocument;
	draftList: DepartmentFaqReference[];
	list: readonly DepartmentFaqReference[];
}): Promise<Mutation[]> {
	if (isSameFaqList(list, draftList)) {
		return [];
	}

	const draftId = `${DRAFTS_PREFIX}${doc._id}`;
	if (await client.fetch<boolean>('count(*[_id == $id]) > 0', { id: draftId })) {
		return [];
	}

	const { _createdAt, _rev, _updatedAt, ...fields } = doc;
	return [createIfNotExists({ ...fields, _id: draftId, _type: doc._type, faqs: draftList })];
}

const departmentFaqs = defineMigration({
	documentTypes: ['department'],
	migrate: {
		async document(doc, context) {
			// A release version is published with its release; none existed when this ran. A department
			// that already has `faqs` was migrated or sorted by an editor.
			if (doc._id.startsWith(VERSIONS_PREFIX) || doc.faqs !== undefined) {
				return [];
			}

			const client = context.client.withConfig({ perspective: 'raw' });
			const faqs = await client.fetch<FaqVersion[]>(FAQ_QUERY);
			const isDraft = doc._id.startsWith(DRAFTS_PREFIX);
			const departmentId = isDraft ? doc._id.slice(DRAFTS_PREFIX.length) : doc._id;
			const list = buildDepartmentFaqs({ departmentId, faqs, forDraft: isDraft });
			const patches: Mutation[] =
				list.length > 0 ? [patch(doc._id, at('faqs', setIfMissing(list)))] : [];

			// The published department only holds published questions; its draft keeps the rest.
			const draftList = isDraft
				? list
				: buildDepartmentFaqs({ departmentId, faqs, forDraft: true });
			return isDraft
				? patches
				: [...patches, ...(await getMissingDraft({ client, doc, draftList, list }))];
		},
	},
	title: 'FAQ-Zuordnung in die Abteilungen übernehmen',
});

/** One version of a FAQ, as far as its former assignment goes. */
interface FaqVersion {
	_id: string;
	departments?: readonly { _ref?: string }[];
	question?: string;
	sortOrder?: number;
}

/** One entry of `department.faqs`. */
interface DepartmentFaqReference {
	_key: string;
	_ref: string;
	_strengthenOnPublish?: { type: 'faq' };
	_type: 'reference';
	_weak?: true;
}

export { buildDepartmentFaqs, type DepartmentFaqReference, type FaqVersion, isSameFaqList };
export default departmentFaqs;
