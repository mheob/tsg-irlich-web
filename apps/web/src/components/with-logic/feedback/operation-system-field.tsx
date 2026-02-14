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

const operationSystemOptions = [
	{ label: 'Windows', value: 'windows' },
	{ label: 'macOS', value: 'macos' },
	{ label: 'Linux', value: 'linux' },
	{ label: 'iOS', value: 'ios' },
	{ label: 'Android', value: 'android' },
	{ label: 'Anderes Betriebssystem', value: 'other' },
] as const;

interface OperationSystemFieldProps {
	form: ReturnType<typeof useForm<FeedbackFormValues>>;
}

export function OperationSystemField({ form }: Readonly<OperationSystemFieldProps>) {
	return (
		<FormField
			render={({ field }) => (
				<FormItem>
					<FormLabel>Betriebssystem</FormLabel>
					<Select onValueChange={field.onChange} value={field.value}>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder="Welches Betriebssystem wird verwendet?" />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{operationSystemOptions.map((option) => (
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
			name="operationSystem"
		/>
	);
}
