'use server';

import { z } from 'zod';

import { actionClient } from '@/lib/actions/safe-action';
import { env } from '@/lib/env';
import { feedbackFormSchema } from '@/lib/validations/feedback';
import type { FeedbackFormValues } from '@/lib/validations/feedback';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

const CREATE_ISSUE_MUTATION = `
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

const METADATA_LABELS: [keyof FeedbackFormValues, string][] = [
	['browser', 'Browser'],
	['operationSystem', 'Operation System'],
	['device', 'Device'],
	['email', 'Reporter Email'],
	['privacy', 'Privacy checked'],
];

function buildMetadataLines(data: FeedbackFormValues): string[] {
	const lines: string[] = ['', '---', `**Type:** ${data.type}`];

	for (const [key, label] of METADATA_LABELS) {
		const value = data[key];
		if (value) {
			lines.push(`**${label}:** ${String(value)}`);
		}
	}

	lines.push(`**Source:** Feedback Form from tsg-irlich.de`);

	return lines;
}

function buildDescription(data: FeedbackFormValues): string {
	const parts = [data.description];

	if (data.screenshotUrls && data.screenshotUrls.length > 0) {
		parts.push('', '## Screenshots');
		for (const url of data.screenshotUrls) {
			parts.push(`![Screenshot](${url})`);
		}
	}

	parts.push(...buildMetadataLines(data));

	return parts.join('\n');
}

const linearIssueSchema = z.object({ id: z.string(), identifier: z.string() });

const linearIssueCreateSchema = z.object({
	issue: linearIssueSchema.nullish(),
	success: z.boolean(),
});

const linearDataSchema = z.object({ issueCreate: linearIssueCreateSchema });

const linearErrorSchema = z.object({ message: z.string() });

const linearResponseSchema = z.object({
	data: linearDataSchema.nullish(),
	errors: z.array(linearErrorSchema).optional(),
});

async function postLinearMutation(
	apiKey: string,
	variables: Record<string, unknown>,
): Promise<z.infer<typeof linearResponseSchema>> {
	const response = await fetch(LINEAR_API_URL, {
		body: JSON.stringify({ query: CREATE_ISSUE_MUTATION, variables }),
		headers: {
			Authorization: apiKey,
			'Content-Type': 'application/json',
		},
		method: 'POST',
	});

	if (!response.ok) {
		throw new Error(`HTTP error: ${response.status}`);
	}

	const payload: unknown = await response.json();
	const result = linearResponseSchema.parse(payload);

	if (result.errors) {
		console.error('Linear API errors:', result.errors);
		throw new Error('Failed to create issue');
	}

	return result;
}

function extractIssueResult(result: z.infer<typeof linearResponseSchema>): {
	issueId: string;
	issueIdentifier: string;
} {
	const issueData = result.data?.issueCreate;

	if (!issueData?.success || !issueData.issue) {
		throw new Error('Issue creation failed');
	}

	return {
		issueId: issueData.issue.id,
		issueIdentifier: issueData.issue.identifier,
	};
}

export const createLinearIssue = actionClient
	.inputSchema(feedbackFormSchema)
	.action(async ({ parsedInput: data }) => {
		const apiKey = env('LINEAR_API_KEY');
		const assigneeId = env('LINEAR_ASSIGNEE_ID');
		const labelId = env('LINEAR_LABEL_ID');
		const teamId = env('LINEAR_TEAM_ID');

		const description = buildDescription(data);
		const title = `[${data.type.toUpperCase()}] ${data.title}`;

		const result = await postLinearMutation(apiKey, {
			input: { assigneeId, description, labelIds: [labelId], teamId, title },
		});

		return extractIssueResult(result);
	});
