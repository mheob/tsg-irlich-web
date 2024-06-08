import { RiArticleLine, RiParentLine, RiSettings5Line } from 'react-icons/ri';
import type { StructureBuilder } from 'sanity/structure';

export function deskStructure(S: StructureBuilder) {
	return S.list()
		.title('Base')
		.items([
			S.listItem()
				.title('News')
				.icon(RiArticleLine)
				.child(
					S.list()
						.title('News')
						.items([S.documentTypeListItem('post')]),
				),

			S.divider(),

			...S.documentTypeListItems().filter(listItem => {
				const id = listItem.getId();
				return (
					id && !['author', 'media.tag', 'page', 'person', 'post', 'siteSettings'].includes(id)
				);
			}),

			S.divider(),

			S.listItem()
				.title('Personen')
				.icon(RiParentLine)
				.child(
					S.list()
						.title('Personen')
						.items([S.documentTypeListItem('author'), S.documentTypeListItem('person')]),
				),

			S.divider(),

			S.listItem()
				.title('Generelles')
				.icon(RiSettings5Line)
				.child(
					S.list()
						.title('Generelles')
						.items([S.documentTypeListItem('page'), S.documentTypeListItem('siteSettings')]),
				),
		]);
}
