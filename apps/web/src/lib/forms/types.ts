import type { FormByIdQueryResult } from '@/types/sanity.types';

/** A top-level field of a form, as `formByIdQuery` and `formPageQuery` project it. */
type FormFieldDefinition = NonNullable<NonNullable<FormByIdQueryResult>['fields']>[number];

/** A field inside a group: the same projection without nested `fields`, and never a group. */
type FormSubFieldDefinition = NonNullable<
	Extract<FormFieldDefinition, { _type: 'formFieldGroup' }>['fields']
>[number];

/** Any field, top-level or inside a group. */
type AnyFormField = FormFieldDefinition | FormSubFieldDefinition;

/** What the form holds while it is filled in: strings from inputs, arrays, booleans, group entries. */
type FormValues = Record<string, unknown>;

export type { AnyFormField, FormFieldDefinition, FormSubFieldDefinition, FormValues };
