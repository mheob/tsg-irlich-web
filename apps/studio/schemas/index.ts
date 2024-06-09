import author from './documents/author';
import group from './documents/group';
import newsArticle from './documents/news.article';
import newsCategory from './documents/news.category';
import person from './documents/person';
import testimonial from './documents/testimonial';
import columns from './objects/columns';
import extendedImage from './objects/extended-image';
import externalLink from './objects/external-link';
import internalLink from './objects/internal-link';
import link from './objects/link';
import metFields from './objects/meta';
import simpleBlockContent from './objects/simple-block-content';
import socialFields from './objects/social-fields';
import blockContent from './sections/block-content';
import grid from './sections/grid';
import mainImage from './sections/main-image';
import spacer from './sections/spacer';
import imprint from './singletons/imprint';
import privacy from './singletons/privacy';
import siteSettings from './singletons/site-settings';

export const schemaTypes = [
	// Documents
	newsArticle,
	newsCategory,

	author,
	person,

	group,
	testimonial,

	siteSettings,

	// Objects
	columns,
	extendedImage,
	externalLink,
	internalLink,
	link,
	metFields,
	simpleBlockContent,
	socialFields,

	// Sections
	blockContent,
	grid,
	mainImage,
	spacer,

	// Singletons
	privacy,
	imprint,
];