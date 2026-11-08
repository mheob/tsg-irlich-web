import { useFormContext } from 'react-hook-form';

/** The name of the honeypot, in the form and in the action's input. */
const HONEYPOT_NAME = 'hp_confirm';

/**
 * A text input no visitor sees, reaches or has filled in by the browser: off-screen, hidden from
 * assistive technology and out of the tab order. A bot that fills every input it finds fills this
 * one too, and the action answers such a submission as if it had worked, without storing it. It is
 * registered with the form, whose schema knows no such field and so leaves it out of the values;
 * the form reads it on submit with `getValues`.
 *
 * @returns The hidden input.
 */
function Honeypot() {
	const { register } = useFormContext();

	return (
		<div aria-hidden="true" className="absolute top-0 left-[-9999px] size-px overflow-hidden">
			<label>
				Website
				<input autoComplete="off" tabIndex={-1} type="text" {...register(HONEYPOT_NAME)} />
			</label>
		</div>
	);
}

export { HONEYPOT_NAME, Honeypot };
