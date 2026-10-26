import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

import { cn } from '@tsgi-web/shared';

// No 'use client' here: Base UI's parts carry their own directive, so this wrapper stays a server
// component and a server component (such as `PortableText`) can be passed in as an answer.

// Several items may be open at the same time unless `multiple` is switched off.
export function Accordion({
	className,
	multiple = true,
	...props
}: Readonly<ComponentPropsWithRef<typeof BaseAccordion.Root>>) {
	return (
		<BaseAccordion.Root
			className={cn('flex flex-col gap-4', className)}
			data-slot="accordion"
			multiple={multiple}
			{...props}
		/>
	);
}

export function AccordionItem({
	className,
	...props
}: Readonly<ComponentPropsWithRef<typeof BaseAccordion.Item>>) {
	return (
		<BaseAccordion.Item
			className={cn(
				'overflow-hidden rounded-xl border-l-4 border-transparent bg-card shadow-md transition-[border-color,box-shadow] duration-200 data-open:border-secondary data-open:shadow-lg motion-reduce:transition-none',
				className,
			)}
			data-slot="accordion-item"
			{...props}
		/>
	);
}

// The question: a button inside a level 3 heading. Its chevron sits in a yellow circle like the
// arrows of the cards and turns while the answer is open.
export function AccordionTrigger({
	children,
	className,
	...props
}: Readonly<ComponentPropsWithRef<typeof BaseAccordion.Trigger>>) {
	return (
		<BaseAccordion.Header className="flex" data-slot="accordion-header">
			<BaseAccordion.Trigger
				className={cn(
					'group flex flex-1 cursor-pointer items-center justify-between gap-6 px-6 py-5 text-left text-lg font-semibold text-primary transition-colors outline-none hover:text-primary-light focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset motion-reduce:transition-none',
					className,
				)}
				data-slot="accordion-trigger"
				{...props}
			>
				{children}
				{/* Tailwind 4 turns an element through `rotate`, not `transform`, so that is what transitions */}
				<span
					aria-hidden="true"
					className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground transition-[rotate,background-color] duration-200 group-hover:bg-secondary-light group-data-panel-open:rotate-180 motion-reduce:transition-none"
				>
					<ChevronDown className="size-5" strokeWidth={2.5} />
				</span>
			</BaseAccordion.Trigger>
		</BaseAccordion.Header>
	);
}

// The answer. `hiddenUntilFound` keeps it in the markup while it is closed, so crawlers read it and
// the browser's find-in-page opens it. React only knows `hidden` as on or off, so the server sends
// `hidden=""` and Base UI switches it to `until-found` after hydration.
export function AccordionContent({
	children,
	className,
	hiddenUntilFound = true,
	...props
}: Readonly<ComponentPropsWithRef<typeof BaseAccordion.Panel>>) {
	return (
		<BaseAccordion.Panel
			className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none"
			data-slot="accordion-content"
			hiddenUntilFound={hiddenUntilFound}
			{...props}
		>
			<div className={cn('mx-6 border-t border-border/50 pt-4 pb-6', className)}>{children}</div>
		</BaseAccordion.Panel>
	);
}
