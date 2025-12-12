import type { Dispatch, SetStateAction } from 'react';

import { FormDescription, FormItem, FormLabel } from '../form';
import { ScreenshotUpload } from './screenshot-upload';

interface ScreenshotsFieldProps {
	isSubmitting: boolean;
	screenshotUrls: string[];
	setScreenshotUrls: Dispatch<SetStateAction<string[]>>;
}

export function ScreenshotsField({
	isSubmitting,
	screenshotUrls,
	setScreenshotUrls,
}: Readonly<ScreenshotsFieldProps>) {
	return (
		<FormItem>
			<FormLabel>
				Screenshots <span className="text-muted-foreground text-base md:text-lg">(optional)</span>
			</FormLabel>
			<ScreenshotUpload
				disabled={isSubmitting}
				maxFiles={5}
				onChange={setScreenshotUrls}
				value={screenshotUrls}
			/>
			<FormDescription>Füge Screenshots hinzu, um das Problem zu verdeutlichen.</FormDescription>
		</FormItem>
	);
}
