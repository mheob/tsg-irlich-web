import Image from 'next/image';

export default function Home() {
	return (
		<div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
			<main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
				<Image
					alt="Next.js logo"
					className="dark:invert"
					height={38}
					src="/next.svg"
					width={180}
					priority
				/>
				<ol className="font-mono list-inside list-decimal text-sm text-center sm:text-left">
					<li className="mb-2">
						Get started by editing{' '}
						<code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
							src/app/page.tsx
						</code>
					</li>
					<li>Save and see your changes instantly.</li>
				</ol>

				<div className="flex gap-4 items-center flex-col sm:flex-row">
					<a
						className="rounded-full border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background border gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
						href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
						rel="noopener noreferrer"
						target="_blank"
					>
						<Image
							alt="Vercel logomark"
							className="dark:invert"
							height={20}
							src="/vercel.svg"
							width={20}
						/>
						Deploy now
					</a>
					<a
						className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
						href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
						rel="noopener noreferrer"
						target="_blank"
					>
						Read our docs
					</a>
				</div>
			</main>
			<footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
				<a
					className="flex items-center gap-2 hover:underline hover:underline-offset-4"
					href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
					rel="noopener noreferrer"
					target="_blank"
				>
					<Image alt="File icon" height={16} src="/file-text.svg" width={16} aria-hidden />
					Learn
				</a>
				<a
					className="flex items-center gap-2 hover:underline hover:underline-offset-4"
					href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
					rel="noopener noreferrer"
					target="_blank"
				>
					<Image alt="Window icon" height={16} src="/window.svg" width={16} aria-hidden />
					Examples
				</a>
				<a
					className="flex items-center gap-2 hover:underline hover:underline-offset-4"
					href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
					rel="noopener noreferrer"
					target="_blank"
				>
					<Image alt="Globe icon" height={16} src="/globe.svg" width={16} aria-hidden />
					Go to nextjs.org →
				</a>
			</footer>
		</div>
	);
}
