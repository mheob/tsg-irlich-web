import { useSyncExternalStore } from 'react';

/**
 * Nothing to subscribe to: whether the page is hydrated never changes once it is.
 *
 * @returns A no-op unsubscribe.
 */
function subscribe(): () => void {
	return () => {
		// Nothing was subscribed, so there is nothing to undo.
	};
}

/**
 * The snapshot of the browser, which only exists after hydration.
 *
 * @returns Always `true`.
 */
function isHydrated(): boolean {
	return true;
}

/**
 * The snapshot of the server render and of the hydration pass, which must agree with it.
 *
 * @returns Always `false`.
 */
function isNotHydrated(): boolean {
	return false;
}

/**
 * Whether React has hydrated the component. The server markup and the hydration pass see `false`,
 * every render after that sees `true`, without a mismatch and without an effect.
 *
 * @returns `true` once the component runs as an interactive client component.
 */
export function useIsHydrated(): boolean {
	return useSyncExternalStore(subscribe, isHydrated, isNotHydrated);
}
