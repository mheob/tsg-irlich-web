'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { useId, useMemo } from 'react';
import type { ComponentProps, ReactElement } from 'react';
import type { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { cn } from '@tsgi-web/shared';

import { Label } from '@/components/ui/label';

import { FormFieldContext, FormItemContext } from './form-context';
import { useFormField } from './use-form-field';

function FormField<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
	const value = useMemo(() => ({ name: props.name }), [props.name]);

	return (
		<FormFieldContext value={value}>
			<Controller {...props} />
		</FormFieldContext>
	);
}

function FormItem({ className, ...props }: ComponentProps<'div'>) {
	const id = useId();
	const value = useMemo(() => ({ id }), [id]);

	return (
		<FormItemContext value={value}>
			<div className={cn('grid gap-3', className)} data-slot="form-item" {...props} />
		</FormItemContext>
	);
}

function FormLabel({ className, ...props }: ComponentProps<typeof Label>) {
	const { error, formItemId } = useFormField();

	return (
		<Label
			className={cn('data-[error=true]:text-destructive-foreground', className)}
			data-error={Boolean(error)}
			data-slot="form-label"
			htmlFor={formItemId}
			{...props}
		/>
	);
}

// Hands the field's id and its error wiring to whatever control it wraps, without rendering an
// element of its own — `children` is the element Base UI renders.
function FormControl({ children, ...props }: Readonly<FormControlProps>) {
	const { error, formDescriptionId, formItemId, formMessageId } = useFormField();

	return useRender({
		props: mergeProps(
			{
				'aria-describedby': error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId,
				'aria-invalid': Boolean(error),
				'data-slot': 'form-control',
				id: formItemId,
			},
			props,
		),
		render: children,
	});
}

function FormDescription({ className, ...props }: ComponentProps<'p'>) {
	const { formDescriptionId } = useFormField();

	return (
		<p
			className={cn('text-sm text-muted-foreground', className)}
			data-slot="form-description"
			id={formDescriptionId}
			{...props}
		/>
	);
}

function FormMessage({ className, ...props }: ComponentProps<'p'>) {
	const { error, formMessageId } = useFormField();
	const body = error ? (error?.message ?? '') : props.children;
	if (!body) {
		return null;
	}

	return (
		<p
			className={cn('px-3 text-sm text-destructive-foreground', className)}
			data-slot="form-message"
			id={formMessageId}
			{...props}
		>
			{body}
		</p>
	);
}

interface FormControlProps extends Omit<ComponentProps<'div'>, 'children'> {
	children: ReactElement;
}

export { FormProvider as Form } from 'react-hook-form';

export { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage };
