/* eslint-disable unicorn/prefer-global-this */

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMatchMediaStub, dispatchMediaQueryChange } from '../../test-utils/setup-dom';
import { useMediaQuery } from './use-media-query';

const QUERY = '(max-width: 48rem)';

describe('media query hook', () => {
	afterEach(() => {
		vi.stubGlobal('matchMedia', createMatchMediaStub(false));
	});

	it('returns false when the query does not match', () => {
		const { result } = renderHook(() => useMediaQuery(QUERY));
		expect(result.current).toBe(false);
	});

	it('returns true when the query matches on mount', () => {
		vi.stubGlobal('matchMedia', createMatchMediaStub(true));
		const { result } = renderHook(() => useMediaQuery(QUERY));
		expect(result.current).toBe(true);
	});

	it('updates when the media query changes', () => {
		const { result } = renderHook(() => useMediaQuery(QUERY));
		const list = window.matchMedia(QUERY);

		act(() => {
			dispatchMediaQueryChange(list, true);
		});

		expect(result.current).toBe(true);
	});

	it('removes its listener on unmount', () => {
		const { unmount } = renderHook(() => useMediaQuery(QUERY));
		const list = window.matchMedia(QUERY);
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		const { listeners } = list as unknown as { listeners: Set<unknown> };

		unmount();

		expect(listeners.size).toBe(0);
	});
});
