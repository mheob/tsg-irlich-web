import { ImageIcon, SearchIcon, TrashIcon, UploadIcon } from '@sanity/icons';
import { Box, Button, Card, Dialog, Flex, Spinner, Stack, Text, TextInput } from '@sanity/ui';
import { type KeyboardEvent, useCallback, useId, useRef, useState } from 'react';
import {
	type ImageValue,
	type ObjectInputProps,
	type ObjectSchemaType,
	set,
	setIfMissing,
	unset,
	useClient,
} from 'sanity';
import { mediaAssetSource } from 'sanity-plugin-media';

import { apiVersion } from '@/env';

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

	const hasImage = Boolean((value as ImageValue)?.asset);

	const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file?.type.startsWith('image/')) {
			setPendingFile(file);
			const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
			setFilename(nameWithoutExtension);
		}
		// Reset damit dieselbe Datei erneut gewählt werden kann
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

		setIsUploading(true);

		try {
			const extension = pendingFile.name.split('.').pop();
			const newFilename = `${filename.trim()}.${extension}`;

			// Erstelle eine neue Datei mit dem benutzerdefinierten Namen
			const renamedFile = new File([pendingFile], newFilename, {
				type: pendingFile.type,
			});

			// Upload über Sanity Client
			const asset = await client.assets.upload('image', renamedFile, {
				filename: newFilename,
			});

			// Setze die Referenz auf das Feld
			onChange([
				setIfMissing({ _type: 'image' }),
				set({ _ref: asset._id, _type: 'reference' }, ['asset']),
			]);

			setPendingFile(null);
			setFilename('');
		} catch (error) {
			console.error('Upload fehlgeschlagen:', error);
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

	const handleDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		setIsDragOver(false);

		const file = event.dataTransfer.files[0];
		if (file?.type.startsWith('image/')) {
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
		// eslint-disable-next-line ts/no-explicit-any
		(assets: any[]) => {
			const selectedAsset = assets[0];
			if (selectedAsset) {
				const assetId =
					selectedAsset.kind === 'assetDocumentId' ? selectedAsset.value : selectedAsset._id;

				if (assetId) {
					onChange([
						setIfMissing({ _type: 'image' }),
						set({ _ref: assetId, _type: 'reference' }, ['asset']),
					]);
				}
			}
			setIsMediaLibraryOpen(false);
		},
		[onChange],
	);

	const handleRemoveImage = useCallback(() => {
		onChange(unset());
	}, [onChange]);

	// Mediathek-Komponente
	const MediaLibraryComponent = mediaAssetSource.component;

	// Wenn bereits ein Bild vorhanden ist, zeige Vorschau mit Optionen
	if (hasImage) {
		return (
			<Stack space={3}>
				{/* Standard-Rendering für Bildvorschau und zusätzliche Felder (alt, hotspot, etc.) */}
				{renderDefault(props)}

				{/* Bild entfernen Button */}
				<Button
					icon={TrashIcon}
					mode="ghost"
					onClick={handleRemoveImage}
					text="Bild entfernen"
					tone="critical"
				/>
			</Stack>
		);
	}

	return (
		<>
			{/* Verstecktes File-Input */}
			<input
				accept="image/*"
				onChange={handleFileInputChange}
				ref={fileInputReference}
				style={{ display: 'none' }}
				type="file"
			/>

			{/* Dropzone */}
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
					{/* Icon und Text */}
					<Flex align="center" direction="column" gap={3} justify="center" padding={3}>
						<Text size={4} muted>
							<ImageIcon />
						</Text>
						<Text size={1} muted>
							Bild hierher ziehen oder eine Option wählen
						</Text>
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

			{/* Dialog für Dateinamen */}
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

			{/* Mediathek Dialog */}
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
