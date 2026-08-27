import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as createLinearIssueModule from '@/actions/create-linear-issue';
import type { FeedbackFormValues } from '@/lib/validations/feedback';

import { loadWithEnv } from '../../test-utils/env';
import { createFetchMock, type FetchCall } from '../../test-utils/fetch-mock';

type CreateLinearIssueModule = typeof createLinearIssueModule;

const LINEAR_ENV = {
	LINEAR_API_KEY: 'test-api-key',
	LINEAR_ASSIGNEE_ID: 'test-assignee-id',
	LINEAR_LABEL_ID: 'test-label-id',
	LINEAR_TEAM_ID: 'test-team-id',
};

// The installed `next-safe-action` (8.6.1, see
// `node_modules/next-safe-action/dist/index.mjs`) ships a `DEFAULT_SERVER_ERROR_MESSAGE` of
// exactly this string, and `src/lib/actions/safe-action.ts` sets no custom `handleServerError`, so
// every thrown `Error` in `postLinearMutation`/`extractIssueResult` is masked behind this fixed
// message in the envelope. Its default error handler also does `console.error('Action error:',
// e.message)` before masking, which is the only place the specific message is still observable —
// see the failure-path tests below.
const GENERIC_SERVER_ERROR = 'Something went wrong while executing the operation.';

function validFeedbackInput(): FeedbackFormValues {
	return {
		description: 'Der Anmeldebutton reagiert auf mobilen Geräten nicht mehr.',
		privacy: true,
		title: 'Anmeldebutton kaputt',
		type: 'bug',
	};
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
	// here, so this narrows a JSON body this test file itself constructed, not an external payload.
	return JSON.parse(call.body) as { query: string; variables: Record<string, unknown> };
}

describe('building the linear issue description and mutation variables', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.restoreAllMocks();
	});

	it('omits the screenshot section and skips falsy metadata fields when there are no screenshot urls', async () => {
		mock = createFetchMock();
		const { createLinearIssue } = await loadWithEnv<CreateLinearIssueModule>(
			'@/actions/create-linear-issue',
			LINEAR_ENV,
		);
		mock.enqueueJson({
			data: { issueCreate: { issue: { id: 'id-1', identifier: 'ID-1' }, success: true } },
		});

		await createLinearIssue({
			description: 'Der Anmeldebutton reagiert auf mobilen Geräten nicht mehr.',
			privacy: true,
			title: 'Anmeldebutton kaputt',
			type: 'bug',
		});

		const expectedDescription = [
			'Der Anmeldebutton reagiert auf mobilen Geräten nicht mehr.',
			'',
			'---',
			'**Type:** bug',
			'**Privacy checked:** true',
			'**Source:** Feedback Form from tsg-irlich.de',
		].join('\n');

		expect(parseGraphqlBody(mock.calls[0]).variables).toStrictEqual({
			input: {
				assigneeId: 'test-assignee-id',
				description: expectedDescription,
				labelIds: ['test-label-id'],
				teamId: 'test-team-id',
				title: '[BUG] Anmeldebutton kaputt',
			},
		});
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('renders one screenshot markdown image per url, every truthy metadata line, and Source last', async () => {
		mock = createFetchMock();
		const { createLinearIssue } = await loadWithEnv<CreateLinearIssueModule>(
			'@/actions/create-linear-issue',
			LINEAR_ENV,
		);
		mock.enqueueJson({
			data: { issueCreate: { issue: { id: 'id-1', identifier: 'ID-1' }, success: true } },
		});

		await createLinearIssue({
			browser: 'chrome',
			description: 'Ein Screenshot zeigt den fehlerhaften Zustand des Formulars.',
			device: 'iPhone 15',
			email: 'reporter@example.com',
			operationSystem: 'ios',
			privacy: true,
			screenshotUrls: ['https://cdn.example.com/a.png', 'https://cdn.example.com/b.png'],
			title: 'Formular fehlerhaft',
			type: 'feature',
		});

		const expectedDescription = [
			'Ein Screenshot zeigt den fehlerhaften Zustand des Formulars.',
			'',
			'## Screenshots',
			'![Screenshot](https://cdn.example.com/a.png)',
			'![Screenshot](https://cdn.example.com/b.png)',
			'',
			'---',
			'**Type:** feature',
			'**Browser:** chrome',
			'**Operation System:** ios',
			'**Device:** iPhone 15',
			'**Reporter Email:** reporter@example.com',
			'**Privacy checked:** true',
			'**Source:** Feedback Form from tsg-irlich.de',
		].join('\n');

		const { variables } = parseGraphqlBody(mock.calls[0]);

		expect(variables).toStrictEqual({
			input: {
				assigneeId: 'test-assignee-id',
				description: expectedDescription,
				labelIds: ['test-label-id'],
				teamId: 'test-team-id',
				title: '[FEATURE] Formular fehlerhaft',
			},
		});
		expect(mock.unqueued).toStrictEqual([]);
	});
});

describe('surfacing a failure from the linear api', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.restoreAllMocks();
	});

	it('surfaces "HTTP error: <status>" for a non-ok response, masked behind the generic envelope message', async () => {
		mock = createFetchMock();
		const { createLinearIssue } = await loadWithEnv<CreateLinearIssueModule>(
			'@/actions/create-linear-issue',
			LINEAR_ENV,
		);
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();

		mock.enqueue({ body: 'Internal Server Error', status: 503 });

		const result = await createLinearIssue(validFeedbackInput());

		expect(result).toStrictEqual({ serverError: GENERIC_SERVER_ERROR });
		expect(errorSpy).toHaveBeenCalledExactlyOnceWith('Action error:', 'HTTP error: 503');
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('surfaces "Failed to create issue" for a graphql errors array, after logging it', async () => {
		mock = createFetchMock();
		const { createLinearIssue } = await loadWithEnv<CreateLinearIssueModule>(
			'@/actions/create-linear-issue',
			LINEAR_ENV,
		);
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();

		mock.enqueueJson({ errors: [{ message: 'field X is required' }] });

		const result = await createLinearIssue(validFeedbackInput());

		expect(result).toStrictEqual({ serverError: GENERIC_SERVER_ERROR });
		expect(errorSpy).toHaveBeenCalledWith('Linear API errors:', [
			{ message: 'field X is required' },
		]);
		expect(errorSpy).toHaveBeenCalledWith('Action error:', 'Failed to create issue');
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('surfaces "Issue creation failed" when issueCreate.success is false', async () => {
		mock = createFetchMock();
		const { createLinearIssue } = await loadWithEnv<CreateLinearIssueModule>(
			'@/actions/create-linear-issue',
			LINEAR_ENV,
		);
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();

		mock.enqueueJson({ data: { issueCreate: { issue: null, success: false } } });

		const result = await createLinearIssue(validFeedbackInput());

		expect(result).toStrictEqual({ serverError: GENERIC_SERVER_ERROR });
		expect(errorSpy).toHaveBeenCalledExactlyOnceWith('Action error:', 'Issue creation failed');
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('surfaces "Issue creation failed" when the issue is missing despite success:true', async () => {
		mock = createFetchMock();
		const { createLinearIssue } = await loadWithEnv<CreateLinearIssueModule>(
			'@/actions/create-linear-issue',
			LINEAR_ENV,
		);
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();

		mock.enqueueJson({ data: { issueCreate: { issue: null, success: true } } });

		const result = await createLinearIssue(validFeedbackInput());

		expect(result).toStrictEqual({ serverError: GENERIC_SERVER_ERROR });
		expect(errorSpy).toHaveBeenCalledExactlyOnceWith('Action error:', 'Issue creation failed');
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('surfaces a zod error instead of a silent success when the payload fails linearResponseSchema', async () => {
		mock = createFetchMock();
		const { createLinearIssue } = await loadWithEnv<CreateLinearIssueModule>(
			'@/actions/create-linear-issue',
			LINEAR_ENV,
		);
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();

		// `success` must be a boolean per `linearIssueCreateSchema`; a string fails `.parse`.
		mock.enqueueJson({ data: { issueCreate: { issue: null, success: 'yes' } } });

		const result = await createLinearIssue(validFeedbackInput());

		expect(result).toStrictEqual({ serverError: GENERIC_SERVER_ERROR });
		// zod 4's `ZodError.message` for a caught `.parse()` failure is this pretty-printed issues
		// array (see `src/lib/cleverreach.test.ts`'s `EXPECTED_VALIDATION_ERROR_MESSAGE` for the same
		// convention) — hard-coded here rather than derived from a schema this test doesn't import.
		expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
			'Action error:',
			JSON.stringify(
				[
					{
						expected: 'boolean',
						code: 'invalid_type',
						path: ['data', 'issueCreate', 'success'],
						message: 'Invalid input: expected boolean, received string',
					},
				],
				null,
				2,
			),
		);
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('never reaches fetch when the input fails feedbackFormSchema', async () => {
		mock = createFetchMock();
		const { createLinearIssue } = await loadWithEnv<CreateLinearIssueModule>(
			'@/actions/create-linear-issue',
			LINEAR_ENV,
		);

		const result = await createLinearIssue({
			description: 'Der Anmeldebutton reagiert auf mobilen Geräten nicht mehr.',
			privacy: true,
			title: 'x',
			type: 'bug',
		});

		expect(result).toStrictEqual({
			validationErrors: {
				title: { _errors: ['Der Titel muss mindestens 5 Zeichen lang sein'] },
			},
		});
		expect(mock.calls).toStrictEqual([]);
	});
});

describe('completing a linear issue creation', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.restoreAllMocks();
	});

	it('returns the created issue id and identifier, authenticated with the linear api key', async () => {
		mock = createFetchMock();
		const { createLinearIssue } = await loadWithEnv<CreateLinearIssueModule>(
			'@/actions/create-linear-issue',
			LINEAR_ENV,
		);

		mock.enqueueJson({
			data: { issueCreate: { issue: { id: 'issue-abc', identifier: 'ISS-42' }, success: true } },
		});

		const result = await createLinearIssue(validFeedbackInput());

		expect(result).toStrictEqual({ data: { issueId: 'issue-abc', issueIdentifier: 'ISS-42' } });
		expect(mock.calls).toHaveLength(1);
		expect({
			authorization: mock.calls[0].headers.authorization,
			contentType: mock.calls[0].headers['content-type'],
			method: mock.calls[0].method,
			url: mock.calls[0].url,
		}).toStrictEqual({
			authorization: 'test-api-key',
			contentType: 'application/json',
			method: 'POST',
			url: 'https://api.linear.app/graphql',
		});
		expect(mock.unqueued).toStrictEqual([]);
	});
});
