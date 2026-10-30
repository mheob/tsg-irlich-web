import { useState } from 'react';
import type { KeyboardEvent } from 'react';

interface ListboxNavigation {
	/** The id of the highlighted option, `null` while the focus stays on the input. */
	activeId: string | null;
	/** Handles ArrowDown and ArrowUp, and nothing else: the panel keeps Enter and Escape. */
	onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
	/** Takes the highlight away. */
	reset: () => void;
}

interface NavigationState {
	activeId: string | null;
	/** The options the highlight was set for. A highlight never outlives them. */
	optionsKey: string;
}

const STEP_DOWN = 1;
const STEP_UP = -1;
const NO_INDEX = -1;

type Step = typeof STEP_DOWN | typeof STEP_UP;

/**
 * Finds the option one step away from the current one, wrapping at the ends. From nothing a step
 * down lands on the first option and a step up on the last.
 *
 * @param optionIds - The ids of the options, in the order they are shown.
 * @param currentId - The highlighted id, `null` for none.
 * @param step - `STEP_DOWN` to move down, `STEP_UP` to move up.
 * @returns The id of the next option, `null` when there are no options.
 */
function getNextId(optionIds: string[], currentId: string | null, step: Step): string | null {
	const { length } = optionIds;

	if (length === 0) {
		return null;
	}

	const currentIndex = currentId === null ? NO_INDEX : optionIds.indexOf(currentId);
	const nextIndex =
		currentIndex === NO_INDEX && step === STEP_UP ? length - 1 : currentIndex + step;

	return optionIds[(nextIndex + length) % length] ?? null;
}

/**
 * Moves a highlight through the options of a listbox while the focus stays on the input in front of
 * it (the `aria-activedescendant` pattern). Putting `activeId` on the input and opening the option
 * on Enter is the panel's job.
 *
 * - ArrowDown and ArrowUp step through `optionIds` and wrap at both ends.
 * - Home and End stay with the input, where they move the caret.
 * - Whenever the ids change the highlight is gone, even if its option is still in the list: new
 *   results are new options.
 *
 * @param optionIds - The ids of the options, in the order they are shown.
 * @returns The highlighted id, the key handler for the input and a way to clear the highlight.
 */
function useListboxNavigation(optionIds: string[]): ListboxNavigation {
	// The ids go by content, so a parent that builds a new array with every render does not reset
	// the highlight. A string is safe to compare while rendering, an array of ids is not.
	const optionsKey = JSON.stringify(optionIds);
	const [state, setState] = useState<NavigationState>({ activeId: null, optionsKey });

	// State from an earlier list is discarded while rendering, not in an effect: the stale highlight
	// is never painted, and ids that change and change back do not bring it back.
	if (state.optionsKey !== optionsKey) {
		setState({ activeId: null, optionsKey });
	}

	const activeId = state.optionsKey === optionsKey ? state.activeId : null;

	/**
	 * Steps the highlight on ArrowDown and ArrowUp.
	 *
	 * @param event - The key event of the input.
	 */
	function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
			return;
		}

		// An arrow key would otherwise move the caret to the start or end of the input.
		event.preventDefault();

		const step = event.key === 'ArrowDown' ? STEP_DOWN : STEP_UP;

		setState((previous) => {
			const currentId = previous.optionsKey === optionsKey ? previous.activeId : null;

			return { activeId: getNextId(optionIds, currentId, step), optionsKey };
		});
	}

	/** Takes the highlight away. */
	function reset(): void {
		setState({ activeId: null, optionsKey });
	}

	return { activeId, onKeyDown, reset };
}

export { useListboxNavigation };
export type { ListboxNavigation };
