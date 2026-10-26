import { RiQuestionAnswerLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

// Optional, so the page stays valid until the editors fill it in: the website falls back to
// "Häufige Fragen" and "FAQ".
export const faqField = defineField({
	fields: [...getDefaultPageSectionFieldsWithGroup()],
	group: 'faq',
	icon: RiQuestionAnswerLine,
	name: 'faqSection',
	title: 'FAQ',
	type: 'object',
});
