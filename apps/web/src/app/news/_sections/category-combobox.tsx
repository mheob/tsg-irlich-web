'use client';

import { ChevronDownIcon } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { lazy, startTransition, Suspense, useEffect, useState } from 'react';

import {
	COMBOBOX_INPUT_CLASS_NAME,
	COMBOBOX_INPUT_GROUP_CLASS_NAME,
	COMBOBOX_TRIGGER_CLASS_NAME,
} from '@/components/ui/combobox-classes';
import type { NewsCategoriesQueryResult } from '@/types/sanity.types';

import type { CategoryComboboxField as FieldComponent } from './category-combobox-field';
import { getCategoryOptions, getCurrentHref } from './category-options';

/**
 * Why the combobox is loaded, weakest first. A stronger reason replaces a weaker one, never the other
 * way round: a press focuses the field too, and its focus must not undo the open list.
 */
const ACTIVATIONS = ['none', 'load', 'focus', 'press'] as const;

type Activation = (typeof ACTIVATIONS)[number];

/** The keys that open the list of a combobox: they open it as soon as it has loaded. */
const OPENING_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Enter']);

/**
 * The combobox module, imported once. `isLoaded` lets a category page reached by a client-side
 * navigation show the combobox right away instead of its placeholder.
 */
interface FieldModule {
	CategoryComboboxField: typeof FieldComponent;
}

const field: { isLoaded: boolean; module: Promise<FieldModule> | null } = {
	isLoaded: false,
	module: null,
};

async function importField(): Promise<FieldModule> {
	const loaded = await import('./category-combobox-field');
	field.isLoaded = true;
	return loaded;
}

const CategoryComboboxField = lazy(async () => {
	field.module ??= importField();
	const { CategoryComboboxField: component } = await field.module;
	return { default: component };
});

function isStronger(next: Activation, current: Activation): boolean {
	return ACTIVATIONS.indexOf(next) > ACTIVATIONS.indexOf(current);
}

/**
 * Runs a callback once the page has loaded. The hero image paints well before the `load` event, so
 * whatever the callback loads never competes with it.
 *
 * @param onLoad - What to run.
 * @returns A function that cancels it.
 */
function afterLoad(onLoad: () => void): () => void {
	if (document.readyState === 'complete') {
		const handle = globalThis.setTimeout(onLoad, 0);
		return () => {
			globalThis.clearTimeout(handle);
		};
	}

	globalThis.addEventListener('load', onLoad, { once: true });
	return () => {
		globalThis.removeEventListener('load', onLoad);
	};
}

/**
 * What the server renders and the page shows until the combobox has loaded: its input and its
 * trigger with the same classes and name, so nothing moves when it is swapped. Using it is what
 * loads the combobox, which then takes the focus and, after a press, opens its list.
 *
 * @param props - The current selection, and what to call when the placeholder is used.
 * @param props.label - The label of the current selection.
 * @param props.onActivate - Called with the reason once the placeholder is used.
 * @returns The placeholder.
 */
function CategoryComboboxPlaceholder({
	label,
	onActivate,
}: Readonly<{ label: string; onActivate: (activation: Activation) => void }>) {
	function handleKeyDown(event: KeyboardEvent) {
		if (OPENING_KEYS.has(event.key)) {
			onActivate('press');
		}
	}

	return (
		<div className={COMBOBOX_INPUT_GROUP_CLASS_NAME} data-slot="combobox-input-group">
			<input
				aria-autocomplete="list"
				aria-expanded="false"
				aria-haspopup="listbox"
				aria-label="News-Kategorie"
				autoComplete="off"
				className={COMBOBOX_INPUT_CLASS_NAME}
				data-slot="combobox-input"
				onFocus={() => {
					onActivate('focus');
				}}
				onKeyDown={handleKeyDown}
				onPointerDown={() => {
					onActivate('press');
				}}
				readOnly
				// ARIA asks for `aria-controls` only while the list is shown; Base UI's server markup
				// leaves it out the same way.
				// oxlint-disable-next-line jsx-a11y/role-has-required-aria-props
				role="combobox"
				spellCheck={false}
				value={label}
			/>
			<button
				aria-label="Auswahl öffnen"
				className={COMBOBOX_TRIGGER_CLASS_NAME}
				data-slot="combobox-trigger"
				onFocus={() => {
					onActivate('focus');
				}}
				onKeyDown={handleKeyDown}
				onPointerDown={() => {
					onActivate('press');
				}}
				type="button"
			>
				<ChevronDownIcon className="size-4 opacity-50" />
			</button>
		</div>
	);
}

interface CategoryComboboxProps extends NewsCategoriesQueryResult {
	className?: string;
	/** The slug of the category whose page renders the combobox; the overview passes none. */
	currentSlug?: string;
}

/**
 * The category switch of the news overview and the category pages (WEB-448). The combobox brings
 * Base UI's combobox and Floating UI, which the first paint does not need, and Lighthouse counts
 * every byte that starts loading before the hero image paints. So the page renders a placeholder and
 * loads the combobox after the `load` event, or as soon as the placeholder is used. The swap runs in
 * a transition: the placeholder, focus included, stays until the combobox is there.
 *
 * @param props - The categories, the total and the current page.
 * @param props.categories - The categories with at least one article.
 * @param props.className - Classes of the wrapper.
 * @param props.currentSlug - The slug of the current category page.
 * @param props.total - The number of all articles.
 * @returns The placeholder or the combobox.
 */
export function CategoryCombobox({
	categories,
	className,
	currentSlug,
	total,
}: Readonly<CategoryComboboxProps>) {
	const [activation, setActivation] = useState<Activation>(() =>
		field.isLoaded ? 'load' : 'none',
	);

	const currentHref = getCurrentHref(currentSlug);
	const label =
		getCategoryOptions(categories, total).find((option) => option.value === currentHref)?.label ??
		'';

	function activate(next: Activation) {
		startTransition(() => {
			setActivation((current) => (isStronger(next, current) ? next : current));
		});
	}

	useEffect(
		() =>
			afterLoad(() => {
				startTransition(() => {
					setActivation((current) => (current === 'none' ? 'load' : current));
				});
			}),
		[],
	);

	const placeholder = <CategoryComboboxPlaceholder label={label} onActivate={activate} />;

	return (
		<div className={className}>
			<Suspense fallback={placeholder}>
				{activation === 'none' ? (
					placeholder
				) : (
					<CategoryComboboxField
						categories={categories}
						currentSlug={currentSlug}
						hasFocusOnMount={activation === 'focus' || activation === 'press'}
						isOpenOnMount={activation === 'press'}
						total={total}
					/>
				)}
			</Suspense>
		</div>
	);
}
