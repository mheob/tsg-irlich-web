'use server';

import process from 'node:process';

import type { UploadResponse } from '@/lib/validations/feedback';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

export async function uploadToLinear(formData: FormData): Promise<UploadResponse> {
	const apiKey = process.env.LINEAR_API_KEY;

	if (!apiKey) {
		return { error: 'Server configuration error', success: false };
	}

	const file = formData.get('file') as File | null;

	if (!file) {
		return { error: 'No file provided', success: false };
	}

	// Validate file type
	const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
	if (!allowedTypes.includes(file.type)) {
		return { error: 'Invalid file type. Only images are allowed.', success: false };
	}

	// Validate file size (max 10MB for Linear Free Plan)
	const maxSize = 10 * 1024 * 1024;
	if (file.size > maxSize) {
		return { error: 'File too large. Maximum size is 10MB.', success: false };
	}

	try {
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

		console.info('Linear API Request:', {
			contentType: file.type,
			filename: file.name,
			size: file.size,
		});

		const uploadUrlResponse = await fetch(LINEAR_API_URL, {
			body: JSON.stringify(requestBody),
			headers: {
				Authorization: apiKey,
				'Content-Type': 'application/json',
			},
			method: 'POST',
		});

		const uploadUrlResult = await uploadUrlResponse.json();

		console.info('Linear API Response Status:', uploadUrlResponse.status);
		console.info('Linear API Response Body:', JSON.stringify(uploadUrlResult, null, 2));

		if (!uploadUrlResponse.ok) {
			throw new Error(
				`Failed to get upload URL: ${uploadUrlResponse.status} - ${JSON.stringify(uploadUrlResult)}`,
			);
		}

		if (uploadUrlResult.errors || !uploadUrlResult.data?.fileUpload?.success) {
			console.error('Linear fileUpload error:', uploadUrlResult.errors);
			return { error: 'Failed to get upload URL', success: false };
		}

		const { assetUrl, headers, uploadUrl } = uploadUrlResult.data.fileUpload.uploadFile;

		// Step 2: Upload file to the pre-signed URL
		const uploadHeaders: Record<string, string> = {};
		for (const header of headers) {
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
			assetUrl,
			success: true,
		};
	} catch (error) {
		console.error('Error uploading to Linear:', error);
		return {
			error: 'Upload failed. Please try again.',
			success: false,
		};
	}
}
