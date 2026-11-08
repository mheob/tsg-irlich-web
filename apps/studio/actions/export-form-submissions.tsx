import { useToast } from '@sanity/ui/toast';
import { RiFileExcel2Line } from 'react-icons/ri';
import type { DocumentActionDescription, DocumentActionProps } from 'sanity';
import { useClient } from 'sanity';

import { buildExportSheets, settle } from '@tsgi-web/shared';

import { loadExportData } from './load-export-data';
import { writeWorkbook } from './write-workbook';

const API_VERSION = '2026-10-01';

const NOT_PUBLISHED_TITLE = 'Erst veröffentlichen';

/** Forms whose export is running, so a second click cannot start a second download. */
const runningIds = new Set<string>();

const berlinDate = new Intl.DateTimeFormat('en-CA', {
	day: '2-digit',
	month: '2-digit',
	timeZone: 'Europe/Berlin',
	year: 'numeric',
});

async function exportSubmissions(
	client: ReturnType<typeof useClient>,
	formId: string,
): Promise<boolean> {
	const { fields, slug, submissions } = await loadExportData(client, formId);
	if (submissions.length === 0) {
		return false;
	}

	await writeWorkbook(
		buildExportSheets(fields, submissions),
		`${slug}-${berlinDate.format(new Date())}.xlsx`,
	);
	return true;
}

/**
 * Writes all submissions of the form into an Excel file the editor downloads.
 *
 * @param props - The document action props from the studio.
 * @returns The action description.
 */
function ExportFormSubmissionsAction(props: DocumentActionProps): DocumentActionDescription {
	const client = useClient({ apiVersion: API_VERSION });
	const toast = useToast();
	const isPublished = Boolean(props.published);

	return {
		disabled: !isPublished,
		icon: RiFileExcel2Line,
		label: 'Als Excel exportieren',
		onHandle: async () => {
			if (runningIds.has(props.id)) {
				return;
			}

			runningIds.add(props.id);
			const outcome = await settle(exportSubmissions(client, props.id));
			runningIds.delete(props.id);

			if (!outcome.ok) {
				console.error('The submissions could not be exported', outcome.error);
				toast.push({ closable: true, status: 'error', title: 'Export fehlgeschlagen' });
			} else if (!outcome.value) {
				toast.push({ closable: true, status: 'info', title: 'Noch keine Eingänge' });
			}
		},
		title: isPublished ? undefined : NOT_PUBLISHED_TITLE,
	};
}

export { ExportFormSubmissionsAction };
