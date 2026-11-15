import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';

import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '../with-logic/form';
import { Input } from './input';

interface InputWithLabelProps extends ComponentProps<typeof Input> {
	children?: HTMLAttributes<HTMLLabelElement>['children'];
	description?: ReactNode;
	field?: FieldValues;
	wrapperClassName?: HTMLAttributes<HTMLDivElement>['className'];
}

// An `Input` inside a react-hook-form field, with its label, description and message. It lives apart
// from `Input` on purpose (WEB-448): the form helpers import react-hook-form, and a page that only
// needs a plain input, such as the newsletter on almost every page, would download it as well.
function InputWithLabel({
	children,
	description,
	field,
	wrapperClassName,
	...props
}: Readonly<InputWithLabelProps>) {
	return (
		<FormItem className={wrapperClassName}>
			<FormLabel>{children}</FormLabel>
			<FormControl>
				<Input {...field} {...props} />
			</FormControl>
			{description && <FormDescription className="max-w-none px-3">{description}</FormDescription>}
			<FormMessage />
		</FormItem>
	);
}

export { InputWithLabel };
