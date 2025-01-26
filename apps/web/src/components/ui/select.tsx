'use client';

import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@tsgi-web/shared';
import type { ComponentPropsWithoutRef, ComponentPropsWithRef, HTMLAttributes } from 'react';
import type { FieldValues } from 'react-hook-form';

import { FormControl, FormItem, FormLabel, FormMessage } from './form';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = ({
	children,
	className,
	...props
}: ComponentPropsWithRef<typeof SelectPrimitive.Trigger>) => (
	<SelectPrimitive.Trigger
		className={cn(
			'data-placeholder:text-muted-foreground ring-offset-background focus-visible:ring-ring bg-background-high-contrast focus-visible:outline-hidden text-md flex w-full items-center justify-between whitespace-nowrap rounded-md border-0 px-4 py-2 shadow-sm focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-xl [&>span]:line-clamp-1',
			className,
		)}
		{...props}
	>
		{children}
		<SelectPrimitive.Icon asChild>
			<ChevronDownIcon className="h-4 w-4 opacity-50" />
		</SelectPrimitive.Icon>
	</SelectPrimitive.Trigger>
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = ({
	className,
	...props
}: ComponentPropsWithRef<typeof SelectPrimitive.ScrollUpButton>) => (
	<SelectPrimitive.ScrollUpButton
		className={cn('flex cursor-default items-center justify-center py-1', className)}
		{...props}
	>
		<ChevronUpIcon className="h-4 w-4" />
	</SelectPrimitive.ScrollUpButton>
);
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = ({
	className,
	...props
}: ComponentPropsWithRef<typeof SelectPrimitive.ScrollDownButton>) => (
	<SelectPrimitive.ScrollDownButton
		className={cn('flex cursor-default items-center justify-center py-1', className)}
		{...props}
	>
		<ChevronDownIcon className="h-4 w-4" />
	</SelectPrimitive.ScrollDownButton>
);
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = ({
	children,
	className,
	position = 'popper',
	...props
}: ComponentPropsWithRef<typeof SelectPrimitive.Content>) => (
	<SelectPrimitive.Portal>
		<SelectPrimitive.Content
			className={cn(
				'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md',
				{
					'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1':
						position === 'popper',
				},
				className,
			)}
			position={position}
			{...props}
		>
			<SelectScrollUpButton />
			<SelectPrimitive.Viewport
				className={cn('p-1', {
					'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]':
						position === 'popper',
				})}
			>
				{children}
			</SelectPrimitive.Viewport>
			<SelectScrollDownButton />
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = ({
	className,
	...props
}: ComponentPropsWithRef<typeof SelectPrimitive.Label>) => (
	<SelectPrimitive.Label
		className={cn('px-2 py-1.5 text-sm font-semibold', className)}
		{...props}
	/>
);
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = ({
	children,
	className,
	...props
}: ComponentPropsWithRef<typeof SelectPrimitive.Item>) => (
	<SelectPrimitive.Item
		className={cn(
			'focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			className,
		)}
		{...props}
	>
		<span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
			<SelectPrimitive.ItemIndicator>
				<CheckIcon className="h-4 w-4" />
			</SelectPrimitive.ItemIndicator>
		</span>
		<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
	</SelectPrimitive.Item>
);
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = ({
	className,
	...props
}: ComponentPropsWithRef<typeof SelectPrimitive.Separator>) => (
	<SelectPrimitive.Separator className={cn('bg-muted -mx-1 my-1 h-px', className)} {...props} />
);
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

interface SelectWithLabelProps extends ComponentPropsWithRef<typeof Select> {
	children?: HTMLAttributes<HTMLLabelElement>['children'];
	field?: FieldValues;
	placeholder?: ComponentPropsWithoutRef<typeof SelectValue>['placeholder'];
	selectItems: {
		label: ComponentPropsWithoutRef<typeof SelectItem>['children'];
		value: ComponentPropsWithoutRef<typeof SelectItem>['value'];
	}[];
	wrapperClassName?: HTMLAttributes<HTMLDivElement>['className'];
}

function SelectWithLabel({
	children,
	field,
	placeholder,
	selectItems,
	wrapperClassName,
	...props
}: Readonly<SelectWithLabelProps>) {
	return (
		<FormItem className={wrapperClassName}>
			<FormLabel>{children}</FormLabel>
			<FormControl>
				<Select {...props} defaultValue={field?.value} onValueChange={field?.onChange}>
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

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
	SelectWithLabel,
};
