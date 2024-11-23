interface TSGLogoProps {
	className?: string;
}

export default function TSGLogo({ className = 'h-16 w-auto' }: Readonly<TSGLogoProps>) {
	return (
		<svg
			className={className}
			fillRule="evenodd"
			strokeLinejoin="round"
			strokeMiterlimit="2"
			viewBox="0 0 1024 768"
			xmlns="http://www.w3.org/2000/svg"
			xmlSpace="preserve"
		>
			<path
				d="M983 233c-26-46-64-87-111-122A607 607 0 0 0 512 0C376 0 248 39 152 111c-47 35-85 76-111 122a302 302 0 0 0 0 302c26 46 64 87 111 122 96 72 224 111 360 111s264-39 360-111c47-35 85-76 111-122a302 302 0 0 0 0-302"
				fill="#fff"
				fillRule="nonzero"
			></path>
			<path
				d="M1008 384c0 203-222 368-496 368S16 587 16 384 238 16 512 16s496 165 496 368"
				fill="#2e2b70"
				fillRule="nonzero"
			></path>
			<path
				d="M157 481h57v128h-57zm166 0c9 0 17 2 24 5a36 36 0 0 1 21 33c0 6-1 12-4 16-2 5-6 9-10 13 7 7 12 16 16 27 4 10 7 21 8 34h-58c-1-17-4-29-8-37-3-7-9-11-17-11v48h-56V481zm-28 51h1q9 0 12-3c3-2 4-5 4-9s-1-7-4-9c-2-2-5-4-10-4h-3zm153-51v96h49v32H392V481zm63 0h56v128h-56zm149-2a108 108 0 0 1 51 14l-24 45a62 62 0 0 0-22-4c-6 0-11 1-14 3-3 1-4 4-4 7s1 5 5 7c3 2 8 3 14 3a55 55 0 0 0 21-5l24 49c-7 3-15 7-24 9-10 2-19 4-27 4-14 0-27-3-38-9-10-5-19-13-24-23q-9-15-9-33a62 62 0 0 1 35-58q16.5-9 36-9m121 2v47h29v-47h56v128h-56v-48h-29v48h-56V481z"
				fill="#fff"
				fillRule="nonzero"
			></path>
			<g fill="#fed501" fillRule="nonzero">
				<path d="M396 162v120h-60v150H216V282h-60V162z"></path>
				<path d="M498 158a299 299 0 0 1 57 5 347 347 0 0 1 51 13l-29 85c-10-12-20-22-31-29-12-7-24-10-36-10-8 0-13 1-16 4-4 3-5 7-5 12q0 6 9 12l30 13c35 13 58 26 68 39 10 12 15 28 15 46q0 43.5-33 66c-21 15-54 23-97 23-22 0-43-2-64-5-20-3-39-8-59-16l29-90c8 13 19 24 32 32 12 7 24 11 36 11 6 0 10-1 14-4s6-6 6-11-3-10-8-13l-25-13c-28-10-47-22-57-34a69 69 0 0 1-16-45c0-30 11-53 33-68 21-15 54-23 96-23"></path>
				<path d="M737 158a256 256 0 0 1 131 36l-58 81c-24-11-46-17-66-17-14 0-25 4-33 11s-12 16-12 27c0 12 3 20 10 25 7 6 18 8 33 8v-42h119v146l-59 3a1104 1104 0 0 1-39 1c-39 0-71-5-95-14-24-10-44-26-59-49-15-22-22-48-22-78 0-26 6-49 18-71 13-22 30-38 53-50 22-11 49-17 79-17"></path>
			</g>
		</svg>
	);
}
