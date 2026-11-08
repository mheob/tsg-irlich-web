'use client';

// PROTOTYPE — floating bar that flips between the variants of a prototype route via `?variant=`.
// Never merge this into `next`; it lives on the throwaway prototype branch only.

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface PrototypeVariant {
	key: string;
	name: string;
}

interface PrototypeSwitcherProps {
	current: string;
	variants: readonly PrototypeVariant[];
}

const PREVIOUS = -1;
const NEXT = 1;

function isEditable(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
	);
}

export function PrototypeSwitcher({ current, variants }: Readonly<PrototypeSwitcherProps>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const index = Math.max(
		variants.findIndex((variant) => variant.key === current),
		0,
	);
	const active = variants[index];

	function go(step: number) {
		const next = variants[(index + step + variants.length) % variants.length];
		if (!next) {
			return;
		}
		const params = new URLSearchParams(searchParams);
		params.set('variant', next.key);
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- prototype route, not typed
		router.replace(`${pathname}?${params.toString()}` as never, { scroll: false });
	}

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (isEditable(event.target)) {
				return;
			}
			if (event.key === 'ArrowLeft') {
				go(PREVIOUS);
			}
			if (event.key === 'ArrowRight') {
				go(NEXT);
			}
		}
		globalThis.addEventListener('keydown', onKeyDown);
		return () => {
			globalThis.removeEventListener('keydown', onKeyDown);
		};
	});

	return (
		<div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black p-2 text-sm text-white shadow-2xl ring-2 ring-fuchsia-500">
			<button
				aria-label="Vorherige Variante"
				className="grid size-9 cursor-pointer place-items-center rounded-full hover:bg-white/15"
				onClick={() => {
					go(PREVIOUS);
				}}
				type="button"
			>
				<ChevronLeft className="size-5" />
			</button>
			<span className="min-w-56 text-center font-mono">
				Prototyp · {active?.key} ({active?.name})
			</span>
			<button
				aria-label="Nächste Variante"
				className="grid size-9 cursor-pointer place-items-center rounded-full hover:bg-white/15"
				onClick={() => {
					go(NEXT);
				}}
				type="button"
			>
				<ChevronRight className="size-5" />
			</button>
		</div>
	);
}
