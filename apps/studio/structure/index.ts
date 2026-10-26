import {
	RiArticleLine,
	RiBookOpenLine,
	RiOpenaiLine,
	RiParentLine,
	RiQuestionAnswerLine,
	RiSettings5Line,
	RiTeamLine,
	RiTrophyLine,
} from 'react-icons/ri';
import type { DocumentDefinition } from 'sanity';
import type { DocumentListBuilder, ListItemBuilder, StructureBuilder } from 'sanity/structure';

type DocumentGroup =
	| 'departments'
	| 'echo'
	| 'faq'
	| 'groups'
	| 'news'
	| 'persons'
	| 'settings'
	| 'single-pages';

/**
 * Returns the group for the news.
 *
 * @param S - The structure builder.
 * @returns The group for the news.
 */
function getGroupNews(S: StructureBuilder): ListItemBuilder[] {
	return [
		S.listItem()
			.title('News')
			.icon(RiArticleLine)
			.child(
				S.list()
					.title('News')
					.items([S.documentTypeListItem('news.article'), S.documentTypeListItem('news.category')]),
			),
	];
}

/**
 * Returns the group for the TSG-Echo issues, newest release first.
 *
 * @param S - The structure builder.
 * @returns The group for the TSG-Echo issues.
 */
function getGroupEcho(S: StructureBuilder): ListItemBuilder[] {
	return [
		S.listItem()
			.title('TSG-Echo')
			.id('echo')
			.icon(RiBookOpenLine)
			.child(
				S.documentTypeList('echo.issue')
					.title('TSG-Echo')
					.defaultOrdering([{ direction: 'desc', field: 'releaseDate' }]),
			),
	];
}

/**
 * Returns the group for the persons.
 *
 * @param S - The structure builder.
 * @returns The group for the persons.
 */
function getGroupPersons(S: StructureBuilder): ListItemBuilder[] {
	return [
		S.listItem()
			.title('Personen')
			.id('persons')
			.icon(RiParentLine)
			.child(
				S.list()
					.title('Personen')
					.items([
						S.documentTypeListItem('author'),
						S.documentTypeListItem('honoraryMember'),
						S.documentTypeListItem('person'),
						S.documentTypeListItem('role'),
					]),
			),
	];
}

/**
 * Returns the group for the departments, ordered like on the website.
 *
 * @param S - The structure builder.
 * @returns The group for the departments.
 */
function getGroupDepartments(S: StructureBuilder): ListItemBuilder[] {
	return [
		S.listItem()
			.title('Abteilungen')
			.id('departments')
			.icon(RiTrophyLine)
			.child(
				S.documentTypeList('department')
					.title('Abteilungen')
					.defaultOrdering([{ direction: 'asc', field: 'sortOrder' }]),
			),
	];
}

/**
 * Returns the group for the FAQ, ordered like on the department pages.
 *
 * @param S - The structure builder.
 * @returns The group for the FAQ.
 */
function getGroupFaq(S: StructureBuilder): ListItemBuilder[] {
	return [
		S.listItem()
			.title('FAQ')
			.id('faq')
			.icon(RiQuestionAnswerLine)
			.child(
				S.documentTypeList('faq')
					.title('FAQ')
					.defaultOrdering([{ direction: 'asc', field: 'sortOrder' }]),
			),
	];
}

/**
 * Returns the list of the groups of one department. "Neu" in this list creates a group that is
 * already assigned to the department.
 *
 * @param S - The structure builder.
 * @param departmentId - The id of the department document.
 * @returns The list of the groups of the department.
 */
function getGroupsOfDepartmentList(S: StructureBuilder, departmentId: string): DocumentListBuilder {
	return S.documentList()
		.title('Gruppen')
		.schemaType('group')
		.filter('_type == "group" && department._ref == $departmentId')
		.params({ departmentId })
		.defaultOrdering([{ direction: 'asc', field: 'sortOrder' }])
		.initialValueTemplates([S.initialValueTemplateItem('group-by-department', { departmentId })]);
}

/**
 * Returns the group for the groups: the departments by sort order, each opening its own groups.
 * The departments come from the documents, so a new department shows up without a change here.
 *
 * @param S - The structure builder.
 * @returns The group for the groups.
 */
function getGroupGroups(S: StructureBuilder): ListItemBuilder[] {
	return [
		S.listItem()
			.title('Gruppen')
			.id('groups')
			.icon(RiTeamLine)
			.child(
				S.documentTypeList('department')
					.title('Gruppen')
					.defaultOrdering([{ direction: 'asc', field: 'sortOrder' }])
					.child((departmentId) => getGroupsOfDepartmentList(S, departmentId)),
			),
	];
}

/**
 * Returns the group for the settings.
 *
 * @param S - The structure builder.
 * @returns The group for the settings.
 */
function getGroupSettings(S: StructureBuilder): ListItemBuilder[] {
	return [
		S.documentTypeListItem('assist.instruction.context').title('KI-Anweisungen').icon(RiOpenaiLine),
		S.listItem()
			.title('Generelle Einstellungen')
			.id('site-settings')
			.icon(RiSettings5Line)
			.child(S.document().schemaType('site-settings').documentId('site-settings')),
	];
}

/**
 * Checks if a singleton list item is excluded.
 *
 * @param id - The id of the singleton list item.
 * @returns True if the singleton list item is excluded, false otherwise.
 */
function isExcludedSingletonListItem(id?: string): boolean {
	if (!id) {
		return false;
	}
	return !['site-settings'].includes(id);
}

/**
 * Returns the group for the single pages.
 *
 * @param S - The structure builder.
 * @param typeDefinitionArray - The array of document definitions.
 * @returns The group for the single pages.
 */
function getGroupSinglePages(
	S: StructureBuilder,
	typeDefinitionArray?: DocumentDefinition[],
): ListItemBuilder[] {
	if (!typeDefinitionArray) {
		return [];
	}
	return [
		S.listItem()
			.title('Einzelseiten')
			.id('single-pages')
			.icon(RiArticleLine)
			.child(
				S.list()
					.title('Einzelseiten')
					.items(
						typeDefinitionArray
							.map((typeDefinition) =>
								S.listItem()
									.title(typeDefinition.title ?? typeDefinition.name)
									.id(typeDefinition.name)
									.icon(typeDefinition.icon)
									.child(
										S.document().schemaType(typeDefinition.name).documentId(typeDefinition.name),
									),
							)
							.filter((typeDefinition) => isExcludedSingletonListItem(typeDefinition.getId())),
					),
			),
	];
}

/**
 * Checks if a default list item is excluded.
 *
 * @param id - The id of the default list item.
 * @returns True if the default list item is excluded, false otherwise.
 */
function isExcludedDefaultListItem(id?: string): boolean {
	if (!id) {
		return false;
	}
	return ![
		'assist.instruction.context',
		'author',
		'department',
		'echo.issue',
		'faq',
		'group',
		'honoraryMember',
		'media.folder',
		'media.tag',
		'news.article',
		'news.category',
		'person',
		'role',
	].includes(id);
}

/**
 * Returns the group for the given name.
 *
 * @param S - The structure builder.
 * @param name - The name of the group.
 * @param typeDefinitionArray - The array of document definitions.
 * @returns The group for the given name.
 */
function getGroup(
	S: StructureBuilder,
	name: DocumentGroup,
	typeDefinitionArray?: DocumentDefinition[],
): ListItemBuilder[] {
	switch (name) {
		case 'departments': {
			return getGroupDepartments(S);
		}
		case 'echo': {
			return getGroupEcho(S);
		}
		case 'faq': {
			return getGroupFaq(S);
		}
		case 'news': {
			return getGroupNews(S);
		}
		case 'persons': {
			return getGroupPersons(S);
		}
		case 'groups': {
			return getGroupGroups(S);
		}
		case 'settings': {
			return getGroupSettings(S);
		}
		case 'single-pages': {
			return getGroupSinglePages(S, typeDefinitionArray);
		}
		default: {
			return getGroupSettings(S);
		}
	}
}

export { getGroup, getGroupsOfDepartmentList, isExcludedDefaultListItem };
