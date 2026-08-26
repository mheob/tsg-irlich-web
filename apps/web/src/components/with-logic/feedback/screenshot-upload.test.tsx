import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { uploadToLinear } from '@/actions/upload-to-linear';

import { renderWithUser } from '../../../../test-utils/render';
import { ScreenshotUpload } from './screenshot-upload';

// `screenshot-upload.tsx` imports `uploadToLinear` and calls it directly, the same way
// `feedback/form.tsx` calls `createLinearIssue` — so the boundary to mock is the action module
// itself, not `next-safe-action`'s `useAction`.
vi.mock(import('@/actions/upload-to-linear'), () => ({ uploadToLinear: vi.fn() }));

// `vi.mocked` only needs the reference to the mock function object; it is never invoked as a bare,
// unbound `this`-dependent call.
// oxlint-disable-next-line typescript/unbound-method
const mockedUploadToLinear = vi.mocked(uploadToLinear);

// Mirrors the `TEN_MB` constant in `screenshot-upload.tsx` (not exported) and the matching
// `MAX_FILE_SIZE` in `src/actions/upload-to-linear.ts` — both gate at 10MB.
const TEN_MB = 10 * 1024 * 1024;

const DROP_ZONE_LABEL = /Klicken, ziehen/u;

// `ScreenshotUpload` is a controlled component (`value`/`onChange` come from the parent) — this
// stands in for `feedback/form.tsx`'s own `useState<string[]>`, the same as the real form.
function ControlledScreenshotUpload(): ReactElement {
	const [value, setValue] = useState<string[]>([]);
	return <ScreenshotUpload onChange={setValue} value={value} />;
}

function renderUpload() {
	return renderWithUser(<ControlledScreenshotUpload />);
}

function buildImageFile(name: string, byteLength = 3): File {
	return new File([new Uint8Array(byteLength)], name, { type: 'image/png' });
}

interface Deferred<T> {
	promise: Promise<T>;
	resolve: (value: T) => void;
}

function createDeferred<T>(): Deferred<T> {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

describe('the screenshot upload', () => {
	afterEach(() => {
		mockedUploadToLinear.mockReset();
	});

	it('uploads a selected image and shows it in the preview list', async () => {
		mockedUploadToLinear.mockResolvedValue({
			data: { assetUrl: 'https://uploads.linear.app/one.png' },
		});
		const { findByRole, getByLabelText, user } = renderUpload();

		const file = buildImageFile('screenshot.png');
		await user.upload(getByLabelText(DROP_ZONE_LABEL), file);

		await expect(findByRole('img', { name: 'Screenshot 1' })).resolves.not.toBeNull();
		expect(mockedUploadToLinear).toHaveBeenCalledExactlyOnceWith({ file });
	});

	// The input carries `accept="image/png,image/jpeg,image/gif,image/webp"`, which `user.upload`
	// honours by default and would otherwise filter the mismatched file before any event fires —
	// masking the component's own `allowedTypes.includes(file.type)` guard. `applyAccept: false`
	// bypasses that so this test actually exercises the guard, the same way a user bypassing the
	// native file picker (drag-and-drop, paste) would.
	it('rejects a file of the wrong type without calling the upload action or changing the list', async () => {
		const { getByLabelText, queryAllByRole } = render(<ControlledScreenshotUpload />);
		const user = userEvent.setup({ applyAccept: false });

		const file = new File([new Uint8Array(3)], 'notes.pdf', { type: 'application/pdf' });
		await user.upload(getByLabelText(DROP_ZONE_LABEL), file);

		expect(mockedUploadToLinear).not.toHaveBeenCalled();
		expect(queryAllByRole('img')).toHaveLength(0);
	});

	it('rejects an oversized file without calling the upload action or changing the list', async () => {
		const { getByLabelText, queryAllByRole, user } = renderUpload();

		const file = buildImageFile('huge.png', TEN_MB + 1);
		await user.upload(getByLabelText(DROP_ZONE_LABEL), file);

		expect(mockedUploadToLinear).not.toHaveBeenCalled();
		expect(queryAllByRole('img')).toHaveLength(0);
	});

	it('shows the pending state while the upload is running', async () => {
		const deferred = createDeferred<Awaited<ReturnType<typeof uploadToLinear>>>();
		mockedUploadToLinear.mockReturnValue(deferred.promise);
		const { findByRole, getByLabelText, queryByRole, user } = renderUpload();

		const file = buildImageFile('screenshot.png');
		await user.upload(getByLabelText(DROP_ZONE_LABEL), file);

		// While pending, the uploading tile shows the file's own name as its `alt`; the final tile
		// (added once `value` gains the asset URL) uses `Screenshot ${index + 1}` instead — so seeing
		// the former and not the latter is the observable signal for "still uploading".
		await expect(findByRole('img', { name: 'screenshot.png' })).resolves.not.toBeNull();
		expect(queryByRole('img', { name: 'Screenshot 1' })).toBeNull();

		deferred.resolve({ data: { assetUrl: 'https://uploads.linear.app/one.png' } });

		await expect(findByRole('img', { name: 'Screenshot 1' })).resolves.not.toBeNull();
		expect(queryByRole('img', { name: 'screenshot.png' })).toBeNull();
	});

	it('removes an uploaded entry, leaving the others intact', async () => {
		mockedUploadToLinear
			.mockResolvedValueOnce({ data: { assetUrl: 'https://uploads.linear.app/one.png' } })
			.mockResolvedValueOnce({ data: { assetUrl: 'https://uploads.linear.app/two.png' } });
		const { findByRole, getByLabelText, getByRole, queryAllByRole, queryByRole, user } =
			renderUpload();

		await user.upload(getByLabelText(DROP_ZONE_LABEL), buildImageFile('one.png'));
		await findByRole('img', { name: 'Screenshot 1' });

		await user.upload(getByLabelText(DROP_ZONE_LABEL), buildImageFile('two.png'));
		await findByRole('img', { name: 'Screenshot 2' });

		const survivingSource = getByRole('img', { name: 'Screenshot 2' }).getAttribute('src');

		await user.click(getByRole('button', { name: 'Remove screenshot 1' }));

		expect(queryAllByRole('img')).toHaveLength(1);
		const remaining = getByRole('img', { name: 'Screenshot 1' });
		expect(remaining.getAttribute('src')).toBe(survivingSource);
		expect(queryByRole('button', { name: 'Remove screenshot 2' })).toBeNull();
	});

	it('surfaces an upload failure without leaving a half-added entry', async () => {
		mockedUploadToLinear.mockResolvedValue({ serverError: 'Der Server hat ein Problem.' });
		const { findByText, getByLabelText, queryAllByRole, user } = renderUpload();

		const file = buildImageFile('screenshot.png');
		await user.upload(getByLabelText(DROP_ZONE_LABEL), file);

		await expect(findByText('Der Server hat ein Problem.')).resolves.not.toBeNull();
		expect(queryAllByRole('img', { name: 'Screenshot 1' })).toHaveLength(0);
	});
});
