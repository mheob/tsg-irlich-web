import type { ComponentPropsWithRef, HTMLAttributes } from 'react';
import type { FieldValues } from 'react-hook-form';

import { cn } from '@/utils/cn';

import { FormControl, FormItem, FormLabel, FormMessage } from './form';

const Input = ({ className, type, ...props }: ComponentPropsWithRef<'input'>) => (
	<input
		className={cn(
			'file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring bg-background-high-contrast focus-visible:outline-hidden text-md flex w-full rounded-md px-4 py-2 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-xl',
			className,
		)}
		type={type}
		{...props}
	/>
);
Input.displayName = 'Input';

interface InputWithLabelProps extends ComponentPropsWithRef<typeof Input> {
	children?: HTMLAttributes<HTMLLabelElement>['children'];
	field?: FieldValues;
	wrapperClassName?: HTMLAttributes<HTMLDivElement>['className'];
}

function InputWithLabel({
	children,
	field,
	wrapperClassName,
	...props
}: Readonly<InputWithLabelProps>) {
	return (
		<FormItem className={wrapperClassName}>
			<FormLabel>{children}</FormLabel>
			<FormControl>
				<Input {...props} {...field} />
			</FormControl>
			<FormMessage />
		</FormItem>
	);
}

export { Input, InputWithLabel };
