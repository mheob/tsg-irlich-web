'use client';

import { LoaderCircle, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, RefObject } from 'react';

import { cn } from '@tsgi-web/shared';

import {
	Dialog,
	DialogBackdrop,
	DialogClose,
	DialogPopupPrimitive,
	DialogPortal,
	DialogTitle,
} from '@/components/ui/dialog';
import { SEARCH_MAX_LENGTH } from '@/lib/search/constants';
import { getSearchPath, SEARCH_PATH } from '@/lib/search/path';
import { normalizeSearchInput } from '@/lib/search/query';
import type { SearchHit } from '@/lib/search/types';

import { SearchPanelHits } from './search-panel-hits';
import { SearchPanelNotice, SearchPanelPopular } from './search-panel-states';
import { useListboxNavigation } from './use-listbox-navigation';
import { usePopularSearches } from './use-popular-searches';
import { useSearchResults } from './use-search-results';

/** The placeholder while the singleton of the search page is missing. */
const FALLBACK_PLACEHOLDER = 'Wonach suchst du?';

/**
 * The panel hangs below the bar, which is 3.5 rem high below `lg`. There it fills the screen;
 * from `lg` it is as high as its content and scrolls within what is left of the screen. It slides
 * down from behind the bar, which stays on top (`z-50`), and with reduced motion only fades in.
 */
const POPUP_CLASS_NAME =
	'fixed inset-x-0 top-14 bottom-0 z-40 overflow-y-auto overscroll-contain bg-background shadow-xl outline-none transition-[opacity,translate] duration-300 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:data-ending-style:-translate-y-full motion-safe:data-starting-style:-translate-y-full lg:bottom-auto';

/** Where the panel starts from `lg`: below the full bar. */
const POPUP_TOP_CLASS_NAME = 'lg:top-32 lg:max-h-[calc(100dvh-8rem)]';

/** Where the panel starts from `lg` once the bar has shrunk to its scrolled height. */
const POPUP_TOP_COMPACT_CLASS_NAME = 'lg:top-16 lg:max-h-[calc(100dvh-4rem)]';

/**
 * The content of the open panel: the input, the live region and whatever the input leads to.
 *
 * @param props - The content's props.
 * @param props.inputRef - The input, which the dialog focuses when it opens.
 * @param props.onClose - Closes the panel.
 * @param props.placeholder - The placeholder of the input.
 * @returns The content.
 */
function SearchPanelContent({ inputRef, onClose, placeholder }: Readonly<SearchPanelContentProps>) {
	const router = useRouter();
	const id = useId();
	const [input, setInput] = useState('');
	const { result, status } = useSearchResults(input);
	const popularSearches = usePopularSearches();

	// The hits on screen. A failed search shows its notice instead of the last hits it kept.
	const shownResult = status === 'done' || status === 'loading' ? result : null;
	const hits = shownResult ? [...shownResult.pages, ...shownResult.news] : [];
	const hasOptions = hits.length > 0;
	const listboxId = `${id}-listbox`;

	const getOptionId = (hit: SearchHit) => `${id}-option-${hit.id}`;
	const navigation = useListboxNavigation(hits.map((hit) => getOptionId(hit)));
	const { activeId } = navigation;

	useEffect(() => {
		if (activeId !== null) {
			document.querySelector(`[id="${activeId}"]`)?.scrollIntoView({ block: 'nearest' });
		}
	}, [activeId]);

	const navigate = (href: string) => {
		router.push(href);
		onClose();
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		setInput(event.target.value);
		// The marked option belongs to the hits of the old input. Enter must not open it while the
		// hits of the new one are on their way.
		navigation.reset();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		navigation.onKeyDown(event);

		// Enter that confirms a composed character (an IME) is no search.
		if (event.key !== 'Enter' || event.nativeEvent.isComposing) {
			return;
		}

		event.preventDefault();

		const activeHit = hits.find((hit) => getOptionId(hit) === activeId);
		const term = normalizeSearchInput(input);

		navigate(activeHit?.href ?? (term === '' ? SEARCH_PATH : getSearchPath(term)));
	};

	return (
		// The logo hangs below the bar on a phone and in the scrolled desktop bar; the top padding
		// keeps the input clear of it.
		<div className="container mx-auto flex flex-col gap-6 pt-6 pb-8 lg:pt-8 lg:pb-10">
			<DialogTitle className="sr-only">Website durchsuchen</DialogTitle>

			<div className="flex items-center gap-3 border-b-2 border-primary-light focus-within:border-primary">
				{status === 'loading' ? (
					<LoaderCircle
						aria-hidden="true"
						className="size-6 shrink-0 text-primary-light motion-safe:animate-spin"
					/>
				) : (
					<Search aria-hidden="true" className="size-6 shrink-0 text-primary-light" />
				)}
				<label className="sr-only" htmlFor={`${id}-input`}>
					Suchbegriff
				</label>
				<input
					aria-activedescendant={activeId ?? undefined}
					aria-autocomplete="list"
					aria-controls={hasOptions ? listboxId : undefined}
					aria-expanded={hasOptions}
					autoComplete="off"
					className="h-14 min-w-0 flex-1 bg-transparent font-serif text-3xl tracking-wide text-primary placeholder:text-muted-foreground focus:outline-none md:text-4xl lg:h-16 lg:text-5xl"
					enterKeyHint="search"
					id={`${id}-input`}
					maxLength={SEARCH_MAX_LENGTH}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					ref={inputRef}
					role="combobox"
					spellCheck={false}
					type="text"
					value={input}
				/>
				<DialogClose className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-primary transition-colors hover:bg-background-low-contrast focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none">
					<X aria-hidden="true" className="size-6" />
					<span className="sr-only">Suche schließen</span>
				</DialogClose>
			</div>

			{/* Mounted for as long as the panel is open, so screen readers pick up its changes. An
			    `output` holds the result of a form and is no live region in every screen reader. */}
			{/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role */}
			<p aria-live="polite" className="sr-only" role="status">
				{status === 'loading' ? 'Suche läuft …' : ''}
			</p>

			{status === 'idle' && popularSearches && (
				<SearchPanelPopular onNavigate={onClose} popularSearches={popularSearches} />
			)}

			{status === 'error' && (
				<SearchPanelNotice onNavigate={onClose} query={normalizeSearchInput(input)}>
					Die Suche ist gerade nicht erreichbar.
				</SearchPanelNotice>
			)}

			{shownResult && !hasOptions && (
				<SearchPanelNotice onNavigate={onClose} query={shownResult.query}>
					{`Keine Treffer für „${shownResult.query}“.`}
				</SearchPanelNotice>
			)}

			{shownResult && hasOptions && (
				<SearchPanelHits
					activeId={activeId}
					getOptionId={getOptionId}
					listboxId={listboxId}
					onNavigate={onClose}
					result={shownResult}
				/>
			)}
		</div>
	);
}

/**
 * The search panel of the navigation: a modal dialog that hangs below the bar, with a big input and
 * the hits of the panel route below it. It is loaded on the first press of the lupe, so a page
 * nobody searches on does not carry it.
 *
 * - The dialog traps the focus and moves it into the input when it opens. Escape, the close button
 *   and a click on the dimmed page close it, and the focus returns to `finalFocus`.
 * - The input is a combobox for the listbox of hits: ArrowDown and ArrowUp mark an option while the
 *   focus stays in the input, Enter opens the marked hit or, without one, the search page.
 * - Everything the panel holds is gone once it has closed, so it opens empty again.
 *
 * @param props - The panel's props.
 * @param props.finalFocus - Where the focus goes when the panel closes: the lupe that opened it.
 * @param props.isBarCompact - Whether the bar has shrunk to its scrolled height, which from `lg`
 * moves the top of the panel up.
 * @param props.onOpenChange - Called when the panel wants to open or close.
 * @param props.open - Whether the panel is open.
 * @param props.placeholder - The placeholder of the search page, a default while it is missing.
 * @returns The dialog.
 */
function SearchPanel({
	finalFocus,
	isBarCompact = false,
	onOpenChange,
	open,
	placeholder,
}: Readonly<SearchPanelProps>) {
	const inputRef = useRef<HTMLInputElement>(null);
	// Base UI plays the enter transition only for a dialog that mounts closed and opens later. The
	// panel mounts on the first press of a lupe, already meant to be open, so it opens a frame after
	// its mount; otherwise the first opening per page load would neither slide nor fade in.
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		const frame = requestAnimationFrame(() => {
			setHasMounted(true);
		});

		return () => {
			cancelAnimationFrame(frame);
		};
	}, []);

	const close = () => {
		onOpenChange(false);
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open && hasMounted}>
			<DialogPortal>
				{/* Behind the bar too, so the bar stays bright above the dimmed page; the navigation
				    makes all of it but the menu toggle inert meanwhile. */}
				<DialogBackdrop className="z-40 bg-primary/40 duration-300" />
				<DialogPopupPrimitive
					className={cn(
						POPUP_CLASS_NAME,
						isBarCompact ? POPUP_TOP_COMPACT_CLASS_NAME : POPUP_TOP_CLASS_NAME,
					)}
					finalFocus={finalFocus}
					initialFocus={inputRef}
				>
					<SearchPanelContent
						inputRef={inputRef}
						onClose={close}
						placeholder={placeholder ?? FALLBACK_PLACEHOLDER}
					/>
				</DialogPopupPrimitive>
			</DialogPortal>
		</Dialog>
	);
}

interface SearchPanelProps {
	finalFocus: RefObject<HTMLElement | null>;
	isBarCompact?: boolean;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	placeholder?: null | string;
}

interface SearchPanelContentProps {
	inputRef: RefObject<HTMLInputElement | null>;
	onClose: () => void;
	placeholder: string;
}

export { SearchPanel };
