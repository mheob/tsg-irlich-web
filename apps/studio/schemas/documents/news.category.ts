import { RiPriceTag3Line } from 'react-icons/ri';
import { defineType } from 'sanity';

import { general, meta } from '@/shared/field-groups';
import { formattedSlugField, titleField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { newsCategoryIconField } from '@/shared/fields/news-category-icon';
import { previousSlugsField } from '@/shared/fields/slug-history';
import { getFieldWithGroup } from '@/utils/fields';
import { getPreviewIcon } from '@/utils/preview-icon';

const newsCategory = defineType({
	fields: [
		// General
		titleField,
		formattedSlugField,
		getFieldWithGroup(previousSlugsField, 'general'),
		newsCategoryIconField,

		// Meta
		metaField,
	],
	groups: [general, meta],
	icon: RiPriceTag3Line,
	name: 'news.category',
	preview: {
		// Without an icon the studio shows the type icon, the price tag.
		prepare: ({ icon, title }: { icon?: string; title?: string }) => ({
			media: getPreviewIcon(icon),
			title,
		}),
		select: {
			icon: 'icon',
			title: 'title',
		},
	},
	title: 'News-Kategorie',
	type: 'document',
});

export default newsCategory;
