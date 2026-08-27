import type { Dispatch, SetStateAction } from 'react';
import { useId } from 'react';

import { Label } from '@/components/ui/label';

import { FormItem } from '../form';
import { ScreenshotUpload } from './screenshot-upload';

interface ScreenshotsFieldProps {
	isSubmitting: boolean;
	screenshotUrls: string[];
	setScreenshotUrls: Dispatch<SetStateAction<string[]>>;
}

// Screenshots are kept in local state instead of react-hook-form, so this uses a plain
// label and description — the `Form*` variants require a surrounding `FormField`. Without that
// context there is no field id either, so the label is tied to the upload's file input here.
export function ScreenshotsField({
	isSubmitting,
	screenshotUrls,
	setScreenshotUrls,
}: Readonly<ScreenshotsFieldProps>) {
	const inputId = useId();

	return (
		<FormItem>
			<Label htmlFor={inputId}>
				Screenshots <span className="text-base text-muted-foreground md:text-lg">(optional)</span>
			</Label>
			<ScreenshotUpload
				disabled={isSubmitting}
				inputId={inputId}
				maxFiles={5}
				onChange={setScreenshotUrls}
				value={screenshotUrls}
			/>
			<p className="text-sm text-muted-foreground">
				Füge Screenshots hinzu, um das Problem zu verdeutlichen.
			</p>
		</FormItem>
	);
}
