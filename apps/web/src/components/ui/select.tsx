import { Select as BaseSelect } from '@base-ui/react/select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import type { ComponentProps, HTMLAttributes } from 'react';
import type { FieldValues } from 'react-hook-form';

import { cn } from '@tsgi-web/shared';

import { FormControl, FormItem, FormLabel, FormMessage } from '../with-logic/form';

const Select = BaseSelect.Root;

function SelectGroup({ ...props }: ComponentProps<typeof BaseSelect.Group>) {
	return <BaseSelect.Group data-slot="select-group" {...props} />;
}

function SelectValue({ ...props }: ComponentProps<typeof BaseSelect.Value>) {
	return <BaseSelect.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
	children,
	className,
	...props
}: ComponentProps<typeof BaseSelect.Trigger>) {
	return (
		<BaseSelect.Trigger
			className={cn(
				'flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background-high-contrast px-4 py-2 text-base whitespace-nowrap shadow-sm transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-placeholder:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 md:text-lg [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 [&_svg:not([class*="text-"])]:text-muted-foreground',
				className,
			)}
			data-slot="select-trigger"
			{...props}
		>
			{children}
			<BaseSelect.Icon>
				<ChevronDownIcon className="size-4 opacity-50" />
			</BaseSelect.Icon>
		</BaseSelect.Trigger>
	);
}

function SelectScrollUpButton({
	className,
	...props
}: ComponentProps<typeof BaseSelect.ScrollUpArrow>) {
	return (
		<BaseSelect.ScrollUpArrow
			className={cn(
				'flex w-full cursor-default items-center justify-center bg-popover py-1',
				className,
			)}
			data-slot="select-scroll-up-button"
			{...props}
		>
			<ChevronUpIcon className="size-4" />
		</BaseSelect.ScrollUpArrow>
	);
}

function SelectScrollDownButton({
	className,
	...props
}: ComponentProps<typeof BaseSelect.ScrollDownArrow>) {
	return (
		<BaseSelect.ScrollDownArrow
			className={cn(
				'flex w-full cursor-default items-center justify-center bg-popover py-1',
				className,
			)}
			data-slot="select-scroll-down-button"
			{...props}
		>
			<ChevronDownIcon className="size-4" />
		</BaseSelect.ScrollDownArrow>
	);
}

function SelectContent({ children, className, ...props }: ComponentProps<typeof BaseSelect.Popup>) {
	return (
		<BaseSelect.Portal>
			{/*
			 * `alignItemWithTrigger` is off so the popup opens below the trigger, the way Radix's
			 * `position="popper"` did, instead of overlapping it like a native select.
			 */}
			<BaseSelect.Positioner
				alignItemWithTrigger={false}
				className="z-50 outline-hidden"
				sideOffset={4}
			>
				<BaseSelect.Popup
					className={cn(
						'relative min-w-[max(8rem,var(--anchor-width))] origin-(--transform-origin) overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
						className,
					)}
					data-slot="select-content"
					{...props}
				>
					<SelectScrollUpButton />
					<BaseSelect.List className="max-h-(--available-height) scroll-my-1 overflow-y-auto p-1">
						{children}
					</BaseSelect.List>
					<SelectScrollDownButton />
				</BaseSelect.Popup>
			</BaseSelect.Positioner>
		</BaseSelect.Portal>
	);
}

function SelectLabel({ className, ...props }: ComponentProps<typeof BaseSelect.GroupLabel>) {
	return (
		<BaseSelect.GroupLabel
			className={cn('px-2 py-1.5 text-sm font-semibold text-muted-foreground', className)}
			data-slot="select-label"
			{...props}
		/>
	);
}

function SelectItem({ children, className, ...props }: ComponentProps<typeof BaseSelect.Item>) {
	return (
		<BaseSelect.Item
			className={cn(
				'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-base outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground md:text-lg [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 [&_svg:not([class*="text-"])]:text-muted-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2',
				className,
			)}
			data-slot="select-item"
			{...props}
		>
			<span className="absolute right-2 flex size-3.5 items-center justify-center">
				<BaseSelect.ItemIndicator>
					<CheckIcon className="size-4" />
				</BaseSelect.ItemIndicator>
			</span>
			<BaseSelect.ItemText>{children}</BaseSelect.ItemText>
		</BaseSelect.Item>
	);
}

function SelectSeparator({ className, ...props }: ComponentProps<typeof BaseSelect.Separator>) {
	return (
		<BaseSelect.Separator
			className={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
			data-slot="select-separator"
			{...props}
		/>
	);
}

function SelectWithLabel({
	children,
	field,
	onValueChange,
	placeholder,
	selectItems,
	wrapperClassName,
	...props
}: Readonly<SelectWithLabelProps>) {
	return (
		<FormItem className={wrapperClassName}>
			<FormLabel>{children}</FormLabel>
			<FormControl>
				<Select
					{...props}
					// `items` is what makes `SelectValue` render the item's label rather than its raw value.
					items={selectItems}
					// oxlint-disable-next-line typescript/no-unsafe-assignment
					onValueChange={onValueChange ?? field?.onChange}
					// oxlint-disable-next-line typescript/no-unsafe-assignment
					value={field?.value}
				>
					<SelectTrigger>
						<SelectValue placeholder={placeholder} />
					</SelectTrigger>
					<SelectContent>
						{selectItems.map(({ label, value }) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</FormControl>
			<FormMessage />
		</FormItem>
	);
}

interface SelectWithLabelProps extends ComponentProps<typeof Select> {
	children?: HTMLAttributes<HTMLLabelElement>['children'];
	field?: FieldValues;
	placeholder?: ComponentProps<typeof SelectValue>['placeholder'];
	// Base UI types an item's `value` as `any`; the app only ever uses strings, and saying so keeps
	// the value out of the unsafe-assignment rule.
	selectItems: { label: ComponentProps<typeof SelectItem>['children']; value: string }[];
	wrapperClassName?: HTMLAttributes<HTMLDivElement>['className'];
}

export {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
	SelectScrollUpButton,
	SelectScrollDownButton,
	SelectWithLabel,
};
