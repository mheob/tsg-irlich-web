import {
	RiArticleLine,
	RiOpenaiLine,
	RiParentLine,
	RiSettings5Line,
	RiTeamLine,
} from 'react-icons/ri';
import type { DocumentDefinition } from 'sanity';
import type { ListItemBuilder, StructureBuilder } from 'sanity/structure';

type DocumentGroup = 'groups' | 'news' | 'persons' | 'settings' | 'single-pages';

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

function getGroupGroups(S: StructureBuilder): ListItemBuilder[] {
	return [
		S.listItem()
			.title('Gruppen')
			.id('groups')
			.icon(RiTeamLine)
			.child(
				S.list()
					.title('Gruppen')
					.items([
						S.documentTypeListItem('group.admin'),
						S.documentTypeListItem('group.soccer'),
						S.documentTypeListItem('group.children-gymnastics'),
						S.documentTypeListItem('group.courses'),
						S.documentTypeListItem('group.taekwondo'),
						S.documentTypeListItem('group.dance'),
						S.documentTypeListItem('group.other-sports'),
					]),
			),
	];
}

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

function isExcludedSingletonListItem(id?: string): boolean {
	if (!id) return false;
	return !['site-settings'].includes(id);
}

function getGroupSinglePages(
	S: StructureBuilder,
	typeDefinitionArray?: DocumentDefinition[],
): ListItemBuilder[] {
	if (!typeDefinitionArray) return [];
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
							.map(typeDefinition => {
								return S.listItem()
									.title(typeDefinition.title ?? typeDefinition.name)
									.id(typeDefinition.name)
									.icon(typeDefinition.icon)
									.child(
										S.document().schemaType(typeDefinition.name).documentId(typeDefinition.name),
									);
							})
							.filter(typeDefinition => isExcludedSingletonListItem(typeDefinition.getId())),
					),
			),
	];
}

export function isExcludedDefaultListItem(id?: string): boolean {
	if (!id) return false;
	return ![
		'assist.instruction.context',
		'author',
		'group.admin',
		'group.children-gymnastics',
		'group.courses',
		'group.dance',
		'group.other-sports',
		'group.soccer',
		'group.taekwondo',
		'honoraryMember',
		'media.tag',
		'news.article',
		'news.category',
		'person',
		'role',
	].includes(id);
}

export function getGroup(
	S: StructureBuilder,
	name: DocumentGroup,
	typeDefinitionArray?: DocumentDefinition[],
): ListItemBuilder[] {
	switch (name) {
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
