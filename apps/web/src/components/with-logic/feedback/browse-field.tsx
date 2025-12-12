import type { useForm } from 'react-hook-form';

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { FeedbackFormValues } from '@/lib/validations/feedback';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';

const browserOptions = [
	{ label: 'Chrome', value: 'chrome' },
	{ label: 'Firefox', value: 'firefox' },
	{ label: 'Edge', value: 'edge' },
	{ label: 'Safari', value: 'safari' },
	{ label: 'Anderer Browser', value: 'other' },
] as const;

interface BrowserFieldProps {
	form: ReturnType<typeof useForm<FeedbackFormValues>>;
}

export function BrowserField({ form }: Readonly<BrowserFieldProps>) {
	return (
		<FormField
			render={({ field }) => (
				<FormItem>
					<FormLabel>Browser</FormLabel>
					<Select defaultValue={field.value} onValueChange={field.onChange}>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder="Welcher Browser wird verwendet?" />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{browserOptions.map(option => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
			control={form.control}
			name="browser"
		/>
	);
}
