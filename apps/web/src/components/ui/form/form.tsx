'use client';

import type * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@tsgi-web/shared';
import { type ComponentPropsWithRef, useId, useMemo } from 'react';
import type { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';
import { Controller, FormProvider } from 'react-hook-form';

import { Label } from '@/components/ui/label';

import { FormFieldContext, FormItemContext } from './form-context';
import { useFormField } from './use-form-field';

const Form = FormProvider;

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => {
	const value = useMemo(() => ({ name: props.name }), [props.name]);

	return (
		<FormFieldContext value={value}>
			<Controller {...props} />
		</FormFieldContext>
	);
};

const FormItem = ({ className, ...props }: ComponentPropsWithRef<'div'>) => {
	const id = useId();
	const value = useMemo(() => ({ id }), [id]);

	return (
		<FormItemContext value={value}>
			<div className={cn('flex flex-col gap-3', className)} {...props} />
		</FormItemContext>
	);
};
FormItem.displayName = 'FormItem';

const FormLabel = ({ className, ...props }: ComponentPropsWithRef<typeof LabelPrimitive.Root>) => {
	const { error, formItemId } = useFormField();

	return (
		<Label
			className={cn({ 'text-destructive': error }, className)}
			htmlFor={formItemId}
			{...props}
		/>
	);
};
FormLabel.displayName = 'FormLabel';

const FormControl = ({ ...props }: ComponentPropsWithRef<typeof Slot>) => {
	const { error, formDescriptionId, formItemId, formMessageId } = useFormField();

	return (
		<Slot
			aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
			aria-invalid={Boolean(error)}
			id={formItemId}
			{...props}
		/>
	);
};
FormControl.displayName = 'FormControl';

const FormDescription = ({ className, ...props }: ComponentPropsWithRef<'p'>) => {
	const { formDescriptionId } = useFormField();

	return (
		<p className={cn('text-muted-foreground px-3', className)} id={formDescriptionId} {...props} />
	);
};
FormDescription.displayName = 'FormDescription';

const FormMessage = ({ children, className, ...props }: ComponentPropsWithRef<'p'>) => {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error?.message) : children;

	if (!body) {
		return null;
	}

	return (
		<p
			className={cn('text-destructive px-3 font-medium italic', className)}
			id={formMessageId}
			{...props}
		>
			{body}
		</p>
	);
};
FormMessage.displayName = 'FormMessage';

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage };
