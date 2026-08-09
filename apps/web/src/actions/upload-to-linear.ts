'use server';

import { z } from 'zod';

import { actionClient } from '@/lib/actions/safe-action';
import { env } from '@/lib/env';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

const BYTES_PER_KB = 1024;
const KB_PER_MB = 1024;
const MB_IN_BYTES = BYTES_PER_KB * KB_PER_MB;
// 10MB for Linear Free Plan
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * MB_IN_BYTES;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

const uploadSchema = z.object({
	file: z
		.instanceof(File)
		.refine((file) => ALLOWED_TYPES.has(file.type), {
			message: 'Invalid file type. Only images are allowed.',
		})
		.refine((file) => file.size <= MAX_FILE_SIZE, {
			message: 'File too large. Maximum size is 10MB.',
		}),
});

const FILE_UPLOAD_MUTATION = `
  mutation FileUpload($contentType: String!, $filename: String!, $size: Int!) {
    fileUpload(contentType: $contentType, filename: $filename, size: $size) {
      success
      uploadFile {
        uploadUrl
        assetUrl
        headers {
          key
          value
        }
      }
    }
  }
`;

const uploadFileHeaderSchema = z.object({ key: z.string(), value: z.string() });

const uploadFileSchema = z.object({
	assetUrl: z.string(),
	headers: z.array(uploadFileHeaderSchema),
	uploadUrl: z.string(),
});

const fileUploadSchema = z.object({ uploadFile: uploadFileSchema.nullish() });

const uploadDataSchema = z.object({ fileUpload: fileUploadSchema.nullish() });

const uploadErrorSchema = z.object({ message: z.string() });

const uploadResponseSchema = z.object({
	data: uploadDataSchema.nullish(),
	errors: z.array(uploadErrorSchema).optional(),
});

type UploadFileHeader = z.infer<typeof uploadFileHeaderSchema>;
type UploadFile = z.infer<typeof uploadFileSchema>;

async function fetchUploadUrl(apiKey: string, file: File): Promise<Response> {
	return fetch(LINEAR_API_URL, {
		body: JSON.stringify({
			query: FILE_UPLOAD_MUTATION,
			variables: { contentType: file.type, filename: file.name, size: file.size },
		}),
		headers: {
			Authorization: apiKey,
			'Content-Type': 'application/json',
		},
		method: 'POST',
	});
}

function extractUploadFile(
	result: z.infer<typeof uploadResponseSchema>,
	status: number,
): UploadFile {
	const uploadFile = result.data?.fileUpload?.uploadFile;

	if (result.errors || !uploadFile) {
		console.error('Linear fileUpload error:', result.errors);
		throw new Error(`Failed to get upload URL: ${status} - ${JSON.stringify(result)}`);
	}

	return uploadFile;
}

async function requestUploadUrl(apiKey: string, file: File): Promise<UploadFile> {
	const response = await fetchUploadUrl(apiKey, file);
	const payload: unknown = await response.json();
	const result = uploadResponseSchema.parse(payload);

	return extractUploadFile(result, response.status);
}

function buildUploadHeaders(
	fileHeaders: UploadFileHeader[],
	contentType: string,
): Record<string, string> {
	const result: Record<string, string> = { 'Content-Type': contentType };

	for (const { key, value } of fileHeaders) {
		result[key] = value;
	}

	return result;
}

async function uploadFileToUrl(
	uploadUrl: string,
	headers: Record<string, string>,
	file: File,
): Promise<void> {
	const fileBuffer = await file.arrayBuffer();

	const response = await fetch(uploadUrl, {
		body: fileBuffer,
		headers,
		method: 'PUT',
	});

	if (!response.ok) {
		throw new Error(`Failed to upload file: ${response.status}`);
	}
}

export const uploadToLinear = actionClient
	.inputSchema(uploadSchema)
	.action(async ({ parsedInput: { file } }) => {
		const apiKey = env('LINEAR_API_KEY');

		const { assetUrl, headers, uploadUrl } = await requestUploadUrl(apiKey, file);
		const uploadHeaders = buildUploadHeaders(headers, file.type);

		await uploadFileToUrl(uploadUrl, uploadHeaders, file);

		return { assetUrl };
	});
