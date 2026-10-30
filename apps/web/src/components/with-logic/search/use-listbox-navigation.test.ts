import { act, renderHook } from '@testing-library/react';
import type { RenderHookResult } from '@testing-library/react';
import type { KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { Mock } from 'vite-plus/test';

import { useListboxNavigation } from './use-listbox-navigation';
import type { ListboxNavigation } from './use-listbox-navigation';

const IDS = ['first', 'second', 'third'];

type NavigationHook = RenderHookResult<ListboxNavigation, { ids: string[] }> & {
	/** Sends a key to the hook inside `act` and returns the spy of the event's `preventDefault`. */
	press: (key: string) => Mock<() => void>;
};

/**
 * Builds the slice of a keyboard event the hook reads.
 *
 * @param key - The `key` of the event.
 * @returns The event, and `preventDefault` as a spy.
 */
function createKeyEvent(key: string): {
	event: KeyboardEvent<HTMLInputElement>;
	preventDefault: Mock<() => void>;
} {
	const preventDefault = vi.fn<() => void>();
	const event = { key, preventDefault } as unknown as KeyboardEvent<HTMLInputElement>;

	return { event, preventDefault };
}

/**
 * Renders the hook with ids that tests change through `rerender`.
 *
 * @param initialIds - The option ids the hook starts with.
 * @returns The hook's result, `rerender` and `press`.
 */
function renderNavigation(initialIds: string[]): NavigationHook {
	const hook = renderHook(({ ids }) => useListboxNavigation(ids), {
		initialProps: { ids: initialIds },
	});

	return {
		...hook,
		press: (key) => {
			const { event, preventDefault } = createKeyEvent(key);

			act(() => {
				hook.result.current.onKeyDown(event);
			});

			return preventDefault;
		},
	};
}

describe('listbox navigation hook', () => {
	it('starts without an active option', () => {
		const { result } = renderNavigation(IDS);

		expect(result.current.activeId).toBeNull();
	});

	it('moves to the first option on arrow down from nothing', () => {
		const { press, result } = renderNavigation(IDS);

		press('ArrowDown');

		expect(result.current.activeId).toBe('first');
	});

	it('moves to the last option on arrow up from nothing', () => {
		const { press, result } = renderNavigation(IDS);

		press('ArrowUp');

		expect(result.current.activeId).toBe('third');
	});

	it('steps down through the options', () => {
		const { press, result } = renderNavigation(IDS);

		press('ArrowDown');
		press('ArrowDown');

		expect(result.current.activeId).toBe('second');
	});

	it('steps up through the options', () => {
		const { press, result } = renderNavigation(IDS);

		press('ArrowUp');
		press('ArrowUp');

		expect(result.current.activeId).toBe('second');
	});

	it('wraps from the last option to the first on arrow down', () => {
		const { press, result } = renderNavigation(IDS);

		press('ArrowDown');
		press('ArrowDown');
		press('ArrowDown');
		press('ArrowDown');

		expect(result.current.activeId).toBe('first');
	});

	it('wraps from the first option to the last on arrow up', () => {
		const { press, result } = renderNavigation(IDS);

		press('ArrowDown');
		press('ArrowUp');

		expect(result.current.activeId).toBe('third');
	});

	it('keeps a single option active when it wraps onto itself', () => {
		const { press, result } = renderNavigation(['only']);

		press('ArrowDown');
		press('ArrowDown');
		press('ArrowUp');

		expect(result.current.activeId).toBe('only');
	});

	it('stays on nothing when there are no options', () => {
		const { press, result } = renderNavigation([]);

		press('ArrowDown');
		press('ArrowUp');

		expect(result.current.activeId).toBeNull();
	});

	it('keeps the browser from moving the caret on the arrow keys', () => {
		const { press } = renderNavigation(IDS);

		expect(press('ArrowDown')).toHaveBeenCalledOnce();
		expect(press('ArrowUp')).toHaveBeenCalledOnce();
	});

	it.each(['Home', 'End', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'a'])(
		'leaves %s to the input',
		(key) => {
			const { press, result } = renderNavigation(IDS);

			press('ArrowDown');
			const preventDefault = press(key);

			expect(preventDefault).not.toHaveBeenCalled();
			expect(result.current.activeId).toBe('first');
		},
	);

	it('resets to nothing when the ids change', () => {
		const { press, rerender, result } = renderNavigation(IDS);

		press('ArrowDown');
		rerender({ ids: ['fourth', 'fifth', 'sixth'] });

		expect(result.current.activeId).toBeNull();
	});

	it('resets even when the active id is still among the new ids', () => {
		const { press, rerender, result } = renderNavigation(IDS);

		press('ArrowDown');
		rerender({ ids: ['first', 'fourth', 'fifth'] });

		expect(result.current.activeId).toBeNull();
	});

	it('does not stay on a stale option after the ids changed there and back', () => {
		const { press, rerender, result } = renderNavigation(IDS);

		press('ArrowDown');
		rerender({ ids: ['fourth', 'fifth', 'sixth'] });
		rerender({ ids: IDS });

		expect(result.current.activeId).toBeNull();
	});

	it('keeps the active option when the same ids arrive in a new array', () => {
		const { press, rerender, result } = renderNavigation(IDS);

		press('ArrowDown');
		rerender({ ids: [...IDS] });

		expect(result.current.activeId).toBe('first');
	});

	it('navigates the new ids after they changed', () => {
		const { press, rerender, result } = renderNavigation(IDS);

		press('ArrowDown');
		rerender({ ids: ['fourth', 'fifth', 'sixth'] });
		press('ArrowDown');

		expect(result.current.activeId).toBe('fourth');
	});

	it('resets to nothing on demand', () => {
		const { press, result } = renderNavigation(IDS);

		press('ArrowDown');
		act(() => {
			result.current.reset();
		});

		expect(result.current.activeId).toBeNull();
	});
});
