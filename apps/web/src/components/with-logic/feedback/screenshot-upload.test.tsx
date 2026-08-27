import { fireEvent, render } from '@testing-library/react';
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
function ControlledScreenshotUpload({
	disabled,
	maxFiles,
}: Readonly<{ disabled?: boolean; maxFiles?: number }> = {}): ReactElement {
	const [value, setValue] = useState<string[]>([]);
	return (
		<ScreenshotUpload disabled={disabled} maxFiles={maxFiles} onChange={setValue} value={value} />
	);
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

/**
 * Builds a drag event carrying the given files, the way a browser hands one to a drop zone.
 *
 * jsdom has no `DataTransfer`, so the payload is attached to a plain event object.
 *
 * @param type - The event to build, for example `drop` or `dragover`.
 * @param files - The files the event carries.
 * @returns The event, ready to be dispatched.
 */
function buildDragEvent(type: string, files: File[] = []): Event {
	const event = new Event(type, { bubbles: true, cancelable: true });
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	(event as Event & { dataTransfer: unknown }).dataTransfer = { files };
	return event;
}

/**
 * Builds a paste event carrying the given files as clipboard items.
 *
 * jsdom has no `ClipboardEvent` with a writable `clipboardData`, so the payload is attached to a
 * plain event object.
 *
 * @param files - The files the clipboard holds; a `null` entry stands for an item without a file.
 * @param type - The mime type the clipboard items report.
 * @returns The event, ready to be dispatched on `document`.
 */
function buildPasteEvent(files: (File | null)[], type = 'image/png'): Event {
	const event = new Event('paste', { bubbles: true });
	const items = files.map((file) => ({ getAsFile: () => file, type }));
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	(event as Event & { clipboardData: unknown }).clipboardData = { items };
	return event;
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
	//
	// Regression case: `processFile` in `screenshot-upload.tsx` returns bare from this guard, with
	// no toast, no tile and no other feedback of any kind. The assertions below pin that silence
	// accurately, but it is a known defect being documented, not the intended UX — a user who picks
	// a PDF here gets no indication their file was rejected.
	it('rejects a file of the wrong type without calling the upload action or changing the list', async () => {
		const { getByLabelText, queryAllByRole } = render(<ControlledScreenshotUpload />);
		const user = userEvent.setup({ applyAccept: false });

		const file = new File([new Uint8Array(3)], 'notes.pdf', { type: 'application/pdf' });
		await user.upload(getByLabelText(DROP_ZONE_LABEL), file);

		expect(mockedUploadToLinear).not.toHaveBeenCalled();
		expect(queryAllByRole('img')).toHaveLength(0);
	});

	// Regression case: `processFile`'s size guard also returns bare, with no toast, no tile and no
	// other feedback of any kind. The assertions below pin that silence accurately, but it is a known
	// defect being documented, not the intended UX — a user who picks a 20 MB image here gets no
	// indication their file was rejected.
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

	it('uploads an image that was dropped on the drop zone', async () => {
		mockedUploadToLinear.mockResolvedValue({
			data: { assetUrl: 'https://uploads.linear.app/dropped.png' },
		});
		const { findByRole, getByLabelText } = render(<ControlledScreenshotUpload />);

		const file = buildImageFile('dropped.png');
		fireEvent(getByLabelText(DROP_ZONE_LABEL), buildDragEvent('drop', [file]));

		await expect(findByRole('img', { name: 'Screenshot 1' })).resolves.not.toBeNull();
		expect(mockedUploadToLinear).toHaveBeenCalledExactlyOnceWith({ file });
	});

	it('takes no more files than the drop zone still has room for', async () => {
		mockedUploadToLinear.mockResolvedValue({
			data: { assetUrl: 'https://uploads.linear.app/dropped.png' },
		});
		const { findByRole, getByLabelText } = render(<ControlledScreenshotUpload maxFiles={1} />);

		fireEvent(
			getByLabelText(DROP_ZONE_LABEL),
			buildDragEvent('drop', [buildImageFile('one.png'), buildImageFile('two.png')]),
		);

		await findByRole('img', { name: 'Screenshot 1' });

		const [[{ file }]] = mockedUploadToLinear.mock.calls;

		expect(mockedUploadToLinear).toHaveBeenCalledOnce();
		expect(file.name).toBe('one.png');
	});

	it('ignores a drop while the field is disabled', () => {
		const { getByLabelText } = render(<ControlledScreenshotUpload disabled />);

		fireEvent(
			getByLabelText(DROP_ZONE_LABEL),
			buildDragEvent('drop', [buildImageFile('dropped.png')]),
		);

		expect(mockedUploadToLinear).not.toHaveBeenCalled();
	});

	it('takes no further file once the maximum is reached', async () => {
		mockedUploadToLinear.mockResolvedValue({
			data: { assetUrl: 'https://uploads.linear.app/one.png' },
		});
		const { findByRole, getByLabelText, user } = renderWithUser(
			<ControlledScreenshotUpload maxFiles={1} />,
		);

		await user.upload(getByLabelText(DROP_ZONE_LABEL), buildImageFile('one.png'));
		await findByRole('img', { name: 'Screenshot 1' });

		fireEvent(getByLabelText(DROP_ZONE_LABEL), buildDragEvent('drop', [buildImageFile('two.png')]));

		expect(mockedUploadToLinear).toHaveBeenCalledOnce();
	});

	it('accepts dragging over and leaving the drop zone again', () => {
		const { getByLabelText } = render(<ControlledScreenshotUpload />);
		const dropZone = getByLabelText(DROP_ZONE_LABEL);

		fireEvent(dropZone, buildDragEvent('dragover'));
		fireEvent(dropZone, buildDragEvent('dragleave'));

		expect(mockedUploadToLinear).not.toHaveBeenCalled();
	});

	it('uploads an image pasted from the clipboard', async () => {
		mockedUploadToLinear.mockResolvedValue({
			data: { assetUrl: 'https://uploads.linear.app/pasted.png' },
		});
		const { findByRole } = render(<ControlledScreenshotUpload />);

		const file = buildImageFile('pasted.png');
		fireEvent(document, buildPasteEvent([file]));

		await expect(findByRole('img', { name: 'Screenshot 1' })).resolves.not.toBeNull();
		expect(mockedUploadToLinear).toHaveBeenCalledExactlyOnceWith({ file });
	});

	it.each([
		['the clipboard item carries no file', buildPasteEvent([null])],
		['the clipboard holds something other than an image', buildPasteEvent([null], 'text/plain')],
		['the clipboard is empty', new Event('paste', { bubbles: true })],
	])('ignores a paste when %s', (_name, event) => {
		render(<ControlledScreenshotUpload />);

		fireEvent(document, event);

		expect(mockedUploadToLinear).not.toHaveBeenCalled();
	});

	it('ignores a paste while the field is disabled', () => {
		render(<ControlledScreenshotUpload disabled />);

		fireEvent(document, buildPasteEvent([buildImageFile('pasted.png')]));

		expect(mockedUploadToLinear).not.toHaveBeenCalled();
	});

	it('treats a thrown upload as a failed one', async () => {
		mockedUploadToLinear.mockRejectedValue(new Error('network down'));
		const { findByText, getByLabelText, user } = renderUpload();

		await user.upload(getByLabelText(DROP_ZONE_LABEL), buildImageFile('screenshot.png'));

		await expect(findByText('Upload failed')).resolves.not.toBeNull();
	});

	// The button that clears a failed tile carries no accessible name — unlike the one on an
	// uploaded tile, which is labelled `Remove screenshot N`. Pinning the defect: it is the only
	// button on screen in this state, so the test can still reach it.
	it('clears a failed tile when its button is used', async () => {
		mockedUploadToLinear.mockResolvedValue({ serverError: 'Der Server hat ein Problem.' });
		const { findByText, getByLabelText, getByRole, queryAllByRole, user } = renderUpload();

		await user.upload(getByLabelText(DROP_ZONE_LABEL), buildImageFile('screenshot.png'));
		await findByText('Der Server hat ein Problem.');

		await user.click(getByRole('button'));

		expect(queryAllByRole('img')).toHaveLength(0);
	});
});
