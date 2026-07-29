import { Link } from 'react-email';

import { CrHtml } from '../../lib/cleverreach-tags';

const tableStyle = { borderCollapse: 'separate' as const };

interface EmailButtonProps {
	href: string;
	isCentered?: boolean;
	/** Exposes label and target to the CleverReach editor. */
	isEditable?: boolean;
	label: string;
	variant?: 'primary' | 'secondary';
}

// Recreates the pill button of the website: a coloured pill with an inset, rounded
// outline. Built as a table so Outlook keeps the background colour.
export function EmailButton({
	href,
	isCentered = false,
	isEditable = false,
	label,
	variant = 'secondary',
}: Readonly<EmailButtonProps>) {
	const isSecondary = variant === 'secondary';

	const link = (
		<Link
			className={`inline-block rounded-full border border-solid px-[28px] py-[12px] font-sans text-[15px] font-bold no-underline ${
				isSecondary
					? 'border-secondary-foreground text-secondary-foreground'
					: 'border-primary-foreground text-primary-foreground'
			}`}
			href={href}
		>
			{label}
		</Link>
	);

	return (
		<table
			align={isCentered ? 'center' : 'left'}
			cellPadding={0}
			cellSpacing={0}
			role="presentation"
			style={tableStyle}
		>
			<tbody>
				<tr>
					<td className={`rounded-full p-[5px] ${isSecondary ? 'bg-secondary' : 'bg-primary'}`}>
						{isEditable ? <CrHtml>{link}</CrHtml> : link}
					</td>
				</tr>
			</tbody>
		</table>
	);
}
