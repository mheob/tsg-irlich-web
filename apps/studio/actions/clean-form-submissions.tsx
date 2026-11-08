import { useToast } from '@sanity/ui/toast';
import { useState } from 'react';
import { RiEraserLine } from 'react-icons/ri';
import type { DocumentActionDescription, DocumentActionProps } from 'sanity';
import { useClient } from 'sanity';

import { settle } from '@tsgi-web/shared';

import { cleanSubmissions } from './clean-submissions';

const API_VERSION = '2026-10-01';

const NOT_PUBLISHED_TITLE = 'Erst veröffentlichen';

const CONFIRM_MESSAGE =
	'Adressen und Geburtsdaten aller Eingänge dieses Formulars jetzt bereinigen? Das lässt sich nicht rückgängig machen.';

/**
 * Cleans the addresses and birth dates in all submissions of the form right away, instead of
 * waiting for the scheduled clean-up, after the editor confirmed it.
 *
 * @param props - The document action props from the studio.
 * @returns The action description.
 */
function CleanFormSubmissionsAction(props: DocumentActionProps): DocumentActionDescription {
	const client = useClient({ apiVersion: API_VERSION });
	const toast = useToast();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const isPublished = Boolean(props.published);

	const close = (): void => {
		setIsDialogOpen(false);
	};

	return {
		dialog: isDialogOpen
			? {
					message: CONFIRM_MESSAGE,
					onCancel: close,
					onConfirm: async () => {
						const outcome = await settle(cleanSubmissions(client, props.id));
						if (outcome.ok) {
							toast.push({
								closable: true,
								status: 'success',
								title: `${outcome.value} Eingänge bereinigt`,
							});
						} else {
							console.error('The submissions could not be cleaned', outcome.error);
							toast.push({ closable: true, status: 'error', title: 'Bereinigung fehlgeschlagen' });
						}
						close();
					},
					type: 'confirm',
				}
			: undefined,
		disabled: !isPublished,
		icon: RiEraserLine,
		label: 'Jetzt bereinigen',
		onHandle: () => {
			setIsDialogOpen(true);
		},
		title: isPublished ? undefined : NOT_PUBLISHED_TITLE,
	};
}

export { CleanFormSubmissionsAction };
