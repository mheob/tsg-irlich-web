import type { NodePatch } from 'sanity/migrate';
import { at, defineMigration, unset } from 'sanity/migrate';

/**
 * Removes the former assignment of a FAQ (WEB-431). Run it only after `department-faqs`, which reads
 * these fields to fill `faqs` of the departments.
 */
export default defineMigration({
	documentTypes: ['faq'],
	migrate: {
		document({ departments, sortOrder }) {
			const patches: NodePatch[] = [];
			if (departments !== undefined) {
				patches.push(at('departments', unset()));
			}
			if (sortOrder !== undefined) {
				patches.push(at('sortOrder', unset()));
			}
			return patches;
		},
	},
	title: 'Alte FAQ-Zuordnung entfernen',
});
