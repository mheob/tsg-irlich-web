import type { useForm } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import type { FeedbackFormValues } from '@/lib/validations/feedback';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';

interface TitleFieldProps {
	form: ReturnType<typeof useForm<FeedbackFormValues>>;
}

export function TitleField({ form }: Readonly<TitleFieldProps>) {
	return (
		<FormField
			render={({ field }) => (
				<FormItem>
					<FormLabel>Titel</FormLabel>
					<FormControl>
						<Input placeholder="Kurze Zusammenfassung..." {...field} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
			control={form.control}
			name="title"
		/>
	);
}
