'use server';

import process from 'node:process';

import type { FeedbackFormValues, LinearIssueResponse } from '@/lib/validations/feedback';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

export async function createLinearIssue(data: FeedbackFormValues): Promise<LinearIssueResponse> {
	const apiKey = process.env.LINEAR_API_KEY;
	const teamId = process.env.LINEAR_TEAM_ID;

	if (!apiKey || !teamId) {
		console.error('Missing LINEAR_API_KEY or LINEAR_TEAM_ID');
		return {
			error: 'Server configuration error',
			success: false,
		};
	}

	// Build description with metadata
	const descriptionParts = [data.description];

	// Add screenshots if present
	if (data.screenshotUrls && data.screenshotUrls.length > 0) {
		descriptionParts.push('', '## Screenshots');
		for (const url of data.screenshotUrls) {
			descriptionParts.push(`![Screenshot](${url})`);
		}
	}

	descriptionParts.push('', '---', `**Type:** ${data.type}`);

	if (data.browser) descriptionParts.push(`**Browser:** ${data.browser}`);
	if (data.operationSystem) descriptionParts.push(`**Operation System:** ${data.operationSystem}`);
	if (data.device) descriptionParts.push(`**Device:** ${data.device}`);
	if (data.email) descriptionParts.push(`**Reporter Email:** ${data.email}`);

	descriptionParts.push(`**Source:** Feedback Form form tsg-irlich.de`);

	const description = descriptionParts.join('\n');

	const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
        }
      }
    }
  `;

	try {
		const response = await fetch(LINEAR_API_URL, {
			body: JSON.stringify({
				query: mutation,
				variables: {
					input: {
						description,
						teamId,
						title: `[${data.type.toUpperCase()}] ${data.title}`,
					},
				},
			}),
			headers: {
				Authorization: apiKey,
				'Content-Type': 'application/json',
			},
			method: 'POST',
		});

		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			console.error('Linear API errors:', result.errors);
			return {
				error: 'Failed to create issue',
				success: false,
			};
		}

		const issueData = result.data?.issueCreate;

		if (!issueData?.success) {
			return {
				error: 'Issue creation failed',
				success: false,
			};
		}

		return {
			issueId: issueData.issue.id,
			issueIdentifier: issueData.issue.identifier,
			success: true,
		};
	} catch (error) {
		console.error('Error creating Linear issue:', error);
		return {
			error: 'Network error',
			success: false,
		};
	}
}
