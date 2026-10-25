import type { Template } from 'sanity';

interface GroupByDepartmentParams {
	departmentId: string;
}

/**
 * The template behind "Neu" in the groups of a department: it creates a group whose department is
 * already set. `departmentId` is the id of the department document, which the desk passes along.
 */
const groupByDepartmentTemplate = {
	id: 'group-by-department',
	parameters: [{ name: 'departmentId', type: 'string' }],
	schemaType: 'group',
	title: 'Gruppe in Abteilung',
	value: ({ departmentId }: GroupByDepartmentParams) => ({
		department: { _ref: departmentId, _type: 'reference' },
	}),
} satisfies Template<GroupByDepartmentParams>;

export { groupByDepartmentTemplate };
export type { GroupByDepartmentParams };
