import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

import {
	COMBOBOX_INPUT_CLASS_NAME,
	COMBOBOX_INPUT_GROUP_CLASS_NAME,
	COMBOBOX_TRIGGER_CLASS_NAME,
} from './combobox-classes';

const Combobox = BaseCombobox.Root;

function ComboboxInput({ className, ...props }: ComponentProps<typeof BaseCombobox.Input>) {
	return (
		<BaseCombobox.InputGroup
			className={COMBOBOX_INPUT_GROUP_CLASS_NAME}
			data-slot="combobox-input-group"
		>
			<BaseCombobox.Input
				className={cn(COMBOBOX_INPUT_CLASS_NAME, className)}
				data-slot="combobox-input"
				{...props}
			/>
			<BaseCombobox.Trigger
				aria-label="Auswahl öffnen"
				className={COMBOBOX_TRIGGER_CLASS_NAME}
				data-slot="combobox-trigger"
			>
				<ChevronDownIcon className="size-4 opacity-50" />
			</BaseCombobox.Trigger>
		</BaseCombobox.InputGroup>
	);
}

function ComboboxContent({
	children,
	className,
	...props
}: ComponentProps<typeof BaseCombobox.Popup>) {
	return (
		<BaseCombobox.Portal>
			<BaseCombobox.Positioner className="z-50 outline-hidden" sideOffset={4}>
				<BaseCombobox.Popup
					className={cn(
						'relative w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
						className,
					)}
					data-slot="combobox-content"
					{...props}
				>
					{children}
				</BaseCombobox.Popup>
			</BaseCombobox.Positioner>
		</BaseCombobox.Portal>
	);
}

function ComboboxList({ className, ...props }: ComponentProps<typeof BaseCombobox.List>) {
	return (
		<BaseCombobox.List
			className={cn(
				'max-h-[min(22.5rem,var(--available-height))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0',
				className,
			)}
			data-slot="combobox-list"
			{...props}
		/>
	);
}

function ComboboxItem({ children, className, ...props }: ComponentProps<typeof BaseCombobox.Item>) {
	return (
		<BaseCombobox.Item
			className={cn(
				'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-base outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground md:text-lg',
				className,
			)}
			data-slot="combobox-item"
			{...props}
		>
			<BaseCombobox.ItemIndicator className="absolute right-2 flex size-3.5 items-center justify-center">
				<CheckIcon className="size-4" />
			</BaseCombobox.ItemIndicator>
			{children}
		</BaseCombobox.Item>
	);
}

function ComboboxEmpty({ className, ...props }: ComponentProps<typeof BaseCombobox.Empty>) {
	// The element itself stays mounted so screen readers announce the change; Base UI renders its
	// children only while the list is empty, and `empty:` collapses the padding otherwise.
	return (
		<BaseCombobox.Empty
			className={cn('px-4 py-3 text-base text-muted-foreground empty:p-0', className)}
			data-slot="combobox-empty"
			{...props}
		/>
	);
}

export { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList };
