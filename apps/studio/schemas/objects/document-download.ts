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
			description: 'Es können nur PDF-Dateien hochgeladen werden',
			options: {
				accept: 'application/pdf',
			},
			validation: (Rule) => [
				Rule.required().error('Dokument ist erforderlich'),
				Rule.custom((file) => {
					if (!file) return true; // let required() handle this

					const asset = file.asset as { mimeType?: string };
					return asset?.mimeType && asset.mimeType !== 'application/pdf'
						? 'Nur PDF-Dateien sind erlaubt'
						: true;
				}),
			],
		}),
	],
});

export default documentDownloadField;
