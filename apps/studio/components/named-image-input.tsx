import { ImageIcon, SearchIcon, UploadIcon } from '@sanity/icons';
import { Box, Button, Card, Dialog, Flex, Spinner, Stack, Text, TextInput } from '@sanity/ui';
import {
	type ChangeEvent,
	type DragEvent,
	type KeyboardEvent,
	useCallback,
	useId,
	useRef,
	useState,
} from 'react';
import {
	type AssetFromSource,
	type ImageValue,
	type ObjectInputProps,
	type ObjectSchemaType,
	set,
	setIfMissing,
	useClient,
} from 'sanity';
import { mediaAssetSource } from 'sanity-plugin-media';

import { apiVersion } from '@/env';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const GENERIC_FILENAME_PATTERN =
	/^(?:IMG[-_]|DSC[-_]|SCR[-_]|Screenshot|Bildschirmfoto|\d{8}[-_])/i;

const validateFile = (file: File): null | string => {
	if (!file.type.startsWith('image/')) {
		return 'Bitte wähle eine Bilddatei';
	}
	if (file.size > MAX_FILE_SIZE) {
		return `Datei ist zu groß (max. ${MAX_FILE_SIZE / 1024 / 1024}MB)`;
	}
	return null;
};

const validateFilename = (filename: string): null | string => {
	if (GENERIC_FILENAME_PATTERN.test(filename)) {
		return 'Bitte einen beschreibenden Dateinamen eingeben (vermeide generische Namen wie IMG_1234)';
	}
	return null;
};

type NamedImageInputProps = ObjectInputProps<ImageValue, ObjectSchemaType>;

export function NamedImageInput(props: Readonly<NamedImageInputProps>) {
	const { onChange, renderDefault, schemaType, value } = props;
	const client = useClient({ apiVersion });
	const fileInputReference = useRef<HTMLInputElement>(null);
	const dialogId = useId();

	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [filename, setFilename] = useState('');
	const [isUploading, setIsUploading] = useState(false);
	const [isDragOver, setIsDragOver] = useState(false);
	const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
	const [uploadError, setUploadError] = useState<null | string>(null);

	const hasImage = Boolean((value as ImageValue)?.asset);

	const handleFileInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const error = validateFile(file);
			if (error) {
				setUploadError(error);
				return;
			}
			setUploadError(null);
			setPendingFile(file);
			const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
			setFilename(nameWithoutExtension);
		}
		// Reset so that the same file can be selected again
		event.target.value = '';
	}, []);

	const handleUploadClick = useCallback(() => {
		fileInputReference.current?.click();
	}, []);

	const handleCancelDialog = useCallback(() => {
		setPendingFile(null);
		setFilename('');
	}, []);

	const handleConfirmUpload = useCallback(async () => {
		if (!pendingFile || !filename.trim()) return;

		// Validate filename before upload
		const filenameError = validateFilename(filename.trim());
		if (filenameError) {
			setUploadError(filenameError);
			return;
		}

		setIsUploading(true);
		setUploadError(null);

		try {
			const extension = pendingFile.name.split('.').pop() || 'jpg';
			const sanitizeFilename = (name: string): string => {
				return (
					name
						.trim()
						// cspell:disable-next-line
						.replaceAll(/[^\wäöüß-]/gi, '-') // Replace special chars (keep German umlauts)
						.replaceAll(/(-)+/g, '-') // Collapse multiple dashes
						.replaceAll(/(^-|-$)/g, '')
				); // Remove leading/trailing dashes
			};
			const newFilename = `${sanitizeFilename(filename)}.${extension}`;

			// Create a new file with the custom user-specified name
			const renamedFile = new File([pendingFile], newFilename, {
				type: pendingFile.type,
			});

			// Upload via Sanity Client
			const asset = await client.assets.upload('image', renamedFile, {
				filename: newFilename,
			});

			// Set the reference to the field
			onChange([
				setIfMissing({ _type: 'image' }),
				set({ _ref: asset._id, _type: 'reference' }, ['asset']),
			]);

			setPendingFile(null);
			setFilename('');
			setUploadError(null); // Clear previous errors
		} catch (error) {
			console.error('Upload failed:', error);
			setUploadError(
				error instanceof Error ? error.message : 'Upload fehlgeschlagen. Bitte versuche es erneut.',
			);
			// Keep dialog open so user can retry
			return;
		} finally {
			setIsUploading(false);
		}
	}, [pendingFile, filename, client, onChange]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === 'Enter' && filename.trim() && !isUploading) {
				void handleConfirmUpload();
			}
		},
		[filename, isUploading, handleConfirmUpload],
	);

	const handleDragOver = useCallback((event: DragEvent) => {
		event.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((event: DragEvent) => {
		event.preventDefault();
		// Only set to false if leaving the container, not entering children
		if (event.currentTarget === event.target) {
			setIsDragOver(false);
		}
	}, []);

	const handleDrop = useCallback((event: DragEvent) => {
		event.preventDefault();
		setIsDragOver(false);

		const file = event.dataTransfer.files[0];
		if (file) {
			const error = validateFile(file);
			if (error) {
				setUploadError(error);
				return;
			}
			setUploadError(null);
			setPendingFile(file);
			const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
			setFilename(nameWithoutExtension);
		}
	}, []);

	const handleOpenMediaLibrary = useCallback(() => {
		setIsMediaLibraryOpen(true);
	}, []);

	const handleCloseMediaLibrary = useCallback(() => {
		setIsMediaLibraryOpen(false);
	}, []);

	const handleMediaSelect = useCallback(
		(assets: AssetFromSource[]) => {
			const selectedAsset = assets[0];
			if (selectedAsset?.kind === 'assetDocumentId' && typeof selectedAsset.value === 'string') {
				onChange([
					setIfMissing({ _type: 'image' }),
					set({ _ref: selectedAsset.value, _type: 'reference' }, ['asset']),
				]);
			}
			setIsMediaLibraryOpen(false);
		},
		[onChange],
	);

	// Media library component
	const MediaLibraryComponent = mediaAssetSource.component;

	// If an image is already present, show preview with options
	if (hasImage) {
		return (
			<>
				{/* Standard rendering for image preview and additional fields (alt, hotspot, etc.) */}
				{renderDefault(props)}
			</>
		);
	}

	return (
		<>
			{/* Hidden file input */}
			<input
				accept="image/*"
				onChange={handleFileInputChange}
				ref={fileInputReference}
				style={{ display: 'none' }}
				type="file"
			/>

			{/* Dropzone area */}
			<Card
				style={{
					backgroundColor: isDragOver ? 'var(--card-bg2-color)' : undefined,
					border: isDragOver
						? '2px dashed var(--card-focus-ring-color)'
						: '2px dashed var(--card-border-color)',
					transition: 'all 0.15s ease',
				}}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				padding={4}
				radius={2}
				shadow={1}
				tone={isDragOver ? 'primary' : 'default'}
			>
				<Stack space={4}>
					{/* Icon and text */}
					<Flex align="center" direction="column" gap={3} justify="center" padding={3}>
						<Text size={4} muted>
							<ImageIcon />
						</Text>
						<Text size={1} muted>
							Bild hierher ziehen oder eine Option wählen
						</Text>
						{uploadError && !pendingFile && (
							<Text size={1} style={{ color: 'var(--card-critical-fg-color)' }}>
								{uploadError}
							</Text>
						)}
					</Flex>

					{/* Buttons */}
					<Flex gap={2} justify="center" wrap="wrap">
						<Button
							icon={UploadIcon}
							mode="ghost"
							onClick={handleUploadClick}
							text="Hochladen"
							tone="primary"
						/>
						<Button
							icon={SearchIcon}
							mode="ghost"
							onClick={handleOpenMediaLibrary}
							text="Mediathek"
						/>
					</Flex>
				</Stack>
			</Card>

			{/* Dialog for filename */}
			{pendingFile && (
				<Dialog
					header="Dateinamen eingeben"
					id={`name-image-dialog-${dialogId}`}
					onClose={handleCancelDialog}
					width={1}
				>
					<Box padding={4}>
						<Stack space={4}>
							<Stack space={2}>
								<Text size={1} muted>
									Originaler Dateiname: {pendingFile.name}
								</Text>
								<Text size={1} style={{ color: 'var(--card-critical-fg-color)' }}>
									{uploadError}
								</Text>
								<TextInput
									disabled={isUploading}
									onChange={event => setFilename(event.currentTarget.value)}
									onKeyDown={handleKeyDown}
									placeholder="Beschreibenden Dateinamen eingeben"
									value={filename}
									autoFocus
								/>
								<Text size={1} muted>
									Vermeide generische Namen wie IMG_1234 oder Screenshot.
								</Text>
							</Stack>

							<Flex gap={2} justify="flex-end">
								<Button
									disabled={isUploading}
									mode="ghost"
									onClick={handleCancelDialog}
									text="Abbrechen"
								/>
								<Button
									disabled={!filename.trim() || isUploading}
									icon={isUploading ? Spinner : undefined}
									onClick={handleConfirmUpload}
									text={isUploading ? 'Wird hochgeladen...' : 'Hochladen'}
									tone="primary"
								/>
							</Flex>
						</Stack>
					</Box>
				</Dialog>
			)}

			{/* Media library dialog */}
			{isMediaLibraryOpen && (
				<MediaLibraryComponent
					accept="image/*"
					assetSource={mediaAssetSource}
					onClose={handleCloseMediaLibrary}
					onSelect={handleMediaSelect}
					schemaType={schemaType}
					selectedAssets={[]}
					selectionType="single"
				/>
			)}
		</>
	);
}
