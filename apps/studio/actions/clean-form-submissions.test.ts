import type { DocumentActionProps } from 'sanity';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { CleanFormSubmissionsAction } from './clean-form-submissions';

const studio = vi.hoisted(() => ({
	cleanSubmissions: vi.fn(),
	dialogOpen: false,
	pushToast: vi.fn(),
}));

// The action keeps only the open state of its dialog in React. Calling it as a plain function is
// enough once that hook is replaced by a variable the test can flip.
vi.mock(import('react'), () => ({
	useState: (() => [
		studio.dialogOpen,
		(open: boolean) => {
			studio.dialogOpen = open;
		},
	]) as never,
}));

vi.mock(import('sanity'), () => ({
	useClient: (() => ({})) as never,
}));

vi.mock(import('@sanity/ui/toast'), () => ({
	useToast: (() => ({ push: studio.pushToast })) as never,
}));

vi.mock(import('./clean-submissions'), () => ({
	cleanSubmissions: studio.cleanSubmissions as never,
}));

function createProps(documents: Partial<DocumentActionProps>): DocumentActionProps {
	return {
		draft: null,
		id: 'form-1',
		published: { _id: 'form-1' },
		type: 'form',
		...documents,
	} as DocumentActionProps;
}

/**
 * Opens the dialog and runs its confirm handler.
 *
 * @param props - The props of the action.
 */
async function confirm(props: DocumentActionProps): Promise<void> {
	studio.dialogOpen = true;
	const dialog = CleanFormSubmissionsAction(props).dialog as unknown as {
		onConfirm: () => Promise<void>;
	};
	await dialog.onConfirm();
}

describe('clean form submissions action', () => {
	beforeEach(() => {
		studio.cleanSubmissions.mockReset().mockResolvedValue(3);
		studio.dialogOpen = false;
		studio.pushToast.mockReset();
	});

	it('is disabled before the first publish', () => {
		const action = CleanFormSubmissionsAction(createProps({ published: null }));

		expect(action).toMatchObject({
			disabled: true,
			label: 'Jetzt bereinigen',
			title: 'Erst veröffentlichen',
		});
	});

	it('asks for confirmation', () => {
		const props = createProps({});
		const first = CleanFormSubmissionsAction(props);

		expect(first.dialog).toBeUndefined();

		first.onHandle?.();
		const opened = CleanFormSubmissionsAction(props);

		expect(opened.dialog).toMatchObject({
			message:
				'Adressen und Geburtsdaten aller Eingänge dieses Formulars jetzt bereinigen? Das lässt sich nicht rückgängig machen.',
			type: 'confirm',
		});
	});

	it('toasts the cleaned count', async () => {
		const props = createProps({});

		await confirm(props);

		expect(studio.cleanSubmissions).toHaveBeenCalledWith(expect.anything(), 'form-1');
		expect(studio.pushToast).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ status: 'success', title: '3 Eingänge bereinigt' }),
		);
	});

	it('toasts a failure', async () => {
		vi.spyOn(console, 'error').mockReturnValue();
		studio.cleanSubmissions.mockRejectedValue(new Error('offline'));
		const props = createProps({});

		await confirm(props);

		expect(studio.pushToast).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ status: 'error', title: 'Bereinigung fehlgeschlagen' }),
		);
	});

	it('closes the dialog on cancel', () => {
		const props = createProps({});
		studio.dialogOpen = true;
		const dialog = CleanFormSubmissionsAction(props).dialog as unknown as { onCancel: () => void };

		dialog.onCancel();

		expect(studio.dialogOpen).toBe(false);
	});
});
