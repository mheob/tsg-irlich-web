import { defineField } from 'sanity';

import { titleField } from '@/shared/fields/general';
import { validatePdfFile } from '@/shared/fields/pdf';
import { getFieldWithoutGroup } from '@/utils/fields';

const documentDownloadField = defineField({
	fields: [
		getFieldWithoutGroup(titleField),

		defineField({
			description: 'Es können nur PDF-Dateien hochgeladen werden',
			name: 'document',
			options: {
				accept: 'application/pdf',
			},
			title: 'Dokument',
			type: 'file',
			validation: (Rule) => [
				Rule.required().error('Dokument ist erforderlich'),
				Rule.custom(validatePdfFile),
			],
		}),
	],
	name: 'documentDownload',
	title: 'Dokument zum herunterladen',
	type: 'object',
});

export default documentDownloadField;
