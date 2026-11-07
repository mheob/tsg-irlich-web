import { act } from '@testing-library/react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { vi } from 'vite-plus/test';
import type { Mock } from 'vite-plus/test';

interface HydratedRoot {
	/** Called by React for every hydration mismatch it recovers from; a clean hydration never calls it. */
	onRecoverableError: Mock;
	/** Unmounts the root and removes its container from the document. */
	unmount: () => void;
}

/**
 * Renders `ui` the way the server sends it: plain markup in a container attached to the document,
 * with no React root behind it and no effect run.
 *
 * @param ui - The element to render.
 * @returns The container holding the server markup.
 */
function renderOnServer(ui: ReactElement): HTMLDivElement {
	const container = document.createElement('div');
	container.innerHTML = renderToString(ui);
	document.body.append(container);
	return container;
}

/**
 * Hydrates the server markup in `container` with `ui`, the way the browser does once the page's
 * JavaScript has loaded, and flushes the effects of that pass.
 *
 * @param container - A container from {@link renderOnServer}.
 * @param ui - The same element the server rendered.
 * @returns The mismatch spy and a function that tears the root down again.
 */
function hydrate(container: HTMLDivElement, ui: ReactElement): HydratedRoot {
	const onRecoverableError = vi.fn();
	// `act` returns nothing a caller can use, so the root leaves its callback through this holder.
	const hydrated: { root?: Root } = {};
	act(() => {
		hydrated.root = hydrateRoot(container, ui, { onRecoverableError });
	});

	return {
		onRecoverableError,
		unmount: () => {
			act(() => {
				hydrated.root?.unmount();
			});
			container.remove();
		},
	};
}

/**
 * The ids an `aria-describedby` (or any other id list) names that no element in the document
 * carries. Assistive technology skips those silently, so a reference that points nowhere is a
 * description the field claims to have and never gets.
 *
 * @param element - The element whose references are checked.
 * @param attribute - The id-list attribute, `aria-describedby` by default.
 * @returns The ids without an element, in the order the attribute names them.
 */
function danglingIdReferences(element: Element, attribute = 'aria-describedby'): string[] {
	const ids = element.getAttribute(attribute)?.split(/\s+/u).filter(Boolean) ?? [];
	return ids.filter((id) => !element.ownerDocument.querySelector(`[id="${id}"]`));
}

export { danglingIdReferences, hydrate, renderOnServer };
export type { HydratedRoot };
