import { RiArticleLine, RiOpenaiLine, RiParentLine, RiSettings5Line } from 'react-icons/ri';
import type { DocumentDefinition } from 'sanity';
import type { ListItemBuilder, StructureBuilder } from 'sanity/structure';

type DocumentGroup = 'default' | 'persons' | 'settings' | 'singletons';

export function isExcludedDefaultListItem(id?: string) {
	if (!id) return false;
	return ![
		'assist.instruction.context',
		'author',
		'media.tag',
		'news.article',
		'news.category',
		'person',
	].includes(id);
}

export function isExcludedSingletonListItem(id?: string) {
	if (!id) return false;
	return !['site-settings'].includes(id);
}

export function getGroup(
	S: StructureBuilder,
	name: DocumentGroup,
	typeDefArray?: DocumentDefinition[],
): ListItemBuilder[] {
	switch (name) {
		case 'default':
			return getGroupNews(S);
		case 'persons':
			return getGroupPersons(S);
		case 'settings':
			return getGroupSettings(S);
		case 'singletons':
			return getGroupSingletons(S, typeDefArray);
		default:
			return getGroupSettings(S);
	}
}

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
			.icon(RiParentLine)
			.child(
				S.list()
					.title('Personen')
					.items([S.documentTypeListItem('author'), S.documentTypeListItem('person')]),
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

function getGroupSingletons(
	S: StructureBuilder,
	typeDefArray?: DocumentDefinition[],
): ListItemBuilder[] {
	if (!typeDefArray) return [];
	return [
		S.listItem()
			.title('Einzelseiten')
			.id('single-pages')
			.icon(RiArticleLine)
			.child(
				S.list()
					.title('Einzelseiten')
					.items(
						typeDefArray
							.map(typeDef => {
								return S.listItem()
									.title(typeDef.title || typeDef.name)
									.id(typeDef.name)
									.icon(typeDef.icon)
									.child(S.document().schemaType(typeDef.name).documentId(typeDef.name));
							})
							.filter(typeDef => isExcludedSingletonListItem(typeDef.getId())),
					),
			),
	];
}
