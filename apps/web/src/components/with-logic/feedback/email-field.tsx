import type { useForm } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import type { FeedbackFormValues } from '@/lib/validations/feedback';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../form';

interface EmailFieldProps {
	form: ReturnType<typeof useForm<FeedbackFormValues>>;
}

export function EmailField({ form }: Readonly<EmailFieldProps>) {
	return (
		<FormField
			render={({ field }) => (
				<FormItem>
					<FormLabel>
						E-Mail <span className="text-muted-foreground text-base md:text-lg">(optional)</span>
					</FormLabel>
					<FormControl>
						<Input placeholder="deine@email.de" type="email" {...field} />
					</FormControl>
					<FormDescription>
						Falls wir Rückfragen haben oder dich über den Status informieren sollen.
					</FormDescription>
					<FormMessage />
				</FormItem>
			)}
			control={form.control}
			name="email"
		/>
	);
}
