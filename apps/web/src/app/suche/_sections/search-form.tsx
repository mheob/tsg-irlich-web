import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEARCH_MAX_LENGTH } from '@/lib/search/constants';
import { SEARCH_PATH } from '@/lib/search/path';
import type { SearchTab } from '@/lib/search/types';

const INPUT_ID = 'search-page-query';

/** The placeholder while the singleton of the page is missing. */
const FALLBACK_PLACEHOLDER = 'Wonach suchst du?';

/**
 * The search form of the search page. It is a plain GET form, so it works without JavaScript: the
 * term lands in the URL and the page renders the hits on the server.
 *
 * @param props - The form's props.
 * @param props.placeholder - The placeholder of the field, a default while the singleton is missing.
 * @param props.query - The current search term, which the field starts with.
 * @param props.tab - The current tab. A tab other than „Alle“ travels as the hidden `typ`, so a new
 * search stays on it. The page number never does: a new search starts on the first page.
 * @returns The form.
 */
function SearchForm({ placeholder = FALLBACK_PLACEHOLDER, query, tab }: Readonly<SearchFormProps>) {
	return (
		<form
			action={SEARCH_PATH}
			className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
			method="get"
			// `role="search"` on the form is the landmark every browser and screen reader supports; the
			// newer `<search>` element would wrap the form in a second element for the same effect.
			// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
			role="search"
		>
			<label className="sr-only" htmlFor={INPUT_ID}>
				Suchbegriff
			</label>
			<Input
				className="h-12 flex-1 border-2 border-primary-light bg-background md:h-14"
				defaultValue={query}
				enterKeyHint="search"
				id={INPUT_ID}
				maxLength={SEARCH_MAX_LENGTH}
				name="q"
				placeholder={placeholder}
				type="search"
			/>
			{tab !== 'alle' && <input name="typ" type="hidden" value={tab} />}
			<Button type="submit" variant="secondary">
				Suchen
			</Button>
		</form>
	);
}

interface SearchFormProps {
	placeholder?: string;
	query: string;
	tab: SearchTab;
}

export { SearchForm };
