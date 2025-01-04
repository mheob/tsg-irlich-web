import { Box, TextInput } from '@sanity/ui';
import { set, type StringInputProps, type StringSchemaType, unset } from 'sanity';

export default function TimePicker({
	onChange,
	value,
}: Readonly<StringInputProps<StringSchemaType>>) {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = event.target.value;
		if (inputValue) {
			onChange(set(inputValue));
		} else {
			onChange(unset());
		}
	};

	return (
		<Box>
			<TextInput onChange={handleChange} step="900" type="time" value={value ?? ''} />
		</Box>
	);
}
