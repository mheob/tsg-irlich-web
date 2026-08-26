import { render, type RenderResult } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';

interface RenderWithUserResult extends RenderResult {
	/** A `user-event` instance set up against the same `document` the component was rendered into. */
	user: UserEvent;
}

/**
 * Renders `ui` through Testing Library and returns the usual render result alongside a
 * `user-event` instance already `setup()` for it.
 *
 * `userEvent.setup()` and `render()` both default to the ambient `document` (there is only one in
 * a jsdom test run, and this helper never renders into a custom container), so the two are already
 * talking to the same document without passing it explicitly.
 *
 * @param ui - The element to render.
 * @returns The Testing Library render result plus a ready-to-use `user` instance.
 */
function renderWithUser(ui: ReactElement): RenderWithUserResult {
	const user = userEvent.setup();
	const result = render(ui);
	return { ...result, user };
}

export { renderWithUser };
export type { RenderWithUserResult };
