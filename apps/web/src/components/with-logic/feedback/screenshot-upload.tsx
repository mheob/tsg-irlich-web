'use client';

import { AlertCircle, ImagePlus, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import type { ChangeEvent, DragEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { cn } from '@tsgi-web/shared';

import { uploadToLinear } from '@/actions/upload-to-linear';

const BYTES_PER_KB = 1024;
// oxlint-disable-next-line no-magic-numbers
const TEN_MB = 10 * BYTES_PER_KB * BYTES_PER_KB;

interface ScreenshotUploadProps {
	onChange: (urls: string[]) => void;
	disabled?: boolean;
	maxFiles?: number;
	value: string[];
}

interface UploadingFile {
	id: string;
	error?: string;
	name: string;
	preview: string;
	progress: 'done' | 'error' | 'uploading';
}

export function ScreenshotUpload({
	disabled = false,
	maxFiles = 5,
	onChange,
	value,
}: Readonly<ScreenshotUploadProps>) {
	const [isDragging, setIsDragging] = useState(false);
	const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

	const canAddMore = value.length + uploadingFiles.length < maxFiles;

	const processFile = useCallback(
		async (file: File) => {
			if (!canAddMore) {
				return;
			}

			// Validate file type
			const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
			if (!allowedTypes.includes(file.type)) {
				return;
			}

			// Validate file size (10MB)
			if (file.size > TEN_MB) {
				return;
			}

			const id = crypto.randomUUID();
			const preview = URL.createObjectURL(file);

			// Add to uploading state
			setUploadingFiles((previous) => [
				...previous,
				{ id, name: file.name, preview, progress: 'uploading' },
			]);

			try {
				const result = await uploadToLinear({ file });

				if (result?.data?.assetUrl) {
					// Remove from uploading, add to value
					setUploadingFiles((previous) => previous.filter((f) => f.id !== id));
					onChange([...value, result.data.assetUrl]);
				} else {
					// Mark as error
					setUploadingFiles((previous) =>
						previous.map((f) =>
							f.id === id
								? { ...f, error: result?.serverError ?? 'Upload failed', progress: 'error' }
								: f,
						),
					);
				}
			} catch {
				setUploadingFiles((previous) =>
					previous.map((f) =>
						f.id === id ? { ...f, error: 'Upload failed', progress: 'error' } : f,
					),
				);
			}
		},
		[canAddMore, onChange, value],
	);

	const handleDrop = useCallback(
		(event: DragEvent) => {
			event.preventDefault();
			setIsDragging(false);

			if (disabled) {
				return;
			}

			const files = [...event.dataTransfer.files];
			for (const file of files.slice(0, maxFiles - value.length)) {
				// oxlint-disable-next-line no-void
				void processFile(file);
			}
		},
		[disabled, maxFiles, processFile, value.length],
	);

	const handleDragOver = useCallback((event: DragEvent) => {
		event.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((event: DragEvent) => {
		event.preventDefault();
		setIsDragging(false);
	}, []);

	const handleFileInput = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const files = [...(event.target.files ?? [])];
			for (const file of files.slice(0, maxFiles - value.length)) {
				// oxlint-disable-next-line no-void
				void processFile(file);
			}
			event.target.value = '';
		},
		[maxFiles, processFile, value.length],
	);

	useEffect(
		() => () => {
			for (const file of uploadingFiles) {
				if (file.preview) {
					URL.revokeObjectURL(file.preview);
				}
			}
		},
		[uploadingFiles],
	);

	// Handle paste from clipboard
	useEffect(() => {
		const handlePaste = (event: ClipboardEvent) => {
			if (disabled || !canAddMore) {
				return;
			}

			const items = event.clipboardData?.items;
			if (!items) {
				return;
			}

			for (const item of items) {
				if (item.type.startsWith('image/')) {
					const file = item.getAsFile();
					if (file) {
						// oxlint-disable-next-line no-void
						void processFile(file);
					}
				}
			}
		};

		document.addEventListener('paste', handlePaste);
		return () => {
			document.removeEventListener('paste', handlePaste);
		};
	}, [disabled, canAddMore, processFile]);

	const removeUrl = (urlToRemove: string) => {
		onChange(value.filter((url) => url !== urlToRemove));
	};

	const removeUploading = (id: string) => {
		setUploadingFiles((previous) => {
			const file = previous.find((f) => f.id === id);
			if (file?.preview) {
				URL.revokeObjectURL(file.preview);
			}
			return previous.filter((f) => f.id !== id);
		});
	};

	return (
		<div className="space-y-3">
			{/* Drop zone */}
			<label
				className={cn(
					`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors`,
					isDragging
						? 'border-primary bg-primary/5'
						: `border-muted-foreground/25 hover:border-muted-foreground/50`,
					disabled && 'cursor-not-allowed opacity-50',
					!canAddMore && 'cursor-not-allowed opacity-50',
				)}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				<div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
					<ImagePlus className="mb-2 size-8 text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						<span className="font-medium">Klicken</span>, ziehen oder{' '}
						<span className="font-medium">Ctrl+V</span> zum Einfügen
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						PNG, JPG, GIF oder WebP (max. 2MB pro Bild)
					</p>
				</div>
				<input
					accept="image/png,image/jpeg,image/gif,image/webp"
					className="hidden"
					disabled={disabled || !canAddMore}
					onChange={handleFileInput}
					type="file"
					multiple
				/>
			</label>

			{/* Preview Grid */}
			{(value.length > 0 || uploadingFiles.length > 0) && (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
					{/* Uploaded images */}
					{value.map((url, index) => (
						<div
							className="group relative aspect-video overflow-hidden rounded-lg border bg-muted"
							key={url}
						>
							<Image
								alt={`Screenshot ${index + 1}`}
								className="absolute inset-0 size-full object-cover"
								src={url}
							/>
							<button
								aria-label={`Remove screenshot ${index + 1}`}
								className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
								// oxlint-disable-next-line react_perf/jsx-no-new-function-as-prop
								onClick={() => {
									removeUrl(url);
								}}
								type="button"
							>
								<X className="size-6" />
							</button>
						</div>
					))}

					{/* Uploading images */}
					{uploadingFiles.map((file) => (
						<div
							className="relative aspect-video overflow-hidden rounded-lg border bg-muted"
							key={file.id}
						>
							<Image alt={file.name} className="object-cover opacity-50" src={file.preview} fill />
							<div className="absolute inset-0 flex items-center justify-center">
								{file.progress === 'uploading' && (
									<Loader2 className="size-6 animate-spin text-primary" />
								)}
								{file.progress === 'error' && (
									<div className="flex flex-col items-center text-destructive">
										<AlertCircle className="size-6" />
										<span className="mt-1 text-xs">{file.error}</span>
									</div>
								)}
							</div>
							{file.progress === 'error' && (
								<button
									className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground"
									// oxlint-disable-next-line react_perf/jsx-no-new-function-as-prop
									onClick={() => {
										removeUploading(file.id);
									}}
									type="button"
								>
									<X className="size-6" />
								</button>
							)}
						</div>
					))}
				</div>
			)}

			{/* Counter */}
			{maxFiles > 1 && (
				<p className="max-w-full text-right text-xs text-muted-foreground">
					{value.length} / {maxFiles} Screenshots
				</p>
			)}
		</div>
	);
}
