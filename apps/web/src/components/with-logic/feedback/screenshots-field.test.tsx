import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ScreenshotsField } from './screenshots-field';

// The field renders `ScreenshotUpload`, which calls the upload action directly — the same boundary
// `screenshot-upload.test.tsx` mocks.
vi.mock(import('@/actions/upload-to-linear'), () => ({ uploadToLinear: vi.fn() }));

function ControlledScreenshotsField(): ReactElement {
	const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
	return (
		<ScreenshotsField
			isSubmitting={false}
			screenshotUrls={screenshotUrls}
			setScreenshotUrls={setScreenshotUrls}
		/>
	);
}

describe('the screenshots field', () => {
	it('labels the upload’s file input, so the label is not loose text', () => {
		render(<ControlledScreenshotsField />);

		const input = screen.getByLabelText(/Screenshots/u);

		expect(input).toBeInstanceOf(HTMLInputElement);
		expect((input as HTMLInputElement).type).toBe('file');
	});
});
