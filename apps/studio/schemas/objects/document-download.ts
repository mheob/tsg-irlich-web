import { defineField } from 'sanity';

import { titleField } from '@/shared/fields/general';
import { getFieldWithoutGroup } from '@/utils/fields';

const documentDownloadField = defineField({
	title: 'Dokument zum herunterladen',
	name: 'documentDownload',
	type: 'object',
	fields: [
		getFieldWithoutGroup(titleField),

		defineField({
			title: 'Dokument',
			name: 'document',
			type: 'file',
			description: 'Bitte nur PDF-Dateien nutzen',
			validation: Rule => [Rule.required().error('Dokument ist erforderlich')],
		}),
	],
});

export default documentDownloadField;
