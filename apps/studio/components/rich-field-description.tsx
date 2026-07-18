import type { ComponentType, JSX, ReactNode } from 'react';
import { FormField } from 'sanity';
import type { StringFieldProps } from 'sanity';

export function withRichDescription(description: ReactNode): ComponentType<StringFieldProps> {
	return function RichDescriptionField(props: Readonly<StringFieldProps>): JSX.Element {
		const { inputId, level, path, renderDefault, title, validation } = props;

		return (
			<FormField
				description={description}
				inputId={inputId}
				level={level}
				path={path}
				title={title}
				validation={validation}
			>
				{renderDefault({ ...props, description: undefined, title: undefined })}
			</FormField>
		);
	};
}
