import type {
	internalGroqTypeReferenceTo,
	SanityImageCrop,
	SanityImageHotspot,
	SimpleBlockContent,
	TrainingTime,
} from './sanity.types.generated';

/**
 * Represents a training time with extended venue details.
 *
 * Extends the base `SanityTrainingTime` type, replacing the `venue` property
 * with a more detailed venue object including location, images, and metadata.
 *
 * @see SanityTrainingTime
 */
export interface TrainingTimeSection extends Omit<TrainingTime, 'venue'> {
	_key: string;
	venue: {
		location?: {
			city: string;
			houseNumber: string;
			name: string;
			street: string;
			zipCode?: string;
		};
		mainImage?: {
			asset?: {
				_ref: string;
				_type: 'reference';
				_weak?: boolean;
				[internalGroqTypeReferenceTo]?: 'sanity.imageAsset';
			};
			_type: 'image';
			alt: string;
			crop?: SanityImageCrop;
			description?: string;
			hotspot?: SanityImageHotspot;
			media?: unknown;
		};
		_createdAt: string;
		_id: string;
		_rev: string;
		_type: 'venue';
		_updatedAt: string;
		description: SimpleBlockContent;
		title: string;
		type: 'artificial-turf' | 'cinder' | 'grass' | 'hall-1' | 'hall-2' | 'hall-3' | 'hybrid';
	};
}
