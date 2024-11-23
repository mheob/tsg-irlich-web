import type { SVGProps } from 'react';

export default function ArrowCta({
	className = 'h-12 w-auto text-current',
	...props
}: Readonly<SVGProps<SVGSVGElement>>) {
	return (
		<svg
			className={className}
			fill="currentColor"
			viewBox="0 0 371 183"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path d="M342.356 49.582c9.777-13.002 19.288-27.343 28.477-43.157L359.796 0C222.813 235.608 18.364 134.854 16.247 133.771l-3.752 11.824c2.087 1.061 187.758 93.095 329.865-96.013z"></path>
			<path d="M51.576 179.379a6.41 6.41 0 0 0-.63-8.385l-32.72-32.198 34.776-11.929a6.4 6.4 0 0 0 4.127-5.976c0-3.505-2.885-6.39-6.39-6.39-.636 0-1.268.095-1.875.282L4.316 130.054A6.4 6.4 0 0 0 0 136.098c0 1.709.686 3.349 1.903 4.549l40.079 39.454a6.4 6.4 0 0 0 4.479 1.831 6.4 6.4 0 0 0 5.115-2.557z"></path>
		</svg>
	);
}
