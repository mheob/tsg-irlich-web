import { useId } from 'react';
import type { useForm } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import type { ContactFormData } from '@/lib/validations/contact-form';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../form';

interface PrivacyFieldProps {
	form: ReturnType<typeof useForm<ContactFormData>>;
}

export function PrivacyField({ form }: Readonly<PrivacyFieldProps>) {
	// Base UI's `Checkbox.Root` renders a `span[role="checkbox"]` and moves the `id` `FormControl`
	// hands it onto its own hidden `input`, so `FormLabel`'s `htmlFor` names that hidden input and
	// never the control a user operates. `aria-labelledby` is the only wiring that reaches it.
	const labelId = useId();

	return (
		<FormField
			render={({ field }) => (
				<FormItem>
					<FormLabel>Datenschutzbestimmungen</FormLabel>
					<FormDescription>
						{/* The label makes the text toggle the checkbox for pointer and keyboard alike */}
						<label className="flex max-w-full cursor-pointer gap-2">
							<FormControl>
								<Checkbox
									aria-labelledby={labelId}
									checked={field.value}
									className="mt-0.5"
									// oxlint-disable-next-line react/jsx-handler-names
									onBlur={field.onBlur}
									// oxlint-disable-next-line react/jsx-handler-names
									onCheckedChange={field.onChange}
									ref={field.ref}
								/>
							</FormControl>
							<span id={labelId}>
								Ich akzeptiere die Datenschutzbestimmungen. Meine Daten werden nur für die Zwecke
								verwendet, für die sie erhoben wurden.
							</span>
						</label>
					</FormDescription>
					<FormMessage />
				</FormItem>
			)}
			control={form.control}
			name="privacy"
		/>
	);
}
