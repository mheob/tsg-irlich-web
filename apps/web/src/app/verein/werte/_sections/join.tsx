import { ButtonLink } from '@/components/ui/button';
import { getNavigationEntries } from '@/components/with-logic/navigation/navigation-entries';
import type { NavigationLink } from '@/components/with-logic/navigation/navigation-entries';
import { VALUES_PAGE_PATH } from '@/utils/links';

import type { JoinSection } from '../_shared/types';

/** Classes that turn the ghost button into an outline on the blue band. */
const OUTLINE_CLASS_NAME = 'border-white bg-transparent text-white hover:bg-white/10';

/**
 * Resolves the buttons the way the main navigation resolves its links: an internal link through
 * `getInternalHref`, an external one through its `href`, and one without a title or a target is
 * left out.
 *
 * @param links - The buttons of the section.
 * @returns The buttons that can be rendered, in the order of the editors.
 */
function resolveLinks(links: JoinSection['links']): NavigationLink[] {
	const entries = getNavigationEntries(
		links.map((link) => ({ ...link, _type: 'navigationLink', children: [] })),
		VALUES_PAGE_PATH,
	);

	return entries.flatMap((entry) => (entry.kind === 'link' ? [entry.link] : []));
}

/**
 * „Werte leben – mach mit!“: the closing call on the blue band, with up to two buttons. The first
 * is yellow, every other one outlined; an external one opens in a new tab. The page puts the
 * newsletter below it, so the band does not run into the blue footer.
 *
 * @param props - The section.
 * @param props.section - The title, the text and the buttons from the studio.
 * @returns The section, or nothing without a title.
 */
function Join({ section }: Readonly<{ section: JoinSection }>) {
	const { links, text, title } = section;

	if (!title) {
		return null;
	}

	const buttons = resolveLinks(links);

	return (
		<section className="bg-primary text-primary-foreground">
			<div className="container py-14 md:py-24 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
				<div>
					<h2 className="font-serif text-5xl uppercase md:text-7xl">{title}</h2>
					{/* The global `p` colour does not inherit, so the text takes the band's colour itself. */}
					{text && <p className="mt-4 max-w-3xl text-primary-foreground md:text-xl">{text}</p>}
				</div>
				{buttons.length > 0 && (
					<div className="mt-8 flex flex-wrap gap-4 lg:mt-0">
						{buttons.map((button, index) => (
							<ButtonLink
								className={index === 0 ? undefined : OUTLINE_CLASS_NAME}
								href={button.href}
								key={button.key}
								variant={index === 0 ? 'secondary' : 'ghost'}
								{...(button.isExternal ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
							>
								{button.title}
							</ButtonLink>
						))}
					</div>
				)}
			</div>
		</section>
	);
}

export { Join };
