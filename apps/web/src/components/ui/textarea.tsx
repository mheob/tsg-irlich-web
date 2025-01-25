import { cn } from '@tsgi-web/shared';
import type { ComponentPropsWithRef, HTMLAttributes } from 'react';
import type { FieldValues } from 'react-hook-form';

import { FormControl, FormItem, FormLabel, FormMessage } from './form';

const Textarea = ({ className, ...props }: ComponentPropsWithRef<'textarea'>) => (
	<textarea
		className={cn(
			'placeholder:text-muted-foreground focus-visible:ring-ring bg-background-high-contrast focus-visible:outline-hidden text-md flex min-h-[7lh] w-full rounded-md px-4 py-2 focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-xl',
			className,
		)}
		{...props}
	/>
);
Textarea.displayName = 'Textarea';

interface TextareaWithLabelProps extends ComponentPropsWithRef<typeof Textarea> {
	children?: HTMLAttributes<HTMLLabelElement>['children'];
	field?: FieldValues;
	wrapperClassName?: HTMLAttributes<HTMLDivElement>['className'];
}

function TextareaWithLabel({
	children,
	field,
	wrapperClassName,
	...props
}: Readonly<TextareaWithLabelProps>) {
	return (
		<FormItem className={wrapperClassName}>
			<FormLabel>{children}</FormLabel>
			<FormControl>
				<Textarea {...props} {...field} />
			</FormControl>
			<FormMessage />
		</FormItem>
	);
}

export { Textarea, TextareaWithLabel };
