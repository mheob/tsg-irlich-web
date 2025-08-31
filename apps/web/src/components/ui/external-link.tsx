type ExternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function ExternalLink({ children, className = '', ...props }: Readonly<ExternalLinkProps>) {
	return (
		<a className={className} rel="noopener noreferrer" target="_blank" {...props}>
			{children}
		</a>
	);
}
