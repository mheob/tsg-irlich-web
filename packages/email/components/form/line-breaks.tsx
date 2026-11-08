import { Fragment } from 'react';

/**
 * A text whose single line breaks stay line breaks. HTML collapses a newline into a space, and
 * `white-space: pre-line` is not honoured by every mail client, so each break becomes a `<br>`.
 *
 * @param props - The props.
 * @param props.text - The text, with `\n` (or `\r\n`) between its lines.
 * @returns The lines with a `<br>` between each two.
 */
function LineBreaks({ text }: Readonly<LineBreaksProps>) {
	return (
		<>
			{text.split(/\r?\n/u).map((line, index) => (
				// oxlint-disable-next-line react/no-array-index-key
				<Fragment key={`${index}-${line}`}>
					{index > 0 ? <br /> : null}
					{line}
				</Fragment>
			))}
		</>
	);
}

interface LineBreaksProps {
	text: string;
}

export { LineBreaks };
