import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as uploadToLinearModule from '@/actions/upload-to-linear';

import { loadWithEnv } from '../../test-utils/env';
import { createFetchMock, type FetchCall } from '../../test-utils/fetch-mock';

type UploadToLinearModule = typeof uploadToLinearModule;

const LINEAR_ENV = { LINEAR_API_KEY: 'test-api-key' };

const LINEAR_API_URL = 'https://api.linear.app/graphql';

// Matches `ALLOWED_TYPES` in `upload-to-linear.ts` — kept as a literal here rather than imported,
// since that constant is not exported.
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

// Matches `MAX_FILE_SIZE` in `upload-to-linear.ts` (10MB), likewise kept as a literal.
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// `next-safe-action`'s default `handleServerError` (see `create-linear-issue.test.ts` for the full
// citation) masks every thrown `Error` behind this fixed message in the envelope, logging the real
// message first via `console.error('Action error:', e.message)`.
const GENERIC_SERVER_ERROR = 'Something went wrong while executing the operation.';

/** A `File` whose `size` getter is overridden, so a >10MB fixture never allocates real bytes. */
class OversizedFile extends File {
	public override get size(): number {
		return MAX_FILE_SIZE_BYTES + 1;
	}
}

function imageFile(bytes: number[], type = 'image/png', name = 'photo.png'): File {
	return new File([new Uint8Array(bytes)], name, { type });
}

/**
 * Parses a recorded fetch call's JSON body as the Linear GraphQL request it is expected to be.
 *
 * @param call - The recorded fetch call to read the body from.
 * @returns The parsed `{ query, variables }` payload.
 */
function parseGraphqlBody(call: FetchCall): { query: string; variables: Record<string, unknown> } {
	if (!call.body) {
		throw new Error(`Expected a JSON string body for ${call.url}`);
	}
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `JSON.parse` widens to `any`
	// here, so this narrows a JSON body this test file itself constructed, not an external payload.
	return JSON.parse(call.body) as { query: string; variables: Record<string, unknown> };
}

describe('validating the uploaded file', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.restoreAllMocks();
	});

	it('rejects a non-image file type without any fetch', async () => {
		mock = createFetchMock();
		const { uploadToLinear } = await loadWithEnv<UploadToLinearModule>(
			'@/actions/upload-to-linear',
			LINEAR_ENV,
		);

		const result = await uploadToLinear({ file: imageFile([1, 2, 3], 'text/plain', 'notes.txt') });

		expect(result).toStrictEqual({
			validationErrors: {
				file: { _errors: ['Invalid file type. Only images are allowed.'] },
			},
		});
		expect(mock.calls).toStrictEqual([]);
	});

	it('rejects a file over the 10MB limit without any fetch', async () => {
		mock = createFetchMock();
		const { uploadToLinear } = await loadWithEnv<UploadToLinearModule>(
			'@/actions/upload-to-linear',
			LINEAR_ENV,
		);

		const file = new OversizedFile([], 'huge.png', { type: 'image/png' });
		const result = await uploadToLinear({ file });

		expect(result).toStrictEqual({
			validationErrors: {
				file: { _errors: ['File too large. Maximum size is 10MB.'] },
			},
		});
		expect(mock.calls).toStrictEqual([]);
	});

	it.each(ALLOWED_TYPES)('accepts a %s file, reaching the linear api', async (type) => {
		mock = createFetchMock();
		const { uploadToLinear } = await loadWithEnv<UploadToLinearModule>(
			'@/actions/upload-to-linear',
			LINEAR_ENV,
		);
		mock.enqueueJson({
			data: {
				fileUpload: {
					success: true,
					uploadFile: {
						assetUrl: 'https://uploads.linear.app/asset-1',
						headers: [],
						uploadUrl: 'https://uploads.linear.app/put-url',
					},
				},
			},
		});
		mock.enqueue({ body: '', status: 200 });

		const result = await uploadToLinear({ file: imageFile([1, 2, 3], type) });

		expect(result.validationErrors).toBeUndefined();
		expect(mock.unqueued).toStrictEqual([]);
	});
});

describe('completing an upload to linear', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.restoreAllMocks();
	});

	it('requests an upload url via the graphql mutation, authenticated with the linear api key', async () => {
		mock = createFetchMock();
		const { uploadToLinear } = await loadWithEnv<UploadToLinearModule>(
			'@/actions/upload-to-linear',
			LINEAR_ENV,
		);
		mock.enqueueJson({
			data: {
				fileUpload: {
					success: true,
					uploadFile: {
						assetUrl: 'https://uploads.linear.app/asset-1',
						headers: [{ key: 'x-goog-meta-source', value: 'tsg-website' }],
						uploadUrl: 'https://uploads.linear.app/put-url',
					},
				},
			},
		});
		mock.enqueue({ body: '', status: 200 });

		const result = await uploadToLinear({
			file: imageFile([1, 2, 3, 4], 'image/png', 'photo.png'),
		});

		expect(result).toStrictEqual({ data: { assetUrl: 'https://uploads.linear.app/asset-1' } });

		const { variables } = parseGraphqlBody(mock.calls[0]);
		expect(variables).toStrictEqual({ contentType: 'image/png', filename: 'photo.png', size: 4 });
		expect({
			authorization: mock.calls[0].headers.authorization,
			contentType: mock.calls[0].headers['content-type'],
			method: mock.calls[0].method,
			url: mock.calls[0].url,
		}).toStrictEqual({
			authorization: 'test-api-key',
			contentType: 'application/json',
			method: 'POST',
			url: LINEAR_API_URL,
		});
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('puts the file bytes to the returned upload url, merging linear headers over content-type', async () => {
		mock = createFetchMock();
		const { uploadToLinear } = await loadWithEnv<UploadToLinearModule>(
			'@/actions/upload-to-linear',
			LINEAR_ENV,
		);
		mock.enqueueJson({
			data: {
				fileUpload: {
					success: true,
					uploadFile: {
						assetUrl: 'https://uploads.linear.app/asset-1',
						headers: [{ key: 'x-goog-meta-source', value: 'tsg-website' }],
						uploadUrl: 'https://uploads.linear.app/put-url',
					},
				},
			},
		});
		mock.enqueue({ body: '', status: 200 });

		await uploadToLinear({ file: imageFile([1, 2, 3, 4], 'image/png', 'photo.png') });

		expect(mock.calls).toHaveLength(2);
		expect({
			contentType: mock.calls[1].headers['content-type'],
			method: mock.calls[1].method,
			sourceHeader: mock.calls[1].headers['x-goog-meta-source'],
			url: mock.calls[1].url,
		}).toStrictEqual({
			contentType: 'image/png',
			method: 'PUT',
			sourceHeader: 'tsg-website',
			url: 'https://uploads.linear.app/put-url',
		});
		expect(mock.calls[1].bodyBytes).toStrictEqual(new Uint8Array([1, 2, 3, 4]));
		expect(mock.unqueued).toStrictEqual([]);
	});

	it("overrides the file's content-type when linear returns its own Content-Type header", async () => {
		mock = createFetchMock();
		const { uploadToLinear } = await loadWithEnv<UploadToLinearModule>(
			'@/actions/upload-to-linear',
			LINEAR_ENV,
		);
		mock.enqueueJson({
			data: {
				fileUpload: {
					success: true,
					uploadFile: {
						assetUrl: 'https://uploads.linear.app/asset-1',
						headers: [{ key: 'Content-Type', value: 'application/vnd.linear.custom' }],
						uploadUrl: 'https://uploads.linear.app/put-url',
					},
				},
			},
		});
		mock.enqueue({ body: '', status: 200 });

		await uploadToLinear({ file: imageFile([1, 2, 3], 'image/png', 'photo.png') });

		expect(mock.calls[1].headers['content-type']).toBe('application/vnd.linear.custom');
		expect(mock.unqueued).toStrictEqual([]);
	});
});

describe('surfacing an upload failure', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.restoreAllMocks();
	});

	it('surfaces "Failed to get upload URL: <status> - ..." when uploadFile is missing, masked behind the generic envelope', async () => {
		mock = createFetchMock();
		const { uploadToLinear } = await loadWithEnv<UploadToLinearModule>(
			'@/actions/upload-to-linear',
			LINEAR_ENV,
		);
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();

		mock.enqueueJson({ data: { fileUpload: { success: true, uploadFile: null } } });

		const result = await uploadToLinear({ file: imageFile([1, 2, 3]) });

		expect(result).toStrictEqual({ serverError: GENERIC_SERVER_ERROR });
		expect(errorSpy).toHaveBeenCalledWith('Linear fileUpload error:', undefined);
		expect(errorSpy).toHaveBeenCalledWith(
			'Action error:',
			expect.stringContaining('Failed to get upload URL: 200 - '),
		);
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('surfaces the same failure for a graphql errors array, after logging it', async () => {
		mock = createFetchMock();
		const { uploadToLinear } = await loadWithEnv<UploadToLinearModule>(
			'@/actions/upload-to-linear',
			LINEAR_ENV,
		);
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();

		mock.enqueueJson({ errors: [{ message: 'file size exceeds plan limit' }] });

		const result = await uploadToLinear({ file: imageFile([1, 2, 3]) });

		expect(result).toStrictEqual({ serverError: GENERIC_SERVER_ERROR });
		expect(errorSpy).toHaveBeenCalledWith('Linear fileUpload error:', [
			{ message: 'file size exceeds plan limit' },
		]);
		expect(errorSpy).toHaveBeenCalledWith(
			'Action error:',
			expect.stringContaining('Failed to get upload URL: 200 - '),
		);
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('surfaces "Failed to upload file: <status>" when the storage put fails', async () => {
		mock = createFetchMock();
		const { uploadToLinear } = await loadWithEnv<UploadToLinearModule>(
			'@/actions/upload-to-linear',
			LINEAR_ENV,
		);
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();

		mock.enqueueJson({
			data: {
				fileUpload: {
					success: true,
					uploadFile: {
						assetUrl: 'https://uploads.linear.app/asset-1',
						headers: [],
						uploadUrl: 'https://uploads.linear.app/put-url',
					},
				},
			},
		});
		mock.enqueue({ body: 'Bad Gateway', status: 502 });

		const result = await uploadToLinear({ file: imageFile([1, 2, 3]) });

		expect(result).toStrictEqual({ serverError: GENERIC_SERVER_ERROR });
		expect(errorSpy).toHaveBeenCalledExactlyOnceWith('Action error:', 'Failed to upload file: 502');
		expect(mock.unqueued).toStrictEqual([]);
	});
});
