import { defineArrayMember, defineField } from 'sanity';

/**
 * Extra words the website search matches a department or group by, next to its title. They help
 * with spellings and synonyms the title does not carry and never appear on the website.
 */
const searchTermsField = defineField({
	description:
		'Weitere Begriffe, unter denen die Website-Suche diese Seite findet, etwa „Erste Mannschaft“ für „1. Mannschaft“ oder „Fussball“ für „Fußball“. Sie erscheinen nicht auf der Website.',
	name: 'searchTerms',
	of: [defineArrayMember({ type: 'string' })],
	options: { layout: 'tags' },
	title: 'Suchbegriffe',
	type: 'array',
});

export { searchTermsField };
