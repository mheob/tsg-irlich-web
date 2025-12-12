import type { useForm } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import type { FeedbackFormValues } from '@/lib/validations/feedback';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';

interface DeviceFieldProps {
	form: ReturnType<typeof useForm<FeedbackFormValues>>;
}

export function DeviceField({ form }: Readonly<DeviceFieldProps>) {
	return (
		<FormField
			render={({ field }) => (
				<FormItem>
					<FormLabel>
						Gerät{' '}
						<span className="text-muted-foreground text-base md:text-lg">
							(z. B. iPhone 13 Pro, iPad Pro 13" oder Samsung S25 etc.)
						</span>
					</FormLabel>
					<FormControl>
						<Input placeholder="Welches Gerät wird verwendet?" {...field} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
			control={form.control}
			name="device"
		/>
	);
}
