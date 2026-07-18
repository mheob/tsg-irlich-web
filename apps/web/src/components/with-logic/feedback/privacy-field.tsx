import type { useForm } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import type { FeedbackFormValues } from '@/lib/validations/feedback';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../form';

interface PrivacyFieldProps {
	form: ReturnType<typeof useForm<FeedbackFormValues>>;
}

export function PrivacyField({ form }: Readonly<PrivacyFieldProps>) {
	return (
		<FormField
			// oxlint-disable-next-line react_perf/jsx-no-new-function-as-prop
			render={({ field }) => (
				<FormItem>
					<FormLabel>Datenschutzbestimmungen</FormLabel>
					<FormDescription className="flex max-w-full gap-2">
						<FormControl>
							<Checkbox
								checked={field.value}
								className="mt-0.5"
								// oxlint-disable-next-line react/jsx-handler-names
								onBlur={field.onBlur}
								// oxlint-disable-next-line react/jsx-handler-names
								onCheckedChange={field.onChange}
								ref={field.ref}
							/>
						</FormControl>
						<span
							className="cursor-pointer"
							// oxlint-disable-next-line react_perf/jsx-no-new-function-as-prop
							onClick={() => field.onChange(!field.value)}
						>
							Ich akzeptiere die Datenschutzbestimmungen. Meine Daten werden nur für die Zwecke
							verwendet, für die sie erhoben wurden.
						</span>
					</FormDescription>
					<FormMessage />
				</FormItem>
			)}
			control={form.control}
			name="privacy"
		/>
	);
}
