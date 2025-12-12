'use server';

import process from 'node:process';

import { z } from 'zod';

import { actionClient } from '@/lib/actions/safe-action';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for Linear Free Plan
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

const uploadSchema = z.object({
	file: z
		.instanceof(File)
		.refine(file => ALLOWED_TYPES.has(file.type), {
			message: 'Invalid file type. Only images are allowed.',
		})
		.refine(file => file.size <= MAX_FILE_SIZE, {
			message: 'File too large. Maximum size is 10MB.',
		}),
});

export const uploadToLinear = actionClient
	.inputSchema(uploadSchema)
	.action(async ({ parsedInput: { file } }) => {
		const apiKey = process.env.LINEAR_API_KEY;

		if (!apiKey) {
			throw new Error('Server configuration error');
		}

		// Step 1: Request upload URL from Linear
		const uploadUrlQuery = `
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

		const requestBody = {
			query: uploadUrlQuery,
			variables: {
				contentType: file.type,
				filename: file.name,
				size: file.size,
			},
		};

		const uploadUrlResponse = await fetch(LINEAR_API_URL, {
			body: JSON.stringify(requestBody),
			headers: {
				Authorization: apiKey,
				'Content-Type': 'application/json',
			},
			method: 'POST',
		});

		const uploadUrlResult = await uploadUrlResponse.json();

		if (!uploadUrlResponse.ok) {
			throw new Error(
				`Failed to get upload URL: ${uploadUrlResponse.status} - ${JSON.stringify(uploadUrlResult)}`,
			);
		}

		if (uploadUrlResult.errors || !uploadUrlResult.data?.fileUpload?.success) {
			console.error('Linear fileUpload error:', uploadUrlResult.errors);
			throw new Error('Failed to get upload URL');
		}

		const { assetUrl, headers, uploadUrl } = uploadUrlResult.data.fileUpload.uploadFile ?? {};
		if (!uploadUrl || !assetUrl) throw new Error('Failed to get upload URL');

		// Step 2: Upload file to the pre-signed URL
		const uploadHeaders: Record<string, string> = {};
		for (const header of headers ?? []) {
			uploadHeaders[header.key] = header.value;
		}

		const fileBuffer = await file.arrayBuffer();

		const uploadResponse = await fetch(uploadUrl, {
			body: fileBuffer,
			headers: {
				...uploadHeaders,
				'Content-Type': file.type,
			},
			method: 'PUT',
		});

		if (!uploadResponse.ok) {
			throw new Error(`Failed to upload file: ${uploadResponse.status}`);
		}

		return {
			assetUrl: assetUrl as string,
		};
	});
