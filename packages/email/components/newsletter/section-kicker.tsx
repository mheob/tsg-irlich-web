import { CrHtml } from '../../lib/cleverreach-tags';

const hairlineStyle = { fontSize: '1px', height: '1px', lineHeight: '1px' };

interface SectionKickerProps {
	label: string;
}

function Hairline() {
	return (
		<div className="bg-border" style={hairlineStyle}>
			&nbsp;
		</div>
	);
}

// The sub title of the website: an uppercase label framed by two hairlines.
export function SectionKicker({ label }: Readonly<SectionKickerProps>) {
	return (
		<table cellPadding={0} cellSpacing={0} role="presentation">
			<tbody>
				<tr>
					<td valign="middle" width="40">
						<Hairline />
					</td>
					<td
						className="px-[12px] font-sans text-[11px] font-bold tracking-[2px] text-muted-foreground uppercase"
						valign="middle"
					>
						<CrHtml mode="textonly">{label}</CrHtml>
					</td>
					<td valign="middle" width="40">
						<Hairline />
					</td>
				</tr>
			</tbody>
		</table>
	);
}
