'use client';

// oxlint-disable import/no-namespace

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { PanInfo, Transition } from 'motion/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { cn } from '@tsgi-web/shared';

/** Step that pages to the previous image. */
const PREVIOUS_STEP = -1;

/** Step that pages to the next image. */
const NEXT_STEP = 1;

/** Horizontal distance in pixels a swipe has to cover to page to another image. */
const SWIPE_DISTANCE_THRESHOLD = 60;

/** Horizontal velocity in pixels per second that pages to another image regardless of distance. */
const SWIPE_VELOCITY_THRESHOLD = 300;

/** Horizontal offset in pixels an image slides in from and out to. */
const SLIDE_OFFSET = 40;

/** How far an image can be dragged beyond its bounds, as a fraction of the drag distance. */
const DRAG_ELASTIC = 0.2;

/** Duration in seconds of the slide between two images. */
const SLIDE_DURATION = 0.2;

const SPRING_DAMPING = 30;
const SPRING_STIFFNESS = 260;

/** Transition of the thumbnail morphing into the full screen image and back. */
const MORPH_TRANSITION: Transition = {
	damping: SPRING_DAMPING,
	stiffness: SPRING_STIFFNESS,
	type: 'spring',
};

const SLIDE_TRANSITION: Transition = { duration: SLIDE_DURATION };
const INSTANT_TRANSITION: Transition = { duration: 0 };
const DRAG_CONSTRAINTS = { left: 0, right: 0 };
const SLIDE_VISIBLE = { opacity: 1, x: 0 };

/**
 * Sizes of the full screen image, always the full viewport width.
 *
 * The media query resolves to `100vw` in every browser, but keeps the string from being the literal
 * `100vw` that `next/image` warns about: it measures the rendered width with
 * `getBoundingClientRect()`, which still carries the scale of the morph animation while the image
 * loads, and therefore mistakes the full screen image for a narrow one.
 */
const FULL_SCREEN_SIZES = '(min-width: 0px) 100vw';

const LightboxContext = createContext<LightboxContextValue | undefined>(undefined);

// Gives access to the lightbox of the surrounding `LightboxGallery`.
function useLightbox(): LightboxContextValue {
	const context = useContext(LightboxContext);

	if (!context) {
		throw new Error('`LightboxTrigger` has to be rendered inside a `LightboxGallery`.');
	}

	return context;
}

// Button that pages to the previous or the next image.
function LightboxPaginationButton({
	children,
	label,
	onClick,
	side,
}: Readonly<LightboxPaginationButtonProps>) {
	return (
		<button
			className={cn(
				'absolute top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/40 p-2 text-white opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
				side === 'left' ? 'left-2 md:left-6' : 'right-2 md:right-6',
			)}
			onClick={onClick}
			type="button"
		>
			{children}
			<span className="sr-only">{label}</span>
		</button>
	);
}

// Groups images into a single lightbox that can be paged through.
//
// The thumbnails stay untouched and are only wrapped in a `LightboxTrigger`, so every section keeps
// its own layout while sharing one lightbox.
function LightboxGallery({ children, images }: Readonly<LightboxGalleryProps>) {
	const [activeIndex, setActiveIndex] = useState<null | number>(null);
	const [direction, setDirection] = useState(NEXT_STEP);
	const shouldReduceMotion = useReducedMotion();

	const open = useCallback((index: number) => {
		setDirection(NEXT_STEP);
		setActiveIndex(index);
	}, []);

	const paginate = useCallback(
		(step: number) => {
			setDirection(step);
			setActiveIndex((current) => {
				if (current === null || images.length === 0) {
					return current;
				}
				return (current + step + images.length) % images.length;
			});
		},
		[images.length],
	);

	const goToPrevious = useCallback(() => {
		paginate(PREVIOUS_STEP);
	}, [paginate]);

	const goToNext = useCallback(() => {
		paginate(NEXT_STEP);
	}, [paginate]);

	const handleOpenChange = useCallback((nextOpen: boolean) => {
		if (!nextOpen) {
			setActiveIndex(null);
		}
	}, []);

	const handleDragEnd = useCallback(
		(_event: unknown, info: PanInfo) => {
			const hasSwipedFarEnough = Math.abs(info.offset.x) > SWIPE_DISTANCE_THRESHOLD;
			const hasSwipedFastEnough = Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD;

			if (hasSwipedFarEnough || hasSwipedFastEnough) {
				paginate(info.offset.x < 0 ? NEXT_STEP : PREVIOUS_STEP);
			}
		},
		[paginate],
	);

	const contextValue = useMemo(() => ({ activeIndex, images, open }), [activeIndex, images, open]);

	const isOpen = activeIndex !== null;

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (!isOpen) {
				return;
			}
			if (event.key === 'ArrowLeft') {
				paginate(PREVIOUS_STEP);
			}
			if (event.key === 'ArrowRight') {
				paginate(NEXT_STEP);
			}
		}

		globalThis.addEventListener('keydown', handleKeyDown);

		return () => {
			globalThis.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen, paginate]);

	const slideFrom = useMemo(
		() => ({ opacity: 0, x: shouldReduceMotion ? 0 : direction * SLIDE_OFFSET }),
		[direction, shouldReduceMotion],
	);

	const slideTo = useMemo(
		() => ({ opacity: 0, x: shouldReduceMotion ? 0 : direction * -SLIDE_OFFSET }),
		[direction, shouldReduceMotion],
	);

	const activeImage = activeIndex === null ? undefined : images[activeIndex];
	const hasMultipleImages = images.length > 1;

	return (
		<LightboxContext.Provider value={contextValue}>
			{children}

			<DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
				<DialogPrimitive.Portal>
					<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />

					<DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col text-white outline-none">
						<DialogPrimitive.Title className="sr-only">
							{activeImage?.alt ?? 'Bildergalerie'}
						</DialogPrimitive.Title>

						<div className="flex shrink-0 items-center justify-between p-4 md:p-6">
							{hasMultipleImages && activeIndex !== null ? (
								<p className="text-sm tabular-nums">
									{activeIndex + 1} / {images.length}
								</p>
							) : (
								<span />
							)}

							<DialogPrimitive.Close className="cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none">
								<X className="size-8 md:size-10" />
								<span className="sr-only">Schließen</span>
							</DialogPrimitive.Close>
						</div>

						<div className="relative flex min-h-0 flex-1 items-center justify-center">
							{hasMultipleImages && (
								<LightboxPaginationButton
									label="Vorheriges Bild"
									onClick={goToPrevious}
									side="left"
								>
									<ChevronLeft className="size-8" />
								</LightboxPaginationButton>
							)}

							{activeImage && (
								<motion.div
									className="relative size-full"
									layoutId={shouldReduceMotion ? undefined : `lightbox-image-${activeImage.key}`}
									transition={MORPH_TRANSITION}
								>
									<AnimatePresence initial={false}>
										<motion.div
											animate={SLIDE_VISIBLE}
											className="absolute inset-0 cursor-grab active:cursor-grabbing"
											dragConstraints={DRAG_CONSTRAINTS}
											dragElastic={DRAG_ELASTIC}
											drag={hasMultipleImages ? 'x' : false}
											exit={slideTo}
											initial={slideFrom}
											key={activeImage.key}
											onDragEnd={handleDragEnd}
											transition={shouldReduceMotion ? INSTANT_TRANSITION : SLIDE_TRANSITION}
										>
											<Image
												alt={activeImage.alt}
												className="object-contain select-none"
												draggable={false}
												sizes={FULL_SCREEN_SIZES}
												src={activeImage.srcFull}
												fill
												priority
											/>
										</motion.div>
									</AnimatePresence>
								</motion.div>
							)}

							{hasMultipleImages && (
								<LightboxPaginationButton label="Nächstes Bild" onClick={goToNext} side="right">
									<ChevronRight className="size-8" />
								</LightboxPaginationButton>
							)}
						</div>

						<div className="flex min-h-14 shrink-0 items-center justify-center p-4 text-center md:p-6">
							{activeImage?.caption && (
								<p className="text-sm text-white/80 italic">{activeImage.caption}</p>
							)}
						</div>
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>
		</LightboxContext.Provider>
	);
}

// Makes a thumbnail open the lightbox of the surrounding `LightboxGallery`.
//
// While the lightbox is open the trigger drops its `layoutId`, so the full screen image is the only
// element carrying it and can morph back into the thumbnail on close.
function LightboxTrigger({ children, className, index }: Readonly<LightboxTriggerProps>) {
	const { activeIndex, images, open } = useLightbox();
	const shouldReduceMotion = useReducedMotion();

	const handleClick = useCallback(() => {
		open(index);
	}, [index, open]);

	const image = images[index];

	if (!image) {
		return null;
	}

	const isLightboxOpen = activeIndex !== null;

	return (
		<motion.button
			aria-label={`${image.alt} vergrößern`}
			className={cn('relative block size-full cursor-zoom-in', className)}
			layoutId={shouldReduceMotion || isLightboxOpen ? undefined : `lightbox-image-${image.key}`}
			onClick={handleClick}
			transition={MORPH_TRANSITION}
			type="button"
		>
			{children}
		</motion.button>
	);
}

interface LightboxImage {
	/** Alternative text of the image. */
	alt: string;
	/** Optional caption shown below the full screen image. */
	caption?: string;
	/** Stable key of the image, used to match the thumbnail with the full screen image. */
	key: string;
	/** URL of the full screen version of the image. */
	srcFull: string;
}

interface LightboxContextValue {
	activeIndex: null | number;
	images: LightboxImage[];
	open: (index: number) => void;
}

interface LightboxGalleryProps {
	children: ReactNode;
	images: LightboxImage[];
}

interface LightboxTriggerProps {
	children: ReactNode;
	className?: string;
	index: number;
}

interface LightboxPaginationButtonProps {
	children: ReactNode;
	label: string;
	onClick: () => void;
	side: 'left' | 'right';
}

export { LightboxGallery, LightboxTrigger };
export type { LightboxImage };
