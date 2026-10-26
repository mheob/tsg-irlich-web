import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

import { cn } from '@tsgi-web/shared';

// No 'use client' here: Base UI's parts carry their own directive, so this wrapper stays a server
// component and a server component (such as `PortableText`) can be passed in as an answer.

// Several items may be open at the same time unless `multiple` is switched off.
export function Accordion({
	multiple = true,
	...props
}: ComponentPropsWithRef<typeof BaseAccordion.Root>) {
	return <BaseAccordion.Root data-slot="accordion" multiple={multiple} {...props} />;
}

export function AccordionItem({
	className,
	...props
}: ComponentPropsWithRef<typeof BaseAccordion.Item>) {
	return (
		<BaseAccordion.Item
			className={cn('border-b border-border last:border-b-0', className)}
			data-slot="accordion-item"
			{...props}
		/>
	);
}

// The question: a button inside a level 3 heading, with a chevron that turns while it is open.
export function AccordionTrigger({
	children,
	className,
	...props
}: ComponentPropsWithRef<typeof BaseAccordion.Trigger>) {
	return (
		<BaseAccordion.Header className="flex" data-slot="accordion-header">
			<BaseAccordion.Trigger
				className={cn(
					'group flex flex-1 cursor-pointer items-center justify-between gap-4 py-5 text-left text-lg font-semibold transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none',
					className,
				)}
				data-slot="accordion-trigger"
				{...props}
			>
				{children}
				<ChevronDown
					aria-hidden="true"
					className="size-5 shrink-0 text-primary transition-transform duration-200 group-data-panel-open:rotate-180 motion-reduce:transition-none"
				/>
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
}: ComponentPropsWithRef<typeof BaseAccordion.Panel>) {
	return (
		<BaseAccordion.Panel
			className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none"
			data-slot="accordion-content"
			hiddenUntilFound={hiddenUntilFound}
			{...props}
		>
			<div className={cn('pb-5', className)}>{children}</div>
		</BaseAccordion.Panel>
	);
}
