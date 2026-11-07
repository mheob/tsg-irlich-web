'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { use, useId, useLayoutEffect, useMemo, useState } from 'react';
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
	const [hasDescription, setHasDescription] = useState(false);
	const value = useMemo(() => ({ hasDescription, id, setHasDescription }), [hasDescription, id]);

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
// element of its own — `children` is the element Base UI renders. `aria-describedby` names only
// what is on the page: the description once one has mounted, the message while there is one.
function FormControl({ children, ...props }: Readonly<FormControlProps>) {
	const { error, formDescriptionId, formItemId, formMessageId, hasDescription } = useFormField();
	const describedBy = [hasDescription && formDescriptionId, error?.message && formMessageId]
		.filter(Boolean)
		.join(' ');

	return useRender({
		props: mergeProps(
			{
				'aria-describedby': describedBy || undefined,
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
	const setHasDescription = use(FormItemContext)?.setHasDescription;

	// A layout effect, so the control is described before the browser paints the hydrated form. The
	// server markup cannot know about a sibling yet and leaves the reference out until then.
	useLayoutEffect(() => {
		setHasDescription?.(true);
		return () => {
			setHasDescription?.(false);
		};
	}, [setHasDescription]);

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
