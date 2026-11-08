import { RiFileTextLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { defaultHeroFields } from '@/shared/fields/general';
import { getFieldWithoutGroup } from '@/utils/fields';

const newsArticlePage = defineType({
	// ?: the "slug" and `meta` comes from the news article itself; this page is rather the layout.
	// Two fields need no tabs, and a single tab next to "Alle Felder" only costs a click.
	fields: defaultHeroFields.map((field) => getFieldWithoutGroup(field)),
	icon: RiFileTextLine,
	name: 'news-article-page',
	preview: {
		prepare: () => ({ title: 'Einzelner News-Artikel' }),
	},
	title: 'Einzelner News-Artikel',
	type: 'document',
});

export default newsArticlePage;
