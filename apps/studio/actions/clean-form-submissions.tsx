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
	'Die als „löschen“ markierten Angaben aller noch nicht bereinigten Eingänge jetzt löschen und Datumsangaben auf das Jahr kürzen, unabhängig vom Datum „Bereinigen ab“? Das lässt sich nicht rückgängig machen.';

/**
 * The toast after a clean-up: „1 Eingang bereinigt“, otherwise „n Eingänge bereinigt“.
 *
 * @param count - How many submissions were cleaned.
 * @returns The title of the toast.
 */
function cleanedTitle(count: number): string {
	return `${count} ${count === 1 ? 'Eingang' : 'Eingänge'} bereinigt`;
}

/**
 * Applies the retention of every answer to all submissions of the form that were not cleaned yet,
 * right away and whatever `cleanupAt` says, after the editor confirmed it. The daily clean-up only
 * reaches a form once its `cleanupAt` has begun.
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
								title: cleanedTitle(outcome.value),
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
