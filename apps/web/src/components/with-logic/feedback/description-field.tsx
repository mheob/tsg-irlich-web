import type { useForm } from 'react-hook-form';

import { Textarea } from '@/components/ui/textarea';
import type { FeedbackFormValues } from '@/lib/validations/feedback';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../form';

interface DescriptionFieldProps {
	form: ReturnType<typeof useForm<FeedbackFormValues>>;
}

export function DescriptionField({ form }: Readonly<DescriptionFieldProps>) {
	const selectedType = form.watch('type');

	const getDescriptionPlaceholder = () => {
		switch (selectedType) {
			case 'bug': {
				return 'Was ist passiert? Wie kann ich das Problem reproduzieren?';
			}
			case 'feature': {
				return 'Beschreibe deine Idee...';
			}
			default: {
				return 'Wie können wir dir helfen?';
			}
		}
	};

	return (
		<FormField
			render={({ field }) => (
				<FormItem>
					<FormLabel>Beschreibung</FormLabel>
					<FormControl>
						<Textarea
							className="min-h-[120px] resize-y"
							placeholder={getDescriptionPlaceholder()}
							{...field}
						/>
					</FormControl>
					<FormDescription>Je mehr Details, desto besser können wir helfen.</FormDescription>
					<FormMessage />
				</FormItem>
			)}
			control={form.control}
			name="description"
		/>
	);
}
