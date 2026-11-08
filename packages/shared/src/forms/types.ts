type FieldRetention = 'delete' | 'year';
type SubmissionStatus = 'cancelled' | 'registered' | 'waitlist';

interface FormGroupAnswer {
	_key: string;
	_type: 'formGroupAnswer';
	fieldType: string;
	key: string;
	label: string;
	retention?: FieldRetention;
	value?: string | null;
	values?: string[] | null;
}

interface FormGroupEntry {
	_key: string;
	_type: 'formGroupEntry';
	answers: FormGroupAnswer[];
}

interface FormAnswer extends Omit<FormGroupAnswer, '_type'> {
	_type: 'formAnswer';
	entries?: FormGroupEntry[] | null;
}

interface FormFieldShape {
	_key: string;
	_type: string;
	fields?: FormFieldShape[] | null;
	label?: string | null;
}

interface ExportSubmission {
	_id: string;
	answers: readonly FormAnswer[];
	label?: string | null;
	status: SubmissionStatus;
	submittedAt: string;
}

interface ExportSheet {
	name: string;
	rows: string[][];
}

export type {
	ExportSheet,
	ExportSubmission,
	FieldRetention,
	FormAnswer,
	FormFieldShape,
	FormGroupAnswer,
	FormGroupEntry,
	SubmissionStatus,
};
