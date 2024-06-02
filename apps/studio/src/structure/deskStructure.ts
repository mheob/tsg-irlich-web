import type { StructureBuilder } from 'sanity/structure';

export function deskStructure(S: StructureBuilder) {
	return S.list()
		.title('Content')
		.items([
			...S.documentTypeListItems().filter(listItem => {
				const id = listItem.getId();
				return id && !['media.tag'].includes(id);
			}),
		]);
}
