'use server';

import { actionClient } from '@/lib/actions/safe-action';
import { env } from '@/lib/env';
import { feedbackFormSchema } from '@/lib/validations/feedback';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

export const createLinearIssue = actionClient
	.inputSchema(feedbackFormSchema)
	.action(async ({ parsedInput: data }) => {
		const apiKey = env('LINEAR_API_KEY');
		const assigneeId = env('LINEAR_ASSIGNEE_ID');
		const labelId = env('LINEAR_LABEL_ID');
		const teamId = env('LINEAR_TEAM_ID');

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

		if (data.browser) {
			descriptionParts.push(`**Browser:** ${data.browser}`);
		}
		if (data.operationSystem) {
			descriptionParts.push(`**Operation System:** ${data.operationSystem}`);
		}
		if (data.device) {
			descriptionParts.push(`**Device:** ${data.device}`);
		}
		if (data.email) {
			descriptionParts.push(`**Reporter Email:** ${data.email}`);
		}

		descriptionParts.push(`**Source:** Feedback Form from tsg-irlich.de`);

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

		const response = await fetch(LINEAR_API_URL, {
			body: JSON.stringify({
				query: mutation,
				variables: {
					input: {
						assigneeId,
						description,
						labelIds: [labelId],
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
			throw new Error('Failed to create issue');
		}

		const issueData = result.data?.issueCreate;

		if (!issueData?.success) {
			throw new Error('Issue creation failed');
		}

		return {
			issueId: issueData.issue.id as string,
			issueIdentifier: issueData.issue.identifier as string,
		};
	});
