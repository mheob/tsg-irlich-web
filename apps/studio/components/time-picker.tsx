import { Box, TextInput } from '@sanity/ui';
import { useCallback } from 'react';
import type { StringInputProps } from 'sanity';
import { set, unset } from 'sanity';

export default function TimePicker({ onChange, value }: Readonly<StringInputProps>) {
	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const inputValue = event.target.value;
			if (inputValue) {
				onChange(set(inputValue));
			} else {
				onChange(unset());
			}
		},
		[onChange],
	);

	return (
		<Box>
			<TextInput onChange={handleChange} step="900" type="time" value={value ?? ''} />
		</Box>
	);
}
