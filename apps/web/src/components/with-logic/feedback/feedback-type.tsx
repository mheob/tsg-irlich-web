import { Bug, HelpCircle, Lightbulb } from 'lucide-react';
import type { useForm } from 'react-hook-form';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { FeedbackFormValues } from '@/lib/validations/feedback';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';

const feedbackTypes = [
	{
		description: 'Etwas funktioniert nicht wie erwartet',
		icon: Bug,
		label: 'Fehlermeldung',
		value: 'bug',
	},
	{
		description: 'Eine Idee für eine Verbesserung',
		icon: Lightbulb,
		label: 'Verbesserungsvorschlag',
		value: 'feature',
	},
	{
		description: 'Ich brauche Hilfe',
		icon: HelpCircle,
		label: 'Frage / Anregung',
		value: 'question',
	},
] as const;

interface FeedbackTypeFieldProps {
	form: ReturnType<typeof useForm<FeedbackFormValues>>;
}

export function FeedbackTypeField({ form }: Readonly<FeedbackTypeFieldProps>) {
	return (
		<FormField
			render={({ field }) => (
				<FormItem>
					<FormLabel>Art des Feedbacks</FormLabel>
					<FormControl>
						<ToggleGroup
							onValueChange={(value) => {
								if (value) field.onChange(value);
							}}
							className="flex-col items-start justify-start sm:flex-row sm:items-center sm:gap-4"
							defaultValue="bug"
							type="single"
							value={field.value}
						>
							{feedbackTypes.map((type) => (
								<ToggleGroupItem
									aria-label={type.label}
									className="flex items-center gap-2 px-4"
									key={type.value}
									value={type.value}
									variant="outline"
								>
									<type.icon className="size-4" />
									{type.label}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
			control={form.control}
			name="type"
		/>
	);
}
