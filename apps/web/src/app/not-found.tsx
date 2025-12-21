export default function NotFound() {
	return (
		<div className="flex h-screen flex-col items-center justify-center">
			<h2 className="text-2xl font-bold md:text-5xl">Falscher Link? Falsche Adresse?</h2>
			<p className="pt-4 text-lg md:pt-8 md:text-2xl">
				Die angeforderte Seite konnte nicht gefunden werden.
			</p>
			<p className="pt-2 text-lg md:text-2xl">
				Nutze die Navigation oben, um zur gewünschten Seite zu gelangen.
			</p>
		</div>
	);
}
