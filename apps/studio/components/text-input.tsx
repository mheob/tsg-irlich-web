import { Stack, Text } from '@sanity/ui';
import type { TextInputProps } from 'sanity';

export default function TextInput(props: Readonly<TextInputProps>) {
	const { renderDefault, value } = props;

	return (
		<Stack space={3}>
			{renderDefault(props)}
			<Text align="right" size={1}>
				Anzahl Zeichen: {value?.length ?? 0}
			</Text>
		</Stack>
	);
}
