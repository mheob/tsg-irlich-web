import type { DocumentActionProps } from 'sanity';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { RegenerateEchoPagesAction } from './regenerate-echo-pages';

const operation = vi.hoisted(() => ({ disabled: false as boolean | string, execute: vi.fn() }));

// The action only needs the patch operation of the studio. Calling the component as a plain
// function is enough once that hook is replaced, because it renders nothing itself.
vi.mock(import('sanity'), () => ({
	useDocumentOperation: (() => ({ patch: operation })) as never,
}));

function createProps(documents: Partial<DocumentActionProps>): DocumentActionProps {
	return {
		draft: null,
		id: 'echo-2025',
		published: null,
		type: 'echo.issue',
		...documents,
	} as DocumentActionProps;
}

const withPdf = { _id: 'echo-2025', pdf: { asset: { _ref: 'file-abc-pdf' } } };

describe('regenerate echo pages action', () => {
	beforeEach(() => {
		operation.disabled = false;
		operation.execute.mockClear();
	});

	it('unsets the render state, which hands the document back to the render webhook', () => {
		const action = RegenerateEchoPagesAction(createProps({ draft: withPdf as never }));

		action.onHandle?.();

		expect(operation.execute).toHaveBeenCalledWith([{ unset: ['render'] }]);
	});

	it('reads the published document when there is no draft', () => {
		const action = RegenerateEchoPagesAction(createProps({ published: withPdf as never }));

		expect(action).toMatchObject({ disabled: false, label: 'Seiten neu erzeugen' });
	});

	it('stays disabled without a PDF', () => {
		const action = RegenerateEchoPagesAction(createProps({}));

		expect(action).toMatchObject({ disabled: true, title: 'Zuerst eine PDF hochladen' });
	});

	it('stays disabled while the studio cannot patch the document', () => {
		operation.disabled = 'NOT_READY';

		const action = RegenerateEchoPagesAction(createProps({ draft: withPdf as never }));

		expect(action.disabled).toBe(true);
	});
});
