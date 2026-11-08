/**
 * The visible label of a field, with an asterisk when it is required. The asterisk is hidden from
 * assistive technology, which learns the same from `aria-required`. A group of buttons or checkboxes
 * may not carry `aria-required`, so it spells the requirement out for screen readers instead.
 *
 * @param props - The label's props.
 * @param props.isGroup - Whether the label names a group rather than a single control.
 * @param props.isRequired - Whether the field is required.
 * @param props.label - The editor's label.
 * @returns The label's content.
 */
function FieldLabel({ isGroup = false, isRequired, label }: Readonly<FieldLabelProps>) {
	return (
		<>
			{label}
			{isRequired && <span aria-hidden="true">*</span>}
			{isRequired && isGroup && (
				<>
					{/* A space of its own: a flex container drops it, the accessible name keeps it */}{' '}
					<span className="sr-only">(Pflichtfeld)</span>
				</>
			)}
		</>
	);
}

interface FieldLabelProps {
	isGroup?: boolean;
	isRequired?: boolean | null;
	label: string;
}

export { FieldLabel };
